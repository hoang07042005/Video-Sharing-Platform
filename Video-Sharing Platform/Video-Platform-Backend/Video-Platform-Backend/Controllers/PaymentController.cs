using Microsoft.AspNetCore.Mvc;
using Video_Platform_Backend.Services;
using Video_Platform_Backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Video_Platform_Backend.Hubs;

namespace Video_Platform_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly IVnPayService _vnPayService;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<LivestreamHub> _hubContext;

    public PaymentController(IVnPayService vnPayService, ApplicationDbContext context, IConfiguration configuration, IHubContext<LivestreamHub> hubContext)
    {
        _vnPayService = vnPayService;
        _context = context;
        _configuration = configuration;
        _hubContext = hubContext;
    }

    [HttpPost("create-payment-url")]
    [Authorize]
    public IActionResult CreatePaymentUrl([FromBody] PaymentRequestModel model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var origin = Request.Headers["Origin"].ToString();
            if (string.IsNullOrEmpty(origin))
            {
                origin = Request.Headers["Referer"].ToString();
                if (!string.IsNullOrEmpty(origin))
                {
                    var uri = new Uri(origin);
                    origin = $"{uri.Scheme}://{uri.Authority}";
                }
            }
            
            var frontendUrl = _configuration["FrontendUrl"];
            if (string.IsNullOrEmpty(frontendUrl))
            {
                frontendUrl = string.IsNullOrEmpty(origin) ? "http://localhost:5173" : origin;
            }
            var returnUrl = $"{Request.Scheme}://{Request.Host}/api/payment/vnpay-return?frontend={Uri.EscapeDataString(frontendUrl)}";

            var orderInfo = $"UserId:{userId}|Plan:{model.Plan}|Cycle:{model.Cycle}";
            if (model.TargetChannelId.HasValue)
            {
                orderInfo += $"|TargetChannelId:{model.TargetChannelId.Value}";
            }
            if (model.DonationId.HasValue)
            {
                orderInfo += $"|DonationId:{model.DonationId.Value}";
            }
            
            if (model.Plan == "Membership" && model.TargetChannelId.HasValue)
            {
                var channel = _context.Channels.FirstOrDefault(c => c.Id == model.TargetChannelId.Value);
                if (channel != null)
                {
                    model.Amount = channel.MembershipFee ?? 30000;
                }
            }

            var paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, model.Amount, orderInfo, returnUrl);

            return Ok(new { url = paymentUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpGet("test-url")]
    [AllowAnonymous]
    public IActionResult TestCreatePaymentUrl()
    {
        try
        {
            var returnUrl = "http://localhost:5173/payment-result";
            var orderInfo = "Test order info";
            var paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, 129000, orderInfo, returnUrl);
            return Ok(new { url = paymentUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.ToString() });
        }
    }

    [HttpGet("vnpay-return")]
    public async Task<IActionResult> PaymentCallback([FromQuery] string frontend)
    {
        var response = _vnPayService.ValidateReturn(Request.Query);

        if (response.Success)
        {
            Guid? redirectLivestreamId = null;
            // Parse OrderInfo
            var parts = response.OrderInfo.Split('|');
            var userIdStr = parts.FirstOrDefault(p => p.StartsWith("UserId:"))?.Replace("UserId:", "");
            var plan = parts.FirstOrDefault(p => p.StartsWith("Plan:"))?.Replace("Plan:", "");
            var cycle = parts.FirstOrDefault(p => p.StartsWith("Cycle:"))?.Replace("Cycle:", "");
            var targetChannelIdStr = parts.FirstOrDefault(p => p.StartsWith("TargetChannelId:"))?.Replace("TargetChannelId:", "");
            var donationIdStr = parts.FirstOrDefault(p => p.StartsWith("DonationId:"))?.Replace("DonationId:", "");

            if (Guid.TryParse(userIdStr, out var userId))
            {
                var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null)
                {
                    // Create Payment record
                    var payment = new Payment
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Amount = response.Amount,
                        Currency = "VND",
                        PaymentMethod = "VNPAY",
                        Status = "Success",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Payments.Add(payment);

                    Guid? targetChannelId = Guid.TryParse(targetChannelIdStr, out var tcId) ? tcId : null;

                    if (plan == "Membership" && targetChannelId.HasValue)
                    {
                        // Handle Channel Membership
                        var subscription = await _context.Subscriptions
                            .FirstOrDefaultAsync(s => s.SubscriberId == userId && s.ChannelId == targetChannelId.Value);

                        if (subscription == null)
                        {
                            subscription = new Subscription
                            {
                                Id = Guid.NewGuid(),
                                SubscriberId = userId,
                                ChannelId = targetChannelId.Value,
                                Tier = cycle, // Using Cycle to store the tier name for now
                                Price = response.Amount,
                                StartDate = DateTime.UtcNow,
                                EndDate = DateTime.UtcNow.AddMonths(1),
                                Status = "Active"
                            };
                            _context.Subscriptions.Add(subscription);
                        }
                        else
                        {
                            subscription.EndDate = subscription.EndDate.HasValue && subscription.EndDate > DateTime.UtcNow
                                ? subscription.EndDate.Value.AddMonths(1)
                                : DateTime.UtcNow.AddMonths(1);
                            subscription.Status = "Active";
                            subscription.Tier = cycle;
                            subscription.Price = response.Amount;
                        }

                        var transaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            PaymentId = payment.Id,
                            TransactionType = $"ChannelMembership_{cycle}",
                            TargetChannelId = targetChannelId.Value,
                            Amount = response.Amount,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Transactions.Add(transaction);
                    }
                    else if (plan == "Donation" && Guid.TryParse(donationIdStr, out var donationId))
                    {
                        var donation = await _context.Donations.FindAsync(donationId);
                        if (donation != null)
                        {
                            donation.Status = "completed";
                            donation.TransactionId = payment.Id.ToString();

                            var transaction = new Transaction
                            {
                                Id = Guid.NewGuid(),
                                PaymentId = payment.Id,
                                TransactionType = "Donation",
                                TargetChannelId = targetChannelId,
                                Amount = response.Amount,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.Transactions.Add(transaction);
                            // Bắn sự kiện SignalR
                            await _hubContext.Clients.Group(donation.LivestreamId.ToString()).SendAsync("ReceiveSuperChat", new
                            {
                                id = donation.Id,
                                livestreamId = donation.LivestreamId,
                                donorName = donation.DonorName,
                                userAvatar = user.Profile?.AvatarUrl,
                                message = donation.Message,
                                amount = donation.Amount,
                                currency = donation.Currency,
                                createdAt = donation.CreatedAt
                            });

                            redirectLivestreamId = donation.LivestreamId;
                        }
                    }
                    else if (plan == "BuyCoins")
                    {
                        var coinsToAdd = (int)(response.Amount / 100); // 100 VND = 1 Coin
                        user.Coins += coinsToAdd;

                        var transaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            PaymentId = payment.Id,
                            TransactionType = "BuyCoins",
                            Amount = response.Amount,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Transactions.Add(transaction);
                    }
                    else
                    {
                        // Update user premium status
                        user.IsPremium = true;
                        var months = cycle == "Yearly" ? 12 : 1;
                        user.PremiumUntil = user.PremiumUntil.HasValue && user.PremiumUntil > DateTime.UtcNow
                            ? user.PremiumUntil.Value.AddMonths(months)
                            : DateTime.UtcNow.AddMonths(months);

                        // Create Transaction record
                        var transaction = new Transaction
                        {
                            Id = Guid.NewGuid(),
                            PaymentId = payment.Id,
                            TransactionType = $"PremiumUpgrade_{plan}_{cycle}",
                            Amount = response.Amount,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Transactions.Add(transaction);
                    }

                    await _context.SaveChangesAsync();
                }
            }

            var frontendUrl = !string.IsNullOrEmpty(frontend) ? frontend : (_configuration["FrontendUrl"] ?? "http://localhost:5173");
            if (plan == "Donation" && redirectLivestreamId.HasValue) 
            {
                return Redirect($"{frontendUrl}/live/{redirectLivestreamId.Value}");
            }
            return Redirect($"{frontendUrl}/payment-result?status=success&amount={response.Amount}&txn={response.TransactionId}&type={plan}");
        }

        var failUrl = !string.IsNullOrEmpty(frontend) ? frontend : (_configuration["FrontendUrl"] ?? "http://localhost:5173");
        return Redirect($"{failUrl}/payment-result?status=failed&code={response.ResponseCode}");
    }

    [HttpGet("current-plan")]
    [Authorize]
    public async Task<IActionResult> GetCurrentPlan()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        if (Guid.TryParse(userIdStr, out var userId))
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
                
            if (user == null) return NotFound();

            if (user.UserRoles.Any(ur => ur.Role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase) || ur.Role.Name.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)))
            {
                return Ok(new { plan = "Premium", cycle = "Unlimited", premiumUntil = (DateTime?)null, coins = user.Coins });
            }

            if (user.IsPremium != true || (user.PremiumUntil.HasValue && user.PremiumUntil.Value < DateTime.UtcNow))
            {
                return Ok(new { plan = "Free", premiumUntil = (DateTime?)null, coins = user.Coins });
            }

            // Get the latest premium transaction
            var latestTxn = await _context.Transactions
                .Where(t => t.Payment.UserId == userId && t.TransactionType.StartsWith("PremiumUpgrade_"))
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (latestTxn != null)
            {
                var parts = latestTxn.TransactionType.Split('_');
                var plan = parts.Length > 1 ? parts[1] : "Premium";
                var cycle = parts.Length > 2 ? parts[2] : "Monthly";
                return Ok(new { plan, cycle, premiumUntil = user.PremiumUntil, coins = user.Coins });
            }

            return Ok(new { plan = "Premium", cycle = "Monthly", premiumUntil = user.PremiumUntil, coins = user.Coins });
        }

        return BadRequest();
    }
}

public class PaymentRequestModel
{
    public string Plan { get; set; } = "Premium";
    public string Cycle { get; set; } = "Monthly";
    public decimal Amount { get; set; }
    public Guid? TargetChannelId { get; set; }
    public Guid? DonationId { get; set; }
}

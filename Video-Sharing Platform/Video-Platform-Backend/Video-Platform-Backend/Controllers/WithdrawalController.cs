using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Security.Claims;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WithdrawalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WithdrawalController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class WithdrawalDto
        {
            public decimal AmountVnd { get; set; }
            public string BankName { get; set; } = null!;
            public string BankAccountNumber { get; set; } = null!;
            public string BankAccountName { get; set; } = null!;
        }

        [HttpPost("request")]
        public async Task<IActionResult> RequestWithdrawal([FromBody] WithdrawalDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            if (dto.AmountVnd <= 0)
                return BadRequest(new { message = "Số tiền rút không hợp lệ." });

            int coinsEquivalent = (int)Math.Ceiling(dto.AmountVnd / 100m);

            var user = await _context.Users.FindAsync(userId);
            var totalGiftedCoins = await _context.Donations
                .Include(d => d.Livestream)
                .ThenInclude(l => l.Channel)
                .Where(d => d.Livestream != null && d.Livestream.Channel != null && d.Livestream.Channel.UserId == userId && d.Status == "completed" && d.Currency == "Xu")
                .SumAsync(d => d.Amount);

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            decimal totalMembershipRevenue = 0;
            if (channel != null)
            {
                totalMembershipRevenue = await _context.Transactions
                    .Include(t => t.Payment)
                    .Where(t => t.TargetChannelId == channel.Id && t.TransactionType != null && t.TransactionType.StartsWith("ChannelMembership") && t.Payment != null && t.Payment.Status == "Completed")
                    .SumAsync(t => t.Amount);
            }

            var totalDonatedMoney = await _context.Donations
                .Include(d => d.Livestream)
                .ThenInclude(l => l.Channel)
                .Where(d => d.Livestream != null && d.Livestream.Channel != null && d.Livestream.Channel.UserId == userId && d.Status == "completed" && d.Currency != "Xu")
                .SumAsync(d => d.Amount);

            var totalWithdrawnCoins = await _context.WithdrawalRequests
                .Where(w => w.UserId == userId && w.Status != "Rejected")
                .SumAsync(w => w.Coins);

            // Platform Fees
            decimal feeCoinOwn = 0.05m;
            decimal feeCoinGift = 0.30m;
            decimal feeDonate = 0.10m;
            decimal feeMembership = 0.30m;

            var virtualBalanceCoins = 
                (int)((decimal)totalGiftedCoins * (1m - feeCoinGift)) + 
                (int)((totalDonatedMoney / 100m) * (1m - feeDonate)) + 
                (int)((totalMembershipRevenue / 100m) * (1m - feeMembership));

            var remainingVirtualBalance = virtualBalanceCoins - totalWithdrawnCoins;
            if (remainingVirtualBalance < 0) remainingVirtualBalance = 0;

            var remainingVirtualBalanceVND = remainingVirtualBalance * 100m;
            decimal amountVndToDeductFromUserCoins = 0;
            int virtualCoinsToUse = 0;

            if (dto.AmountVnd > remainingVirtualBalanceVND)
            {
                amountVndToDeductFromUserCoins = dto.AmountVnd - remainingVirtualBalanceVND;
                virtualCoinsToUse = remainingVirtualBalance;
            }
            else
            {
                virtualCoinsToUse = (int)Math.Ceiling(dto.AmountVnd / 100m);
            }

            int coinsToDeductFromUser = 0;
            if (amountVndToDeductFromUserCoins > 0)
            {
                // Each user coin provides 100 * (1 - feeCoinOwn) VND
                decimal valuePerUserCoin = 100m * (1m - feeCoinOwn);
                coinsToDeductFromUser = (int)Math.Ceiling(amountVndToDeductFromUserCoins / valuePerUserCoin);
            }

            if (coinsToDeductFromUser > user.Coins)
                return BadRequest(new { message = "Số dư không đủ để rút." });

            // Calculate exact breakdown
            int totalGiftCoins = (int)((decimal)totalGiftedCoins * (1m - feeCoinGift));
            int totalDonateCoins = (int)((totalDonatedMoney / 100m) * (1m - feeDonate));
            int totalMembershipCoins = (int)((totalMembershipRevenue / 100m) * (1m - feeMembership));

            int remainingWithdrawn = totalWithdrawnCoins;
            if (remainingWithdrawn >= totalGiftCoins) { remainingWithdrawn -= totalGiftCoins; totalGiftCoins = 0; }
            else { totalGiftCoins -= remainingWithdrawn; remainingWithdrawn = 0; }
            if (remainingWithdrawn >= totalDonateCoins) { remainingWithdrawn -= totalDonateCoins; totalDonateCoins = 0; }
            else { totalDonateCoins -= remainingWithdrawn; remainingWithdrawn = 0; }
            if (remainingWithdrawn >= totalMembershipCoins) { remainingWithdrawn -= totalMembershipCoins; totalMembershipCoins = 0; }
            else { totalMembershipCoins -= remainingWithdrawn; remainingWithdrawn = 0; }

            int virtualToTake = virtualCoinsToUse;
            int useGift = 0, useDonate = 0, useMembership = 0;
            if (virtualToTake > 0 && totalGiftCoins > 0) {
                useGift = Math.Min(virtualToTake, totalGiftCoins);
                virtualToTake -= useGift;
            }
            if (virtualToTake > 0 && totalDonateCoins > 0) {
                useDonate = Math.Min(virtualToTake, totalDonateCoins);
                virtualToTake -= useDonate;
            }
            if (virtualToTake > 0 && totalMembershipCoins > 0) {
                useMembership = Math.Min(virtualToTake, totalMembershipCoins);
                virtualToTake -= useMembership;
            }

            var breakdownDataObj = new {
                OwnCoins = coinsToDeductFromUser,
                OwnCoinsVND = amountVndToDeductFromUserCoins,
                GiftVND = useGift * 100m,
                DonateVND = useDonate * 100m,
                MembershipVND = useMembership * 100m
            };
            string breakdownJson = System.Text.Json.JsonSerializer.Serialize(breakdownDataObj);

            // Use exact VND requested
            var amountFiat = dto.AmountVnd;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Only deduct from actual purchased user coins if they exceeded their virtual balance
                if (coinsToDeductFromUser > 0)
                {
                    user.Coins -= coinsToDeductFromUser;
                }

                var request = new WithdrawalRequest
                {
                    UserId = userId,
                    Coins = virtualCoinsToUse,
                    UserCoinsDeducted = coinsToDeductFromUser,
                    BreakdownData = breakdownJson,
                    AmountFiat = amountFiat,
                    BankName = dto.BankName,
                    BankAccountNumber = dto.BankAccountNumber,
                    BankAccountName = dto.BankAccountName,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.WithdrawalRequests.Add(request);

                // Add an audit log for the user action
                var log = new AuditLog
                {
                    UserId = userId,
                    Action = "Tạo lệnh rút tiền",
                    ActionType = "add",
                    Target = "WithdrawalRequest",
                    Details = $"Rút {dto.AmountVnd.ToString("N0")} VNĐ về NH {dto.BankName}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(log);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Tạo lệnh rút tiền thành công." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống khi tạo lệnh rút tiền.", details = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            var history = await _context.WithdrawalRequests
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new {
                    w.Id,
                    w.Coins,
                    w.AmountFiat,
                    w.BankName,
                    w.BankAccountNumber,
                    w.BankAccountName,
                    w.Status,
                    w.AdminNote,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetRevenueStats()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            var donations = await _context.Donations
                .Include(d => d.Livestream)
                .ThenInclude(l => l.Channel)
                .Where(d => d.Livestream != null && d.Livestream.Channel != null && d.Livestream.Channel.UserId == userId && d.Status == "completed")
                .ToListAsync();

            var totalDonatedMoney = donations.Where(d => d.Currency != "Xu").Sum(d => d.Amount);
            var totalGiftedCoins = donations.Where(d => d.Currency == "Xu").Sum(d => d.Amount);

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            decimal totalMembershipRevenue = 0;
            if (channel != null)
            {
                totalMembershipRevenue = await _context.Transactions
                    .Include(t => t.Payment)
                    .Where(t => t.TargetChannelId == channel.Id && t.TransactionType != null && t.TransactionType.StartsWith("ChannelMembership") && t.Payment != null && t.Payment.Status == "Completed")
                    .SumAsync(t => t.Amount);
            }

            return Ok(new
            {
                TotalDonatedMoney = totalDonatedMoney,
                TotalGiftedCoins = totalGiftedCoins,
                TotalMembershipRevenue = totalMembershipRevenue
            });
        }
    }
}

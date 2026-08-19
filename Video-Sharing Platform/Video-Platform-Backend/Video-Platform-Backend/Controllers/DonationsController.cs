using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Video_Platform_Backend.Hubs;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<DonationsController> _logger;
    private readonly IHubContext<LivestreamHub> _hubContext;

    public DonationsController(ApplicationDbContext db, ILogger<DonationsController> logger, IHubContext<LivestreamHub> hubContext)
    {
        _db = db;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Lấy danh sách donations trong livestream
    /// </summary>
    [HttpGet("livestream/{livestreamId}")]
    public async Task<IActionResult> GetDonations(Guid livestreamId, int limit = 50)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null) return NotFound("Livestream không tìm thấy");

        var donations = await _db.Donations
            .Where(d => d.LivestreamId == livestreamId && d.Status == "completed")
            .OrderByDescending(d => d.CreatedAt)
            .Take(limit)
            .Include(d => d.User)
                .ThenInclude(u => u.Profile)
            .Select(d => new
            {
                d.Id,
                d.DonorName,
                d.Message,
                d.Amount,
                d.Currency,
                d.IsSuperChat,
                d.CreatedAt,
                AvatarUrl = d.User != null && d.User.Profile != null ? d.User.Profile.AvatarUrl : null
            })
            .ToListAsync();

        return Ok(donations);
    }

    /// <summary>
    /// Tạo donation/super chat
    /// </summary>
    [HttpPost("create")]
    public async Task<IActionResult> CreateDonation([FromBody] CreateDonationDTO dto)
    {
        if (string.IsNullOrEmpty(dto.DonorName)) return BadRequest("Tên người tặng không được để trống");
        if (dto.Amount <= 0) return BadRequest("Số tiền phải lớn hơn 0");
        if (dto.Amount > 10000000) return BadRequest("Số tiền vượt quá giới hạn");

        var livestream = await _db.Livestreams.FindAsync(dto.LivestreamId);
        if (livestream == null) return NotFound("Livestream không tìm thấy");

        var donation = new Donation
        {
            Id = Guid.NewGuid(),
            LivestreamId = dto.LivestreamId,
            UserId = dto.UserId,
            DonorName = dto.DonorName,
            Message = dto.Message,
            Amount = dto.Amount,
            Currency = dto.Currency ?? "VND",
            IsSuperChat = dto.IsSuperChat,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { donation.Id, donation.Status });
    }

    /// <summary>
    /// Tặng quà bằng xu (Trừ xu trực tiếp)
    /// </summary>
    [HttpPost("send-gift")]
    [Authorize]
    public async Task<IActionResult> SendGift([FromBody] CreateDonationDTO dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) 
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound("Người dùng không tồn tại");

        if (dto.Amount <= 0) return BadRequest("Số xu phải lớn hơn 0");
        if (user.Coins < (int)dto.Amount) return BadRequest("Bạn không đủ xu, vui lòng nạp thêm");

        var livestream = await _db.Livestreams.FindAsync(dto.LivestreamId);
        if (livestream == null) return NotFound("Livestream không tìm thấy");

        // Deduct coins
        user.Coins -= (int)dto.Amount;
        _db.Users.Update(user);

        // Create donation
        var donation = new Donation
        {
            Id = Guid.NewGuid(),
            LivestreamId = dto.LivestreamId,
            UserId = userId,
            DonorName = dto.DonorName ?? user.Email,
            Message = dto.Message,
            Amount = dto.Amount,
            Currency = "Xu",
            IsSuperChat = dto.IsSuperChat,
            Status = "completed",
            CreatedAt = DateTime.UtcNow
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Tặng quà thành công", coins = user.Coins, donation });
    }

    /// <summary>
    /// Xác nhận donation (sau khi thanh toán VNPay thành công)
    /// </summary>
    [HttpPost("{donationId}/confirm")]
    public async Task<IActionResult> ConfirmDonation(Guid donationId, [FromBody] ConfirmDonationDTO dto)
    {
        var donation = await _db.Donations.FindAsync(donationId);
        if (donation == null) return NotFound("Donation không tìm thấy");

        donation.Status = "completed";
        donation.TransactionId = dto.TransactionId;

        _db.Donations.Update(donation);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"Donation confirmed: {donationId} - Amount: {donation.Amount}");

        return Ok(new { message = "Donation confirmed", donation.Id, donation.Status });
    }

    /// <summary>
    /// Lấy thống kê donations
    /// </summary>
    [HttpGet("livestream/{livestreamId}/stats")]
    public async Task<IActionResult> GetDonationStats(Guid livestreamId)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null) return NotFound("Livestream không tìm thấy");

        var donations = await _db.Donations
            .Where(d => d.LivestreamId == livestreamId && d.Status == "completed")
            .ToListAsync();

        var totalAmount = donations.Where(d => d.Currency != "Xu").Sum(d => d.Amount);
        var totalCoins = donations.Where(d => d.Currency == "Xu").Sum(d => d.Amount);
        var totalDonations = donations.Count;
        
        // Find top donor by VND amount
        var topDonor = donations.Where(d => d.Currency != "Xu").OrderByDescending(d => d.Amount).FirstOrDefault();

        return Ok(new
        {
            livestreamId,
            totalAmount,
            totalCoins,
            totalDonations,
            topDonor = topDonor != null ? new
            {
                topDonor.DonorName,
                topDonor.Amount,
                topDonor.Message
            } : null
        });
    }
}

public class CreateDonationDTO
{
    public Guid LivestreamId { get; set; }
    public Guid? UserId { get; set; }
    public string DonorName { get; set; } = null!;
    public string? Message { get; set; }
    public decimal Amount { get; set; }
    public string? Currency { get; set; } = "VND";
    public bool IsSuperChat { get; set; } = false;
}

public class ConfirmDonationDTO
{
    public string TransactionId { get; set; } = null!;
}

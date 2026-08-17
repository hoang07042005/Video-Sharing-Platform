using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DonationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<DonationsController> _logger;

    public DonationsController(ApplicationDbContext db, ILogger<DonationsController> logger)
    {
        _db = db;
        _logger = logger;
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
            .Select(d => new
            {
                d.Id,
                d.DonorName,
                d.Message,
                d.Amount,
                d.Currency,
                d.IsSuperChat,
                d.CreatedAt
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

        var totalAmount = donations.Sum(d => d.Amount);
        var totalDonations = donations.Count;
        var topDonor = donations.OrderByDescending(d => d.Amount).FirstOrDefault();

        return Ok(new
        {
            livestreamId,
            totalAmount,
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

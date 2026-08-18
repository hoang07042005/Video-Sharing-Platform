using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveMessagesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LiveMessagesController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("by-livestream/{livestreamId}")]
    public async Task<IActionResult> GetByLivestream(Guid livestreamId, int page = 1, int pageSize = 50)
    {
        // Get the livestream channel to check membership
        var livestream = await _db.Livestreams.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == livestreamId);
        var channelId = livestream?.ChannelId;

        // Get active subscribers for this channel
        HashSet<Guid> memberIds = new();
        if (channelId.HasValue)
        {
            memberIds = (await _db.Subscriptions
                .Where(s => s.ChannelId == channelId.Value && (s.Status == "active" || s.Status == "Active"))
                .Select(s => s.SubscriberId)
                .ToListAsync()).ToHashSet();
        }

        var q = _db.LiveMessages
            .Where(m => m.LivestreamId == livestreamId && !m.IsDeleted)
            .OrderBy(m => m.SentAt);

        var total = await q.CountAsync();

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.LivestreamId,
                m.UserId,
                m.Content,
                m.SentAt,
                m.IsDeleted,
                m.IsPinned,
                m.MessageType,
                UserName = m.User != null ? m.User.Channel != null ? m.User.Channel.ChannelName : "Anonymous" : "Anonymous",
                UserAvatar = m.User != null ? m.User.Channel != null ? m.User.Channel.AvatarUrl : null : null
            })
            .ToListAsync();

        var dtos = items.Select(i => new LiveMessageDTO
        {
            Id = i.Id,
            LivestreamId = i.LivestreamId,
            UserId = i.UserId,
            Content = i.Content,
            SentAt = i.SentAt,
            IsDeleted = i.IsDeleted,
            IsPinned = i.IsPinned,
            MessageType = i.MessageType,
            UserName = i.UserName,
            UserAvatar = i.UserAvatar,
            IsMember = i.UserId.HasValue && memberIds.Contains(i.UserId.Value)
        }).ToList();

        return Ok(new LiveMessageResponseDTO { Total = total, Page = page, PageSize = pageSize, Items = dtos });
    }

    [HttpPost("{id}/pin")]
    public async Task<IActionResult> Pin(Guid id)
    {
        var msg = await _db.LiveMessages.FindAsync(id);
        if (msg == null) return NotFound();
        msg.IsPinned = true;
        await _db.SaveChangesAsync();
        return Ok(msg);
    }

    [HttpPost("{id}/unpin")]
    public async Task<IActionResult> Unpin(Guid id)
    {
        var msg = await _db.LiveMessages.FindAsync(id);
        if (msg == null) return NotFound();
        msg.IsPinned = false;
        await _db.SaveChangesAsync();
        return Ok(msg);
    }

    [HttpPost("{id}/delete")]
    public async Task<IActionResult> SoftDelete(Guid id)
    {
        var msg = await _db.LiveMessages.FindAsync(id);
        if (msg == null) return NotFound();
        msg.IsDeleted = true;
        await _db.SaveChangesAsync();
        return Ok(msg);
    }

    [HttpPost("{id}/report")]
    public async Task<IActionResult> ReportMessage(Guid id, [FromBody] ReportMessageDto dto)
    {
        var msg = await _db.LiveMessages.FindAsync(id);
        if (msg == null) return NotFound();

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = dto.ReporterId,
            TargetId = id,
            TargetType = "LiveMessage",
            Reason = dto.Reason,
            Description = dto.Description,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();
        return Ok(new { success = true, reportId = report.Id });
    }

    public class ReportMessageDto
    {
        public Guid ReporterId { get; set; }
        public string Reason { get; set; } = "Spam";
        public string? Description { get; set; }
    }
}

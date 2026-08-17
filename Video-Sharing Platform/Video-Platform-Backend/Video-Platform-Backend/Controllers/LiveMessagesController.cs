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

    private LiveMessageDTO MapToDTO(LiveMessage m, User? user = null, Channel? channel = null)
    {
        return new LiveMessageDTO
        {
            Id = m.Id,
            LivestreamId = m.LivestreamId,
            UserId = m.UserId,
            Content = m.Content,
            SentAt = m.SentAt,
            IsDeleted = m.IsDeleted,
            IsPinned = m.IsPinned,
            MessageType = m.MessageType,
            UserName = channel?.ChannelName ?? "Anonymous",
            UserAvatar = channel?.AvatarUrl ?? null
        };
    }

    [HttpGet("by-livestream/{livestreamId}")]
    public async Task<IActionResult> GetByLivestream(Guid livestreamId, int page = 1, int pageSize = 50)
    {
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
            UserAvatar = i.UserAvatar
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
}

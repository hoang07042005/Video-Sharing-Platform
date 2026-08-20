using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LivestreamsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LivestreamsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Livestreams.Include(l => l.Channel).Where(l => !l.Channel.IsSuspended).OrderByDescending(l => l.ActualStartTime).ToListAsync();
        return Ok(list);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var list = await _db.Livestreams.Include(l => l.Channel).Where(l => l.Status == "live" && !l.Channel.IsSuspended).OrderByDescending(l => l.ActualStartTime).ToListAsync();
        return Ok(list);
    }

    [HttpGet("channel/{channelId}")]
    public async Task<IActionResult> GetByChannel(Guid channelId)
    {
        var list = await _db.Livestreams.Where(l => l.ChannelId == channelId).OrderByDescending(l => l.ScheduledStartTime).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var item = await _db.Livestreams
            .Include(l => l.Channel)
            .Include(l => l.Category)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (item == null) return NotFound();
        if (item.Channel.IsSuspended) return StatusCode(403, new { message = "Kênh này đã bị đình chỉ hoạt động." });

        bool isLiked = false;
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdStr, out var userId))
        {
            isLiked = await _db.LivestreamLikes.AnyAsync(l => l.LivestreamId == id && l.UserId == userId && l.IsLike);
        }

        return Ok(new
        {
            item.Id,
            item.ChannelId,
            item.Title,
            item.StreamKey,
            item.Description,
            item.ThumbnailUrl,
            item.HlsUrl,
            item.VodUrl,
            item.TotalViews,
            item.Tags,
            item.Status,
            item.ScheduledStartTime,
            item.ActualStartTime,
            item.EndTime,
            item.CurrentViewers,
            item.Likes,
            item.CategoryId,
            Category = item.Category != null ? new { item.Category.Id, item.Category.Name } : null,
            IsLiked = isLiked,
            Channel = item.Channel != null ? new { item.Channel.Id, item.Channel.ChannelName, item.Channel.AvatarUrl } : null
        });
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var livestream = await _db.Livestreams.FindAsync(id);
        if (livestream == null) return NotFound("Livestream not found");

        var existingLike = await _db.LivestreamLikes.FirstOrDefaultAsync(l => l.LivestreamId == id && l.UserId == userId);
        bool isLiked;

        if (existingLike != null)
        {
            if (existingLike.IsLike)
            {
                existingLike.IsLike = false;
                livestream.Likes = (livestream.Likes ?? 0) - 1;
                isLiked = false;
            }
            else
            {
                existingLike.IsLike = true;
                livestream.Likes = (livestream.Likes ?? 0) + 1;
                isLiked = true;
            }
        }
        else
        {
            _db.LivestreamLikes.Add(new LivestreamLike
            {
                Id = Guid.NewGuid(),
                LivestreamId = id,
                UserId = userId,
                IsLike = true,
                CreatedAt = DateTime.UtcNow
            });
            livestream.Likes = (livestream.Likes ?? 0) + 1;
            isLiked = true;
        }

        if (livestream.Likes < 0) livestream.Likes = 0;

        await _db.SaveChangesAsync();

        return Ok(new { isLiked, likesCount = livestream.Likes });
    }

    [HttpPost("{id}/start")]
    public async Task<IActionResult> Start(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.Status = "live";
        if (!item.ActualStartTime.HasValue)
            item.ActualStartTime = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Livestream updated)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();

        // Update allowed fields
        item.Title = updated.Title ?? item.Title;
        item.Description = updated.Description ?? item.Description;
        item.ThumbnailUrl = updated.ThumbnailUrl ?? item.ThumbnailUrl;
        item.HlsUrl = updated.HlsUrl ?? item.HlsUrl;
        item.VodUrl = updated.VodUrl ?? item.VodUrl;
        item.Tags = updated.Tags ?? item.Tags;
        item.Status = updated.Status ?? item.Status;
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("{id}/viewers/increment")]
    public async Task<IActionResult> IncrementViewers(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.CurrentViewers = (item.CurrentViewers ?? 0) + 1;
        await _db.SaveChangesAsync();
        return Ok(new { currentViewers = item.CurrentViewers });
    }

    [HttpPost("{id}/viewers/decrement")]
    public async Task<IActionResult> DecrementViewers(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.CurrentViewers = Math.Max(0, (item.CurrentViewers ?? 0) - 1);
        await _db.SaveChangesAsync();
        return Ok(new { currentViewers = item.CurrentViewers });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLivestreamDTO dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Where(kv => kv.Value.Errors.Count > 0)
                .ToDictionary(kv => kv.Key, kv => kv.Value.Errors.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(new { title = "One or more validation errors occurred.", status = 400, errors });
        }
            var channel = await _db.Channels.FindAsync(dto.ChannelId);
            if (channel == null) return BadRequest(new { message = "Kênh không tồn tại." });
            if (channel.IsSuspended) return StatusCode(403, new { message = "Kênh của bạn đã bị đình chỉ hoạt động." });
            if (!channel.CanLivestream) return StatusCode(403, new { message = "Kênh của bạn đã bị cấm phát trực tiếp." });

            var model = new Livestream
        {
            Id = Guid.NewGuid(),
            ChannelId = dto.ChannelId,
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Live Stream" : dto.Title,
            StreamKey = string.IsNullOrWhiteSpace(dto.StreamKey) ? Guid.NewGuid().ToString("N") : dto.StreamKey,
            Description = dto.Description ?? string.Empty,
            ThumbnailUrl = dto.ThumbnailUrl ?? string.Empty,
            HlsUrl = dto.HlsUrl ?? string.Empty,
            VodUrl = dto.VodUrl ?? string.Empty,
            Tags = dto.Tags ?? string.Empty,
            CategoryId = dto.CategoryId,
            TotalViews = dto.TotalViews ?? 0L,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "scheduled" : dto.Status,
            ScheduledStartTime = dto.ScheduledStartTime ?? DateTime.UtcNow,
            CurrentViewers = 0
        };

        if (string.Equals(model.Status, "live", StringComparison.OrdinalIgnoreCase))
        {
            model.ActualStartTime = DateTime.UtcNow;
        }

        _db.Livestreams.Add(model);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
    }

    [HttpPost("{id}/end")]
    public async Task<IActionResult> End(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.EndTime = DateTime.UtcNow;
        item.Status = "ended";
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("{id}/pause")]
    public async Task<IActionResult> Pause(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.Status = "paused";
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("{id}/resume")]
    public async Task<IActionResult> Resume(Guid id)
    {
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        item.Status = "live";
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPost("webhook/publish")]
    public async Task<IActionResult> WebhookPublish([FromBody] NmsWebhookDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StreamKey)) return BadRequest();
        var item = await _db.Livestreams.FirstOrDefaultAsync(l => l.StreamKey == dto.StreamKey);
        if (item == null) return NotFound("StreamKey not found");

        item.Status = "live";
        if (!item.ActualStartTime.HasValue) item.ActualStartTime = DateTime.UtcNow;
        // Use absolute URL to bypass Vite proxy - Express on port 8001 has CORS enabled
        item.HlsUrl = $"http://localhost:8001/live/{dto.StreamKey}/index.m3u8";

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("webhook/done")]
    public async Task<IActionResult> WebhookDone([FromBody] NmsWebhookDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StreamKey)) return BadRequest();
        var item = await _db.Livestreams.FirstOrDefaultAsync(l => l.StreamKey == dto.StreamKey);
        if (item == null) return NotFound("StreamKey not found");

        item.Status = "ended";
        item.EndTime = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("webhook/vod")]
    public async Task<IActionResult> WebhookVod([FromBody] VodWebhookDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.StreamKey) || string.IsNullOrWhiteSpace(dto.VodUrl))
            return BadRequest();

        var item = await _db.Livestreams.FirstOrDefaultAsync(l => l.StreamKey == dto.StreamKey);
        if (item == null) return NotFound("StreamKey not found");

        item.VodUrl = dto.VodUrl;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

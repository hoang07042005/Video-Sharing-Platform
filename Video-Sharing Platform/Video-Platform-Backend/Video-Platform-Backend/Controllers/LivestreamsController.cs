using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
        var list = await _db.Livestreams.OrderByDescending(l => l.ActualStartTime).ToListAsync();
        return Ok(list);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var list = await _db.Livestreams.Where(l => l.Status == "live").OrderByDescending(l => l.ActualStartTime).ToListAsync();
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
        var item = await _db.Livestreams.FindAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
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

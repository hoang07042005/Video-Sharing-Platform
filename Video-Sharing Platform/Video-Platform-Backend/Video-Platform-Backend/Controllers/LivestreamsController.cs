using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.SignalR;
using Video_Platform_Backend.Hubs;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LivestreamsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<LivestreamHub> _hubContext;

    public LivestreamsController(ApplicationDbContext db, IHubContext<LivestreamHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Livestreams
            .Where(l => l.Channel != null && !l.Channel.IsSuspended)
            .OrderByDescending(l => l.ActualStartTime)
            .Select(l => new
            {
                l.Id,
                l.ChannelId,
                l.Title,
                l.StreamKey,
                l.Description,
                l.ThumbnailUrl,
                l.HlsUrl,
                l.VodUrl,
                l.TotalViews,
                l.Tags,
                l.Status,
                l.ScheduledStartTime,
                l.ActualStartTime,
                l.EndTime,
                l.CurrentViewers,
                l.Likes,
                l.CategoryId,
                Category = l.Category == null ? null : new { l.Category.Id, l.Category.Name },
                Channel = l.Channel == null ? null : new
                {
                    l.Channel.Id,
                    l.Channel.ChannelName,
                    l.Channel.AvatarUrl
                }
            })
            .ToListAsync();
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
        return CreatedAtAction(nameof(Get), new { id = model.Id }, new { id = model.Id });
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

    [HttpPost("{id}/report")]
    [Authorize]
    public async Task<IActionResult> ReportLivestream(Guid id, [FromBody] CreateReportDTO request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

        var livestream = await _db.Livestreams.Include(l => l.Channel).FirstOrDefaultAsync(l => l.Id == id);
        if (livestream == null) return NotFound(new { message = "Livestream không tồn tại." });

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = userId,
            TargetId = id,
            TargetType = "Livestream",
            Reason = request.Reason,
            Description = request.Description,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        // Automated Strike Logic
        var tenMinutesAgo = DateTime.UtcNow.AddMinutes(-10);
        var recentReportsCount = await _db.Reports
            .Where(r => r.TargetId == id && r.TargetType == "Livestream" && r.CreatedAt >= tenMinutesAgo)
            .Select(r => r.ReporterId)
            .Distinct()
            .CountAsync();

        var strikeThreshold = 5; // Threshold for automatic strike

        if (recentReportsCount >= strikeThreshold && livestream.Status == "live")
        {
            // End livestream
            livestream.Status = "banned";
            livestream.EndTime = DateTime.UtcNow;
            
            // Add strike to channel
            if (livestream.Channel != null)
            {
                livestream.Channel.Strikes += 1;
                
                // Suspend channel if strikes >= 3
                if (livestream.Channel.Strikes >= 3)
                {
                    livestream.Channel.IsSuspended = true;
                }

                // Notify channel owner
                _db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = livestream.Channel.UserId,
                    Type = "System",
                    Title = "Livestream bị ngắt do vi phạm",
                    Message = $"Livestream '{livestream.Title}' của bạn đã bị ngắt do nhận quá nhiều báo cáo vi phạm tiêu chuẩn cộng đồng. Kênh của bạn bị cảnh cáo 1 gậy (Tổng: {livestream.Channel.Strikes}/3).",
                    TargetUrl = $"/c/{livestream.Channel.Handle}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Drop publisher from Media Server
            if (!string.IsNullOrEmpty(livestream.StreamKey))
            {
                try
                {
                    using (var httpClient = new System.Net.Http.HttpClient())
                    {
                        var payload = new { streamKey = livestream.StreamKey };
                        var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                        await httpClient.PostAsync("http://localhost:8001/api/drop", content);
                    }
                }
                catch (Exception ex)
                {
                    // Log but don't fail the request
                    Console.WriteLine($"[Drop Stream] Error calling media server: {ex.Message}");
                }
            }

            var recentReports = await _db.Reports
                .Where(r => r.TargetId == id && r.TargetType == "Livestream" && r.Status == "Pending")
                .ToListAsync();

            foreach (var r in recentReports)
            {
                r.Status = "Resolved";
            }

            await _db.SaveChangesAsync();
            
            // SignalR event to disconnect viewers
            await _hubContext.Clients.Group(livestream.Id.ToString()).SendAsync("StreamEnded", livestream.Id.ToString());
        }

        return Ok(new { message = "Báo cáo của bạn đã được gửi. Hệ thống sẽ xử lý." });
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

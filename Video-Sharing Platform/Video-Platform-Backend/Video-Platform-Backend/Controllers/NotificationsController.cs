using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ApplicationDbContext db, INotificationService notificationService, ILogger<NotificationsController> logger)
    {
        _db = db;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách notifications của user
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(int limit = 50, bool unreadOnly = false)
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var query = _db.Notifications
            .Where(n => n.UserId == userGuid);

        if (unreadOnly)
            query = query.Where(n => n.IsRead != true);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new
            {
                n.Id,
                n.Type,
                n.Message,
                n.TargetUrl,
                n.IsRead,
                n.CreatedAt,
                n.ImageUrl
            })
            .ToListAsync();

        return Ok(notifications);
    }

    /// <summary>
    /// Lấy unread notification count
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var count = await _db.Notifications
            .CountAsync(n => n.UserId == userGuid && n.IsRead != true);

        return Ok(new { unreadCount = count });
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var notification = await _db.Notifications.FindAsync(notificationId);
        if (notification == null || notification.UserId != userGuid)
            return NotFound();

        notification.IsRead = true;
        _db.Notifications.Update(notification);
        await _db.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var notifications = await _db.Notifications
            .Where(n => n.UserId == userGuid && n.IsRead != true)
            .ToListAsync();

        foreach (var notif in notifications)
            notif.IsRead = true;

        _db.Notifications.UpdateRange(notifications);
        await _db.SaveChangesAsync();

        return Ok(new { markedAsRead = notifications.Count });
    }

    /// <summary>
    /// Delete notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId)
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var notification = await _db.Notifications.FindAsync(notificationId);
        if (notification == null || notification.UserId != userGuid)
            return NotFound();

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Get notification preferences
    /// </summary>
    [HttpGet("preferences")]
    public async Task<IActionResult> GetPreferences()
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var prefs = await _db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userGuid);
        if (prefs == null)
        {
            prefs = new NotificationPreference
            {
                Id = Guid.NewGuid(),
                UserId = userGuid,
                UpdatedAt = DateTime.UtcNow
            };
            _db.NotificationPreferences.Add(prefs);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            prefs.EnableStreamNotifications,
            prefs.EnableDonationNotifications,
            prefs.EnableCommentNotifications,
            prefs.EnableFollowNotifications,
            prefs.EnablePushNotifications,
            prefs.EnableEmailNotifications
        });
    }

    /// <summary>
    /// Update notification preferences
    /// </summary>
    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDTO dto)
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var prefs = await _db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userGuid);
        if (prefs == null)
        {
            prefs = new NotificationPreference
            {
                Id = Guid.NewGuid(),
                UserId = userGuid
            };
            _db.NotificationPreferences.Add(prefs);
        }

        prefs.EnableStreamNotifications = dto.EnableStreamNotifications ?? prefs.EnableStreamNotifications;
        prefs.EnableDonationNotifications = dto.EnableDonationNotifications ?? prefs.EnableDonationNotifications;
        prefs.EnableCommentNotifications = dto.EnableCommentNotifications ?? prefs.EnableCommentNotifications;
        prefs.EnableFollowNotifications = dto.EnableFollowNotifications ?? prefs.EnableFollowNotifications;
        prefs.EnablePushNotifications = dto.EnablePushNotifications ?? prefs.EnablePushNotifications;
        prefs.EnableEmailNotifications = dto.EnableEmailNotifications ?? prefs.EnableEmailNotifications;
        prefs.UpdatedAt = DateTime.UtcNow;

        if (dto.PushSubscriptionJson != null)
            prefs.PushSubscriptionJson = dto.PushSubscriptionJson;

        _db.NotificationPreferences.Update(prefs);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Preferences updated" });
    }

    /// <summary>
    /// Register push subscription (for Web Push API)
    /// </summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionDTO dto)
    {
        var userId = User.FindFirst("id")?.Value;
        if (!Guid.TryParse(userId, out var userGuid)) return Unauthorized();

        var prefs = await _db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userGuid);
        if (prefs == null)
        {
            prefs = new NotificationPreference
            {
                Id = Guid.NewGuid(),
                UserId = userGuid
            };
            _db.NotificationPreferences.Add(prefs);
        }

        prefs.PushSubscriptionJson = System.Text.Json.JsonSerializer.Serialize(dto);
        prefs.EnablePushNotifications = true;
        prefs.UpdatedAt = DateTime.UtcNow;

        _db.NotificationPreferences.Update(prefs);
        await _db.SaveChangesAsync();

        _logger.LogInformation($"User {userGuid} subscribed to push notifications");
        return Ok(new { message = "Successfully subscribed to push notifications" });
    }
}

public class UpdatePreferencesDTO
{
    public bool? EnableStreamNotifications { get; set; }
    public bool? EnableDonationNotifications { get; set; }
    public bool? EnableCommentNotifications { get; set; }
    public bool? EnableFollowNotifications { get; set; }
    public bool? EnablePushNotifications { get; set; }
    public bool? EnableEmailNotifications { get; set; }
    public string? PushSubscriptionJson { get; set; }
}

public class PushSubscriptionDTO
{
    public string Endpoint { get; set; } = null!;
    public KeysDTO Keys { get; set; } = null!;
}

public class KeysDTO
{
    public string P256dh { get; set; } = null!;
    public string Auth { get; set; } = null!;
}

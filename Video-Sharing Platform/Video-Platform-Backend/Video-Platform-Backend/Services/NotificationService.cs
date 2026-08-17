using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Services;

public interface INotificationService
{
    Task<bool> SendNotificationAsync(Guid userId, string title, string message, string type, string? actionUrl = null, Guid? relatedId = null, string? imageUrl = null);
    Task<bool> NotifyFollowersAsync(Guid streamerId, string title, string message, string type, string? actionUrl = null);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext db, ILogger<NotificationService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<bool> SendNotificationAsync(Guid userId, string title, string message, string type, string? actionUrl = null, Guid? relatedId = null, string? imageUrl = null)
    {
        try
        {
            // Check user notification preference
            var preference = await _db.NotificationPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (preference == null)
            {
                // Create default preference if doesn't exist
                preference = new NotificationPreference
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.NotificationPreferences.Add(preference);
                await _db.SaveChangesAsync();
            }

            // Check if this type of notification is enabled
            if (!IsNotificationTypeEnabled(type, preference))
            {
                _logger.LogInformation($"Notification type {type} is disabled for user {userId}");
                return false;
            }

            // Create notification
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = type,
                Message = message,
                TargetUrl = actionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                ImageUrl = imageUrl,
                RelatedId = relatedId
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            _logger.LogInformation($"Notification sent to user {userId}: {type} - {message}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error sending notification: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> NotifyFollowersAsync(Guid streamerId, string title, string message, string type, string? actionUrl = null)
    {
        try
        {
            // Get streamer's channel
            var channel = await _db.Channels.FirstOrDefaultAsync(c => c.UserId == streamerId);
            if (channel == null)
            {
                _logger.LogWarning($"Channel not found for streamer {streamerId}");
                return false;
            }

            // Get all followers of this channel
            var followers = await _db.Followers
                .Where(f => f.ChannelId == channel.Id)
                .Select(f => f.FollowerId)
                .ToListAsync();

            if (followers.Count == 0)
            {
                _logger.LogInformation($"No followers found for streamer {streamerId}");
                return true;
            }

            // Send notification to all followers
            var tasks = followers.Select(followerId =>
                SendNotificationAsync(followerId, title, message, type, actionUrl, streamerId)
            );

            await Task.WhenAll(tasks);
            _logger.LogInformation($"Notification sent to {followers.Count} followers of streamer {streamerId}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error notifying followers: {ex.Message}");
            return false;
        }
    }

    private bool IsNotificationTypeEnabled(string type, NotificationPreference preference)
    {
        return type switch
        {
            "stream_live" => preference.EnableStreamNotifications,
            "donation" => preference.EnableDonationNotifications,
            "comment" => preference.EnableCommentNotifications,
            "follow" => preference.EnableFollowNotifications,
            _ => true
        };
    }
}

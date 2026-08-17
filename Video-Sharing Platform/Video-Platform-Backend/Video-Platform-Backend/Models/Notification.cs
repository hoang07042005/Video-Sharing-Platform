using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Notification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Type { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string? TargetUrl { get; set; }

    public bool? IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? ImageUrl { get; set; }

    public Guid? RelatedId { get; set; } // StreamId, UserId, etc.

    public virtual User User { get; set; } = null!;
}

public partial class NotificationPreference
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public bool EnableStreamNotifications { get; set; } = true;

    public bool EnableDonationNotifications { get; set; } = true;

    public bool EnableCommentNotifications { get; set; } = true;

    public bool EnableFollowNotifications { get; set; } = true;

    public bool EnablePushNotifications { get; set; } = true;

    public bool EnableEmailNotifications { get; set; } = false;

    public string? PushSubscriptionJson { get; set; } // Web Push subscription data

    public DateTime UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}

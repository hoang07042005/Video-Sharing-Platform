using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class User
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? GoogleId { get; set; }

    public string? FacebookId { get; set; }

    public bool? IsEmailVerified { get; set; }

    public bool? IsPhoneVerified { get; set; }

    public string? PhoneNumber { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsBanned { get; set; }

    public bool ReceiveNewVideoNotifications { get; set; } = true;

    public bool ReceiveCommentNotifications { get; set; } = true;

    public bool? IsPremium { get; set; }

    public DateTime? PremiumUntil { get; set; }

    public string CurrentPlan { get; set; } = "Free";

    public int Coins { get; set; } = 0;

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual Channel? Channel { get; set; }

    public virtual ICollection<CommentLike> CommentLikes { get; set; } = new List<CommentLike>();

    public virtual ICollection<CommentReply> CommentReplies { get; set; } = new List<CommentReply>();

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<ConversationParticipant> ConversationParticipants { get; set; } = new List<ConversationParticipant>();

    public virtual ICollection<CopyrightClaim> CopyrightClaims { get; set; } = new List<CopyrightClaim>();

    public virtual ICollection<Follower> Followers { get; set; } = new List<Follower>();

    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();

    public virtual ICollection<LiveMessage> LiveMessages { get; set; } = new List<LiveMessage>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual Profile? Profile { get; set; }

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual Setting? Setting { get; set; }

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual ICollection<WatchHistory> WatchHistories { get; set; } = new List<WatchHistory>();
}

using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Channel
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string ChannelName { get; set; } = null!;

    public string Handle { get; set; } = null!;

    public string? Description { get; set; }

    public string? BannerUrl { get; set; }

    public string? AvatarUrl { get; set; }

    public string? SocialLinks { get; set; }

    public long? TotalViews { get; set; }

    public string? ContactEmail { get; set; }

    public string? Country { get; set; }

    public decimal? MembershipFee { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool IsVerified { get; set; } = false;

    public bool IsSuspended { get; set; } = false;

    public bool CanLivestream { get; set; } = true;

    public bool CanUploadVideo { get; set; } = true;

    public virtual ICollection<Follower> Followers { get; set; } = new List<Follower>();

    public virtual ICollection<Livestream> Livestreams { get; set; } = new List<Livestream>();

    public virtual ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();

    public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Video> Videos { get; set; } = new List<Video>();
}

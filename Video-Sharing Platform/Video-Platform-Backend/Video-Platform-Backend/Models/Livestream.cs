using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Livestream
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public string Title { get; set; } = null!;

    public string StreamKey { get; set; } = null!;

    // Optional metadata for frontend and VOD/HLS playback
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? HlsUrl { get; set; }
    public string? VodUrl { get; set; }
    public long? TotalViews { get; set; }
    public string? Tags { get; set; }

    public int? CategoryId { get; set; }

    // Status: "scheduled", "live", "ended"
    public string? Status { get; set; }

    public int? Likes { get; set; }

    public DateTime? ScheduledStartTime { get; set; }

    // ActualStartTime used to track when stream went live
    public DateTime? ActualStartTime { get; set; }

    public DateTime? EndTime { get; set; }

    // Current concurrent viewers (editable by backend processes)
    public int? CurrentViewers { get; set; }

    public virtual Channel? Channel { get; set; }

    public virtual VideoCategory? Category { get; set; }

    public virtual ICollection<LiveMessage> LiveMessages { get; set; } = new List<LiveMessage>();

    public virtual ICollection<StreamStatistic> StreamStatistics { get; set; } = new List<StreamStatistic>();

    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();

    public virtual ICollection<VideoQuality> VideoQualities { get; set; } = new List<VideoQuality>();

    public virtual ICollection<LivestreamLike> LivestreamLikes { get; set; } = new List<LivestreamLike>();
}

using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Video
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public int? CategoryId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? Visibility { get; set; }

    public int? Duration { get; set; }

    public long? ViewsCount { get; set; }

    public int? LikesCount { get; set; }

    public int? DislikesCount { get; set; }

    public int? CommentsCount { get; set; }

    public DateTime? ScheduledAt { get; set; }

    public bool? IsShort { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual VideoCategory? Category { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<CopyrightClaim> CopyrightClaims { get; set; } = new List<CopyrightClaim>();

    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();

    public virtual ICollection<PlaylistVideo> PlaylistVideos { get; set; } = new List<PlaylistVideo>();

    public virtual ICollection<VideoFile> VideoFiles { get; set; } = new List<VideoFile>();

    public virtual ICollection<VideoTag> VideoTags { get; set; } = new List<VideoTag>();

    public virtual ICollection<VideoThumbnail> VideoThumbnails { get; set; } = new List<VideoThumbnail>();

    public virtual ICollection<View> Views { get; set; } = new List<View>();

    public virtual ICollection<WatchHistory> WatchHistories { get; set; } = new List<WatchHistory>();
}

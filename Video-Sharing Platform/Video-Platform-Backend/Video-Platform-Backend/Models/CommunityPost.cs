using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class CommunityPost
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsMembersOnly { get; set; } = false;

    public bool IsPinned { get; set; } = false;

    public Guid? AuthorId { get; set; }

    public string? VideoUrl { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual User? Author { get; set; }

    public virtual ICollection<CommunityPostImage> CommunityPostImages { get; set; } = new List<CommunityPostImage>();

    public virtual ICollection<CommunityPostPollOption> CommunityPostPollOptions { get; set; } = new List<CommunityPostPollOption>();

    public virtual ICollection<CommunityPostLike> CommunityPostLikes { get; set; } = new List<CommunityPostLike>();

    public virtual ICollection<CommunityPostComment> CommunityPostComments { get; set; } = new List<CommunityPostComment>();
}

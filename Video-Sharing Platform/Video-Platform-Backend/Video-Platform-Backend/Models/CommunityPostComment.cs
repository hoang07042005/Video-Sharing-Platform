using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostComment
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid UserId { get; set; }

    public string Content { get; set; } = null!;

    public int? LikesCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
    
    public Guid? ParentCommentId { get; set; }

    public virtual CommunityPost Post { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual CommunityPostComment? ParentComment { get; set; }

    public virtual ICollection<CommunityPostComment> Replies { get; set; } = new List<CommunityPostComment>();
    
    public virtual ICollection<CommunityPostCommentLike> Likes { get; set; } = new List<CommunityPostCommentLike>();
}

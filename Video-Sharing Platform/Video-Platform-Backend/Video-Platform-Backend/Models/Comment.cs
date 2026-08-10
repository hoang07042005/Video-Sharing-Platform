using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Comment
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public Guid UserId { get; set; }

    public string Content { get; set; } = null!;

    public int? LikesCount { get; set; }

    public bool? IsPinned { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<CommentLike> CommentLikes { get; set; } = new List<CommentLike>();

    public virtual ICollection<CommentReply> CommentReplies { get; set; } = new List<CommentReply>();

    public virtual User User { get; set; } = null!;

    public virtual Video Video { get; set; } = null!;
}

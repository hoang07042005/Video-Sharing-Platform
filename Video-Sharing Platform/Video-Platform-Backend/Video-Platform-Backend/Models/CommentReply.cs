using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class CommentReply
{
    public Guid Id { get; set; }

    public Guid ParentCommentId { get; set; }

    public Guid UserId { get; set; }

    public string Content { get; set; } = null!;

    public int? LikesCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Comment ParentComment { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

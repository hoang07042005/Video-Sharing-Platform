using System;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostCommentLike
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid CommentId { get; set; }

    public bool IsLike { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual CommunityPostComment Comment { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

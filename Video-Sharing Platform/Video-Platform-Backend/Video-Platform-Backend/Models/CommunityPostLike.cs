using System;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostLike
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid UserId { get; set; }

    public bool IsLike { get; set; }

    public virtual CommunityPost Post { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

using System;

namespace Video_Platform_Backend.Models;

public partial class LivestreamLike
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid LivestreamId { get; set; }

    public bool IsLike { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Livestream Livestream { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

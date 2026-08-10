using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class WatchHistory
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid VideoId { get; set; }

    public int? WatchedDuration { get; set; }

    public DateTime? LastWatchedAt { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual Video Video { get; set; } = null!;
}

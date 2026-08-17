using System;

namespace Video_Platform_Backend.Models;

public partial class StreamStatistic
{
    public Guid Id { get; set; }

    public Guid LivestreamId { get; set; }

    public int ViewerCount { get; set; }

    public DateTime RecordedAt { get; set; }

    public virtual Livestream Livestream { get; set; } = null!;
}

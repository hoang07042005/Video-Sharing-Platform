using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Livestream
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public string Title { get; set; } = null!;

    public string StreamKey { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? ScheduledStartTime { get; set; }

    public DateTime? ActualStartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public int? CurrentViewers { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual ICollection<LiveMessage> LiveMessages { get; set; } = new List<LiveMessage>();
}

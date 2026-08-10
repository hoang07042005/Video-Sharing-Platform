using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class View
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public Guid? UserId { get; set; }

    public string? IpAddress { get; set; }

    public DateTime? ViewedAt { get; set; }

    public virtual Video Video { get; set; } = null!;
}

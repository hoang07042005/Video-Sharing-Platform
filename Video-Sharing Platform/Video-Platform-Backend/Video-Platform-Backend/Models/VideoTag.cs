using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class VideoTag
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public string Tag { get; set; } = null!;

    public virtual Video Video { get; set; } = null!;
}

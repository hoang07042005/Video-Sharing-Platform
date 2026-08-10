using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class VideoFile
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public string? Resolution { get; set; }

    public string FileUrl { get; set; } = null!;

    public long? FileSize { get; set; }

    public string? Format { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Video Video { get; set; } = null!;
}

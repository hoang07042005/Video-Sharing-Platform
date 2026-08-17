using System;

namespace Video_Platform_Backend.Models;

public partial class VideoQuality
{
    public Guid Id { get; set; }

    public Guid LivestreamId { get; set; }

    public string QualityLabel { get; set; } = null!; // 1080p, 720p, 480p, 360p, 240p

    public int Height { get; set; }

    public int Bitrate { get; set; } // in kbps

    public string HlsUrl { get; set; } = null!;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public virtual Livestream? Livestream { get; set; }
}

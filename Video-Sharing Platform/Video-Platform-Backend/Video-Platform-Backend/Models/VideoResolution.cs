using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models;

public partial class VideoResolution
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid VideoId { get; set; }

    [Required]
    [StringLength(50)]
    public string Resolution { get; set; } = null!; // e.g. "1080p", "720p", "480p"

    [Required]
    public string FileUrl { get; set; } = null!;

    public int? Width { get; set; }

    public int? Height { get; set; }

    public int? Bitrate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("VideoId")]
    public virtual Video Video { get; set; } = null!;
}

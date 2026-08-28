using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models;

public partial class ChannelStrike
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ChannelId { get; set; }

    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = null!;

    public Guid? TargetId { get; set; }

    public string? TargetType { get; set; }

    public DateTime CreatedAt { get; set; }

    [ForeignKey("ChannelId")]
    public virtual Channel Channel { get; set; } = null!;
}

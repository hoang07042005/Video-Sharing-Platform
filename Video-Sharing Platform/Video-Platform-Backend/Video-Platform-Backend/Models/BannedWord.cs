using System;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.Models;

public class BannedWord
{
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Keyword { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Level { get; set; } = "Medium"; // Low, Medium, High

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int HitCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

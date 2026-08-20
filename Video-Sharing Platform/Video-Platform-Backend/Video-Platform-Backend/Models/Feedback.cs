using System;

namespace Video_Platform_Backend.Models;

public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string Type { get; set; } = null!; // 'bug', 'feature', 'ui', 'other'

    public string Content { get; set; } = null!;

    public string? AttachmentUrl { get; set; }

    public string Status { get; set; } = "Pending"; // 'Pending', 'Resolved'

    public string? AdminReply { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}

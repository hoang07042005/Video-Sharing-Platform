using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class LiveMessage
{
    public Guid Id { get; set; }

    public Guid LivestreamId { get; set; }

    public Guid? UserId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime? SentAt { get; set; }

    // Moderation / metadata
    public bool IsDeleted { get; set; }
    
    public bool IsPinned { get; set; }
    // MessageType: "Normal", "Donation", "System", etc.
    public string? MessageType { get; set; }

    public virtual Livestream Livestream { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

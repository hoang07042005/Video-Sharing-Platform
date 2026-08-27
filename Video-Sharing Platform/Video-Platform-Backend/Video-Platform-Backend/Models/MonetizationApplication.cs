using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models
{
    public class MonetizationApplication
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ChannelId { get; set; }

        [ForeignKey("ChannelId")]
        public virtual Channel Channel { get; set; } = null!;

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public string? AdminNote { get; set; }

        public string? RejectReason { get; set; }

        public string? EvidenceUrl { get; set; }
    }
}

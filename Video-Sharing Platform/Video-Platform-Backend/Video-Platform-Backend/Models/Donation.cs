using System;

namespace Video_Platform_Backend.Models;

public partial class Donation
{
    public Guid Id { get; set; }

    public Guid LivestreamId { get; set; }

    public Guid? UserId { get; set; }

    public string DonorName { get; set; } = null!;

    public string? Message { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "VND";

    public bool IsSuperChat { get; set; } = false;

    public string? TransactionId { get; set; }

    public string Status { get; set; } = "pending"; // pending, completed, failed

    public DateTime CreatedAt { get; set; }

    public virtual Livestream? Livestream { get; set; }

    public virtual User? User { get; set; }
}

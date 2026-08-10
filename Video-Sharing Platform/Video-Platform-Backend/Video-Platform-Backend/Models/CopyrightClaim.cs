using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class CopyrightClaim
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public Guid ClaimantId { get; set; }

    public string Reason { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Claimant { get; set; } = null!;

    public virtual Video Video { get; set; } = null!;
}

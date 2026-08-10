using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Report
{
    public Guid Id { get; set; }

    public Guid ReporterId { get; set; }

    public Guid TargetId { get; set; }

    public string TargetType { get; set; } = null!;

    public string Reason { get; set; } = null!;

    public string? Description { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Reporter { get; set; } = null!;
}

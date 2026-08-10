using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Transaction
{
    public Guid Id { get; set; }

    public Guid PaymentId { get; set; }

    public string? TransactionType { get; set; }

    public Guid? TargetChannelId { get; set; }

    public decimal Amount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Payment Payment { get; set; } = null!;

    public virtual Channel? TargetChannel { get; set; }
}

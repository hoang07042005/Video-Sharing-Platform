using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Subscription
{
    public Guid Id { get; set; }

    public Guid SubscriberId { get; set; }

    public Guid ChannelId { get; set; }

    public string? Tier { get; set; }

    public decimal? Price { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public string? Status { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual User Subscriber { get; set; } = null!;
}

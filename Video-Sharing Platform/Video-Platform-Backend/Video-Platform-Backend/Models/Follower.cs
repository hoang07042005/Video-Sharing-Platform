using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Follower
{
    public Guid Id { get; set; }

    public Guid FollowerId { get; set; }

    public Guid ChannelId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual User FollowerNavigation { get; set; } = null!;
}

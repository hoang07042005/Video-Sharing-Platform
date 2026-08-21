using System;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostVote
{
    public Guid Id { get; set; }

    public Guid PollOptionId { get; set; }

    public Guid UserId { get; set; }

    public virtual CommunityPostPollOption PollOption { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

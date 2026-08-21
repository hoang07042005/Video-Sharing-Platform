using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostPollOption
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public string OptionText { get; set; } = null!;

    public virtual CommunityPost Post { get; set; } = null!;

    public virtual ICollection<CommunityPostVote> CommunityPostVotes { get; set; } = new List<CommunityPostVote>();
}

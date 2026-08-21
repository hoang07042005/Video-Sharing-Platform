using System;

namespace Video_Platform_Backend.Models;

public partial class CommunityPostImage
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public string ImageUrl { get; set; } = null!;
    
    public int SortOrder { get; set; } = 0;

    public virtual CommunityPost Post { get; set; } = null!;
}

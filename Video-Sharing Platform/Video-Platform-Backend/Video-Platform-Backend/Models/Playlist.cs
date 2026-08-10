using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Playlist
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? Visibility { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Channel Channel { get; set; } = null!;

    public virtual ICollection<PlaylistVideo> PlaylistVideos { get; set; } = new List<PlaylistVideo>();
}

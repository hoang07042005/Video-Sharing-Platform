using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class PlaylistVideo
{
    public Guid Id { get; set; }

    public Guid PlaylistId { get; set; }

    public Guid VideoId { get; set; }

    public int? SortOrder { get; set; }

    public DateTime? AddedAt { get; set; }

    public virtual Playlist Playlist { get; set; } = null!;

    public virtual Video Video { get; set; } = null!;
}

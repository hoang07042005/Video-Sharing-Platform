using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class VideoCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string Icon { get; set; } = "LayoutGrid";

    public bool IsActive { get; set; } = true;

    public virtual ICollection<Video> Videos { get; set; } = new List<Video>();
}

using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Label { get; set; }
    public string? Color { get; set; }
    public string? TextColor { get; set; }
    public string? BgColor { get; set; }
    public string? BorderColor { get; set; }
    public string? Icon { get; set; }
    public string? PermissionsJson { get; set; }

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

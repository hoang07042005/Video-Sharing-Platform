using System;

namespace Video_Platform_Backend.Models;

public partial class UserRole
{
    public Guid UserId { get; set; }

    public int RoleId { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual Role Role { get; set; } = null!;
}

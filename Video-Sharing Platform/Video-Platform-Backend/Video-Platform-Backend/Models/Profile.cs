using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Profile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string? FullName { get; set; }

    public string? AvatarUrl { get; set; }

    public string? CoverUrl { get; set; }

    public string? Bio { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public virtual User User { get; set; } = null!;
}

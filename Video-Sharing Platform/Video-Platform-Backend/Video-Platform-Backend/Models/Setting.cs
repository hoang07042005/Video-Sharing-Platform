using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Models;

public partial class Setting
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string? Theme { get; set; }

    public string? Language { get; set; }

    public string? PrivacySettings { get; set; }

    public string? NotificationSettings { get; set; }

    public virtual User User { get; set; } = null!;
}

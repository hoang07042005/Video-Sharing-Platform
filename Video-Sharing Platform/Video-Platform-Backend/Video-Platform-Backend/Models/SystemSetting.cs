using System;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.Models;

public partial class SystemSetting
{
    [Key]
    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;

    public string Type { get; set; } = "string"; // string, boolean, number

    public string GroupName { get; set; } = "General";
}

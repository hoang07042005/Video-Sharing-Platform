using System;

namespace Video_Platform_Backend.Models;

public class SearchHistory
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Query { get; set; } = string.Empty;
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
}

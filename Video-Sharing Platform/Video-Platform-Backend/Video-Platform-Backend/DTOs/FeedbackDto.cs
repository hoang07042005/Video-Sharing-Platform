using System;

namespace Video_Platform_Backend.DTOs;

public class CreateFeedbackDto
{
    public string Type { get; set; } = null!; // 'bug', 'feature', 'ui', 'other'
    public string Content { get; set; } = null!;
    public string? AttachmentUrl { get; set; }
}

public class ReplyFeedbackDto
{
    public string ReplyContent { get; set; } = null!;
}

public class FeedbackResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? UserFullName { get; set; }
    public string? UserAvatarUrl { get; set; }
    public string? UserEmail { get; set; }
    public string Type { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = null!;
    public string? AdminReply { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsPremium { get; set; }
}

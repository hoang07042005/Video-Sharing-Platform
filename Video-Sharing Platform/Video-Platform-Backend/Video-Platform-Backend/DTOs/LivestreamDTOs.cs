using System;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.DTOs;

public class CreateLivestreamDTO
{
    [Required]
    public Guid ChannelId { get; set; }

    public string? Title { get; set; }

    public string? StreamKey { get; set; }

    public string? Description { get; set; }

    public string? ThumbnailUrl { get; set; }

    public string? HlsUrl { get; set; }

    public string? VodUrl { get; set; }

    public string? Tags { get; set; }

    public long? TotalViews { get; set; }

    public string? Status { get; set; }

    public DateTime? ScheduledStartTime { get; set; }
}

public class NmsWebhookDto
{
    public string StreamKey { get; set; } = string.Empty;
}

public class VodWebhookDto
{
    public string StreamKey { get; set; } = string.Empty;
    public string VodUrl { get; set; } = string.Empty;
}


public class LiveMessageDTO
{
    public Guid Id { get; set; }
    public Guid LivestreamId { get; set; }
    public Guid? UserId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime? SentAt { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsPinned { get; set; }
    public string? MessageType { get; set; }
    
    // User info
    public string? UserName { get; set; }
    public string? UserAvatar { get; set; }
    
    // Membership info
    public bool IsMember { get; set; } = false;
}

public class LiveMessageResponseDTO
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public List<LiveMessageDTO> Items { get; set; } = new();
}

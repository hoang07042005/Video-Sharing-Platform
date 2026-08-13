using System;

namespace Video_Platform_Backend.DTOs
{
    public class CategoryResponseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = "LayoutGrid";
    }

    public class VideoResponseDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int Duration { get; set; } // in seconds
        public int WatchedDuration { get; set; } // Add watched duration for history
        public long ViewsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsShort { get; set; }
        public int? CategoryId { get; set; }
        // Channel Info
        public Guid ChannelId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string ChannelHandle { get; set; } = string.Empty;
        public string ChannelAvatarUrl { get; set; } = string.Empty;
    }

    public class VideoDetailDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string VideoUrl { get; set; } = string.Empty; // Actual video file URL
        public int Duration { get; set; }
        public long ViewsCount { get; set; }
        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public int CommentsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Channel Info
        public Guid ChannelId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string ChannelHandle { get; set; } = string.Empty;
        public string ChannelAvatarUrl { get; set; } = string.Empty;
        public int SubscriberCount { get; set; }
        public Guid OwnerUserId { get; set; }
        
        // User specific interaction state
        public bool IsLiked { get; set; }
        public bool IsDisliked { get; set; }
        public bool IsSubscribed { get; set; }
        public bool IsSaved { get; set; }

        public List<VideoResolutionDTO> Resolutions { get; set; } = new List<VideoResolutionDTO>();
    }

    public class VideoResolutionDTO
    {
        public Guid Id { get; set; }
        public string Resolution { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
    }

    public class SaveProgressRequest
    {
        public int WatchedDuration { get; set; }
    }

    public class LikeRequestDTO
    {
        public bool IsLike { get; set; }
    }

    public class CommentRequestDTO
    {
        public string Content { get; set; } = string.Empty;
    }

    public class CommentResponseDTO
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public int LikesCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public List<CommentReplyDTO> Replies { get; set; } = new List<CommentReplyDTO>();
    }

    public class CommentReplyDTO
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public int LikesCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
    public class VideoManageDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int Duration { get; set; }
        public long ViewsCount { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public string Visibility { get; set; } = string.Empty;
        public bool IsShort { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public CategoryResponseDTO? Category { get; set; }
    }

    public class VideoUpdateDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Visibility { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public int? Duration { get; set; }
        public int? CategoryId { get; set; }
        public bool? IsShort { get; set; }
    }

    public class VideoCreateDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Visibility { get; set; } = "Public";
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public int Duration { get; set; } = 0;
        public int? CategoryId { get; set; }
        public bool IsShort { get; set; }
    }
    public class CreateReportDTO
    {
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}

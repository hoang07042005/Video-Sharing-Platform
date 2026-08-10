using System;

namespace Video_Platform_Backend.DTOs
{
    public class CategoryResponseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class VideoResponseDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public int Duration { get; set; } // in seconds
        public long ViewsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        
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
}

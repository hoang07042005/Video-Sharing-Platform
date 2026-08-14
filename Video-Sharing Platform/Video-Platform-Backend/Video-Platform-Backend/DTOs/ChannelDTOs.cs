using System;

namespace Video_Platform_Backend.DTOs
{
    public class ChannelProfileDTO
    {
        public Guid Id { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BannerUrl { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public int SubscriberCount { get; set; }
        public int FollowingCount { get; set; }
        public long TotalViews { get; set; }
        public string? ContactEmail { get; set; }
        public string? Country { get; set; }
        public string? SocialLinks { get; set; }
        public decimal? MembershipFee { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChannelUpdateDTO
    {
        public string ChannelName { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BannerUrl { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string? ContactEmail { get; set; }
        public string? Country { get; set; }
        public string? SocialLinks { get; set; }
        public decimal? MembershipFee { get; set; }
    }

    public class ChannelCardDTO
    {
        public Guid Id { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public int SubscriberCount { get; set; }
    }

    public class ChannelMemberDTO
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public DateTime? JoinedAt { get; set; }
        public DateTime? EndDate { get; set; }
        public string Tier { get; set; } = string.Empty;
    }
}

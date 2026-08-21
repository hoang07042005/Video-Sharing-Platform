using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.DTOs;

public class CreateCommunityPostDto
{
    [Required]
    public string Content { get; set; } = null!;
    
    public bool IsMembersOnly { get; set; } = false;

    public List<string>? ImageUrls { get; set; }
    
    public string? VideoUrl { get; set; }
    
    public List<string>? PollOptions { get; set; }

    public Guid? ChannelId { get; set; }
}

public class CommunityPostDto
{
    public Guid Id { get; set; }
    public Guid ChannelId { get; set; }
    public string ChannelName { get; set; } = null!;
    public string ChannelHandle { get; set; } = null!;
    public string? ChannelAvatarUrl { get; set; }
    
    public string Content { get; set; } = null!;
    public bool IsMembersOnly { get; set; }
    public bool IsPinned { get; set; }
    public DateTime? CreatedAt { get; set; }
    
    public List<string> Images { get; set; } = new List<string>();
    public string? VideoUrl { get; set; }

    public Guid? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string? AuthorHandle { get; set; }
    
    public List<CommunityPostPollOptionDto> PollOptions { get; set; } = new List<CommunityPostPollOptionDto>();
    
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLikedByMe { get; set; }
    public Guid? MyVoteOptionId { get; set; }
    public int TotalVotes { get; set; }
}

public class CommunityPostPollOptionDto
{
    public Guid Id { get; set; }
    public string OptionText { get; set; } = null!;
    public int VotesCount { get; set; }
    public double VotePercentage { get; set; }
}

public class CreateCommunityCommentDto
{
    [Required]
    public string Content { get; set; } = null!;
    public Guid? ParentCommentId { get; set; }
}

public class CommunityCommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string UserHandle { get; set; } = null!;
    public string? UserAvatarUrl { get; set; }
    public string Content { get; set; } = null!;
    public int LikesCount { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int RepliesCount { get; set; }
    public bool IsLikedByMe { get; set; }
}

public class CommunitySidebarDto
{
    public List<CommunityPostDto> PinnedPosts { get; set; } = new List<CommunityPostDto>();
    public List<SidebarFeaturedPostDto> FeaturedByLikes { get; set; } = new List<SidebarFeaturedPostDto>();
    public List<SidebarFeaturedPostDto> FeaturedByComments { get; set; } = new List<SidebarFeaturedPostDto>();
    public List<SidebarTopicDto> TrendingTopics { get; set; } = new List<SidebarTopicDto>();
    public SidebarStatsDto TodayStats { get; set; } = new SidebarStatsDto();
    public List<SidebarMemberDto> ActiveMembers { get; set; } = new List<SidebarMemberDto>();
}

public class SidebarFeaturedPostDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!; 
    public string? ImageUrl { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
}

public class SidebarTopicDto
{
    public string Tag { get; set; } = null!;
    public int PostsCount { get; set; }
}

public class SidebarStatsDto
{
    public int NewPosts { get; set; }
    public int NewVideos { get; set; }
    public int NewPolls { get; set; }
    public int NewComments { get; set; }
}

public class SidebarMemberDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public int PostsCount { get; set; }
    public string Initials { get; set; } = null!;
    public string BgColor { get; set; } = null!;
}

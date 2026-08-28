using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System.IdentityModel.Tokens.Jwt;

namespace Video_Platform_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CommunityController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CommunityController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("/api/channels/{channelId}/community")]
    public async Task<ActionResult<IEnumerable<CommunityPostDto>>> GetChannelPosts(Guid channelId, [FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string filter = "latest")
    {
        var currentUserId = User.Identity?.IsAuthenticated == true
            ? Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!)
            : (Guid?)null;

        var isSubscribed = false;
        if (currentUserId != null)
        {
            isSubscribed = await _context.Subscriptions
                .AnyAsync(s => s.SubscriberId == currentUserId && s.ChannelId == channelId && s.Status == "Active");
        }

        var query = _context.CommunityPosts
            .Include(p => p.Channel)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.Profile)
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Include(p => p.CommunityPostImages)
            .Include(p => p.CommunityPostPollOptions)
                .ThenInclude(po => po.CommunityPostVotes)
            .Include(p => p.CommunityPostLikes)
            .Include(p => p.CommunityPostComments)
            .Where(p => p.ChannelId == channelId);

        var channel = await _context.Channels.FindAsync(channelId);
        if (channel != null && currentUserId != channel.UserId && !isSubscribed)
        {
             query = query.Where(p => !p.IsMembersOnly);
        }

        if (filter == "latest")
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }
        else if (filter == "popular")
        {
            query = query.OrderByDescending(p => p.CommunityPostLikes.Count(l => l.IsLike) + p.CommunityPostComments.Count);
        }
        else if (filter == "oldest")
        {
            query = query.OrderBy(p => p.CreatedAt);
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        var posts = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        var dtos = posts.Select(p => 
        {
            var totalVotes = p.CommunityPostPollOptions.Sum(po => po.CommunityPostVotes.Count);
            
            return new CommunityPostDto
            {
                Id = p.Id,
                ChannelId = p.ChannelId,
                ChannelName = p.Channel.ChannelName,
                ChannelHandle = p.Channel.Handle,
                ChannelAvatarUrl = p.Channel.User.Profile != null ? p.Channel.User.Profile.AvatarUrl : null,
                Content = p.Content,
                IsMembersOnly = p.IsMembersOnly,
                IsPinned = p.IsPinned,
                CreatedAt = p.CreatedAt,
                Images = p.CommunityPostImages.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
                VideoUrl = p.VideoUrl,
                AuthorId = p.AuthorId,
                AuthorName = p.AuthorId == null ? (p.Channel.User.Profile != null ? p.Channel.User.Profile.FullName : p.Channel.User.Email) : (p.Author != null && p.Author.Profile != null ? p.Author.Profile.FullName : (p.Author != null ? p.Author.Email : null)),
                AuthorAvatarUrl = p.AuthorId == null ? (p.Channel.User.Profile != null ? p.Channel.User.Profile.AvatarUrl : null) : (p.Author != null && p.Author.Profile != null ? p.Author.Profile.AvatarUrl : null),
                AuthorHandle = null, // We'll just leave it null for simplicity unless we include Channel on User, but User doesn't have Channel nav property in EF by default from this direction
                LikesCount = p.CommunityPostLikes.Count(l => l.IsLike),
                CommentsCount = p.CommunityPostComments.Count,
                IsLikedByMe = currentUserId != null && p.CommunityPostLikes.Any(l => l.UserId == currentUserId && l.IsLike),
                TotalVotes = totalVotes,
                PollOptions = p.CommunityPostPollOptions.Select(po => new CommunityPostPollOptionDto
                {
                    Id = po.Id,
                    OptionText = po.OptionText,
                    VotesCount = po.CommunityPostVotes.Count,
                    VotePercentage = totalVotes > 0 ? Math.Round((double)po.CommunityPostVotes.Count / totalVotes * 100, 1) : 0
                }).ToList(),
                MyVoteOptionId = currentUserId != null 
                    ? p.CommunityPostPollOptions.FirstOrDefault(po => po.CommunityPostVotes.Any(v => v.UserId == currentUserId))?.Id
                    : null
            };
        });

        return Ok(dtos);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CommunityPostDto>> CreatePost([FromBody] CreateCommunityPostDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Content))
        {
            var badWords = new[] { "đm", "địt", "lồn", "cặc", "vcl", "vl", "đĩ", "phò", "đụ", "cứt" };
            var lowerContent = dto.Content.ToLower();
            var words = lowerContent.Split(new[] { ' ', '.', ',', '!', '?', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Any(w => badWords.Contains(w)) || lowerContent.Contains("chó đẻ") || lowerContent.Contains("địt mẹ"))
            {
                return BadRequest("Nội dung bài viết chứa từ ngữ phản cảm, vi phạm tiêu chuẩn cộng đồng.");
            }
        }

        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        Guid targetChannelId;
        bool isOwner = false;
        
        if (dto.ChannelId.HasValue)
        {
            targetChannelId = dto.ChannelId.Value;
            var channel = await _context.Channels.FindAsync(targetChannelId);
            if (channel == null) return NotFound("Kênh không tồn tại.");
            
            isOwner = channel.UserId == userId;
            
            if (!isOwner)
            {
                // Check if is active member
                var isMember = await _context.Subscriptions
                    .AnyAsync(s => s.SubscriberId == userId && s.ChannelId == targetChannelId && s.Status == "Active" && (s.EndDate == null || s.EndDate > DateTime.UtcNow));
                
                if (!isMember)
                {
                    return Forbid("Chỉ hội viên mới được đăng bài viết lên kênh này.");
                }
                
                if (dto.PollOptions != null && dto.PollOptions.Any())
                {
                    return Forbid("Chỉ chủ kênh mới có quyền tạo thăm dò ý kiến.");
                }
            }
        }
        else
        {
            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (channel == null)
                return BadRequest("Bạn cần tạo kênh để đăng bài.");
            targetChannelId = channel.Id;
            isOwner = true;
        }

        // Force IsMembersOnly to false if not owner
        bool finalIsMembersOnly = isOwner && dto.IsMembersOnly;

        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            ChannelId = targetChannelId,
            AuthorId = userId,
            Content = dto.Content,
            IsMembersOnly = finalIsMembersOnly,
            VideoUrl = dto.VideoUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.ImageUrls != null && dto.ImageUrls.Any())
        {
            for (int i = 0; i < dto.ImageUrls.Count; i++)
            {
                post.CommunityPostImages.Add(new CommunityPostImage
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    ImageUrl = dto.ImageUrls[i],
                    SortOrder = i
                });
            }
        }
        
        if (dto.PollOptions != null && dto.PollOptions.Any() && isOwner)
        {
            foreach (var opt in dto.PollOptions)
            {
                post.CommunityPostPollOptions.Add(new CommunityPostPollOption
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    OptionText = opt
                });
            }
        }

        _context.CommunityPosts.Add(post);
        await _context.SaveChangesAsync();
        
        // ------------------ Notification Logic ------------------
        var targetChannel = await _context.Channels
            .Include(c => c.User)
            .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(c => c.Id == targetChannelId);

        if (targetChannel != null)
        {
            var notifyUserIds = new HashSet<Guid>();

            // Get Members
            var memberUserIds = await _context.Subscriptions
                .Where(s => s.ChannelId == targetChannelId && s.Status == "Active" && (s.EndDate == null || s.EndDate > DateTime.UtcNow))
                .Select(s => s.SubscriberId)
                .ToListAsync();
            
            foreach (var id in memberUserIds) notifyUserIds.Add(id);

            if (!finalIsMembersOnly)
            {
                // Get Subscribers (Followers)
                var subscriberUserIds = await _context.Followers
                    .Where(f => f.ChannelId == targetChannelId)
                    .Select(f => f.FollowerId)
                    .ToListAsync();
                
                foreach (var id in subscriberUserIds) notifyUserIds.Add(id);
            }

            // Don't notify the person who just posted
            notifyUserIds.Remove(userId);

            // Filter out any ghost users (e.g. from deleted accounts without cascade delete)
            var validUserIds = await _context.Users
                .Where(u => notifyUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            var notifications = new List<Notification>();
            var channelTitle = targetChannel.User.Profile != null ? targetChannel.User.Profile.FullName : targetChannel.User.Email;
            var message = finalIsMembersOnly 
                ? $"{channelTitle} vừa đăng một bài viết dành riêng cho hội viên."
                : $"{channelTitle} vừa đăng một bài viết mới trong cộng đồng.";

            foreach (var nUserId in validUserIds)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = nUserId,
                    Title = "Bài viết mới",
                    Type = "CommunityPost",
                    Message = message,
                    TargetUrl = $"/c/{targetChannel.Handle}/community",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedId = post.Id,
                    ImageUrl = targetChannel.User?.Profile?.AvatarUrl
                });
            }

            if (notifications.Any())
            {
                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();
            }
        }
        // --------------------------------------------------------

        return Ok(new { Message = "Đăng bài thành công", PostId = post.Id });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var post = await _context.CommunityPosts.Include(p => p.Channel).FirstOrDefaultAsync(p => p.Id == id);
        
        if (post == null) return NotFound();
        if (post.Channel.UserId != userId) return Forbid();

        _context.CommunityPosts.Remove(post);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã xóa bài đăng" });
    }

    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(Guid id, [FromBody] LikeRequestDTO dto)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var post = await _context.CommunityPosts.FindAsync(id);
        if (post == null) return NotFound();

        var existingLike = await _context.CommunityPostLikes.FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

        if (existingLike != null)
        {
            if (existingLike.IsLike == dto.IsLike)
            {
                _context.CommunityPostLikes.Remove(existingLike);
            }
            else
            {
                existingLike.IsLike = dto.IsLike;
            }
        }
        else
        {
            _context.CommunityPostLikes.Add(new CommunityPostLike
            {
                Id = Guid.NewGuid(),
                PostId = id,
                UserId = userId,
                IsLike = dto.IsLike
            });
        }

        await _context.SaveChangesAsync();
        var likesCount = await _context.CommunityPostLikes.CountAsync(l => l.PostId == id && l.IsLike);

        return Ok(new { LikesCount = likesCount });
    }

    [HttpPost("poll/{optionId}/vote")]
    [Authorize]
    public async Task<IActionResult> VotePoll(Guid optionId)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        var option = await _context.CommunityPostPollOptions
            .Include(po => po.Post)
                .ThenInclude(p => p.CommunityPostPollOptions)
                    .ThenInclude(p => p.CommunityPostVotes)
            .FirstOrDefaultAsync(o => o.Id == optionId);

        if (option == null) return NotFound();

        var existingVote = option.Post.CommunityPostPollOptions
            .SelectMany(po => po.CommunityPostVotes)
            .FirstOrDefault(v => v.UserId == userId);

        if (existingVote != null)
        {
            _context.CommunityPostVotes.Remove(existingVote);
            if (existingVote.PollOptionId == optionId)
            {
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã hủy bình chọn" });
            }
        }

        _context.CommunityPostVotes.Add(new CommunityPostVote
        {
            Id = Guid.NewGuid(),
            PollOptionId = optionId,
            UserId = userId
        });

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã bình chọn" });
    }

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<CommunityCommentDto>>> GetComments(Guid id, [FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] Guid? parentId = null)
    {
        var currentUserIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = null;
        if (!string.IsNullOrEmpty(currentUserIdStr)) currentUserId = Guid.Parse(currentUserIdStr);

        var query = _context.CommunityPostComments
            .Include(c => c.User)
                .ThenInclude(u => u.Profile)
            .Include(c => c.User)
                .ThenInclude(u => u.Channel)
            .Include(c => c.Replies)
            .Include(c => c.Likes)
            .Where(c => c.PostId == id && c.ParentCommentId == parentId);

        var comments = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        var dtos = comments.Select(c => new CommunityCommentDto
        {
            Id = c.Id,
            PostId = c.PostId,
            UserId = c.UserId,
            UserName = c.User.Profile != null ? c.User.Profile.FullName : "Người dùng",
            UserHandle = c.User.Channel != null ? c.User.Channel.Handle : "",
            UserAvatarUrl = c.User.Profile != null ? c.User.Profile.AvatarUrl : "",
            Content = c.Content,
            LikesCount = c.Likes.Count(l => l.IsLike),
            CreatedAt = c.CreatedAt,
            RepliesCount = c.Replies.Count,
            IsLikedByMe = currentUserId != null && c.Likes.Any(l => l.UserId == currentUserId && l.IsLike)
        });

        return Ok(dtos);
    }

    [HttpPost("{id}/comments")]
    [Authorize]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateCommunityCommentDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        var comment = new CommunityPostComment
        {
            Id = Guid.NewGuid(),
            PostId = id,
            UserId = userId,
            Content = dto.Content,
            ParentCommentId = dto.ParentCommentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LikesCount = 0
        };

        _context.CommunityPostComments.Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Users.Include(u => u.Profile).Include(u => u.Channel).FirstOrDefaultAsync(u => u.Id == userId);
        var resultDto = new CommunityCommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            UserId = comment.UserId,
            UserName = user?.Profile?.FullName ?? "Người dùng",
            UserHandle = user?.Channel?.Handle ?? "",
            UserAvatarUrl = user?.Profile?.AvatarUrl ?? "",
            Content = comment.Content,
            LikesCount = 0,
            CreatedAt = comment.CreatedAt,
            RepliesCount = 0,
            IsLikedByMe = false
        };

        return Ok(resultDto);
    }

    [HttpPost("comments/{id}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleCommentLike(Guid id, [FromBody] LikeRequestDTO dto)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var comment = await _context.CommunityPostComments.FindAsync(id);
        if (comment == null) return NotFound("Bình luận không tồn tại");

        var existingLike = await _context.CommunityPostCommentLikes.FirstOrDefaultAsync(l => l.CommentId == id && l.UserId == userId);

        if (existingLike != null)
        {
            if (existingLike.IsLike == dto.IsLike)
            {
                _context.CommunityPostCommentLikes.Remove(existingLike);
            }
            else
            {
                existingLike.IsLike = dto.IsLike;
            }
        }
        else
        {
            _context.CommunityPostCommentLikes.Add(new CommunityPostCommentLike
            {
                Id = Guid.NewGuid(),
                CommentId = id,
                UserId = userId,
                IsLike = dto.IsLike,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        var likesCount = await _context.CommunityPostCommentLikes.CountAsync(l => l.CommentId == id && l.IsLike);

        return Ok(new { LikesCount = likesCount });
    }

    [HttpPut("/api/channels/{channelId}/community/{postId}/pin")]
    [Authorize]
    public async Task<IActionResult> PinPost(Guid channelId, Guid postId)
    {
        var currentUserId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        var channel = await _context.Channels.FindAsync(channelId);
        if (channel == null || channel.UserId != currentUserId)
        {
            return Forbid();
        }

        var post = await _context.CommunityPosts.FirstOrDefaultAsync(p => p.Id == postId && p.ChannelId == channelId);
        if (post == null)
        {
            return NotFound("Không tìm thấy bài viết");
        }

        var pinnedPostsCount = await _context.CommunityPosts.CountAsync(p => p.ChannelId == channelId && p.IsPinned);

        if (post.IsPinned)
        {
            // If already pinned, unpin it
            post.IsPinned = false;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã bỏ ghim bài viết" });
        }
        else
        {
            // If not pinned, check limit
            if (pinnedPostsCount >= 5)
            {
                return BadRequest(new { Message = "Bạn chỉ có thể ghim tối đa 5 bài viết." });
            }

            post.IsPinned = true;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã ghim bài viết" });
        }
    }

    [HttpGet("/api/channels/{channelId}/community/sidebar")]
    public async Task<ActionResult<CommunitySidebarDto>> GetSidebarData(Guid channelId)
    {
        var channel = await _context.Channels.FindAsync(channelId);
        if (channel == null) return NotFound();

        var today = DateTime.UtcNow.AddDays(-1);
        
        var posts = await _context.CommunityPosts
            .Include(p => p.Author)
                .ThenInclude(u => u.Profile)
            .Include(p => p.Channel)
                .ThenInclude(c => c.User)
                    .ThenInclude(u => u.Profile)
            .Include(p => p.CommunityPostImages)
            .Include(p => p.CommunityPostLikes)
            .Include(p => p.CommunityPostComments)
            .Include(p => p.CommunityPostPollOptions)
            .Where(p => p.ChannelId == channelId)
            .ToListAsync();

        var currentUserIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = string.IsNullOrEmpty(currentUserIdStr) ? null : Guid.Parse(currentUserIdStr);

        var pinnedPosts = posts.Where(p => p.IsPinned).Select(p => 
        {
            var totalVotes = p.CommunityPostPollOptions.SelectMany(po => po.CommunityPostVotes).Count();
            return new CommunityPostDto
            {
                Id = p.Id,
                Content = p.Content,
                CreatedAt = p.CreatedAt,
                AuthorName = p.AuthorId == null ? (p.Channel.User.Profile?.FullName ?? p.Channel.User.Email) : (p.Author?.Profile?.FullName ?? p.Author?.Email),
                LikesCount = p.CommunityPostLikes.Count(l => l.IsLike),
                CommentsCount = p.CommunityPostComments.Count,
                Images = p.CommunityPostImages.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl).ToList(),
                VideoUrl = p.VideoUrl,
                IsPinned = true,
                TotalVotes = totalVotes,
                PollOptions = p.CommunityPostPollOptions.Select(po => new CommunityPostPollOptionDto
                {
                    Id = po.Id,
                    OptionText = po.OptionText,
                    VotesCount = po.CommunityPostVotes.Count,
                    VotePercentage = totalVotes > 0 ? Math.Round((double)po.CommunityPostVotes.Count / totalVotes * 100, 1) : 0
                }).ToList(),
                MyVoteOptionId = currentUserId != null 
                    ? p.CommunityPostPollOptions.FirstOrDefault(po => po.CommunityPostVotes.Any(v => v.UserId == currentUserId))?.Id
                    : null
            };
        }).ToList();

        var featuredByLikes = posts.OrderByDescending(p => p.CommunityPostLikes.Count(l => l.IsLike) + p.CommunityPostComments.Count)
            .Take(10)
            .Select(p => new SidebarFeaturedPostDto
            {
                Id = p.Id,
                Title = p.Content.Length > 50 ? p.Content.Substring(0, 50) + "..." : p.Content,
                ImageUrl = p.CommunityPostImages.FirstOrDefault()?.ImageUrl ?? p.VideoUrl,
                LikesCount = p.CommunityPostLikes.Count(l => l.IsLike),
                CommentsCount = p.CommunityPostComments.Count
            }).ToList();

        var featuredByComments = posts.OrderByDescending(p => p.CommunityPostComments.Count)
            .Take(3)
            .Select(p => new SidebarFeaturedPostDto
            {
                Id = p.Id,
                Title = p.Content.Length > 50 ? p.Content.Substring(0, 50) + "..." : p.Content,
                ImageUrl = p.CommunityPostImages.FirstOrDefault()?.ImageUrl ?? p.VideoUrl,
                LikesCount = p.CommunityPostLikes.Count(l => l.IsLike),
                CommentsCount = p.CommunityPostComments.Count
            }).ToList();

        var tagDict = new Dictionary<string, int>();
        foreach(var p in posts)
        {
            if (string.IsNullOrWhiteSpace(p.Content)) continue;
            var words = p.Content.Split(new[] { ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            foreach(var w in words)
            {
                if (w.StartsWith("#") && w.Length > 1)
                {
                    if (tagDict.ContainsKey(w)) tagDict[w]++;
                    else tagDict[w] = 1;
                }
            }
        }
        var trending = tagDict.OrderByDescending(kv => kv.Value).Take(5).Select(kv => new SidebarTopicDto { Tag = kv.Key, PostsCount = kv.Value }).ToList();

        var todayStats = new SidebarStatsDto
        {
            NewPosts = posts.Count(p => p.CreatedAt >= today),
            NewVideos = posts.Count(p => p.CreatedAt >= today && p.VideoUrl != null),
            NewPolls = posts.Count(p => p.CreatedAt >= today && p.CommunityPostPollOptions.Any()),
            NewComments = posts.SelectMany(p => p.CommunityPostComments).Count(c => c.CreatedAt >= today)
        };

        var colors = new[] { "bg-pink-500", "bg-blue-500", "bg-red-500", "bg-orange-500", "bg-cyan-500", "bg-green-500", "bg-purple-500" };
        var activeMembers = posts.GroupBy(p => p.AuthorId ?? p.Channel.UserId)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select((g, index) => {
                var firstPost = g.First();
                var name = firstPost.AuthorId == null ? (firstPost.Channel.User.Profile?.FullName ?? firstPost.Channel.User.Email) : (firstPost.Author?.Profile?.FullName ?? firstPost.Author?.Email);
                var avatarUrl = firstPost.AuthorId == null ? firstPost.Channel.User.Profile?.AvatarUrl : firstPost.Author?.Profile?.AvatarUrl;
                return new SidebarMemberDto
                {
                    UserId = g.Key,
                    Name = name ?? "Unknown",
                    AvatarUrl = avatarUrl,
                    PostsCount = g.Count(),
                    Initials = (name != null && name.Length > 1 ? name.Substring(0, 2).ToUpper() : "U"),
                    BgColor = colors[index % colors.Length]
                };
            }).ToList();

        return Ok(new CommunitySidebarDto
        {
            PinnedPosts = pinnedPosts,
            FeaturedByLikes = featuredByLikes,
            FeaturedByComments = featuredByComments,
            TrendingTopics = trending,
            TodayStats = todayStats,
            ActiveMembers = activeMembers
        });
    }
}

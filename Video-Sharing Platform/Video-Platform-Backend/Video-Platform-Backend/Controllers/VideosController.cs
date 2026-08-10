using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VideosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VideosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/videos/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.VideoCategories
                .Select(c => new CategoryResponseDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description ?? ""
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/videos
        [HttpGet]
        public async Task<IActionResult> GetVideos()
        {
            var videos = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => v.Visibility == "Public")
                .Select(v => new VideoResponseDTO
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == v.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = v.Duration ?? 0,
                    ViewsCount = _context.Views.Count(view => view.VideoId == v.Id),
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    ChannelId = v.ChannelId,
                    ChannelName = v.Channel.ChannelName,
                    ChannelHandle = v.Channel.Handle,
                    ChannelAvatarUrl = v.Channel.User.Profile != null 
                        ? (v.Channel.User.Profile.AvatarUrl ?? "") 
                        : ""
                })
                .OrderByDescending(v => v.ViewsCount)
                .ToListAsync();

            return Ok(videos);
        }

        // GET: api/videos/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVideo(Guid id)
        {
            var video = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Include(v => v.VideoFiles)
                .Include(v => v.VideoThumbnails)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (video == null)
            {
                return NotFound(new { message = "Không tìm thấy video" });
            }

            // Increase view count
            video.ViewsCount = (video.ViewsCount ?? 0) + 1;
            
            // Add view record
            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                   ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            Guid? currentUserId = Guid.TryParse(currentUserIdStr, out var cid) ? cid : null;
            
            _context.Views.Add(new View {
                Id = Guid.NewGuid(),
                VideoId = id,
                UserId = currentUserId,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                ViewedAt = DateTime.UtcNow
            });
            
            if (currentUserId.HasValue)
            {
                var watchHistory = await _context.WatchHistories
                    .FirstOrDefaultAsync(w => w.UserId == currentUserId.Value && w.VideoId == id);
                if (watchHistory == null)
                {
                    _context.WatchHistories.Add(new WatchHistory
                    {
                        Id = Guid.NewGuid(),
                        UserId = currentUserId.Value,
                        VideoId = id,
                        LastWatchedAt = DateTime.UtcNow,
                        WatchedDuration = 0
                    });
                }
                else
                {
                    watchHistory.LastWatchedAt = DateTime.UtcNow;
                }
            }
            
            await _context.SaveChangesAsync();

            var subscriberCount = await _context.Followers.CountAsync(f => f.ChannelId == video.ChannelId);
            var likesCount = await _context.Likes.CountAsync(l => l.VideoId == video.Id && l.IsLike);
            var dislikesCount = await _context.Likes.CountAsync(l => l.VideoId == video.Id && !l.IsLike);
            var actualViewsCount = await _context.Views.CountAsync(v => v.VideoId == video.Id);

            var dto = new VideoDetailDTO
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description ?? "",
                ThumbnailUrl = video.VideoThumbnails.FirstOrDefault()?.ThumbnailUrl ?? "",
                VideoUrl = video.VideoFiles.FirstOrDefault()?.FileUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                Duration = video.Duration ?? 0,
                ViewsCount = actualViewsCount,
                LikesCount = likesCount,
                DislikesCount = dislikesCount,
                CommentsCount = video.CommentsCount ?? 0,
                CreatedAt = video.CreatedAt ?? DateTime.UtcNow,
                
                ChannelId = video.ChannelId,
                ChannelName = video.Channel.ChannelName,
                ChannelHandle = video.Channel.Handle,
                ChannelAvatarUrl = video.Channel.User.Profile?.AvatarUrl ?? "",
                SubscriberCount = subscriberCount,
                OwnerUserId = video.Channel.UserId
            };

            if (currentUserId.HasValue)
            {
                var like = await _context.Likes.FirstOrDefaultAsync(l => l.UserId == currentUserId.Value && l.VideoId == id);
                if (like != null)
                {
                    if (like.IsLike) dto.IsLiked = true;
                    else dto.IsDisliked = true;
                }

                dto.IsSubscribed = await _context.Followers.AnyAsync(f => f.FollowerId == currentUserId.Value && f.ChannelId == video.ChannelId);

                // Default Watch Later playlist check
                var userChannel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);
                if (userChannel != null)
                {
                    var watchLater = await _context.Playlists.FirstOrDefaultAsync(p => p.ChannelId == userChannel.Id && p.Title == "Xem sau");
                    if (watchLater != null)
                    {
                        dto.IsSaved = await _context.PlaylistVideos.AnyAsync(pv => pv.PlaylistId == watchLater.Id && pv.VideoId == id);
                    }
                }
            }

            return Ok(dto);
        }

        // POST: api/videos/{id}/like
        [HttpPost("{id}/like")]
        [Authorize]
        public async Task<IActionResult> ToggleLike(Guid id, [FromBody] LikeRequestDTO request)
        {
            var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var video = await _context.Videos.FindAsync(id);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });

            var existingLike = await _context.Likes.FirstOrDefaultAsync(l => l.UserId == userId && l.VideoId == id);
            
            if (existingLike == null)
            {
                // Mới hoàn toàn
                var newLike = new Like { UserId = userId, VideoId = id, IsLike = request.IsLike };
                _context.Likes.Add(newLike);
                if (request.IsLike) video.LikesCount = (video.LikesCount ?? 0) + 1;
                else video.DislikesCount = (video.DislikesCount ?? 0) + 1;
            }
            else
            {
                if (existingLike.IsLike == request.IsLike)
                {
                    // Bỏ like/dislike hiện tại (toggle)
                    _context.Likes.Remove(existingLike);
                    if (request.IsLike) video.LikesCount = Math.Max(0, (video.LikesCount ?? 0) - 1);
                    else video.DislikesCount = Math.Max(0, (video.DislikesCount ?? 0) - 1);
                }
                else
                {
                    // Đổi từ Like sang Dislike hoặc ngược lại
                    existingLike.IsLike = request.IsLike;
                    if (request.IsLike)
                    {
                        video.LikesCount = (video.LikesCount ?? 0) + 1;
                        video.DislikesCount = Math.Max(0, (video.DislikesCount ?? 0) - 1);
                    }
                    else
                    {
                        video.DislikesCount = (video.DislikesCount ?? 0) + 1;
                        video.LikesCount = Math.Max(0, (video.LikesCount ?? 0) - 1);
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { 
                likesCount = await _context.Likes.CountAsync(l => l.VideoId == id && l.IsLike), 
                dislikesCount = await _context.Likes.CountAsync(l => l.VideoId == id && !l.IsLike),
                message = "Đã cập nhật tương tác."
            });
        }

        // GET: api/videos/{id}/comments
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(Guid id)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .Include(c => c.CommentReplies)
                    .ThenInclude(cr => cr.User)
                        .ThenInclude(u => u.Profile)
                .Where(c => c.VideoId == id)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentResponseDTO
                {
                    Id = c.Id,
                    Content = c.Content,
                    LikesCount = c.LikesCount ?? 0,
                    CreatedAt = c.CreatedAt ?? DateTime.UtcNow,
                    UserId = c.UserId,
                    FullName = c.User.Profile != null && !string.IsNullOrEmpty(c.User.Profile.FullName) 
                               ? c.User.Profile.FullName 
                               : "Anonymous",
                    AvatarUrl = c.User.Profile != null ? (c.User.Profile.AvatarUrl ?? "") : "",
                    Replies = c.CommentReplies.OrderBy(cr => cr.CreatedAt).Select(cr => new CommentReplyDTO
                    {
                        Id = cr.Id,
                        Content = cr.Content,
                        LikesCount = cr.LikesCount ?? 0,
                        CreatedAt = cr.CreatedAt ?? DateTime.UtcNow,
                        UserId = cr.UserId,
                        FullName = cr.User.Profile != null && !string.IsNullOrEmpty(cr.User.Profile.FullName)
                                   ? cr.User.Profile.FullName
                                   : "Anonymous",
                        AvatarUrl = cr.User.Profile != null ? (cr.User.Profile.AvatarUrl ?? "") : ""
                    }).ToList()
                })
                .ToListAsync();

            return Ok(comments);
        }

        // POST: api/videos/{id}/comments
        [HttpPost("{id}/comments")]
        [Authorize]
        public async Task<IActionResult> AddComment(Guid id, [FromBody] CommentRequestDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { message = "Nội dung bình luận không được rỗng." });
            }

            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.Parse(userIdString!);
            
            var video = await _context.Videos.FindAsync(id);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                VideoId = id,
                UserId = userId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            
            video.CommentsCount = (video.CommentsCount ?? 0) + 1;
            
            await _context.SaveChangesAsync();
            
            // Lấy thêm thông tin User vừa bình luận để trả về DTO
            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);

            var commentDto = new CommentResponseDTO
            {
                Id = comment.Id,
                Content = comment.Content,
                LikesCount = comment.LikesCount ?? 0,
                CreatedAt = comment.CreatedAt ?? DateTime.UtcNow,
                UserId = comment.UserId,
                FullName = user?.Profile?.FullName ?? "Anonymous",
                AvatarUrl = user?.Profile?.AvatarUrl ?? "",
                Replies = new List<CommentReplyDTO>()
            };

            return Ok(commentDto);
        }

        // POST: api/videos/comments/{commentId}/replies
        [HttpPost("comments/{commentId}/replies")]
        [Authorize]
        public async Task<IActionResult> AddReply(Guid commentId, [FromBody] CommentRequestDTO request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { message = "Nội dung phản hồi không được rỗng." });
            }

            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.Parse(userIdString!);
            
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound(new { message = "Bình luận không tồn tại." });

            var reply = new CommentReply
            {
                Id = Guid.NewGuid(),
                ParentCommentId = commentId,
                UserId = userId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.CommentReplies.Add(reply);
            await _context.SaveChangesAsync();
            
            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);

            var replyDto = new CommentReplyDTO
            {
                Id = reply.Id,
                Content = reply.Content,
                LikesCount = reply.LikesCount ?? 0,
                CreatedAt = reply.CreatedAt ?? DateTime.UtcNow,
                UserId = reply.UserId,
                FullName = user?.Profile?.FullName ?? "Anonymous",
                AvatarUrl = user?.Profile?.AvatarUrl ?? ""
            };

            return Ok(replyDto);
        }

        // POST: api/videos/comments/{commentId}/like
        [HttpPost("comments/{commentId}/like")]
        [Authorize]
        public async Task<IActionResult> LikeComment(Guid commentId, [FromBody] LikeRequestDTO request)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.Parse(userIdString!);

            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound(new { message = "Bình luận không tồn tại." });

            var existingLike = await _context.CommentLikes
                .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

            if (existingLike != null)
            {
                if (existingLike.IsLike == request.IsLike)
                {
                    // Toggle off
                    _context.CommentLikes.Remove(existingLike);
                    if (request.IsLike) comment.LikesCount = Math.Max(0, (comment.LikesCount ?? 0) - 1);
                }
                else
                {
                    // Switch
                    existingLike.IsLike = request.IsLike;
                    if (request.IsLike) comment.LikesCount = (comment.LikesCount ?? 0) + 1;
                    else comment.LikesCount = Math.Max(0, (comment.LikesCount ?? 0) - 1);
                }
            }
            else
            {
                var like = new CommentLike
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CommentId = commentId,
                    IsLike = request.IsLike,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CommentLikes.Add(like);
                if (request.IsLike) comment.LikesCount = (comment.LikesCount ?? 0) + 1;
            }

            await _context.SaveChangesAsync();
            return Ok(new { likesCount = comment.LikesCount ?? 0 });
        }

        // POST: api/videos/comments/replies/{replyId}/like
        [HttpPost("comments/replies/{replyId}/like")]
        [Authorize]
        public async Task<IActionResult> LikeReply(Guid replyId, [FromBody] LikeRequestDTO request)
        {
            var reply = await _context.CommentReplies.FindAsync(replyId);
            if (reply == null) return NotFound(new { message = "Phản hồi không tồn tại." });

            if (request.IsLike) reply.LikesCount = (reply.LikesCount ?? 0) + 1;
            else reply.LikesCount = Math.Max(0, (reply.LikesCount ?? 0) - 1);

            await _context.SaveChangesAsync();
            return Ok(new { likesCount = reply.LikesCount ?? 0 });
        }

        // GET: api/videos/history
        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetHistory()
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var history = await _context.WatchHistories
                .Include(h => h.Video)
                    .ThenInclude(v => v.Channel)
                        .ThenInclude(c => c.User)
                            .ThenInclude(u => u.Profile)
                .Where(h => h.UserId == userId && h.Video.Visibility == "Public")
                .OrderByDescending(h => h.LastWatchedAt)
                .Select(h => new VideoResponseDTO
                {
                    Id = h.Video.Id,
                    Title = h.Video.Title,
                    Description = h.Video.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == h.Video.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = h.Video.Duration ?? 0,
                    ViewsCount = h.Video.ViewsCount ?? 0,
                    CreatedAt = h.LastWatchedAt ?? DateTime.UtcNow, // Use LastWatchedAt for sorting/display
                    ChannelId = h.Video.ChannelId,
                    ChannelName = h.Video.Channel.ChannelName,
                    ChannelHandle = h.Video.Channel.Handle,
                    ChannelAvatarUrl = h.Video.Channel.User.Profile != null 
                        ? (h.Video.Channel.User.Profile.AvatarUrl ?? "") 
                        : ""
                })
                .ToListAsync();

            return Ok(history);
        }

        // GET: api/videos/subscriptions
        [HttpGet("subscriptions")]
        [Authorize]
        public async Task<IActionResult> GetSubscriptionVideos()
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            // Lấy danh sách ChannelId mà user đã đăng ký
            var subscribedChannelIds = await _context.Followers
                .Where(f => f.FollowerId == userId)
                .Select(f => f.ChannelId)
                .ToListAsync();

            if (!subscribedChannelIds.Any())
                return Ok(new List<VideoResponseDTO>());

            var videos = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => subscribedChannelIds.Contains(v.ChannelId) && v.Visibility == "Public")
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VideoResponseDTO
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == v.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = v.Duration ?? 0,
                    ViewsCount = _context.Views.Count(view => view.VideoId == v.Id),
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    ChannelId = v.ChannelId,
                    ChannelName = v.Channel.ChannelName,
                    ChannelHandle = v.Channel.Handle,
                    ChannelAvatarUrl = v.Channel.User.Profile != null
                        ? (v.Channel.User.Profile.AvatarUrl ?? "")
                        : ""
                })
                .ToListAsync();

            return Ok(videos);
        }
    }
}

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
using Microsoft.Extensions.DependencyInjection;
using System.IO;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VideosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IServiceScopeFactory _scopeFactory;

        public VideosController(ApplicationDbContext context, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _scopeFactory = scopeFactory;
        }

        // GET: api/videos/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.VideoCategories
                .Where(c => c.IsActive)
                .Select(c => new CategoryResponseDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description ?? "",
                    Icon = c.Icon
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
                .Where(v => v.Visibility == "Public" || v.Visibility == "Private")
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
                    ViewsCount = v.ViewsCount ?? 0,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    IsShort = v.IsShort ?? false,
                    CategoryId = v.CategoryId,
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

        // GET: api/videos/explore?category=&q=&sort=
        [HttpGet("explore")]
        public async Task<IActionResult> ExploreVideos(
            [FromQuery] string? category = null,
            [FromQuery] string? q = null,
            [FromQuery] string sort = "views")
        {
            var query = _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Include(v => v.Category)
                .Where(v => (v.Visibility == "Public" || v.Visibility == "Private") && (v.IsShort == false || v.IsShort == null));

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(v => v.Title.Contains(q) || (v.Description != null && v.Description.Contains(q)));

            if (!string.IsNullOrWhiteSpace(category) && category != "all")
                query = query.Where(v => v.Category != null && v.Category.Name == category);

            IOrderedQueryable<Video> sortedQuery = sort switch
            {
                "newest" => query.OrderByDescending(v => v.CreatedAt),
                "oldest" => query.OrderBy(v => v.CreatedAt),
                _ => query.OrderByDescending(v => v.ViewsCount)
            };

            var videos = await sortedQuery
                .Take(60)
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
                    ViewsCount = v.ViewsCount ?? 0,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    IsShort = v.IsShort ?? false,
                    CategoryId = v.CategoryId,
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
                .Include(v => v.VideoResolutions)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (video == null)
            {
                return NotFound(new { message = "Không tìm thấy video" });
            }

            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                   ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            Guid? currentUserId = Guid.TryParse(currentUserIdStr, out var cid) ? cid : null;

            bool canWatch = true;
            if (video.Visibility == "Private")
            {
                canWatch = false;
                if (currentUserId.HasValue)
                {
                    if (video.Channel.UserId == currentUserId.Value)
                    {
                        canWatch = true;
                    }
                    else
                    {
                        bool isMember = await _context.Subscriptions.AnyAsync(s => 
                            s.SubscriberId == currentUserId.Value && 
                            s.ChannelId == video.ChannelId && 
                            s.Status == "Active" && 
                            (s.EndDate == null || s.EndDate > DateTime.UtcNow));
                        if (isMember) canWatch = true;
                    }
                }
            }

            if (canWatch)
            {
                // Increase view count
                video.ViewsCount = (video.ViewsCount ?? 0) + 1;
                
                // Add view record
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
            }

            var subscriberCount = await _context.Followers.CountAsync(f => f.ChannelId == video.ChannelId);
            var likesCount = await _context.Likes.CountAsync(l => l.VideoId == video.Id && l.IsLike);
            var dislikesCount = await _context.Likes.CountAsync(l => l.VideoId == video.Id && !l.IsLike);
            var actualViewsCount = video.ViewsCount ?? 0;

            var fileUrl = video.VideoFiles.FirstOrDefault()?.FileUrl;
            if (string.IsNullOrEmpty(fileUrl) || fileUrl.Contains("example.com"))
            {
                fileUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
            }

            if (!canWatch)
            {
                fileUrl = "";
            }

            var dto = new VideoDetailDTO
            {
                Id = video.Id,
                Title = video.Title,
                Description = video.Description ?? "",
                ThumbnailUrl = video.VideoThumbnails.FirstOrDefault()?.ThumbnailUrl ?? "",
                VideoUrl = fileUrl,
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
                OwnerUserId = video.Channel.UserId,
                IsMembersOnly = !canWatch,
                Resolutions = canWatch ? video.VideoResolutions.Select(r => new VideoResolutionDTO
                {
                    Id = r.Id,
                    Resolution = r.Resolution,
                    FileUrl = r.FileUrl
                }).ToList() : new List<VideoResolutionDTO>()
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

        // POST: api/videos/{id}/record-view
        [HttpPost("{id}/record-view")]
        public async Task<IActionResult> RecordView(Guid id)
        {
            var video = await _context.Videos.FindAsync(id);
            if (video == null) return NotFound();

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
            return Ok();
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
                .Where(c => c.VideoId == id && c.FilterStatus != "Blocked")
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentResponseDTO
                {
                    Id = c.Id,
                    Content = c.DisplayContent ?? c.Content,
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

            // --- FILTER LOGIC ---
            var bannedWords = await _context.BannedWords.Where(w => w.IsActive).ToListAsync();
            var matchedKeywords = new List<string>();
            var highestLevel = "";
            var lowerContent = request.Content.ToLower();
            
            foreach (var bw in bannedWords)
            {
                if (lowerContent.Contains(bw.Keyword.ToLower()))
                {
                    matchedKeywords.Add(bw.Keyword);
                    bw.HitCount += 1;

                    if (bw.Level == "High") highestLevel = "High";
                    else if (bw.Level == "Medium" && highestLevel != "High") highestLevel = "Medium";
                    else if (bw.Level == "Low" && highestLevel == "") highestLevel = "Low";
                }
            }

            var isFiltered = matchedKeywords.Any();
            var filterStatus = "Normal";
            var displayContent = request.Content;

            if (isFiltered)
            {
                if (highestLevel == "High")
                {
                    filterStatus = "Blocked";
                }
                else if (highestLevel == "Medium")
                {
                    filterStatus = "Filtered";
                    displayContent = "Nội dung chứa từ khóa bị cấm...";
                }
                else if (highestLevel == "Low")
                {
                    filterStatus = "Warning";
                }
            }
            else
            {
                var autoApproveSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "autoApproveComments");
                if (autoApproveSetting != null && autoApproveSetting.Value == "false")
                {
                    filterStatus = "Pending";
                }
            }
            // ---------------------

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                VideoId = id,
                UserId = userId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
                DisplayContent = displayContent,
                IsFiltered = isFiltered,
                FilterStatus = filterStatus,
                MatchedKeywords = matchedKeywords.Any() ? string.Join(", ", matchedKeywords) : null
            };

            _context.Comments.Add(comment);
            
            video.CommentsCount = (video.CommentsCount ?? 0) + 1;
            
            await _context.SaveChangesAsync();
            
            if (filterStatus == "Blocked")
            {
                return BadRequest("Bình luận của bạn chứa từ khóa vi phạm và đã bị chặn.");
            }

            // Lấy thêm thông tin User vừa bình luận để trả về DTO
            var user = await _context.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);

            var commentDto = new CommentResponseDTO
            {
                Id = comment.Id,
                Content = comment.DisplayContent ?? comment.Content,
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
                        : "",
                    IsShort = h.Video.IsShort ?? false,
                    WatchedDuration = h.WatchedDuration ?? 0
                })
                .ToListAsync();

            return Ok(history);
        }

        // DELETE: api/videos/history
        [HttpDelete("history")]
        [Authorize]
        public async Task<IActionResult> ClearHistory()
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var historyItems = await _context.WatchHistories.Where(h => h.UserId == userId).ToListAsync();
            _context.WatchHistories.RemoveRange(historyItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Lịch sử đã được xoá" });
        }

        // POST: api/videos/{id}/progress
        [HttpPost("{id}/progress")]
        [Authorize]
        public async Task<IActionResult> SaveProgress(Guid id, [FromBody] SaveProgressRequest request)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var watchHistory = await _context.WatchHistories
                .FirstOrDefaultAsync(w => w.UserId == userId && w.VideoId == id);

            if (watchHistory != null)
            {
                watchHistory.WatchedDuration = request.WatchedDuration;
                watchHistory.LastWatchedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok();
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
                    ViewsCount = v.ViewsCount ?? 0,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    IsShort = v.IsShort ?? false,
                    CategoryId = v.CategoryId,
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

        // GET: api/videos/shorts
        [HttpGet("shorts")]
        public async Task<IActionResult> GetShorts()
        {
            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                   ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            Guid? currentUserId = Guid.TryParse(currentUserIdStr, out var cid) ? cid : null;

            var shorts = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Include(v => v.VideoFiles)
                .Include(v => v.VideoThumbnails)
                .Include(v => v.Likes)
                .Where(v => v.Visibility == "Public" && v.IsShort == true)
                .OrderByDescending(v => v.CreatedAt)
                .Take(20)
                .ToListAsync();

            var response = new List<VideoDetailDTO>();

            foreach (var video in shorts)
            {
                var subscriberCount = await _context.Followers.CountAsync(f => f.ChannelId == video.ChannelId);
                var likesCount = video.Likes.Count(l => l.IsLike);
                var dislikesCount = video.Likes.Count(l => !l.IsLike);

                var isLiked = currentUserId.HasValue && video.Likes.Any(l => l.UserId == currentUserId.Value && l.IsLike);
                var isDisliked = currentUserId.HasValue && video.Likes.Any(l => l.UserId == currentUserId.Value && !l.IsLike);
                var isSubscribed = currentUserId.HasValue && await _context.Followers.AnyAsync(f => f.ChannelId == video.ChannelId && f.FollowerId == currentUserId.Value);
                var isSaved = false;
                if (currentUserId.HasValue)
                {
                    var userChannel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == currentUserId.Value);
                    if (userChannel != null)
                    {
                        var watchLater = await _context.Playlists.FirstOrDefaultAsync(p => p.ChannelId == userChannel.Id && p.Title == "Xem sau");
                        if (watchLater != null)
                            isSaved = await _context.PlaylistVideos.AnyAsync(pv => pv.PlaylistId == watchLater.Id && pv.VideoId == video.Id);
                    }
                }

                response.Add(new VideoDetailDTO
                {
                    Id = video.Id,
                    Title = video.Title,
                    Description = video.Description ?? "",
                    ThumbnailUrl = video.VideoThumbnails.FirstOrDefault()?.ThumbnailUrl ?? "",
                    VideoUrl = video.VideoFiles.FirstOrDefault()?.FileUrl ?? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    Duration = video.Duration ?? 0,
                    ViewsCount = video.ViewsCount ?? 0,
                    LikesCount = likesCount,
                    DislikesCount = dislikesCount,
                    CommentsCount = video.CommentsCount ?? 0,
                    CreatedAt = video.CreatedAt ?? DateTime.UtcNow,
                    ChannelId = video.ChannelId,
                    ChannelName = video.Channel.ChannelName,
                    ChannelHandle = video.Channel.Handle,
                    ChannelAvatarUrl = video.Channel.User.Profile?.AvatarUrl ?? "",
                    SubscriberCount = subscriberCount,
                    OwnerUserId = video.Channel.UserId,
                    IsLiked = isLiked,
                    IsDisliked = isDisliked,
                    IsSubscribed = isSubscribed,
                    IsSaved = isSaved
                });
            }

            var random = new Random();
            response = response.OrderBy(x => random.Next()).ToList();
            return Ok(response);
        }

        // GET: api/videos/liked
        [HttpGet("liked")]
        [Authorize]
        public async Task<IActionResult> GetLikedVideos()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var likedVideoIds = await _context.Likes
                .Where(l => l.UserId == userId && l.IsLike)
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => l.VideoId)
                .ToListAsync();

            var videos = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Include(v => v.VideoThumbnails)
                .Where(v => likedVideoIds.Contains(v.Id) && v.Visibility == "Public")
                .ToListAsync();

            var ordered = likedVideoIds
                .Select(id => videos.FirstOrDefault(v => v.Id == id))
                .Where(v => v != null)
                .ToList();

            var result = ordered.Select(v => new VideoResponseDTO
            {
                Id = v!.Id,
                Title = v.Title,
                Description = v.Description ?? "",
                ThumbnailUrl = v.VideoThumbnails.FirstOrDefault()?.ThumbnailUrl ?? "",
                Duration = v.Duration ?? 0,
                ViewsCount = v.ViewsCount ?? 0,
                CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                IsShort = v.IsShort ?? false,
                CategoryId = v.CategoryId,
                ChannelId = v.ChannelId,
                ChannelName = v.Channel.ChannelName,
                ChannelHandle = v.Channel.Handle,
                ChannelAvatarUrl = v.Channel.User?.Profile?.AvatarUrl ?? ""
            }).ToList();

            return Ok(result);
        }

        // GET: api/videos/my — Get videos belonging to the authenticated user's channel
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyVideos()
        {
            var userIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (channel == null) return NotFound(new { message = "Kênh không tồn tại." });

            var videos = await _context.Videos
                .Include(v => v.VideoThumbnails)
                .Where(v => v.ChannelId == channel.Id)
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VideoManageDTO
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == v.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = v.Duration ?? 0,
                    ViewsCount = v.ViewsCount ?? 0,
                    LikesCount = v.LikesCount ?? 0,
                    CommentsCount = v.CommentsCount ?? 0,
                    Visibility = v.Visibility ?? "Public",
                    IsShort = v.IsShort ?? false,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow
                })
                .ToListAsync();

            return Ok(videos);
        }

        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminAllVideos()
        {
            var videos = await _context.Videos
                .Include(v => v.VideoThumbnails)
                .Include(v => v.Channel)
                .Include(v => v.Category)
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VideoManageDTO
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == v.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = v.Duration ?? 0,
                    ViewsCount = v.ViewsCount ?? 0,
                    LikesCount = v.LikesCount ?? 0,
                    CommentsCount = v.CommentsCount ?? 0,
                    Visibility = v.Visibility ?? "Public",
                    IsShort = v.IsShort ?? false,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    ChannelName = v.Channel != null ? v.Channel.ChannelName : "",
                    Category = v.Category != null ? new CategoryResponseDTO
                    {
                        Id = v.Category.Id,
                        Name = v.Category.Name,
                        Description = v.Category.Description ?? ""
                    } : null
                })
                .ToListAsync();

            return Ok(videos);
        }
        // POST: api/videos
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateVideo([FromBody] VideoCreateDTO dto)
        {
            var userIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (channel == null) return BadRequest(new { message = "Bạn chưa có kênh." });

            var videoId = Guid.NewGuid();
            var video = new Video
            {
                Id = videoId,
                ChannelId = channel.Id,
                Title = dto.Title,
                Description = dto.Description,
                Visibility = dto.Visibility,
                Duration = dto.Duration,
                CategoryId = dto.CategoryId,
                CreatedAt = DateTime.UtcNow,
                ViewsCount = 0,
                LikesCount = 0,
                DislikesCount = 0,
                CommentsCount = 0,
                IsShort = dto.IsShort
            };
            _context.Videos.Add(video);

            if (!string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
            {
                _context.VideoThumbnails.Add(new VideoThumbnail { Id = Guid.NewGuid(), VideoId = videoId, ThumbnailUrl = dto.ThumbnailUrl });
            }
            
            if (!string.IsNullOrWhiteSpace(dto.VideoUrl))
            {
                _context.VideoFiles.Add(new VideoFile { Id = Guid.NewGuid(), VideoId = videoId, FileUrl = dto.VideoUrl, Resolution = "1080p" });
            }

            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(dto.VideoUrl))
            {
                var request = HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
                
                try
                {
                    var fileName = Path.GetFileName(new Uri(dto.VideoUrl).LocalPath);
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "videos", fileName);
                    
                    _ = Task.Run(async () => {
                        using (var scope = _scopeFactory.CreateScope())
                        {
                            var processingService = scope.ServiceProvider.GetRequiredService<Video_Platform_Backend.Services.VideoProcessingService>();
                            await processingService.ProcessVideoResolutionsAsync(videoId, filePath, fileName, baseUrl);
                        }
                    });
                }
                catch (Exception e)
                {
                    // Log but don't fail the request
                    Console.WriteLine("Could not start background transcoding: " + e.Message);
                }
            }

            return Ok(new { message = "Đã tải video lên thành công.", videoId = videoId });
        }

        // PUT: api/videos/{id} — Update video title/description/visibility
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateVideo(Guid id, [FromBody] VideoUpdateDTO dto)
        {
            var userIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var video = await _context.Videos
                .Include(v => v.Channel)
                .Include(v => v.VideoThumbnails)
                .Include(v => v.VideoFiles)
                .FirstOrDefaultAsync(v => v.Id == id);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });
            var isAdmin = User.IsInRole("Admin");
            if (video.Channel.UserId != userId && !isAdmin) return Forbid();

            video.Title = dto.Title;
            video.Description = dto.Description;
            video.Visibility = dto.Visibility;
            if (dto.Duration.HasValue) video.Duration = dto.Duration.Value;
            if (dto.CategoryId.HasValue) video.CategoryId = dto.CategoryId.Value;
            if (dto.IsShort.HasValue) video.IsShort = dto.IsShort.Value;
            video.UpdatedAt = DateTime.UtcNow;

            // Update thumbnail if provided
            if (!string.IsNullOrWhiteSpace(dto.ThumbnailUrl))
            {
                var thumb = video.VideoThumbnails.FirstOrDefault();
                if (thumb != null)
                    thumb.ThumbnailUrl = dto.ThumbnailUrl;
                else
                    _context.VideoThumbnails.Add(new VideoThumbnail { Id = Guid.NewGuid(), VideoId = id, ThumbnailUrl = dto.ThumbnailUrl });
            }

            // Update video file if provided
            if (!string.IsNullOrWhiteSpace(dto.VideoUrl))
            {
                var file = video.VideoFiles.FirstOrDefault();
                if (file != null)
                    file.FileUrl = dto.VideoUrl;
                else
                    _context.VideoFiles.Add(new VideoFile { Id = Guid.NewGuid(), VideoId = id, FileUrl = dto.VideoUrl });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật video thành công." });
        }

        // DELETE: api/videos/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteVideo(Guid id)
        {
            var userIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var video = await _context.Videos.Include(v => v.Channel).FirstOrDefaultAsync(v => v.Id == id);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });
            var isAdmin = User.IsInRole("Admin");
            if (video.Channel.UserId != userId && !isAdmin) return Forbid();

            _context.Videos.Remove(video);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa video." });
        }
        // POST: api/videos/{id}/report
        [HttpPost("{id}/report")]
        [Authorize]
        public async Task<IActionResult> ReportVideo(Guid id, [FromBody] CreateReportDTO request)
        {
            var userIdStr = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            var video = await _context.Videos.FindAsync(id);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });

            var report = new Report
            {
                Id = Guid.NewGuid(),
                ReporterId = userId,
                TargetId = id,
                TargetType = "Video",
                Reason = request.Reason,
                Description = request.Description,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cảm ơn bạn. Báo cáo của bạn đã được gửi và sẽ được xem xét." });
        }

        // GET: api/videos/vod/{filename}
        [HttpGet("vod/{filename}")]
        public IActionResult GetVod(string filename)
        {
            try
            {
                var vodPath = Path.Combine(AppContext.BaseDirectory, "vod", filename);
                
                // Security: Prevent path traversal
                var fullPath = Path.GetFullPath(vodPath);
                var vodDirPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "vod"));
                
                if (!fullPath.StartsWith(vodDirPath))
                {
                    return BadRequest("Invalid file path");
                }

                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound("Video not found");
                }

                var stream = System.IO.File.OpenRead(fullPath);
                return File(stream, "video/mp4", enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error serving video: {ex.Message}");
            }
        }

        // GET: api/videos/livestream/{livestreamId}/vod-status
        [HttpGet("livestream/{livestreamId}/vod-status")]
        public async Task<IActionResult> GetVodStatus(Guid livestreamId)
        {
            var livestream = await _context.Livestreams.FindAsync(livestreamId);
            if (livestream == null)
                return NotFound("Livestream not found");

            return Ok(new
            {
                livestreamId,
                status = livestream.Status,
                vodUrl = livestream.VodUrl,
                hasVod = !string.IsNullOrEmpty(livestream.VodUrl)
            });
        }
    }
}

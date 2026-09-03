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
using Video_Platform_Backend.Extensions;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChannelsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChannelsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/channels â€” Danh sÃ¡ch táº¥t cáº£ kÃªnh (kÃªnh ná»•i báº­t cho trang chá»§)
        [HttpGet]
        public async Task<IActionResult> GetAllChannels([FromQuery] int limit = 10)
        {
            var channels = await _context.Channels
                .Where(c => !c.IsSuspended)
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .Select(c => new ChannelCardDTO
                {
                    Id = c.Id,
                    ChannelName = c.ChannelName,
                    Handle = c.Handle,
                    AvatarUrl = c.User.Profile != null ? (c.User.Profile.AvatarUrl ?? "") : "",
                    Description = c.Description ?? "",
                    SubscriberCount = _context.Followers.Count(f => f.ChannelId == c.Id),
                    IsVerified = c.IsVerified
                })
                .OrderByDescending(c => c.IsVerified)
                .ThenByDescending(c => c.SubscriberCount)
                .Take(limit)
                .ToListAsync();

            return Ok(channels);
        }

        [HttpGet("by-id")]
        public async Task<IActionResult> GetChannelByIdQuery([FromQuery] Guid channelId)
        {
            return await GetChannelByIdInternal(channelId);
        }

        [HttpGet("by-id/{channelId:guid}")]
        public async Task<IActionResult> GetChannelById(Guid channelId)
        {
            return await GetChannelByIdInternal(channelId);
        }

        private async Task<IActionResult> GetChannelByIdInternal(Guid channelId)
        {
            var channel = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .FirstOrDefaultAsync(c => c.Id == channelId);

            if (channel == null)
            {
                return NotFound(new { message = "Không tìm thấy kênh này" });
            }

            var followersCount = await _context.Followers.CountAsync(f => f.ChannelId == channel.Id);
            var followingCount = await _context.Followers.CountAsync(f => f.FollowerId == channel.UserId);
            var actualTotalViews = await _context.Videos
                .Where(v => v.ChannelId == channel.Id)
                .SumAsync(v => v.ViewsCount ?? 0);

            var profileDto = new ChannelProfileDTO
            {
                Id = channel.Id,
                ChannelName = channel.ChannelName,
                Handle = channel.Handle,
                Description = channel.Description ?? "",
                BannerUrl = channel.BannerUrl ?? "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=1920&h=400",
                AvatarUrl = channel.User.Profile?.AvatarUrl ?? "https://via.placeholder.com/150",
                SubscriberCount = followersCount,
                FollowingCount = followingCount,
                TotalViews = actualTotalViews,
                ContactEmail = channel.ContactEmail,
                Country = channel.Country,
                SocialLinks = channel.SocialLinks,
                MembershipFee = channel.MembershipFee,
                CreatedAt = channel.CreatedAt ?? DateTime.UtcNow,
                IsVerified = channel.IsVerified
            };

            return Ok(profileDto);
        }

        // GET: api/channels/{handle}
        [HttpGet("{handle}")]
        public async Task<IActionResult> GetChannelProfile(string handle)
        {
            var channel = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .FirstOrDefaultAsync(c => c.Handle == handle);

            if (channel == null)
            {
                return NotFound(new { message = "KhÃ´ng tÃ¬m tháº¥y kÃªnh nÃ y" });
            }

            if (channel.IsSuspended)
            {
                return StatusCode(403, new { message = "Kênh này đã bị đình chỉ", isSuspended = true });
            }

            var followersCount = await _context.Followers.CountAsync(f => f.ChannelId == channel.Id);
            var followingCount = await _context.Followers.CountAsync(f => f.FollowerId == channel.UserId);
            var actualTotalViews = await _context.Videos
                .Where(v => v.ChannelId == channel.Id)
                .SumAsync(v => v.ViewsCount ?? 0);

            var profileDto = new ChannelProfileDTO
            {
                Id = channel.Id,
                ChannelName = channel.ChannelName,
                Handle = channel.Handle,
                Description = channel.Description ?? "",
                BannerUrl = channel.BannerUrl ?? "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=1920&h=400", // Fallback banner
                AvatarUrl = channel.User.Profile?.AvatarUrl ?? "https://via.placeholder.com/150", // Fallback avatar
                SubscriberCount = followersCount,
                FollowingCount = followingCount,
                TotalViews = actualTotalViews,
                ContactEmail = channel.ContactEmail,
                Country = channel.Country,
                SocialLinks = channel.SocialLinks,
                MembershipFee = channel.MembershipFee,
                CreatedAt = channel.CreatedAt ?? DateTime.UtcNow,
                IsVerified = channel.IsVerified
            };

            return Ok(profileDto);
        }

        // GET: api/channels/me
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyChannel()
        {
            var userIdString = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (channel == null) return NotFound(new { message = "Bạn chưa có kênh." });

            var followersCount = await _context.Followers.CountAsync(f => f.ChannelId == channel.Id);
            var followingCount = await _context.Followers.CountAsync(f => f.FollowerId == channel.UserId);
            var actualTotalViews = await _context.Videos
                .Where(v => v.ChannelId == channel.Id)
                .SumAsync(v => v.ViewsCount ?? 0);

            var profileDto = new ChannelProfileDTO
            {
                Id = channel.Id,
                ChannelName = channel.ChannelName,
                Handle = channel.Handle,
                Description = channel.Description ?? "",
                BannerUrl = channel.BannerUrl ?? "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=1920&h=400",
                AvatarUrl = channel.User.Profile?.AvatarUrl ?? "https://via.placeholder.com/150",
                SubscriberCount = followersCount,
                FollowingCount = followingCount,
                TotalViews = actualTotalViews,
                ContactEmail = channel.ContactEmail,
                Country = channel.Country,
                SocialLinks = channel.SocialLinks,
                MembershipFee = channel.MembershipFee,
                CreatedAt = channel.CreatedAt ?? DateTime.UtcNow,
                IsVerified = channel.IsVerified
            };

            return Ok(profileDto);
        }

        // GET: api/channels/{channelId}/members
        [HttpGet("{channelId}/members")]
        public async Task<IActionResult> GetChannelMembers(Guid channelId)
        {
            var members = await _context.Subscriptions
                .Include(s => s.Subscriber)
                    .ThenInclude(u => u.Profile)
                .Where(s => s.ChannelId == channelId && s.Status == "Active" && (s.EndDate == null || s.EndDate > DateTime.UtcNow))
                .OrderByDescending(s => s.StartDate)
                .Select(s => new ChannelMemberDTO
                {
                    UserId = s.SubscriberId,
                    FullName = s.Subscriber.Profile != null ? s.Subscriber.Profile.FullName : "Người dùng",
                    AvatarUrl = s.Subscriber.Profile != null && s.Subscriber.Profile.AvatarUrl != null ? s.Subscriber.Profile.AvatarUrl : "",
                    JoinedAt = s.StartDate,
                    EndDate = s.EndDate,
                    Tier = s.Tier ?? "Thường"
                })
                .ToListAsync();

            return Ok(members);
        }

        // GET: api/channels/{channelId}/membership-revenue
        [HttpGet("{channelId}/membership-revenue")]
        public async Task<IActionResult> GetChannelMembershipRevenue(Guid channelId)
        {
            var totalRevenue = await _context.Transactions
                .Include(t => t.Payment)
                .Where(t => t.TargetChannelId == channelId 
                         && t.TransactionType != null 
                         && t.TransactionType.StartsWith("ChannelMembership")
                         && t.Payment != null 
                         && (t.Payment.Status == "Completed" || t.Payment.Status == "Success"))
                .SumAsync(t => t.Amount);

            return Ok(new { TotalRevenue = totalRevenue });
        }

        // GET: api/channels/{channelId}/revenue-stats
        [HttpGet("{channelId}/revenue-stats")]
        [Authorize]
        public async Task<IActionResult> GetChannelRevenueStats(Guid channelId)
        {
            var userIdString = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels.FirstOrDefaultAsync(c => c.Id == channelId);
            if (channel == null) return NotFound(new { message = "Không tìm thấy kênh." });
            if (channel.UserId != userId) return Unauthorized(new { message = "Bạn không có quyền truy cập." });

            var channelLivestreamIds = await _context.Livestreams
                .Where(l => l.ChannelId == channel.Id)
                .Select(l => l.Id)
                .ToListAsync();

            // 1 & 3: Donate Revenue & History (VND)
            var donateHistory = await _context.Donations
                .Include(d => d.User).ThenInclude(u => u.Profile)
                .Where(d => channelLivestreamIds.Contains(d.LivestreamId) && d.Currency == "VND" && d.Status == "completed")
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.DonorName,
                    d.Amount,
                    d.Message,
                    d.CreatedAt,
                    AvatarUrl = d.User != null && d.User.Profile != null ? d.User.Profile.AvatarUrl : null
                })
                .ToListAsync();

            var totalDonateVND = donateHistory.Sum(d => d.Amount);

            // 2 & 4: Coin Received Revenue & History (Xu)
            var coinReceivedHistory = await _context.Donations
                .Include(d => d.User).ThenInclude(u => u.Profile)
                .Where(d => channelLivestreamIds.Contains(d.LivestreamId) && d.Currency == "Xu" && d.Status == "completed")
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.DonorName,
                    d.Amount,
                    d.Message,
                    d.CreatedAt,
                    AvatarUrl = d.User != null && d.User.Profile != null ? d.User.Profile.AvatarUrl : null
                })
                .ToListAsync();

            var totalCoinReceived = coinReceivedHistory.Sum(d => d.Amount);

            // 5: Coin Deposit History
            var depositHistory = await _context.Transactions
                .Include(t => t.Payment)
                .Where(t => t.Payment.UserId == userId && t.TransactionType == "BuyCoins" && (t.Payment.Status == "Success" || t.Payment.Status == "Completed"))
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Amount,
                    t.CreatedAt,
                    CoinsAdded = (int)(t.Amount / 100)
                })
                .ToListAsync();

            // 6: Coin Spent History (Gift sent)
            var coinSpentHistory = await _context.Donations
                .Include(d => d.Livestream).ThenInclude(l => l.Channel)
                .Where(d => d.UserId == userId && d.Currency == "Xu" && d.Status == "completed")
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.Amount,
                    d.CreatedAt,
                    ChannelName = d.Livestream != null && d.Livestream.Channel != null ? d.Livestream.Channel.ChannelName : "Kênh ẩn",
                    d.Message
                })
                .ToListAsync();

            // 7: Membership Revenue & Members
            var membershipRevenue = await _context.Transactions
                .Include(t => t.Payment)
                .Where(t => t.TargetChannelId == channelId 
                         && t.TransactionType != null 
                         && t.TransactionType.StartsWith("ChannelMembership")
                         && t.Payment != null 
                         && (t.Payment.Status == "Completed" || t.Payment.Status == "Success"))
                .SumAsync(t => t.Amount);

            var members = await _context.Subscriptions
                .Include(s => s.Subscriber)
                    .ThenInclude(u => u.Profile)
                .Where(s => s.ChannelId == channelId && s.Status == "Active" && (s.EndDate == null || s.EndDate > DateTime.UtcNow))
                .OrderByDescending(s => s.StartDate)
                .Select(s => new
                {
                    UserId = s.SubscriberId,
                    FullName = s.Subscriber.Profile != null ? s.Subscriber.Profile.FullName : "Người dùng",
                    AvatarUrl = s.Subscriber.Profile != null && s.Subscriber.Profile.AvatarUrl != null ? s.Subscriber.Profile.AvatarUrl : "",
                    JoinedAt = s.StartDate,
                    EndDate = s.EndDate,
                    Tier = s.Tier ?? "Thường"
                })
                .ToListAsync();

            var withdrawals = await _context.WithdrawalRequests
                .Where(w => w.UserId == userId && w.Status != "Rejected")
                .Select(w => new
                {
                    w.Id,
                    AmountVnd = w.AmountFiat,
                    w.Coins,
                    w.BreakdownData
                })
                .ToListAsync();

            return Ok(new
            {
                TotalDonateVND = totalDonateVND,
                TotalCoinReceived = totalCoinReceived,
                MembershipRevenue = membershipRevenue,
                Members = members,
                DonateHistory = donateHistory,
                CoinReceivedHistory = coinReceivedHistory,
                DepositHistory = depositHistory,
                CoinSpentHistory = coinSpentHistory,
                Withdrawals = withdrawals
            });
        }


        // GET: api/channels/{channelId}/videos
        [HttpGet("{channelId}/videos")]
        public async Task<IActionResult> GetChannelVideos(Guid channelId)
        {
            var videos = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => v.ChannelId == channelId && (v.Visibility == "Public" || v.Visibility == "Private"))
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
                        : "",
                    ChannelIsVerified = v.Channel.IsVerified,
                    IsMembersOnly = v.Visibility == "Private"
                })
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync();

            return Ok(videos);
        }

        // PUT: api/channels/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChannel(Guid id, [FromBody] ChannelUpdateDTO dto)
        {
            var channel = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (channel == null)
            {
                return NotFound(new { message = "KÃªnh khÃ´ng tá»“n táº¡i" });
            }

            // Check if handle is taken by another channel
            if (channel.Handle != dto.Handle && await _context.Channels.AnyAsync(c => c.Handle == dto.Handle))
            {
                return BadRequest(new { message = "TÃªn Ä‘á»‹nh danh (Handle) Ä‘Ã£ tá»“n táº¡i." });
            }

            // Update Channel fields
            channel.ChannelName = dto.ChannelName;
            channel.Handle = dto.Handle;
            channel.Description = dto.Description;
            channel.BannerUrl = dto.BannerUrl;
            channel.ContactEmail = dto.ContactEmail;
            channel.Country = dto.Country;
            channel.SocialLinks = dto.SocialLinks;
            channel.MembershipFee = dto.MembershipFee;

            // Update Profile fields
            if (channel.User.Profile != null)
            {
                channel.User.Profile.AvatarUrl = dto.AvatarUrl;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cáº­p nháº­t thÃ nh cÃ´ng!" });
        }

        [HttpGet("by-id/{channelId}/check-follow")]
        [Authorize]
        public async Task<IActionResult> CheckFollow(Guid channelId)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            bool isSubscribed = await _context.Followers.AnyAsync(f => f.FollowerId == userId && f.ChannelId == channelId);
            return Ok(new { isSubscribed });
        }

        // POST: api/channels/{channelId}/follow
        [HttpPost("{channelId}/follow")]
        [Authorize]
        public async Task<IActionResult> ToggleFollow(Guid channelId)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null) return NotFound(new { message = "KÃªnh khÃ´ng tá»“n táº¡i." });

            if (channel.UserId == userId)
                return BadRequest(new { message = "B\u1ea1n kh\u00f4ng th\u1ec3 \u0111\u0103ng k\u00fd k\u00eanh c\u1ee7a ch\u00ednh m\u00ecnh." });

            var existingFollow = await _context.Followers.FirstOrDefaultAsync(f => f.FollowerId == userId && f.ChannelId == channelId);
            bool isSubscribed = false;

            if (existingFollow == null)
            {
                // Subscribe
                var follower = new Follower { FollowerId = userId, ChannelId = channelId, CreatedAt = DateTime.UtcNow };
                _context.Followers.Add(follower);
                isSubscribed = true;
            }
            else
            {
                // Unsubscribe
                _context.Followers.Remove(existingFollow);
            }

            await _context.SaveChangesAsync();

            var currentFollowersCount = await _context.Followers.CountAsync(f => f.ChannelId == channelId);

            return Ok(new { 
                isSubscribed = isSubscribed,
                subscriberCount = currentFollowersCount,
                message = isSubscribed ? "ÄÃ£ Ä‘Äƒng kÃ½ kÃªnh." : "ÄÃ£ há»§y Ä‘Äƒng kÃ½."
            });
        }

        // GET: api/channels/subscribed
        [HttpGet("subscribed")]
        [Authorize]
        public async Task<IActionResult> GetSubscribedChannels()
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var subscribedChannels = await _context.Followers
                .Include(f => f.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(f => f.FollowerId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new ChannelCardDTO
                {
                    Id = f.Channel.Id,
                    ChannelName = f.Channel.ChannelName,
                    Handle = f.Channel.Handle,
                    AvatarUrl = f.Channel.User.Profile != null ? (f.Channel.User.Profile.AvatarUrl ?? "") : "",
                    Description = f.Channel.Description ?? "",
                    SubscriberCount = _context.Followers.Count(x => x.ChannelId == f.ChannelId),
                    VideoCount = _context.Videos.Count(v => v.ChannelId == f.ChannelId && v.Visibility == "Public"),
                    IsVerified = f.Channel.IsVerified
                })
                .ToListAsync();

            return Ok(subscribedChannels);
        }

        // GET: api/channels/{channelId}/membership
        [HttpGet("{channelId}/membership")]
        [Authorize]
        public async Task<IActionResult> GetMembershipStatus(Guid channelId)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.SubscriberId == userId && s.ChannelId == channelId && s.Status == "Active" && (s.EndDate == null || s.EndDate > DateTime.UtcNow));

            if (subscription != null)
            {
                return Ok(new { 
                    isMember = true, 
                    tier = subscription.Tier, 
                    endDate = subscription.EndDate 
                });
            }

            return Ok(new { isMember = false });
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllChannelsForAdmin()
        {
            var channels = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .Select(c => new
                {
                    c.Id,
                    c.ChannelName,
                    c.Handle,
                    AvatarUrl = !string.IsNullOrEmpty(c.AvatarUrl) ? c.AvatarUrl : (c.User.Profile != null ? c.User.Profile.AvatarUrl : null),
                    OwnerEmail = c.User.Email,
                    OwnerName = c.User.Email,
                    c.TotalViews,
                    SubscribersCount = c.Followers.Count,
                    c.IsVerified,
                    c.IsSuspended,
                    c.CanLivestream,
                    c.CanUploadVideo,
                    c.CreatedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(channels);
        }

        [HttpPut("{id}/verify")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleVerifyChannel(Guid id)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound(new { message = "Kênh không tồn tại" });

            channel.IsVerified = !channel.IsVerified;
            var actionStr = channel.IsVerified ? "Cấp tích xanh" : "Thu hồi tích xanh";
            this.AddAuditLog(_context, actionStr, "update", $"Channel:{id}", $"Trạng thái: {(channel.IsVerified ? "Verified" : "Unverified")}");
            
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã {(channel.IsVerified ? "cấp" : "thu hồi")} tích xanh.", isVerified = channel.IsVerified });
        }

        [HttpPut("{id}/suspend")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleSuspendChannel(Guid id)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound(new { message = "Kênh không tồn tại" });

            channel.IsSuspended = !channel.IsSuspended;
            if (channel.IsSuspended)
            {
                channel.CanLivestream = false;
                channel.CanUploadVideo = false;
            }
            var actionStr = channel.IsSuspended ? "Đình chỉ kênh" : "Mở lại kênh";
            this.AddAuditLog(_context, actionStr, "update", $"Channel:{id}", $"Trạng thái: {(channel.IsSuspended ? "Suspended" : "Active")}");
            
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã {(channel.IsSuspended ? "đình chỉ" : "mở lại")} kênh.", isSuspended = channel.IsSuspended });
        }

        [HttpPut("{id}/permissions")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateChannelPermissions(Guid id, [FromBody] ChannelPermissionsDto dto)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null) return NotFound(new { message = "Kênh không tồn tại" });
            if (channel.IsSuspended) return BadRequest(new { message = "Không thể thay đổi quyền khi kênh đang bị đình chỉ." });

            channel.CanLivestream = dto.CanLivestream;
            channel.CanUploadVideo = dto.CanUploadVideo;

            this.AddAuditLog(_context, "Cập nhật quyền kênh", "update", $"Channel:{id}", $"Livestream: {dto.CanLivestream}, Upload: {dto.CanUploadVideo}");

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật quyền kênh thành công.", canLivestream = channel.CanLivestream, canUploadVideo = channel.CanUploadVideo });
        }
    }

    public class ChannelPermissionsDto
    {
        public bool CanLivestream { get; set; }
        public bool CanUploadVideo { get; set; }
    }
}

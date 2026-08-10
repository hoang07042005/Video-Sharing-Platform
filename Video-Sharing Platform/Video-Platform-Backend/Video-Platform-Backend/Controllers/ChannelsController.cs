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
    public class ChannelsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChannelsController(ApplicationDbContext context)
        {
            _context = context;
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
                return NotFound(new { message = "Không tìm thấy kênh này" });
            }

            var followersCount = await _context.Followers.CountAsync(f => f.ChannelId == channel.Id);
            var followingCount = await _context.Followers.CountAsync(f => f.FollowerId == channel.UserId);
            var actualTotalViews = await _context.Views.CountAsync(v => v.Video.ChannelId == channel.Id);

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
                CreatedAt = channel.CreatedAt ?? DateTime.UtcNow
            };

            return Ok(profileDto);
        }

        // GET: api/channels/{channelId}/videos
        [HttpGet("{channelId}/videos")]
        public async Task<IActionResult> GetChannelVideos(Guid channelId)
        {
            var videos = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => v.ChannelId == channelId && v.Visibility == "Public")
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
                return NotFound(new { message = "Kênh không tồn tại" });
            }

            // Check if handle is taken by another channel
            if (channel.Handle != dto.Handle && await _context.Channels.AnyAsync(c => c.Handle == dto.Handle))
            {
                return BadRequest(new { message = "Tên định danh (Handle) đã tồn tại." });
            }

            // Update Channel fields
            channel.ChannelName = dto.ChannelName;
            channel.Handle = dto.Handle;
            channel.Description = dto.Description;
            channel.BannerUrl = dto.BannerUrl;
            channel.ContactEmail = dto.ContactEmail;
            channel.Country = dto.Country;

            // Update Profile fields
            if (channel.User.Profile != null)
            {
                channel.User.Profile.AvatarUrl = dto.AvatarUrl;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thành công!" });
        }

        // POST: api/channels/{channelId}/follow
        [HttpPost("{channelId}/follow")]
        [Authorize]
        public async Task<IActionResult> ToggleFollow(Guid channelId)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null) return NotFound(new { message = "Kênh không tồn tại." });

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
                message = isSubscribed ? "Đã đăng ký kênh." : "Đã hủy đăng ký."
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
                    SubscriberCount = _context.Followers.Count(x => x.ChannelId == f.Channel.Id)
                })
                .ToListAsync();

            return Ok(subscribedChannels);
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlaylistsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PlaylistsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class PlaylistResponseDTO
        {
            public Guid Id { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public int VideoCount { get; set; }
            public string ThumbnailUrl { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
        }

        [HttpGet("channel/{channelId}")]
        public async Task<IActionResult> GetChannelPlaylists(Guid channelId)
        {
            var playlists = await _context.Playlists
                .Where(p => p.ChannelId == channelId && p.Visibility == "Public")
                .Select(p => new PlaylistResponseDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description ?? "",
                    VideoCount = p.PlaylistVideos.Count,
                    ThumbnailUrl = p.PlaylistVideos
                        .OrderBy(pv => pv.AddedAt)
                        .Select(pv => pv.Video.VideoThumbnails.FirstOrDefault().ThumbnailUrl)
                        .FirstOrDefault() ?? "https://via.placeholder.com/600x400?text=No+Thumbnail",
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow
                })
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(playlists);
        }


        public class SaveVideoRequest
        {
            public Guid VideoId { get; set; }
        }

        // POST: api/playlists/save
        [HttpPost("save")]
        [Authorize]
        public async Task<IActionResult> ToggleSaveVideo([FromBody] SaveVideoRequest request)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var video = await _context.Videos.FindAsync(request.VideoId);
            if (video == null) return NotFound(new { message = "Video không tồn tại." });

            var userChannel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (userChannel == null) return BadRequest(new { message = "User does not have a channel." });

            // Tìm hoặc tạo playlist "Xem sau" cho user này
            var watchLaterPlaylist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.ChannelId == userChannel.Id && p.Title == "Xem sau");

            if (watchLaterPlaylist == null)
            {
                watchLaterPlaylist = new Playlist
                {
                    Id = Guid.NewGuid(),
                    ChannelId = userChannel.Id,
                    Title = "Xem sau",
                    Description = "Danh sách video muốn xem lại.",
                    Visibility = "Private",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Playlists.Add(watchLaterPlaylist);
                await _context.SaveChangesAsync();
            }

            // Kiểm tra xem video đã có trong playlist chưa
            var existingItem = await _context.PlaylistVideos
                .FirstOrDefaultAsync(pv => pv.PlaylistId == watchLaterPlaylist.Id && pv.VideoId == request.VideoId);

            bool isSaved = false;

            if (existingItem == null)
            {
                var maxOrder = await _context.PlaylistVideos
                    .Where(pv => pv.PlaylistId == watchLaterPlaylist.Id)
                    .MaxAsync(pv => (int?)pv.SortOrder) ?? 0;

                var newItem = new PlaylistVideo
                {
                    Id = Guid.NewGuid(),
                    PlaylistId = watchLaterPlaylist.Id,
                    VideoId = request.VideoId,
                    SortOrder = maxOrder + 1,
                    AddedAt = DateTime.UtcNow
                };
                _context.PlaylistVideos.Add(newItem);
                isSaved = true;
            }
            else
            {
                _context.PlaylistVideos.Remove(existingItem);
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                isSaved = isSaved,
                message = isSaved ? "Đã lưu vào danh sách Xem sau." : "Đã xóa khỏi danh sách Xem sau."
            });
        }

        // GET: api/playlists/saved
        [HttpGet("saved")]
        [Authorize]
        public async Task<IActionResult> GetSavedVideos()
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var userChannel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (userChannel == null) return Ok(new List<VideoResponseDTO>());

            var watchLaterPlaylist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.ChannelId == userChannel.Id && p.Title == "Xem sau");

            if (watchLaterPlaylist == null)
            {
                return Ok(new List<VideoResponseDTO>());
            }

            var savedVideos = await _context.PlaylistVideos
                .Include(pv => pv.Video)
                    .ThenInclude(v => v.Channel)
                        .ThenInclude(c => c.User)
                            .ThenInclude(u => u.Profile)
                .Include(pv => pv.Video)
                    .ThenInclude(v => v.VideoThumbnails)
                .Where(pv => pv.PlaylistId == watchLaterPlaylist.Id && pv.Video.Visibility == "Public")
                .OrderByDescending(pv => pv.AddedAt)
                .ToListAsync();

            var result = savedVideos.Select(pv => new VideoResponseDTO
            {
                Id = pv.Video.Id,
                Title = pv.Video.Title,
                Description = pv.Video.Description ?? "",
                ThumbnailUrl = pv.Video.VideoThumbnails.FirstOrDefault()?.ThumbnailUrl ?? "",
                Duration = pv.Video.Duration ?? 0,
                ViewsCount = pv.Video.ViewsCount ?? 0,
                CreatedAt = pv.Video.CreatedAt ?? DateTime.UtcNow,
                IsShort = pv.Video.IsShort ?? false,
                ChannelId = pv.Video.ChannelId,
                ChannelName = pv.Video.Channel.ChannelName,
                ChannelHandle = pv.Video.Channel.Handle,
                ChannelAvatarUrl = pv.Video.Channel.User.Profile?.AvatarUrl ?? ""
            }).ToList();

            return Ok(result);
        }

        // DELETE: api/playlists/saved/{videoId}
        [HttpDelete("saved/{videoId}")]
        [Authorize]
        public async Task<IActionResult> RemoveSavedVideo(Guid videoId)
        {
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid userId)) return Unauthorized();

            var userChannel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
            if (userChannel == null) return NotFound();

            var watchLaterPlaylist = await _context.Playlists
                .FirstOrDefaultAsync(p => p.ChannelId == userChannel.Id && p.Title == "Xem sau");
            if (watchLaterPlaylist == null) return NotFound();

            var item = await _context.PlaylistVideos
                .FirstOrDefaultAsync(pv => pv.PlaylistId == watchLaterPlaylist.Id && pv.VideoId == videoId);
            if (item == null) return NotFound();

            _context.PlaylistVideos.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa khỏi danh sách Xem sau." });
        }
    }
}

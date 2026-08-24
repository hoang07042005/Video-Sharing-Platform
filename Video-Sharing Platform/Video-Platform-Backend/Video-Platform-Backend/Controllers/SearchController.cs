using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System;
using System.Collections.Generic;

namespace Video_Platform_Backend.Controllers
{
    public class SearchResultDTO
    {
        public List<ChannelCardDTO> Channels { get; set; } = new();
        public List<PlaylistResponseDTO> Playlists { get; set; } = new();
        public List<VideoResponseDTO> Videos { get; set; } = new();
        public List<VideoResponseDTO> Shorts { get; set; } = new();
    }

    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GlobalSearch([FromQuery] string q = "", [FromQuery] int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new SearchResultDTO());
            }

            var query = q.ToLower();

            // 1. Search Channels (Match ChannelName or Handle)
            var channels = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .Where(c => (c.ChannelName.ToLower().Contains(query) || c.Handle.ToLower().Contains(query)) && !c.IsSuspended)
                .Select(c => new ChannelCardDTO
                {
                    Id = c.Id,
                    ChannelName = c.ChannelName,
                    Handle = c.Handle,
                    AvatarUrl = c.User.Profile != null ? (c.User.Profile.AvatarUrl ?? "") : "",
                    SubscriberCount = _context.Followers.Count(f => f.ChannelId == c.Id)
                })
                .Take(5)
                .ToListAsync();

            // 2. Search Playlists (Match Title, or Video Titles/Descriptions, Public only)
            var playlists = await _context.Playlists
                .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video)
                .Where(p => p.Visibility == "Public" && 
                            (p.Title.ToLower().Contains(query) || 
                             p.PlaylistVideos.Any(pv => pv.Video.Title.ToLower().Contains(query) || 
                                                        (pv.Video.Description != null && pv.Video.Description.ToLower().Contains(query)))))
                .Select(p => new PlaylistResponseDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description ?? "",
                    VideoCount = p.PlaylistVideos.Count,
                    ThumbnailUrl = p.PlaylistVideos.OrderBy(pv => pv.AddedAt).Select(pv => _context.VideoThumbnails.Where(t => t.VideoId == pv.VideoId).Select(t => t.ThumbnailUrl).FirstOrDefault()).FirstOrDefault() ?? "https://via.placeholder.com/320x180",
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
                    Visibility = p.Visibility
                })
                .Take(15)
                .ToListAsync();

            // 3. Search Videos & Shorts (Match Title or Description, Public only)
            var videoEntities = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => v.Visibility == "Public" && !v.Channel.IsSuspended &&
                            (v.Title.ToLower().Contains(query) || 
                            (v.Description != null && v.Description.ToLower().Contains(query))))
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
                    ChannelIsVerified = v.Channel.IsVerified
                })
                .OrderByDescending(v => v.ViewsCount)
                .Take(limit)
                .ToListAsync();

            var videos = videoEntities.Where(v => !v.IsShort).ToList();
            var shorts = videoEntities.Where(v => v.IsShort).ToList();

            var result = new SearchResultDTO
            {
                Channels = channels,
                Playlists = playlists,
                Videos = videos,
                Shorts = shorts
            };

            return Ok(result);
        }
    }
}

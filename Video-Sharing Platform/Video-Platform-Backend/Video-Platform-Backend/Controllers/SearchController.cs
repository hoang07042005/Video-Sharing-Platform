using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System;
using System.Collections.Generic;
using System.Text;
using System.Globalization;

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

        /// <summary>
        /// Chuẩn hóa chuỗi: bỏ dấu + lowercase
        /// Ví dụ: "Phim Hành Động" → "phim hanh dong"
        /// </summary>
        private static string Normalize(string input)
        {
            if (string.IsNullOrEmpty(input)) return "";
            var normalized = input.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var ch in normalized)
            {
                var cat = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (cat != UnicodeCategory.NonSpacingMark)
                    sb.Append(ch);
            }
            return sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        }

        [HttpGet]
        public async Task<IActionResult> GlobalSearch([FromQuery] string q = "", [FromQuery] int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new SearchResultDTO());
            }

            // Chuẩn hóa keyword: bỏ dấu + lowercase để so sánh
            var queryNorm = Normalize(q);

            // 1. Tải tất cả channels về rồi filter in-memory để hỗ trợ bỏ dấu
            var allChannels = await _context.Channels
                .Include(c => c.User)
                    .ThenInclude(u => u.Profile)
                .Where(c => !c.IsSuspended)
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
                .ToListAsync();

            var channels = allChannels
                .Where(c => Normalize(c.ChannelName).Contains(queryNorm)
                         || Normalize(c.Handle).Contains(queryNorm))
                .Take(5)
                .ToList();

            // 2. Tải tất cả playlists về rồi filter in-memory để hỗ trợ bỏ dấu
            var allPlaylists = await _context.Playlists
                .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video)
                .Where(p => p.Visibility == "Public")
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    Description = p.Description ?? "",
                    VideoCount = p.PlaylistVideos.Count,
                    ThumbnailUrl = p.PlaylistVideos
                        .OrderBy(pv => pv.AddedAt)
                        .Select(pv => _context.VideoThumbnails
                            .Where(t => t.VideoId == pv.VideoId)
                            .Select(t => t.ThumbnailUrl)
                            .FirstOrDefault())
                        .FirstOrDefault() ?? "https://via.placeholder.com/320x180",
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
                    p.Visibility,
                    VideoTitles = p.PlaylistVideos.Select(pv => pv.Video.Title).ToList(),
                    VideoDescriptions = p.PlaylistVideos.Select(pv => pv.Video.Description ?? "").ToList()
                })
                .ToListAsync();

            var playlists = allPlaylists
                .Where(p => Normalize(p.Title).Contains(queryNorm)
                         || p.VideoTitles.Any(t => Normalize(t).Contains(queryNorm))
                         || p.VideoDescriptions.Any(d => Normalize(d).Contains(queryNorm)))
                .Select(p => new PlaylistResponseDTO
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    VideoCount = p.VideoCount,
                    ThumbnailUrl = p.ThumbnailUrl,
                    CreatedAt = p.CreatedAt,
                    Visibility = p.Visibility
                })
                .Take(15)
                .ToList();

            // 3. Tải tất cả videos về rồi filter in-memory để hỗ trợ bỏ dấu
            var allVideoEntities = await _context.Videos
                .Include(v => v.Channel)
                    .ThenInclude(c => c.User)
                        .ThenInclude(u => u.Profile)
                .Where(v => (v.Visibility == "Public" || v.Visibility == "Private") && !v.Channel.IsSuspended)
                .Select(v => new
                {
                    v.Id,
                    v.Title,
                    Description = v.Description ?? "",
                    ThumbnailUrl = _context.VideoThumbnails
                        .Where(t => t.VideoId == v.Id)
                        .Select(t => t.ThumbnailUrl)
                        .FirstOrDefault() ?? "",
                    Duration = v.Duration ?? 0,
                    ViewsCount = v.ViewsCount ?? 0,
                    CreatedAt = v.CreatedAt ?? DateTime.UtcNow,
                    IsShort = v.IsShort ?? false,
                    v.CategoryId,
                    v.ChannelId,
                    v.Channel.ChannelName,
                    ChannelHandle = v.Channel.Handle,
                    ChannelAvatarUrl = v.Channel.User.Profile != null
                        ? (v.Channel.User.Profile.AvatarUrl ?? "")
                        : "",
                    ChannelIsVerified = v.Channel.IsVerified,
                    v.Visibility
                })
                .ToListAsync();

            var videoEntities = allVideoEntities
                .Where(v => Normalize(v.Title).Contains(queryNorm)
                         || Normalize(v.Description).Contains(queryNorm))
                .OrderByDescending(v => v.ViewsCount)
                .Take(limit)
                .Select(v => new VideoResponseDTO
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    ThumbnailUrl = v.ThumbnailUrl,
                    Duration = v.Duration,
                    ViewsCount = v.ViewsCount,
                    CreatedAt = v.CreatedAt,
                    IsShort = v.IsShort,
                    CategoryId = v.CategoryId,
                    ChannelId = v.ChannelId,
                    ChannelName = v.ChannelName,
                    ChannelHandle = v.ChannelHandle,
                    ChannelAvatarUrl = v.ChannelAvatarUrl,
                    ChannelIsVerified = v.ChannelIsVerified,
                    IsMembersOnly = v.Visibility == "Private"
                })
                .ToList();

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

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var titles = await _context.Videos
                .Where(v => v.Visibility == "Public" && v.CreatedAt >= thirtyDaysAgo)
                .OrderByDescending(v => v.ViewsCount)
                .Take(5)
                .Select(v => v.Title)
                .ToListAsync();

            if (titles.Count < 5)
            {
                titles = await _context.Videos
                    .Where(v => v.Visibility == "Public")
                    .OrderByDescending(v => v.ViewsCount)
                    .Take(5)
                    .Select(v => v.Title)
                    .ToListAsync();
            }

            var random = new Random();
            var searchTrends = titles.Select(t => new { keyword = t, change = "+ " + random.Next(10, 150) + "%" }).ToList();

            var topics = await _context.VideoTags
                .GroupBy(t => t.Tag)
                .OrderByDescending(g => g.Count())
                .Take(6)
                .Select(g => "# " + g.Key)
                .ToListAsync();

            if (topics.Count == 0)
            {
                topics = await _context.VideoCategories
                    .OrderByDescending(c => c.Videos.Count)
                    .Take(6)
                    .Select(c => "# " + c.Name)
                    .ToListAsync();
            }

            return Ok(new
            {
                SearchTrends = searchTrends,
                Topics = topics
            });
        }
    }
}

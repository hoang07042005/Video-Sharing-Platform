using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideoQualitiesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<VideoQualitiesController> _logger;

    // Predefined quality profiles
    private static readonly List<QualityProfile> QualityProfiles = new()
    {
        new QualityProfile { Label = "2160p", Height = 2160, Bitrate = 12000 },
        new QualityProfile { Label = "1440p", Height = 1440, Bitrate = 8000 },
        new QualityProfile { Label = "1080p", Height = 1080, Bitrate = 5000 },
        new QualityProfile { Label = "720p", Height = 720, Bitrate = 3000 },
        new QualityProfile { Label = "480p", Height = 480, Bitrate = 1500 },
        new QualityProfile { Label = "360p", Height = 360, Bitrate = 800 },
        new QualityProfile { Label = "240p", Height = 240, Bitrate = 400 }
    };

    public VideoQualitiesController(ApplicationDbContext db, ILogger<VideoQualitiesController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách quality options cho livestream
    /// </summary>
    [HttpGet("livestream/{livestreamId}")]
    public async Task<IActionResult> GetLivestreamQualities(Guid livestreamId)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null)
            return NotFound("Livestream not found");

        var qualities = await _db.VideoQualities
            .Where(q => q.LivestreamId == livestreamId && q.IsActive)
            .OrderByDescending(q => q.Height)
            .Select(q => new
            {
                q.Id,
                q.QualityLabel,
                q.Height,
                q.Bitrate,
                q.HlsUrl
            })
            .ToListAsync();

        return Ok(qualities);
    }

    /// <summary>
    /// Tạo/cập nhật quality option cho livestream
    /// </summary>
    [HttpPost("livestream/{livestreamId}/set-quality")]
    public async Task<IActionResult> SetQuality(Guid livestreamId, [FromBody] SetQualityDTO dto)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null)
            return NotFound("Livestream not found");

        var profile = QualityProfiles.FirstOrDefault(p => p.Label == dto.QualityLabel);
        if (profile == null)
            return BadRequest("Invalid quality label");

        // Check if quality already exists
        var existing = await _db.VideoQualities
            .FirstOrDefaultAsync(q => q.LivestreamId == livestreamId && q.QualityLabel == dto.QualityLabel);

        if (existing != null)
        {
            existing.HlsUrl = dto.HlsUrl;
            existing.IsActive = true;
            _db.VideoQualities.Update(existing);
        }
        else
        {
            var quality = new VideoQuality
            {
                Id = Guid.NewGuid(),
                LivestreamId = livestreamId,
                QualityLabel = dto.QualityLabel,
                Height = profile.Height,
                Bitrate = profile.Bitrate,
                HlsUrl = dto.HlsUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _db.VideoQualities.Add(quality);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation($"Quality {dto.QualityLabel} set for livestream {livestreamId}");

        return Ok(new { message = "Quality set successfully" });
    }

    /// <summary>
    /// Lấy master HLS playlist với tất cả quality variants
    /// </summary>
    [HttpGet("livestream/{livestreamId}/master-playlist")]
    public async Task<IActionResult> GetMasterPlaylist(Guid livestreamId)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null)
            return NotFound("Livestream not found");

        var qualities = await _db.VideoQualities
            .Where(q => q.LivestreamId == livestreamId && q.IsActive)
            .OrderByDescending(q => q.Height)
            .ToListAsync();

        if (qualities.Count == 0)
            return NotFound("No quality options available");

        // Generate M3U8 master playlist
        var playlist = new System.Text.StringBuilder();
        playlist.AppendLine("#EXTM3U");
        playlist.AppendLine("#EXT-X-VERSION:3");
        playlist.AppendLine("#EXT-X-STREAM-INF:BANDWIDTH=0");

        foreach (var quality in qualities)
        {
            playlist.AppendLine($"#EXT-X-STREAM-INF:BANDWIDTH={quality.Bitrate * 1000},RESOLUTION={GetResolution(quality.Height)}");
            playlist.AppendLine(quality.HlsUrl);
        }

        return Content(playlist.ToString(), "application/vnd.apple.mpegurl");
    }

    /// <summary>
    /// Cập nhật quality preference của user
    /// </summary>
    [HttpPost("user-preference")]
    public IActionResult SetUserQualityPreference([FromBody] UserQualityPreferenceDTO dto)
    {
        // Store in localStorage on client side, or could store in database
        // This is a simple endpoint for setting user preference
        return Ok(new { message = "Quality preference updated", quality = dto.PreferredQuality });
    }

    private string GetResolution(int height)
    {
        return height switch
        {
            2160 => "3840x2160",
            1440 => "2560x1440",
            1080 => "1920x1080",
            720 => "1280x720",
            480 => "854x480",
            360 => "640x360",
            240 => "426x240",
            _ => "1920x1080"
        };
    }
}

public class QualityProfile
{
    public string Label { get; set; } = null!;
    public int Height { get; set; }
    public int Bitrate { get; set; }
}

public class SetQualityDTO
{
    public string QualityLabel { get; set; } = null!;
    public string HlsUrl { get; set; } = null!;
}

public class UserQualityPreferenceDTO
{
    public string PreferredQuality { get; set; } = "auto"; // auto, 1080p, 720p, 480p, etc.
}

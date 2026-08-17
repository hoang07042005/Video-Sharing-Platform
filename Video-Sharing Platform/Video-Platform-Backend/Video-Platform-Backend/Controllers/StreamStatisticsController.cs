using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StreamStatisticsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public StreamStatisticsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("livestream/{livestreamId}/stats")]
    public async Task<IActionResult> GetLivestreamStats(Guid livestreamId, int minutes = 60)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null) return NotFound();

        var startTime = DateTime.UtcNow.AddMinutes(-minutes);
        var stats = await _db.StreamStatistics
            .Where(s => s.LivestreamId == livestreamId && s.RecordedAt >= startTime)
            .OrderBy(s => s.RecordedAt)
            .ToListAsync();

        var peakViewers = stats.MaxBy(s => s.ViewerCount)?.ViewerCount ?? 0;
        var avgViewers = stats.Count > 0 ? (int)stats.Average(s => s.ViewerCount) : 0;
        var currentViewers = livestream.CurrentViewers ?? 0;

        return Ok(new
        {
            livestreamId,
            currentViewers,
            peakViewers,
            avgViewers,
            totalStats = stats.Count,
            stats = stats.Select(s => new
            {
                recordedAt = s.RecordedAt,
                viewerCount = s.ViewerCount
            })
        });
    }

    [HttpPost("livestream/{livestreamId}/record-stat")]
    public async Task<IActionResult> RecordStat(Guid livestreamId, [FromBody] RecordStatDTO dto)
    {
        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null) return NotFound();

        var stat = new StreamStatistic
        {
            Id = Guid.NewGuid(),
            LivestreamId = livestreamId,
            ViewerCount = dto.ViewerCount,
            RecordedAt = DateTime.UtcNow
        };

        _db.StreamStatistics.Add(stat);
        await _db.SaveChangesAsync();

        return Ok(stat);
    }
}

public class RecordStatDTO
{
    public int ViewerCount { get; set; }
}

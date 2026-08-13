using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xabe.FFmpeg;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Services;

public class VideoProcessingService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<VideoProcessingService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public VideoProcessingService(IWebHostEnvironment environment, ILogger<VideoProcessingService> logger, IServiceScopeFactory scopeFactory)
    {
        _environment = environment;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task ProcessVideoResolutionsAsync(Guid videoId, string originalFilePath, string originalFileName, string baseUrl)
    {
        try
        {
            _logger.LogInformation($"Starting background transcoding for video {videoId}");
            
            // Setup FFmpeg
            var ffmpegPath = Path.Combine(_environment.ContentRootPath, "ffmpeg");
            if (!Directory.Exists(ffmpegPath))
            {
                Directory.CreateDirectory(ffmpegPath);
            }
            FFmpeg.SetExecutablesPath(ffmpegPath);
            
            if (!File.Exists(Path.Combine(ffmpegPath, "ffmpeg.exe")))
            {
                _logger.LogInformation("Downloading FFmpeg...");
                await Xabe.FFmpeg.Downloader.FFmpegDownloader.GetLatestVersion(Xabe.FFmpeg.Downloader.FFmpegVersion.Official, ffmpegPath);
                _logger.LogInformation("FFmpeg downloaded successfully.");
            }

            var mediaInfo = await FFmpeg.GetMediaInfo(originalFilePath);
            var videoStream = mediaInfo.VideoStreams.FirstOrDefault();

            if (videoStream == null)
            {
                _logger.LogWarning($"No video stream found for {originalFilePath}");
                return;
            }

            int originalWidth = videoStream.Width;
            int originalHeight = videoStream.Height;
            _logger.LogInformation($"Original video resolution: {originalWidth}x{originalHeight}");

            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "videos");

            // Define target resolutions
            var targetResolutions = new[]
            {
                new { Name = "1080p", Height = 1080, Width = 1920, Bitrate = 4000 },
                new { Name = "720p", Height = 720, Width = 1280, Bitrate = 2500 },
                new { Name = "480p", Height = 480, Width = 854, Bitrate = 1000 }
            };

            bool anyGenerated = false;

            foreach (var target in targetResolutions)
            {
                // Only upscale if the original is very close, generally we only downscale
                if (originalHeight >= target.Height * 0.9)
                {
                    _logger.LogInformation($"Transcoding to {target.Name}...");
                    var outputFileName = $"{Path.GetFileNameWithoutExtension(originalFileName)}_{target.Name}.mp4";
                    var outputFilePath = Path.Combine(uploadsFolder, outputFileName);
                    var fileUrl = $"{baseUrl}/uploads/videos/{outputFileName}";

                    var conversion = FFmpeg.Conversions.New()
                        .AddStream(videoStream)
                        .AddStream(mediaInfo.AudioStreams.ToArray())
                        .SetOutput(outputFilePath)
                        .SetVideoBitrate(target.Bitrate * 1000)
                        .AddParameter($"-s {target.Width}x{target.Height}");

                    await conversion.Start();

                    // Save to database
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        context.VideoResolutions.Add(new VideoResolution
                        {
                            Id = Guid.NewGuid(),
                            VideoId = videoId,
                            Resolution = target.Name,
                            FileUrl = fileUrl,
                            Width = target.Width,
                            Height = target.Height,
                            Bitrate = target.Bitrate,
                            CreatedAt = DateTime.UtcNow
                        });
                        await context.SaveChangesAsync();
                        anyGenerated = true;
                    }
                    _logger.LogInformation($"Successfully created {target.Name} version.");
                }
            }

            // If the video is too small and no targets were generated, save the original as a resolution
            if (!anyGenerated)
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var fileUrl = $"{baseUrl}/uploads/videos/{originalFileName}";
                    
                    context.VideoResolutions.Add(new VideoResolution
                    {
                        Id = Guid.NewGuid(),
                        VideoId = videoId,
                        Resolution = $"{originalHeight}p (Gốc)",
                        FileUrl = fileUrl,
                        Width = originalWidth,
                        Height = originalHeight,
                        Bitrate = (int)(videoStream.Bitrate / 1000),
                        CreatedAt = DateTime.UtcNow
                    });
                    await context.SaveChangesAsync();
                }
                _logger.LogInformation($"Saved original resolution ({originalHeight}p) as fallback.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing video resolutions for {videoId}");
        }
    }
}

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.IO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Services;

public class VideoRecordingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VideoRecordingBackgroundService> _logger;
    private readonly IConfiguration _configuration;
    private readonly Dictionary<Guid, string> _activeRecordings = new();

    public VideoRecordingBackgroundService(IServiceProvider serviceProvider, ILogger<VideoRecordingBackgroundService> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Video Recording Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndRecordLivestreamsAsync(stoppingToken);
                await Task.Delay(5000, stoppingToken); // Check every 5 seconds
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in video recording background service: {ex.Message}");
            }
        }

        _logger.LogInformation("Video Recording Background Service stopped");
    }

    private async Task CheckAndRecordLivestreamsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recordingService = scope.ServiceProvider.GetRequiredService<IVideoRecordingService>();

        // Get VOD storage path from configuration
        var vodStoragePath = _configuration["VodStoragePath"] ?? Path.Combine(AppContext.BaseDirectory, "vod");
        if (!Directory.Exists(vodStoragePath))
        {
            Directory.CreateDirectory(vodStoragePath);
        }

        // Find all active livestreams
        var liveStreams = db.Livestreams
            .Where(l => l.Status == "live" && !string.IsNullOrEmpty(l.HlsUrl))
            .ToList();

        foreach (var livestream in liveStreams)
        {
            if (!_activeRecordings.ContainsKey(livestream.Id))
            {
                _logger.LogInformation($"Starting recording for livestream: {livestream.Id} - {livestream.Title}");
                
                var recordingPath = await recordingService.StartRecordingAsync(
                    livestream.Id.ToString(),
                    livestream.HlsUrl,
                    vodStoragePath
                );

                if (!string.IsNullOrEmpty(recordingPath))
                {
                    _activeRecordings[livestream.Id] = recordingPath;
                }
            }
        }

        // Check for ended livestreams that need to stop recording
        var activeIds = _activeRecordings.Keys.ToList();
        foreach (var livestreamId in activeIds)
        {
            var livestream = db.Livestreams.Find(livestreamId);
            if (livestream == null || livestream.Status != "live")
            {
                _logger.LogInformation($"Stopping recording for livestream: {livestreamId}");
                
                await recordingService.StopRecordingAsync(livestreamId.ToString());
                
                // Update livestream with VOD URL
                if (livestream != null && _activeRecordings.TryGetValue(livestreamId, out var vodPath))
                {
                    livestream.VodUrl = $"/vod/{Path.GetFileName(vodPath)}";
                    db.Livestreams.Update(livestream);
                    await db.SaveChangesAsync(CancellationToken.None);
                    _logger.LogInformation($"Updated livestream VOD URL: {livestream.VodUrl}");
                }

                _activeRecordings.Remove(livestreamId);
            }
        }
    }
}

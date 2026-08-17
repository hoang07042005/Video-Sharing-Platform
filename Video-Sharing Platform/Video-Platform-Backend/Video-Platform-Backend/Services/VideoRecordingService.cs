using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Video_Platform_Backend.Services;

public interface IVideoRecordingService
{
    Task<string> StartRecordingAsync(string livestreamId, string hlsUrl, string outputPath);
    Task<bool> StopRecordingAsync(string livestreamId);
    Task<string> GetRecordingPathAsync(string livestreamId);
}

public class VideoRecordingService : IVideoRecordingService
{
    private readonly ILogger<VideoRecordingService> _logger;
    private readonly Dictionary<string, Process> _recordingProcesses = new();
    private readonly string _vodStoragePath;

    public VideoRecordingService(ILogger<VideoRecordingService> logger, IConfiguration config)
    {
        _logger = logger;
        _vodStoragePath = config["VodStoragePath"] ?? Path.Combine(AppContext.BaseDirectory, "vod");
        
        // Ensure VOD directory exists
        if (!Directory.Exists(_vodStoragePath))
        {
            Directory.CreateDirectory(_vodStoragePath);
            _logger.LogInformation($"Created VOD storage directory: {_vodStoragePath}");
        }
    }

    public async Task<string> StartRecordingAsync(string livestreamId, string hlsUrl, string outputPath = "")
    {
        try
        {
            if (_recordingProcesses.ContainsKey(livestreamId))
            {
                _logger.LogWarning($"Recording already in progress for livestream: {livestreamId}");
                return null;
            }

            var fileName = $"{livestreamId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.mp4";
            var outputFilePath = string.IsNullOrEmpty(outputPath) 
                ? Path.Combine(_vodStoragePath, fileName)
                : Path.Combine(outputPath, fileName);

            var processInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-i \"{hlsUrl}\" -c copy -bsf:a aac_adtstoasc \"{outputFilePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var process = Process.Start(processInfo);
            if (process != null)
            {
                _recordingProcesses[livestreamId] = process;
                _logger.LogInformation($"Started recording for livestream: {livestreamId} -> {outputFilePath}");
                
                // Handle process exit
                _ = Task.Run(async () =>
                {
                    await process.WaitForExitAsync();
                    _recordingProcesses.Remove(livestreamId);
                    _logger.LogInformation($"Recording completed for livestream: {livestreamId}");
                });

                return outputFilePath;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error starting recording for livestream {livestreamId}: {ex.Message}");
        }

        return null;
    }

    public async Task<bool> StopRecordingAsync(string livestreamId)
    {
        try
        {
            if (_recordingProcesses.TryGetValue(livestreamId, out var process))
            {
                if (!process.HasExited)
                {
                    process.StandardInput.WriteLine("q");
                    await Task.Delay(2000); // Wait for graceful shutdown
                    
                    if (!process.HasExited)
                    {
                        process.Kill();
                    }
                }

                _recordingProcesses.Remove(livestreamId);
                _logger.LogInformation($"Stopped recording for livestream: {livestreamId}");
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error stopping recording for livestream {livestreamId}: {ex.Message}");
        }

        return false;
    }

    public Task<string> GetRecordingPathAsync(string livestreamId)
    {
        // Look for most recent file for this livestream
        var files = Directory.GetFiles(_vodStoragePath, $"{livestreamId}_*.mp4")
            .OrderByDescending(f => new FileInfo(f).CreationTime)
            .FirstOrDefault();

        return Task.FromResult(files ?? string.Empty);
    }
}

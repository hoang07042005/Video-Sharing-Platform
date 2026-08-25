using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Text.Json;

namespace Video_Platform_Backend.Services
{
    public class RevenueCalculationBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RevenueCalculationBackgroundService> _logger;

        // Tỉ lệ quy đổi (Ví dụ: 10 VNĐ cho mỗi lượt xem)
        private const decimal REVENUE_PER_VIEW = 10m;

        public RevenueCalculationBackgroundService(IServiceProvider serviceProvider, ILogger<RevenueCalculationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CalculateDailyRevenueAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tính doanh thu lượt xem.");
                }

                // Chạy mỗi ngày một lần (hoặc có thể test nhanh bằng cách dùng TimeSpan.FromHours(1))
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task CalculateDailyRevenueAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            // 1. Lấy danh sách kênh đã được bật kiếm tiền
            var monetizedChannels = await context.Channels
                .Where(c => c.IsMonetized)
                .ToListAsync();

            if (!monetizedChannels.Any()) return;

            foreach (var channel in monetizedChannels)
            {
                // 2. Lấy tất cả lượt xem CỦA HÔM QUA cho các video của kênh này
                // (Chỉ tính view từ hôm qua để chốt sổ 1 ngày, hoặc tùy logic)
                var yesterdayViews = await context.Views
                    .Include(v => v.Video)
                    .Where(v => v.Video.ChannelId == channel.Id && v.ViewedAt >= yesterday && v.ViewedAt < today)
                    .GroupBy(v => v.VideoId)
                    .Select(g => new
                    {
                        VideoId = g.Key,
                        ViewsCount = g.Count()
                    })
                    .ToListAsync();

                foreach (var videoStat in yesterdayViews)
                {
                    if (videoStat.ViewsCount == 0) continue;

                    // 3. Tính tiền
                    decimal earned = videoStat.ViewsCount * REVENUE_PER_VIEW;

                    // 4. Lưu vào bảng DailyVideoEarnings
                    var dailyEarning = new DailyVideoEarnings
                    {
                        VideoId = videoStat.VideoId,
                        Date = yesterday,
                        ViewsCount = videoStat.ViewsCount,
                        EarnedAmount = earned
                    };
                    context.DailyVideoEarnings.Add(dailyEarning);

                    // Doanh thu đã được lưu vào bảng DailyVideoEarnings.
                    // Khi Streamer rút tiền (WithdrawalController), chúng ta sẽ Sum(EarnedAmount) từ bảng này.
                }
            }

            await context.SaveChangesAsync();
            _logger.LogInformation($"Đã tính toán xong doanh thu lượt xem cho ngày {yesterday:dd/MM/yyyy}");
        }
    }
}

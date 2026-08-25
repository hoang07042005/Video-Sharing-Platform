using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Services;

public class SubscriptionExpirationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionExpirationBackgroundService> _logger;

    public SubscriptionExpirationBackgroundService(IServiceProvider serviceProvider, ILogger<SubscriptionExpirationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Subscription Expiration Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpirationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in Subscription Expiration Background Service.");
            }

            // Run every 1 hour
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task ProcessExpirationsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;

        // 1. Process expired Premium plans
        var expiredPremiumUsers = await context.Users
            .Where(u => u.IsPremium == true && u.PremiumUntil.HasValue && u.PremiumUntil.Value < now)
            .ToListAsync(stoppingToken);

        foreach (var user in expiredPremiumUsers)
        {
            user.IsPremium = false;
            user.CurrentPlan = "Free";
            
            await notificationService.SendNotificationAsync(
                userId: user.Id,
                title: "Gói nâng cấp hết hạn",
                message: "Gói nâng cấp tài khoản của bạn đã hết hạn và tài khoản đã được chuyển về gói Miễn phí.",
                type: "system",
                actionUrl: "/premium"
            );
            
            _logger.LogInformation($"User {user.Email} premium plan expired.");
        }

        // 2. Process expired Channel Memberships
        var expiredSubscriptions = await context.Subscriptions
            .Include(s => s.Channel)
            .Where(s => s.Status == "Active" && s.EndDate.HasValue && s.EndDate.Value < now)
            .ToListAsync(stoppingToken);

        foreach (var sub in expiredSubscriptions)
        {
            sub.Status = "Expired";

            var channelName = sub.Channel?.ChannelName ?? "Kênh";

            await notificationService.SendNotificationAsync(
                userId: sub.SubscriberId,
                title: "Hội viên kênh hết hạn",
                message: $"Gói hội viên của bạn tại {channelName} đã hết hạn.",
                type: "system",
                actionUrl: $"/channel/{sub.ChannelId}"
            );

            _logger.LogInformation($"Subscription for user {sub.SubscriberId} to channel {sub.ChannelId} expired.");
        }

        if (expiredPremiumUsers.Any() || expiredSubscriptions.Any())
        {
            await context.SaveChangesAsync(stoppingToken);
        }
    }
}

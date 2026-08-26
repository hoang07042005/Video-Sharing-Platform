using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Security.Claims;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/monetization")]
    [ApiController]
    [Authorize]
    public class MonetizationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MonetizationController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User ID not found in token.");
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var userId = GetUserId();
                var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
                if (channel == null) return NotFound("Chưa có kênh.");

                // Đếm Subs
                var subCount = await _context.Subscriptions.CountAsync(s => s.ChannelId == channel.Id && s.Status == "Active");

                // Đếm giờ xem trong 365 ngày qua (query thẳng DB, không load lên RAM)
                var oneYearAgo = DateTime.UtcNow.AddYears(-1);
                var viewCount = await _context.Views
                    .Where(v => v.Video.ChannelId == channel.Id
                             && v.Video.Visibility == "public"
                             && v.ViewedAt >= oneYearAgo)
                    .CountAsync();

                // Ước lượng mỗi view = 2 phút
                long watchHours = (long)viewCount * 2 / 60;

                // Kiểm tra xem đã có đơn đăng ký chưa
                var application = await _context.MonetizationApplications
                    .OrderByDescending(a => a.AppliedAt)
                    .FirstOrDefaultAsync(a => a.ChannelId == channel.Id);

                // Check eligibility
                bool isEligible = subCount >= 1000 && watchHours >= 4000;

                return Ok(new
                {
                    IsMonetized = channel.IsMonetized,
                    MonetizationStatus = channel.MonetizationStatus,
                    CurrentStats = new {
                        Subscribers = subCount,
                        WatchHours = watchHours
                    },
                    Requirements = new {
                        Subscribers = 1000,
                        WatchHours = 4000
                    },
                    IsEligible = isEligible,
                    Application = application
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyForMonetization()
        {
            try
            {
                var userId = GetUserId();
                var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
                if (channel == null) return NotFound("Chưa có kênh.");

                if (channel.MonetizationStatus == "Approved" || channel.IsMonetized)
                {
                    return BadRequest(new { message = "Kênh đã được bật kiếm tiền." });
                }

                if (channel.MonetizationStatus == "Pending")
                {
                    return BadRequest(new { message = "Đơn đăng ký của bạn đang được duyệt." });
                }

                // Lưu đơn đăng ký
                var application = new MonetizationApplication
                {
                    ChannelId = channel.Id,
                    AppliedAt = DateTime.UtcNow,
                    Status = "Pending"
                };

                channel.MonetizationStatus = "Pending";

                _context.MonetizationApplications.Add(application);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đăng ký thành công. Vui lòng chờ xét duyệt." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("earnings")]
        public async Task<IActionResult> GetEarnings()
        {
            try
            {
                var userId = GetUserId();
                var channel = await _context.Channels.FirstOrDefaultAsync(c => c.UserId == userId);
                if (channel == null) return NotFound("Chưa có kênh.");

                // Tổng doanh thu
                var totalEarnings = await _context.DailyVideoEarnings
                    .Where(e => e.Video.ChannelId == channel.Id)
                    .SumAsync(e => (decimal?)e.EarnedAmount) ?? 0;

                // Doanh thu tháng này
                var firstOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var thisMonthEarnings = await _context.DailyVideoEarnings
                    .Where(e => e.Video.ChannelId == channel.Id && e.Date >= firstOfMonth)
                    .SumAsync(e => (decimal?)e.EarnedAmount) ?? 0;

                // Doanh thu 30 ngày qua
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var last30DaysEarnings = await _context.DailyVideoEarnings
                    .Where(e => e.Video.ChannelId == channel.Id && e.Date >= thirtyDaysAgo)
                    .SumAsync(e => (decimal?)e.EarnedAmount) ?? 0;

                // Top 5 video kiếm nhiều nhất
                var topVideos = await _context.DailyVideoEarnings
                    .Where(e => e.Video.ChannelId == channel.Id)
                    .GroupBy(e => new { e.VideoId, e.Video.Title, e.Video.ViewsCount })
                    .Select(g => new
                    {
                        VideoId = g.Key.VideoId,
                        Title = g.Key.Title,
                        TotalViews = g.Key.ViewsCount,
                        TotalEarned = g.Sum(e => e.EarnedAmount),
                        LastEarned = g.Max(e => e.Date)
                    })
                    .OrderByDescending(v => v.TotalEarned)
                    .Take(5)
                    .ToListAsync();

                // Gắn thumbnail từ VideoThumbnails
                var topVideoIds = topVideos.Select(v => v.VideoId).ToList();
                var thumbnails = await _context.VideoThumbnails
                    .Where(t => topVideoIds.Contains(t.VideoId))
                    .GroupBy(t => t.VideoId)
                    .Select(g => new { VideoId = g.Key, Url = g.FirstOrDefault()!.ThumbnailUrl })
                    .ToListAsync();

                var topVideosWithThumbnails = topVideos.Select(v => new
                {
                    v.VideoId,
                    v.Title,
                    Thumbnail = thumbnails.FirstOrDefault(t => t.VideoId == v.VideoId)?.Url,
                    v.TotalViews,
                    v.TotalEarned,
                    v.LastEarned
                }).ToList();

                // Doanh thu 7 ngày gần nhất (cho chart)
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var dailyChart = await _context.DailyVideoEarnings
                    .Where(e => e.Video.ChannelId == channel.Id && e.Date >= sevenDaysAgo)
                    .GroupBy(e => e.Date.Date)
                    .Select(g => new { Date = g.Key, Amount = g.Sum(e => e.EarnedAmount) })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                // Calculate Available Balance
                var totalGiftedCoins = await _context.Donations
                    .Include(d => d.Livestream)
                    .ThenInclude(l => l.Channel)
                    .Where(d => d.Livestream != null && d.Livestream.Channel != null && d.Livestream.Channel.UserId == userId && d.Status == "completed" && d.Currency == "Xu")
                    .SumAsync(d => d.Amount);

                var totalDonatedMoney = await _context.Donations
                    .Include(d => d.Livestream)
                    .ThenInclude(l => l.Channel)
                    .Where(d => d.Livestream != null && d.Livestream.Channel != null && d.Livestream.Channel.UserId == userId && d.Status == "completed" && d.Currency != "Xu")
                    .SumAsync(d => d.Amount);

                var totalMembershipRevenue = await _context.Transactions
                    .Include(t => t.Payment)
                    .Where(t => t.TargetChannelId == channel.Id && t.TransactionType != null && t.TransactionType.StartsWith("ChannelMembership") && t.Payment != null && (t.Payment.Status == "Completed" || t.Payment.Status == "Success"))
                    .SumAsync(t => t.Amount);

                var totalWithdrawnCoins = await _context.WithdrawalRequests
                    .Where(w => w.UserId == userId && w.Status != "Rejected")
                    .SumAsync(w => w.Coins);

                decimal feeCoinGift = 0.30m;
                decimal feeDonate = 0.10m;
                decimal feeMembership = 0.30m;
                decimal feeVideo = 0.30m;

                var virtualBalanceCoins = 
                    (int)((decimal)totalGiftedCoins * (1m - feeCoinGift)) + 
                    (int)((totalDonatedMoney / 100m) * (1m - feeDonate)) + 
                    (int)((totalMembershipRevenue / 100m) * (1m - feeMembership)) +
                    (int)((totalEarnings / 100m) * (1m - feeVideo));

                var remainingVirtualBalance = virtualBalanceCoins - totalWithdrawnCoins;
                if (remainingVirtualBalance < 0) remainingVirtualBalance = 0;

                var availableBalanceVnd = remainingVirtualBalance * 100m;

                return Ok(new
                {
                    TotalEarnings = totalEarnings,
                    ThisMonthEarnings = thisMonthEarnings,
                    Last30DaysEarnings = last30DaysEarnings,
                    AvailableBalanceVnd = availableBalanceVnd,
                    TopVideos = topVideosWithThumbnails,
                    DailyChart = dailyChart
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

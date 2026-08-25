using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/revenue")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminRevenueController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminRevenueController(ApplicationDbContext context)
        {
            _context = context;
        }

        private class BreakdownDataModel
        {
            public int OwnCoins { get; set; }
            public decimal OwnCoinsVND { get; set; }
            public decimal GiftVND { get; set; }
            public decimal DonateVND { get; set; }
            public decimal MembershipVND { get; set; }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetRevenueStats()
        {
            try
            {
                var withdrawals = await _context.WithdrawalRequests
                    .Include(w => w.User)
                    .ThenInclude(u => u.Profile)
                    .Where(w => w.Status == "Completed")
                    .OrderBy(w => w.CreatedAt)
                    .ToListAsync();

                decimal totalRevenue = 0;
                decimal currentMonthRevenue = 0;
                decimal lastMonthRevenue = 0;

                decimal totalGiftFee = 0;
                decimal totalDonateFee = 0;
                decimal totalMembershipFee = 0;
                decimal totalOwnCoinsFee = 0;
                decimal totalPremiumFee = 0;

                var now = DateTime.UtcNow;
                var currentMonthStart = new DateTime(now.Year, now.Month, 1);
                var lastMonthStart = currentMonthStart.AddMonths(-1);

                var history = new List<object>();
                var dailyRevenueDict = new Dictionary<string, decimal>();

                // Initialize last 30 days
                for (int i = 29; i >= 0; i--)
                {
                    dailyRevenueDict[now.AddDays(-i).ToString("yyyy-MM-dd")] = 0;
                }

                foreach (var w in withdrawals)
                {
                    decimal wGiftFee = 0;
                    decimal wDonateFee = 0;
                    decimal wMembershipFee = 0;
                    decimal wOwnCoinsFee = 0;
                    decimal wTotalFee = 0;
                    decimal wGrossAmount = 0;

                    if (!string.IsNullOrEmpty(w.BreakdownData))
                    {
                        try
                        {
                            var bd = JsonSerializer.Deserialize<BreakdownDataModel>(w.BreakdownData);
                            if (bd != null)
                            {
                                // Constants from WithdrawalController
                                // feeCoinGift = 0.30m => Received = Gross * 0.7 => Fee = Received / 0.7 * 0.3 = Received * 3/7
                                wGiftFee = bd.GiftVND * 3m / 7m;
                                
                                // feeDonate = 0.10m => Received = Gross * 0.9 => Fee = Received / 0.9 * 0.1 = Received * 1/9
                                wDonateFee = bd.DonateVND * 1m / 9m;
                                
                                // feeMembership = 0.30m => Received = Gross * 0.7 => Fee = Received / 0.7 * 0.3 = Received * 3/7
                                wMembershipFee = bd.MembershipVND * 3m / 7m;
                                
                                // feeCoinOwn = 0.05m. Value = OwnCoins * 100. Received = OwnCoinsVND. Fee = Value - Received
                                wOwnCoinsFee = (bd.OwnCoins * 100m) - bd.OwnCoinsVND;

                                wTotalFee = wGiftFee + wDonateFee + wMembershipFee + wOwnCoinsFee;
                                wGrossAmount = bd.GiftVND + wGiftFee + bd.DonateVND + wDonateFee + bd.MembershipVND + wMembershipFee + bd.OwnCoinsVND + wOwnCoinsFee;
                            }
                        }
                        catch { }
                    }

                    totalRevenue += wTotalFee;
                    totalGiftFee += wGiftFee;
                    totalDonateFee += wDonateFee;
                    totalMembershipFee += wMembershipFee;
                    totalOwnCoinsFee += wOwnCoinsFee;

                    var transactionTime = w.UpdatedAt ?? w.CreatedAt;

                    if (transactionTime >= currentMonthStart)
                    {
                        currentMonthRevenue += wTotalFee;
                    }
                    else if (transactionTime >= lastMonthStart && transactionTime < currentMonthStart)
                    {
                        lastMonthRevenue += wTotalFee;
                    }

                    string dayKey = transactionTime.ToString("yyyy-MM-dd");
                    if (dailyRevenueDict.ContainsKey(dayKey))
                    {
                        dailyRevenueDict[dayKey] += wTotalFee;
                    }

                    string mainSource = "Khác";
                    decimal maxFee = Math.Max(Math.Max(wGiftFee, wDonateFee), Math.Max(wMembershipFee, wOwnCoinsFee));
                    if (maxFee > 0)
                    {
                        if (maxFee == wGiftFee) mainSource = "Quà tặng";
                        else if (maxFee == wDonateFee) mainSource = "Donate";
                        else if (maxFee == wMembershipFee) mainSource = "Hội viên";
                        else if (maxFee == wOwnCoinsFee) mainSource = "Nạp Xu";
                    }

                    // Chỉ hiển thị trong lịch sử nếu có phát sinh phí hoặc có breakdown data
                    if (wTotalFee > 0 || !string.IsNullOrEmpty(w.BreakdownData))
                    {
                        history.Add(new
                        {
                            Id = w.Id,
                            CreatedAt = transactionTime,
                            StreamerName = w.User?.Profile?.FullName ?? "Unknown",
                            StreamerEmail = w.User?.Email ?? "Unknown",
                            StreamerAvatar = w.User?.Profile?.AvatarUrl,
                            AmountReceived = w.AmountFiat,
                            PlatformFee = wTotalFee,
                            GrossAmount = wGrossAmount,
                            MainSource = mainSource
                        });
                    }
                }

                var premiumUpgrades = await _context.Transactions
                    .Include(t => t.Payment).ThenInclude(p => p.User).ThenInclude(u => u.Profile)
                    .Where(t => t.TransactionType != null && t.TransactionType.StartsWith("PremiumUpgrade_") && 
                               (t.Payment.Status == "Completed" || t.Payment.Status == "Success"))
                    .ToListAsync();

                foreach (var pu in premiumUpgrades)
                {
                    decimal puFee = pu.Amount;
                    if (puFee <= 0) continue;

                    totalRevenue += puFee;
                    totalPremiumFee += puFee;

                    var transactionTime = pu.CreatedAt ?? DateTime.UtcNow;

                    if (transactionTime >= currentMonthStart)
                    {
                        currentMonthRevenue += puFee;
                    }
                    else if (transactionTime >= lastMonthStart && transactionTime < currentMonthStart)
                    {
                        lastMonthRevenue += puFee;
                    }

                    string dayKey = transactionTime.ToString("yyyy-MM-dd");
                    if (dailyRevenueDict.ContainsKey(dayKey))
                    {
                        dailyRevenueDict[dayKey] += puFee;
                    }

                        string plan = "PREMIUM";
                        string cycle = "Tháng";
                        if (!string.IsNullOrEmpty(pu.TransactionType))
                        {
                            var parts = pu.TransactionType.Split('_');
                            if (parts.Length > 1) plan = parts[1].ToUpper();
                            if (parts.Length > 2) cycle = parts[2] == "Monthly" ? "Tháng" : "Năm";
                        }
                        
                        history.Add(new
                        {
                            Id = pu.Id,
                            CreatedAt = transactionTime,
                            StreamerName = pu.Payment?.User?.Profile?.FullName ?? pu.Payment?.User?.Email ?? "Unknown",
                            StreamerEmail = pu.Payment?.User?.Email ?? "Unknown",
                            StreamerAvatar = pu.Payment?.User?.Profile?.AvatarUrl,
                            AmountReceived = 0m,
                            PlatformFee = puFee,
                            GrossAmount = puFee,
                            MainSource = $"Gói {plan} - {cycle}"
                        });
                }

                // Sort history by date descending
                history = history.OrderByDescending(h => ((dynamic)h).CreatedAt).ToList();

                var chartData = dailyRevenueDict.Select(kv => new
                {
                    date = kv.Key,
                    revenue = kv.Value
                }).ToList();

                var breakdownChart = new List<object>
                {
                    new { name = "Từ Quà tặng", value = totalGiftFee },
                    new { name = "Từ Donate", value = totalDonateFee },
                    new { name = "Từ Hội viên kênh", value = totalMembershipFee },
                    new { name = "Từ Xu cá nhân", value = totalOwnCoinsFee },
                    new { name = "Từ Gói nâng cấp", value = totalPremiumFee }
                };

                decimal percentChange = 0;
                if (lastMonthRevenue > 0)
                {
                    percentChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
                }
                else if (currentMonthRevenue > 0)
                {
                    percentChange = 100; // 100% increase if last month was 0
                }

                return Ok(new
                {
                    stats = new
                    {
                        totalRevenue,
                        currentMonthRevenue,
                        percentChange,
                        totalWithdrawals = withdrawals.Count,
                        averageRevenuePerWithdrawal = withdrawals.Count > 0 ? totalRevenue / withdrawals.Count : 0
                    },
                    chartData,
                    breakdownChart,
                    history
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi xử lý doanh thu.", error = ex.Message });
            }
        }
    }
}

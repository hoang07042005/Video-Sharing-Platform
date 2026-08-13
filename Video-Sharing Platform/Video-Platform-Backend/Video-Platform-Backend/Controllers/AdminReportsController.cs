using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Video_Platform_Backend.DTOs;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/reports")]
    [ApiController]
    [Authorize] // Assuming we have global policy or role checks in place, or Add Roles="Admin"
    public class AdminReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/reports/stats
        [HttpGet("stats")]
        public async Task<ActionResult<AdminReportStatsDTO>> GetReportStats()
        {
            var now = DateTime.UtcNow;
            var oneWeekAgo = now.AddDays(-7);
            var twoWeeksAgo = now.AddDays(-14);

            // Fetch reports
            var allReports = await _context.Reports.ToListAsync();

            // Stats calculation
            var stats = new AdminReportStatsDTO();
            
            // Total Reports
            stats.TotalReports = allReports.Count;
            var totalThisWeek = allReports.Count(r => r.CreatedAt >= oneWeekAgo);
            var totalLastWeek = allReports.Count(r => r.CreatedAt >= twoWeeksAgo && r.CreatedAt < oneWeekAgo);
            stats.TotalReportsTrend = CalculateTrend(totalThisWeek, totalLastWeek);
            
            // Pending Reports
            var pendingReports = allReports.Where(r => r.Status == "Pending" || r.Status == "Chờ xử lý").ToList();
            stats.PendingReports = pendingReports.Count;
            var pendingThisWeek = pendingReports.Count(r => r.CreatedAt >= oneWeekAgo);
            var pendingLastWeek = pendingReports.Count(r => r.CreatedAt >= twoWeeksAgo && r.CreatedAt < oneWeekAgo);
            stats.PendingReportsTrend = CalculateTrend(pendingThisWeek, pendingLastWeek);

            // Copyright Reports
            var copyrightReports = allReports.Where(r => r.Reason != null && r.Reason.Contains("Bản quyền", StringComparison.OrdinalIgnoreCase)).ToList();
            stats.CopyrightReports = copyrightReports.Count;
            var copyrightThisWeek = copyrightReports.Count(r => r.CreatedAt >= oneWeekAgo);
            var copyrightLastWeek = copyrightReports.Count(r => r.CreatedAt >= twoWeeksAgo && r.CreatedAt < oneWeekAgo);
            stats.CopyrightReportsTrend = CalculateTrend(copyrightThisWeek, copyrightLastWeek);

            // Resolved this week
            var resolvedReports = allReports.Where(r => r.Status == "Resolved" || r.Status == "Đã giải quyết").ToList();
            stats.ResolvedThisWeek = resolvedReports.Count(r => r.CreatedAt >= oneWeekAgo);
            var resolvedLastWeek = resolvedReports.Count(r => r.CreatedAt >= twoWeeksAgo && r.CreatedAt < oneWeekAgo);
            stats.ResolvedThisWeekTrend = CalculateTrend(stats.ResolvedThisWeek, resolvedLastWeek);

            // Priorities (Mock mapping for now)
            stats.SeverePriority = allReports.Count(r => GetPriority(r.Reason) == "Nghiêm trọng");
            stats.WarningPriority = allReports.Count(r => GetPriority(r.Reason) == "Cảnh báo");
            stats.ReviewPriority = allReports.Count(r => GetPriority(r.Reason) == "Kiểm tra lại");

            // Mock sparkline data (To simplify, just returning random values for the chart shape)
            var random = new Random();
            stats.TotalReportsSparkline = GenerateSparkline(random);
            stats.PendingReportsSparkline = GenerateSparkline(random);
            stats.CopyrightReportsSparkline = GenerateSparkline(random);
            stats.ResolvedThisWeekSparkline = GenerateSparkline(random);

            // Timeline Data (Last 7 days)
            for (int i = 6; i >= 0; i--)
            {
                var date = now.AddDays(-i).Date;
                var dailyReports = allReports.Where(r => r.CreatedAt?.Date == date).ToList();
                stats.TimelineData.Add(new TimelineData
                {
                    Date = date.ToString("dd/MM"),
                    Spam = dailyReports.Count(r => r.Reason != null && r.Reason.Contains("Spam", StringComparison.OrdinalIgnoreCase)),
                    Copyright = dailyReports.Count(r => r.Reason != null && r.Reason.Contains("Bản quyền", StringComparison.OrdinalIgnoreCase)),
                    Inappropriate = dailyReports.Count(r => r.Reason != null && !r.Reason.Contains("Spam") && !r.Reason.Contains("Bản quyền"))
                });
            }

            return Ok(stats);
        }

        // GET: api/admin/reports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminReportDTO>>> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var reportsQuery = _context.Reports
                .Include(r => r.Reporter)
                    .ThenInclude(u => u.Profile)
                .OrderByDescending(r => r.CreatedAt);

            var reports = await reportsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = reports.Select(r => new AdminReportDTO
            {
                Id = "#BC-" + r.Id.ToString().Substring(0, 4).ToUpper(),
                User = r.Reporter?.Profile?.FullName ?? r.Reporter?.Email ?? "Unknown",
                Avatar = r.Reporter?.Profile?.AvatarUrl ?? r.Reporter?.Profile?.FullName?.Substring(0, 1).ToUpper() ?? "U",
                Reason = r.Reason ?? "Không rõ",
                Description = r.Description,
                Time = GetRelativeTime(r.CreatedAt),
                Priority = GetPriority(r.Reason),
                Status = r.Status == "Pending" ? "Chờ xử lý" : r.Status == "Resolved" ? "Đã giải quyết" : "Bỏ qua",
                PColor = GetPriorityColor(GetPriority(r.Reason)),
                SColor = r.Status == "Pending" ? "text-orange-500" : "text-emerald-500"
            });

            return Ok(result);
        }

        // PUT: api/admin/reports/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateReportStatus(Guid id, [FromBody] UpdateReportStatusRequest request)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null)
            {
                return NotFound();
            }

            report.Status = request.Status;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        public class UpdateReportStatusRequest
        {
            public string Status { get; set; } = null!;
        }

        // Helper Methods
        private int CalculateTrend(int current, int previous)
        {
            if (previous == 0) return current > 0 ? 100 : 0;
            return (int)Math.Round(((double)(current - previous) / previous) * 100);
        }

        private List<SparklineData> GenerateSparkline(Random rnd)
        {
            var list = new List<SparklineData>();
            for (int i = 0; i < 7; i++)
            {
                list.Add(new SparklineData { v = rnd.Next(5, 50) });
            }
            return list;
        }

        private string GetPriority(string? reason)
        {
            if (string.IsNullOrEmpty(reason)) return "Kiểm tra lại";
            var r = reason.ToLower();
            if (r.Contains("nghiêm trọng") || r.Contains("phản cảm") || r.Contains("thù ghét") || r.Contains("bạo lực"))
                return "Nghiêm trọng";
            if (r.Contains("spam") || r.Contains("lừa đảo"))
                return "Cảnh báo";
            
            return "Kiểm tra lại";
        }

        private string GetPriorityColor(string priority)
        {
            return priority switch
            {
                "Nghiêm trọng" => "text-red-500 bg-red-500/10 border-red-500/20",
                "Cảnh báo" => "text-orange-500 bg-orange-500/10 border-orange-500/20",
                _ => "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
            };
        }

        private string GetRelativeTime(DateTime? date)
        {
            if (!date.HasValue) return "Không rõ";
            var ts = new TimeSpan(DateTime.UtcNow.Ticks - date.Value.Ticks);
            double delta = Math.Abs(ts.TotalSeconds);

            if (delta < 60) return ts.Seconds == 1 ? "1 giây trước" : ts.Seconds + " giây trước";
            if (delta < 3600) return ts.Minutes == 1 ? "1 phút trước" : ts.Minutes + " phút trước";
            if (delta < 86400) return ts.Hours == 1 ? "1 giờ trước" : ts.Hours + " giờ trước";
            if (delta < 2592000) return ts.Days == 1 ? "1 ngày trước" : ts.Days + " ngày trước";
            if (delta < 31104000)
            {
                int months = Convert.ToInt32(Math.Floor((double)ts.Days / 30));
                return months <= 1 ? "1 tháng trước" : months + " tháng trước";
            }
            int years = Convert.ToInt32(Math.Floor((double)ts.Days / 365));
            return years <= 1 ? "1 năm trước" : years + " năm trước";
        }
    }
}

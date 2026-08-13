using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.DTOs
{
    public class CreateRoleDto
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required, MaxLength(100)]
        public string Label { get; set; } = null!;

        [MaxLength(50)]
        public string? Color { get; set; }

        [MaxLength(50)]
        public string? TextColor { get; set; }

        [MaxLength(50)]
        public string? BgColor { get; set; }

        [MaxLength(50)]
        public string? BorderColor { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }

        public string? PermissionsJson { get; set; }
    }

    public class UpdateRoleDto
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = null!;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required, MaxLength(100)]
        public string Label { get; set; } = null!;

        [MaxLength(50)]
        public string? Color { get; set; }

        [MaxLength(50)]
        public string? TextColor { get; set; }

        [MaxLength(50)]
        public string? BgColor { get; set; }

        [MaxLength(50)]
        public string? BorderColor { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }

        public string? PermissionsJson { get; set; }
    }

    public class AdminReportDTO
    {
        public string Id { get; set; } = null!;
        public string User { get; set; } = null!;
        public string Avatar { get; set; } = null!;
        public string Reason { get; set; } = null!;
        public string? Description { get; set; }
        public string Time { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string PColor { get; set; } = null!;
        public string SColor { get; set; } = null!;
    }

    public class AdminReportStatsDTO
    {
        public int TotalReports { get; set; }
        public int PendingReports { get; set; }
        public int CopyrightReports { get; set; }
        public int ResolvedThisWeek { get; set; }
        
        // Percentages vs last week
        public int TotalReportsTrend { get; set; }
        public int PendingReportsTrend { get; set; }
        public int CopyrightReportsTrend { get; set; }
        public int ResolvedThisWeekTrend { get; set; }

        public List<SparklineData> TotalReportsSparkline { get; set; } = new();
        public List<SparklineData> PendingReportsSparkline { get; set; } = new();
        public List<SparklineData> CopyrightReportsSparkline { get; set; } = new();
        public List<SparklineData> ResolvedThisWeekSparkline { get; set; } = new();

        public List<TimelineData> TimelineData { get; set; } = new();
        
        // For Donut Chart
        public int SeverePriority { get; set; }
        public int WarningPriority { get; set; }
        public int ReviewPriority { get; set; }
    }

    public class SparklineData
    {
        public int v { get; set; }
    }

    public class TimelineData
    {
        public string Date { get; set; } = null!;
        public int Spam { get; set; }
        public int Copyright { get; set; }
        public int Inappropriate { get; set; }
    }
}

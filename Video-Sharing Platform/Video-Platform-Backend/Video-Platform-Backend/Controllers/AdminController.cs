using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Globalization;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate   = null,
            [FromQuery] int days = 7)
        {
            // --- Xác định khoảng thời gian lọc ---
            var now = DateTime.UtcNow.Date;
            DateTime rangeStart, rangeEnd;

            if (DateTime.TryParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedStart) &&
                DateTime.TryParseExact(endDate,   "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedEnd))
            {
                rangeStart = DateTime.SpecifyKind(parsedStart.Date, DateTimeKind.Utc);
                rangeEnd   = DateTime.SpecifyKind(parsedEnd.Date.AddDays(1), DateTimeKind.Utc); // exclusive
            }
            else
            {
                rangeEnd   = now.Date.AddDays(1);
                rangeStart = now.Date.AddDays(-(days - 1));
            }

            var rangeLength = rangeEnd - rangeStart; // TimeSpan
            var prevRangeStart = rangeStart - rangeLength;
            var prevRangeEnd   = rangeStart; // exclusive

            var startOfThisMonth   = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var startOfPrevMonth   = startOfThisMonth.AddMonths(-1);

            // --- Tính toán số liệu theo range ---
            var currentPeriodUsers   = await _context.Users.CountAsync(u => u.CreatedAt >= rangeStart && u.CreatedAt < rangeEnd);
            var previousPeriodUsers  = await _context.Users.CountAsync(u => u.CreatedAt >= prevRangeStart && u.CreatedAt < prevRangeEnd);

            var currentPeriodVideos  = await _context.Videos.CountAsync(v => v.CreatedAt >= rangeStart && v.CreatedAt < rangeEnd);
            var previousPeriodVideos = await _context.Videos.CountAsync(v => v.CreatedAt >= prevRangeStart && v.CreatedAt < prevRangeEnd);

            var currentPeriodViews   = await _context.Views.CountAsync(v => v.ViewedAt >= rangeStart && v.ViewedAt < rangeEnd);
            var previousPeriodViews  = await _context.Views.CountAsync(v => v.ViewedAt >= prevRangeStart && v.ViewedAt < prevRangeEnd);

            var currentPeriodLikes   = await _context.Likes.CountAsync(l => l.CreatedAt >= rangeStart && l.CreatedAt < rangeEnd && l.IsLike);
            var previousPeriodLikes  = await _context.Likes.CountAsync(l => l.CreatedAt >= prevRangeStart && l.CreatedAt < prevRangeEnd && l.IsLike);

            var currentPeriodStorageBytes  = await _context.VideoFiles.Where(f => f.CreatedAt >= rangeStart && f.CreatedAt < rangeEnd).SumAsync(f => (long?)(f.FileSize ?? 0)) ?? 0L;
            var previousPeriodStorageBytes = await _context.VideoFiles.Where(f => f.CreatedAt >= prevRangeStart && f.CreatedAt < prevRangeEnd).SumAsync(f => (long?)(f.FileSize ?? 0)) ?? 0L;

            var currentPeriodComments = await _context.Comments.CountAsync(c => c.CreatedAt >= rangeStart && c.CreatedAt < rangeEnd);

            var usersGrowth   = CalculateGrowth(currentPeriodUsers,  previousPeriodUsers);
            var videosGrowth  = CalculateGrowth(currentPeriodVideos, previousPeriodVideos);
            var viewsGrowth   = CalculateGrowth(currentPeriodViews,  previousPeriodViews);
            var likesGrowth   = CalculateGrowth(currentPeriodLikes,  previousPeriodLikes);
            var currentStorageGB = Math.Round((double)currentPeriodStorageBytes / (1024 * 1024 * 1024), 2);
            var previousStorageGB = Math.Round((double)previousPeriodStorageBytes / (1024 * 1024 * 1024), 2);
            var storageGrowth = CalculateGrowth((long)currentStorageGB, (long)previousStorageGB);

            // --- Doanh thu theo range ---
            var monthlyRevenue = await _context.Transactions
                .Where(t => t.CreatedAt >= rangeStart && t.CreatedAt < rangeEnd)
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var previousRevenue = await _context.Transactions
                .Where(t => t.CreatedAt >= prevRangeStart && t.CreatedAt < prevRangeEnd)
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var revenueGrowth = previousRevenue == 0
                ? (monthlyRevenue > 0 ? 100m : 0m)
                : ((monthlyRevenue - previousRevenue) / previousRevenue) * 100m;

            // --- Top videos theo lượt xem trong range ---
            var topVideos = await _context.Views
                .Where(v => v.ViewedAt >= rangeStart && v.ViewedAt < rangeEnd)
                .GroupBy(v => v.VideoId)
                .Select(g => new { VideoId = g.Key, ViewCount = g.Count() })
                .OrderByDescending(g => g.ViewCount)
                .Take(8)
                .Join(_context.Videos
                    .Include(v => v.Channel)
                    .Include(v => v.VideoThumbnails),
                    g => g.VideoId, v => v.Id,
                    (g, v) => new {
                        Id = v.Id,
                        Title = v.Title,
                        Views = g.ViewCount,
                        ChannelName = v.Channel.ChannelName,
                        ThumbnailUrl = v.VideoThumbnails.Select(t => t.ThumbnailUrl).FirstOrDefault() ?? ""
                    })
                .ToListAsync();

            // Fallback: nếu không có lượt xem nào trong range, lấy top 5 all-time
            if (!topVideos.Any())
            {
                topVideos = await _context.Videos
                    .Where(v => v.CreatedAt >= rangeStart && v.CreatedAt < rangeEnd)
                    .Include(v => v.Channel)
                    .Include(v => v.VideoThumbnails)
                    .OrderByDescending(v => v.ViewsCount)
                    .Take(8)
                    .Select(v => new {
                        Id = v.Id,
                        Title = v.Title,
                        Views = (int)(v.ViewsCount ?? 0),
                        ChannelName = v.Channel.ChannelName,
                        ThumbnailUrl = v.VideoThumbnails.Select(t => t.ThumbnailUrl).FirstOrDefault() ?? ""
                    })
                    .ToListAsync();
            }

            // --- Top channels theo lượt xem video trong range ---
            var topChannels = await _context.Views
                .Where(v => v.ViewedAt >= rangeStart && v.ViewedAt < rangeEnd)
                .Join(_context.Videos, view => view.VideoId, video => video.Id, (view, video) => video.ChannelId)
                .GroupBy(channelId => channelId)
                .Select(g => new { ChannelId = g.Key, ViewCount = g.Count() })
                .OrderByDescending(g => g.ViewCount)
                .Take(5)
                .Join(_context.Channels
                    .Include(c => c.User).ThenInclude(u => u.Profile)
                    .Include(c => c.Subscriptions),
                    g => g.ChannelId, c => c.Id,
                    (g, c) => new {
                        Id = c.Id,
                        ChannelName = c.ChannelName,
                        AvatarUrl = c.User.Profile != null ? c.User.Profile.AvatarUrl ?? "" : "",
                        Subscribers = c.Subscriptions.Count(s => s.Status == "Active" || s.Status == null),
                        VideoCount = _context.Videos.Count(v => v.ChannelId == c.Id && v.CreatedAt >= rangeStart && v.CreatedAt < rangeEnd),
                        TotalViews = g.ViewCount
                    })
                .ToListAsync();

            // Fallback top channels
            if (!topChannels.Any())
            {
                topChannels = await _context.Channels
                    .Include(c => c.User).ThenInclude(u => u.Profile)
                    .Include(c => c.Subscriptions)
                    .OrderByDescending(c => c.Subscriptions.Count(s => s.Status == "Active" || s.Status == null))
                    .Take(5)
                    .Select(c => new {
                        Id = c.Id,
                        ChannelName = c.ChannelName,
                        AvatarUrl = c.User.Profile != null ? c.User.Profile.AvatarUrl ?? "" : "",
                        Subscribers = c.Subscriptions.Count(s => s.Status == "Active" || s.Status == null),
                        VideoCount = _context.Videos.Count(v => v.ChannelId == c.Id),
                        TotalViews = (int)_context.Videos.Where(v => v.ChannelId == c.Id).Sum(v => v.ViewsCount ?? 0)
                    })
                    .ToListAsync();
            }

            // --- Top danh mục theo video được tạo trong range ---
            var categories = await _context.VideoCategories
                .Select(c => new {
                    Name = c.Name,
                    Value = _context.Videos.Count(v => v.CategoryId == c.Id && v.CreatedAt >= rangeStart && v.CreatedAt < rangeEnd)
                })
                .Where(c => c.Value > 0)
                .OrderByDescending(c => c.Value)
                .Take(5)
                .ToListAsync();

            // Fallback categories nếu không có video mới trong range
            if (!categories.Any())
            {
                categories = await _context.VideoCategories
                    .Select(c => new { Name = c.Name, Value = _context.Videos.Count(v => v.CategoryId == c.Id) })
                    .Where(c => c.Value > 0)
                    .OrderByDescending(c => c.Value)
                    .Take(5)
                    .ToListAsync();
            }

            // --- Báo cáo trong range (không fallback all-time) ---
            var recentReports = await _context.Reports
                .Include(r => r.Reporter)
                    .ThenInclude(u => u.Profile)
                .Where(r => r.CreatedAt >= rangeStart && r.CreatedAt < rangeEnd)
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .Select(r => new {
                    Id = r.Id,
                    User = r.Reporter.Profile != null && !string.IsNullOrWhiteSpace(r.Reporter.Profile.FullName)
                        ? r.Reporter.Profile.FullName
                        : r.Reporter.Email,
                    Reason = r.Reason,
                    Status = string.IsNullOrWhiteSpace(r.Status) ? "Pending" : r.Status,
                    Time = r.CreatedAt != null ? FormatRelativeTime(r.CreatedAt.Value) : "Mới đây"
                })
                .ToListAsync();

            var recentActivities = await _context.AuditLogs
                .Where(a => a.CreatedAt >= rangeStart && a.CreatedAt < rangeEnd)
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .Select(a => new {
                    Id = a.Id,
                    Action = a.Action,
                    Time = FormatRelativeTime(a.CreatedAt),
                    Type = a.ActionType == "update" ? "video" : a.ActionType == "add" ? "user" : "payment"
                })
                .ToListAsync();

            var recentTransactions = await _context.Transactions
                .Include(t => t.Payment)
                    .ThenInclude(p => p.User)
                    .ThenInclude(u => u.Profile)
                .Where(t => t.CreatedAt >= rangeStart && t.CreatedAt < rangeEnd)
                .OrderByDescending(t => t.CreatedAt)
                .Take(5)
                .Select(t => new {
                    Id = t.Id,
                    User = t.Payment.User.Profile != null && !string.IsNullOrWhiteSpace(t.Payment.User.Profile.FullName)
                        ? t.Payment.User.Profile.FullName
                        : t.Payment.User.Email,
                    Type = NormalizeTransactionType(t.TransactionType),
                    Amount = t.Amount,
                    Status = "Thành công",
                    Time = t.CreatedAt != null ? FormatRelativeTime(t.CreatedAt.Value) : "Mới đây"
                })
                .ToListAsync();

            return Ok(new
            {
                TotalUsers = currentPeriodUsers,
                UserGrowth = usersGrowth,
                TotalVideos = currentPeriodVideos,
                VideoGrowth = videosGrowth,
                TotalViews = currentPeriodViews,
                ViewsGrowth = viewsGrowth,
                TotalStorageGB = currentStorageGB,
                StorageGrowth = storageGrowth,
                TotalLikes = currentPeriodLikes,
                LikesGrowth = likesGrowth,
                TotalComments = currentPeriodComments,
                MonthlyRevenue = decimal.ToDouble(monthlyRevenue),
                RevenueGrowth = decimal.ToDouble(revenueGrowth),
                TopVideos = topVideos,
                TopChannels = topChannels,
                CategoryDistribution = categories,
                RecentReports = recentReports,
                RecentActivities = recentActivities,
                RecentTransactions = recentTransactions
            });
        }

        [HttpGet("chart-data")]
        public async Task<IActionResult> GetChartData(
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate   = null,
            [FromQuery] int days = 7)
        {
            var now = DateTime.UtcNow.Date;
            DateTime rangeStart, rangeEnd;

            if (DateTime.TryParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedStart) &&
                DateTime.TryParseExact(endDate,   "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedEnd))
            {
                rangeStart = DateTime.SpecifyKind(parsedStart.Date, DateTimeKind.Utc);
                rangeEnd   = DateTime.SpecifyKind(parsedEnd.Date, DateTimeKind.Utc);
            }
            else
            {
                rangeStart = now.AddDays(-(days - 1));
                rangeEnd   = now;
            }

            // Tạo danh sách ngày động theo range
            int totalDays = (int)(rangeEnd - rangeStart).TotalDays + 1;
            var dateList = Enumerable.Range(0, totalDays)
                .Select(offset => rangeStart.AddDays(offset))
                .ToList();

            var rangeEndExclusive = rangeEnd.AddDays(1);

            // --- Traffic (lượt xem) ---
            var trafficRecords = await _context.Views
                .Where(v => v.ViewedAt != null && v.ViewedAt >= rangeStart && v.ViewedAt < rangeEndExclusive)
                .GroupBy(v => v.ViewedAt!.Value.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            // Nhóm theo ngày hoặc tuần tùy độ dài range
            List<object> trafficData;
            if (totalDays <= 31)
            {
                trafficData = dateList.Select(day => (object)new {
                    name = day.ToString("dd/MM"),
                    users = 0,
                    videos = 0,
                    views = trafficRecords.FirstOrDefault(r => r.Date == day)?.Count ?? 0
                }).ToList();
            }
            else
            {
                // Nhóm theo tuần khi range > 31 ngày
                trafficData = dateList
                    .GroupBy(d => $"T{(int)Math.Ceiling((d - rangeStart).TotalDays / 7.0 + 1)}")
                    .Select(g => (object)new {
                        name = g.Key,
                        users = 0,
                        videos = 0,
                        views = trafficRecords.Where(r => g.Contains(r.Date)).Sum(r => r.Count)
                    }).ToList();
            }

            // --- Revenue Pie (theo range) ---
            var revenuePieData = await _context.Transactions
                .Where(t => t.CreatedAt >= rangeStart && t.CreatedAt < rangeEndExclusive)
                .GroupBy(t => t.TransactionType ?? "Other")
                .Select(g => new { Name = NormalizeTransactionType(g.Key), Value = g.Sum(x => x.Amount) })
                .OrderByDescending(x => x.Value)
                .ToListAsync();

            // Fallback: nếu range không có revenue thì lấy tháng hiện tại
            if (!revenuePieData.Any())
            {
                var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                revenuePieData = await _context.Transactions
                    .Where(t => t.CreatedAt >= startOfMonth)
                    .GroupBy(t => t.TransactionType ?? "Other")
                    .Select(g => new { Name = NormalizeTransactionType(g.Key), Value = g.Sum(x => x.Amount) })
                    .OrderByDescending(x => x.Value)
                    .ToListAsync();
            }

            // --- Nâng cấp tài khoản vs Đăng kí hội viên ---
            var upgradesRecords = await _context.Transactions
                .Where(t => t.CreatedAt >= rangeStart && t.CreatedAt < rangeEndExclusive
                    && t.TransactionType != null && t.TransactionType.Contains("PremiumUpgrade"))
                .GroupBy(t => t.CreatedAt!.Value.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var registrationsRecords = await _context.Transactions
                .Where(t => t.CreatedAt >= rangeStart && t.CreatedAt < rangeEndExclusive
                    && t.TransactionType != null && t.TransactionType.Contains("ChannelMembership"))
                .GroupBy(t => t.CreatedAt!.Value.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            List<object> accountUpgradesVsRegistrations;
            if (totalDays <= 31)
            {
                accountUpgradesVsRegistrations = dateList.Select(day => (object)new {
                    name = day.ToString("dd/MM"),
                    upgrades      = upgradesRecords.FirstOrDefault(r => r.Date == day)?.Count ?? 0,
                    registrations = registrationsRecords.FirstOrDefault(r => r.Date == day)?.Count ?? 0
                }).ToList();
            }
            else
            {
                accountUpgradesVsRegistrations = dateList
                    .GroupBy(d => $"T{(int)Math.Ceiling((d - rangeStart).TotalDays / 7.0 + 1)}")
                    .Select(g => (object)new {
                        name          = g.Key,
                        upgrades      = upgradesRecords.Where(r => g.Contains(r.Date)).Sum(r => r.Count),
                        registrations = registrationsRecords.Where(r => g.Contains(r.Date)).Sum(r => r.Count)
                    }).ToList();
            }

            var deviceData = new[]
            {
                new { name = "Mobile",  value = 65 },
                new { name = "Desktop", value = 25 },
                new { name = "Tablet",  value = 10 }
            };

            return Ok(new {
                Traffic = trafficData,
                Revenue = revenuePieData,
                Devices = deviceData,
                AccountUpgradesVsRegistrations = accountUpgradesVsRegistrations
            });
        }

        private static double CalculateGrowth(long currentValue, long previousValue)
        {
            if (previousValue == 0)
                return currentValue > 0 ? 100d : 0d;

            return ((double)(currentValue - previousValue) / previousValue) * 100d;
        }

        private static string NormalizeTransactionType(string? transactionType)
        {
            if (string.IsNullOrWhiteSpace(transactionType))
                return "Other";

            var normalized = transactionType.Trim();

            if (normalized.StartsWith("ChannelMembership_", StringComparison.OrdinalIgnoreCase))
                return "ChannelMembership_" + normalized["ChannelMembership_".Length..].Trim();

            if (normalized.StartsWith("PremiumUpgrade_", StringComparison.OrdinalIgnoreCase))
            {
                var parts = normalized.Split('_', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (parts.Length >= 3)
                {
                    return $"Premium {parts[1]} {parts[2]}";
                }

                return "Premium";
            }

            if (normalized.Contains("donate", StringComparison.OrdinalIgnoreCase)) return "Donate";
            if (normalized.Contains("ad", StringComparison.OrdinalIgnoreCase)) return "Quảng cáo (Ads)";
            if (normalized.Contains("premium", StringComparison.OrdinalIgnoreCase)) return "Premium";
            if (normalized.Contains("sub", StringComparison.OrdinalIgnoreCase)) return "Premium";

            return normalized;
        }

        private static string FormatRelativeTime(DateTime date)
        {
            var span = DateTime.UtcNow - date;

            if (span.TotalMinutes < 1) return "vừa xong";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
            if (span.TotalDays < 30) return $"{(int)span.TotalDays} ngày trước";
            return date.ToString("dd/MM/yyyy");
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Channel)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.Profile != null ? u.Profile.FullName : "Unknown",
                    AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    IsActive = u.IsActive ?? true,
                    IsBanned = u.IsBanned ?? false,
                    CreatedAt = u.CreatedAt,
                    TotalVideos = u.Channel != null ? _context.Videos.Count(v => v.ChannelId == u.Channel.Id && (v.IsShort == false || v.IsShort == null)) : 0,
                    TotalShorts = u.Channel != null ? _context.Videos.Count(v => v.ChannelId == u.Channel.Id && v.IsShort == true) : 0,
                    Subscribers = u.Channel != null ? _context.Followers.Count(f => f.ChannelId == u.Channel.Id) : 0
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("users/{id}/ban")]
        public async Task<IActionResult> ToggleBanUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Toggle the IsBanned status
            user.IsBanned = !(user.IsBanned ?? false);
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = user.IsBanned == true ? "User banned successfully" : "User unbanned successfully",
                isBanned = user.IsBanned 
            });
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRolesDto dto)
        {
            var validRoles = await _context.Roles.Select(r => r.Name).ToListAsync();
            
            if (dto.Roles == null || dto.Roles.Count == 0)
                dto.Roles = new List<string> { "User" };

            foreach(var role in dto.Roles)
            {
                if (!validRoles.Contains(role))
                    return BadRequest(new { message = $"Vai trò {role} không hợp lệ." });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            // Xóa các role cũ
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Thêm role mới
            var newRoles = await _context.Roles.Where(r => dto.Roles.Contains(r.Name)).ToListAsync();
            foreach(var role in newRoles)
            {
                user.UserRoles.Add(new UserRole { RoleId = role.Id, UserId = user.Id });
            }

            // Ghi AuditLog
            var adminUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            Guid? adminUserId = null;
            if (Guid.TryParse(adminUserIdStr, out Guid parsedId))
            {
                adminUserId = parsedId;
            }

            var log = new AuditLog
            {
                UserId = adminUserId,
                Action = "Phân quyền",
                ActionType = "assign",
                Target = user.Email,
                Details = $"Cập nhật quyền thành {string.Join(", ", dto.Roles)}",
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã cập nhật vai trò thành công.", roles = dto.Roles });
        }
        
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .Include(l => l.User)
                    .ThenInclude(u => u.Profile)
                .OrderByDescending(l => l.CreatedAt)
                .Take(50)
                .Select(l => new {
                    Id = l.Id,
                    Time = l.CreatedAt.ToString("HH:mm dd/MM/yyyy"),
                    User = l.User != null ? l.User.Email : "Hệ thống",
                    Role = "Quản trị viên", // Assuming only admins can do this for now
                    Avatar = l.User != null && l.User.Profile != null && !string.IsNullOrEmpty(l.User.Profile.AvatarUrl)
                        ? l.User.Profile.AvatarUrl
                        : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (l.User != null ? l.User.Email : "System"),
                    Action = l.Action,
                    ActionType = l.ActionType,
                    Target = l.Target,
                    Details = l.Details
                })
                .ToListAsync();

            return Ok(logs);
        }
        
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description,
                    Label = r.Label,
                    Color = r.Color,
                    TextColor = r.TextColor,
                    BgColor = r.BgColor,
                    BorderColor = r.BorderColor,
                    Icon = r.Icon,
                    PermissionsJson = r.PermissionsJson
                })
                .ToListAsync();
            return Ok(roles);
        }

        [HttpPost("roles")]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
        {
            if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
            {
                return BadRequest(new { message = "Vai trò với tên này đã tồn tại." });
            }

            var role = new Role
            {
                Name = dto.Name,
                Label = dto.Label,
                Description = dto.Description,
                Color = dto.Color ?? "from-gray-500 to-gray-600",
                TextColor = dto.TextColor ?? "text-gray-400",
                BgColor = dto.BgColor ?? "bg-gray-500/10",
                BorderColor = dto.BorderColor ?? "border-gray-500/20",
                Icon = dto.Icon ?? "Users",
                PermissionsJson = dto.PermissionsJson ?? "[]"
            };

            _context.Roles.Add(role);

            // Audit log
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(adminId, out Guid adminGuid))
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminGuid,
                    Action = "Thêm vai trò",
                    ActionType = "add",
                    Target = dto.Label,
                    Details = $"Tạo mới vai trò {dto.Label}"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm vai trò thành công." });
        }

        [HttpPut("roles/{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound(new { message = "Không tìm thấy vai trò." });

            if (role.Name != dto.Name && await _context.Roles.AnyAsync(r => r.Name == dto.Name))
            {
                return BadRequest(new { message = "Tên vai trò mới đã tồn tại." });
            }

            role.Name = dto.Name;
            role.Label = dto.Label;
            role.Description = dto.Description;
            role.Color = dto.Color ?? role.Color;
            role.TextColor = dto.TextColor ?? role.TextColor;
            role.BgColor = dto.BgColor ?? role.BgColor;
            role.BorderColor = dto.BorderColor ?? role.BorderColor;
            role.Icon = dto.Icon ?? role.Icon;
            role.PermissionsJson = dto.PermissionsJson ?? role.PermissionsJson;

            // Audit log
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(adminId, out Guid adminGuid))
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminGuid,
                    Action = "Cập nhật vai trò",
                    ActionType = "update",
                    Target = dto.Label,
                    Details = $"Cập nhật vai trò {dto.Label}"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật vai trò thành công." });
        }

        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound(new { message = "Không tìm thấy vai trò." });

            bool isUsed = await _context.UserRoles.AnyAsync(ur => ur.RoleId == id);
            if (isUsed)
            {
                return BadRequest(new { message = "Không thể xóa vai trò đang có người dùng." });
            }

            _context.Roles.Remove(role);

            // Audit log
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(adminId, out Guid adminGuid))
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminGuid,
                    Action = "Xóa vai trò",
                    ActionType = "delete",
                    Target = role.Label,
                    Details = $"Xóa vai trò {role.Label}"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa vai trò thành công." });
        }
    }
}

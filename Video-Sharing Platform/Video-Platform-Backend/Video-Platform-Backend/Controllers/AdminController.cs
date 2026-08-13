using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

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
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalVideos = await _context.Videos.CountAsync();
            var totalViews = await _context.Videos.SumAsync(v => (long)(v.ViewsCount ?? 0));
            
            // Tính tổng dung lượng (Byte -> GB)
            var totalSizeBytes = await _context.VideoFiles.SumAsync(f => (long)(f.FileSize ?? 0));
            var totalStorageGB = Math.Round((double)totalSizeBytes / (1024 * 1024 * 1024), 2);

            // Tương tác
            var totalLikes = await _context.Videos.SumAsync(v => (long)(v.LikesCount ?? 0));
            var totalComments = await _context.Videos.SumAsync(v => (long)(v.CommentsCount ?? 0));

            // Doanh thu Mock - Tháng này và phần trăm tăng trưởng
            var monthlyRevenue = 12340; 
            var revenueGrowth = 15.5; // +15.5%

            // Top 5 Videos (Thịnh hành)
            var topVideos = await _context.Videos
                .Include(v => v.Channel)
                .Include(v => v.VideoThumbnails)
                .OrderByDescending(v => v.ViewsCount)
                .Take(5)
                .Select(v => new {
                    Id = v.Id,
                    Title = v.Title,
                    Views = v.ViewsCount ?? 0,
                    ChannelName = v.Channel.ChannelName,
                    ThumbnailUrl = v.VideoThumbnails.Select(t => t.ThumbnailUrl).FirstOrDefault() ?? ""
                })
                .ToListAsync();

            // Top 5 Kênh (theo Subscriber)
            var topChannels = await _context.Channels
                .OrderByDescending(c => c.Followers.Count)
                .Take(5)
                .Select(c => new {
                    Id = c.Id,
                    ChannelName = c.ChannelName,
                    AvatarUrl = c.User.Profile.AvatarUrl ?? "",
                    Subscribers = c.Followers.Count,
                    TotalViews = _context.Videos.Where(v => v.ChannelId == c.Id).Sum(v => v.ViewsCount ?? 0)
                })
                .ToListAsync();

            // Phân bổ danh mục
            var categories = await _context.VideoCategories
                .Select(c => new {
                    Name = c.Name,
                    Value = _context.Videos.Count(v => v.CategoryId == c.Id)
                })
                .Where(c => c.Value > 0)
                .OrderByDescending(c => c.Value)
                .Take(5)
                .ToListAsync();

            // Báo cáo gần đây (Mock data vì bảng Report có thể trống)
            var recentReports = new[] {
                new { Id = 1, User = "Nguyễn Văn A", Reason = "Nội dung phản cảm", Status = "Pending", Time = "10 phút trước" },
                new { Id = 2, User = "Trần B", Reason = "Spam", Status = "Pending", Time = "2 giờ trước" },
                new { Id = 3, User = "Lê C", Reason = "Vi phạm bản quyền", Status = "Resolved", Time = "5 giờ trước" }
            };

            // Hoạt động gần đây (Mock)
            var recentActivities = new[] {
                new { Id = 1, Action = "User X vừa đăng ký tài khoản mới", Time = "2 phút trước", Type = "user" },
                new { Id = 2, Action = "Kênh Y vừa upload video Z", Time = "15 phút trước", Type = "video" },
                new { Id = 3, Action = "User W vừa nâng cấp gói Premium", Time = "1 giờ trước", Type = "payment" }
            };

            // Giao dịch gần đây (Mock)
            var recentTransactions = new[] {
                new { Id = 101, User = "Hoang Nguyen", Type = "Premium", Amount = 9.99, Status = "Thành công", Time = "10 phút trước" },
                new { Id = 102, User = "Tran B", Type = "Donate", Amount = 5.00, Status = "Thành công", Time = "30 phút trước" },
                new { Id = 103, User = "Le C", Type = "Premium", Amount = 9.99, Status = "Đang xử lý", Time = "1 giờ trước" }
            };

            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalVideos = totalVideos,
                TotalViews = totalViews,
                TotalStorageGB = totalStorageGB,
                TotalLikes = totalLikes,
                TotalComments = totalComments,
                MonthlyRevenue = monthlyRevenue,
                RevenueGrowth = revenueGrowth,
                TopVideos = topVideos,
                TopChannels = topChannels,
                CategoryDistribution = categories,
                RecentReports = recentReports,
                RecentActivities = recentActivities,
                RecentTransactions = recentTransactions
            });
        }
        
        [HttpGet("chart-data")]
        public IActionResult GetChartData()
        {
            var trafficData = new[]
            {
                new { name = "T2", users = 400, videos = 240, views = 24000 },
                new { name = "T3", users = 300, videos = 139, views = 22100 },
                new { name = "T4", users = 200, videos = 980, views = 22900 },
                new { name = "T5", users = 278, videos = 390, views = 20000 },
                new { name = "T6", users = 189, videos = 480, views = 21810 },
                new { name = "T7", users = 239, videos = 380, views = 25000 },
                new { name = "CN", users = 349, videos = 430, views = 21000 }
            };

            var revenuePieData = new[]
            {
                new { name = "Quảng cáo (Ads)", value = 5400 },
                new { name = "Premium Sub", value = 3200 },
                new { name = "Donate", value = 1500 },
                new { name = "Tài trợ", value = 2240 }
            };

            var deviceData = new[]
            {
                new { name = "Mobile", value = 65 },
                new { name = "Desktop", value = 25 },
                new { name = "Tablet", value = 10 }
            };

            return Ok(new {
                Traffic = trafficData,
                Revenue = revenuePieData,
                Devices = deviceData
            });
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

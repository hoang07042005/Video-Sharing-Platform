using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/monetization")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminMonetizationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public AdminMonetizationController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("applications")]
        public async Task<IActionResult> GetApplications([FromQuery] string? status = "All", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var baseQuery = _context.MonetizationApplications
                    .Include(a => a.Channel)
                    .ThenInclude(c => c.User)
                    .ThenInclude(u => u.Profile)
                    .AsQueryable();

                var total = await baseQuery.CountAsync();
                var approved = await baseQuery.CountAsync(a => a.Status == "Approved");
                var rejected = await baseQuery.CountAsync(a => a.Status == "Rejected");
                var revoked = await baseQuery.CountAsync(a => a.Status == "Revoked");
                var pending = await baseQuery.CountAsync(a => a.Status == "Pending");
                var checking = await baseQuery.CountAsync(a => a.Status == "Checking");

                var query = baseQuery;
                if (!string.IsNullOrEmpty(status) && status != "All" && status != "Tất cả")
                {
                    query = query.Where(a => a.Status == status);
                }

                var totalItems = await query.CountAsync();

                var applications = await query
                    .OrderByDescending(a => a.AppliedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new
                    {
                        a.Id,
                        a.ChannelId,
                        ChannelName = a.Channel.ChannelName,
                        Handle = a.Channel.Handle,
                        Avatar = a.Channel.AvatarUrl ?? a.Channel.User.Profile.AvatarUrl,
                        Email = a.Channel.User.Email,
                        Phone = a.Channel.User.PhoneNumber,
                        Country = a.Channel.Country,
                        CreatedAt = a.Channel.CreatedAt,
                        SubscribersCount = a.Channel.Followers.Count(),
                        VideosCount = a.Channel.Videos.Count(),
                        ChannelDescription = a.Channel.Description,
                        a.AppliedAt,
                        a.ReviewedAt,
                        a.Status,
                        a.AdminNote,
                        a.RejectReason,
                        a.EvidenceUrl
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Stats = new { Total = total, Approved = approved, Rejected = rejected, Revoked = revoked, Pending = pending, Checking = checking },
                    TotalItems = totalItems,
                    Applications = applications
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.ToString() });
            }
        }

        [HttpPost("applications/{id}/approve")]
        public async Task<IActionResult> ApproveApplication(Guid id)
        {
            try
            {
                var application = await _context.MonetizationApplications
                    .Include(a => a.Channel)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (application == null) return NotFound(new { message = "Không tìm thấy đơn." });
                if (application.Status != "Pending" && application.Status != "Revoked" && application.Status != "Checking") return BadRequest(new { message = "Đơn này đã được xử lý hoặc không thể duyệt." });

                application.Status = "Approved";
                application.ReviewedAt = DateTime.UtcNow;
                application.AdminNote = "Đã duyệt";

                application.Channel.IsMonetized = true;
                application.Channel.MonetizationStatus = "Approved";

                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã phê duyệt bật kiếm tiền." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.ToString() });
            }
        }

        [HttpPost("applications/{id}/check")]
        public async Task<IActionResult> CheckApplication(Guid id)
        {
            try
            {
                var application = await _context.MonetizationApplications
                    .Include(a => a.Channel)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (application == null) return NotFound(new { message = "Không tìm thấy đơn." });
                if (application.Status != "Pending") return BadRequest(new { message = "Chỉ có thể chuyển sang trạng thái kiểm tra từ trạng thái chờ duyệt." });

                application.Status = "Checking";
                application.Channel.MonetizationStatus = "Checking";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã chuyển sang trạng thái đang kiểm tra." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.ToString() });
            }
        }

        [HttpPost("applications/{id}/reject")]
        public async Task<IActionResult> RejectApplication(Guid id, [FromBody] RejectDto dto)
        {
            try
            {
                var application = await _context.MonetizationApplications
                    .Include(a => a.Channel)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (application == null) return NotFound(new { message = "Không tìm thấy đơn." });

                bool wasApproved = application.Status == "Approved";
                bool wasAlreadyRejectedOrRevoked = application.Status == "Rejected" || application.Status == "Revoked";

                string targetStatus = "Rejected";
                if (wasApproved)
                {
                    targetStatus = dto.ActionType == "Reject" ? "Rejected" : "Revoked";
                }

                application.Status = targetStatus;
                application.ReviewedAt = DateTime.UtcNow;
                application.RejectReason = dto.Reason;
                application.AdminNote = dto.AdminNote;
                application.EvidenceUrl = dto.EvidenceUrl;

                application.Channel.IsMonetized = false;
                application.Channel.MonetizationStatus = targetStatus;

                await _context.SaveChangesAsync();

                string notifyMsg = wasApproved && targetStatus == "Revoked"
                    ? $"Tính năng kiếm tiền của kênh đã bị tắt. Lý do: {dto.Reason}"
                    : $"Đơn đăng ký kiếm tiền của bạn đã bị từ chối. Lý do: {dto.Reason}";

                // Chỉ gửi thông báo nếu đây là lần thay đổi trạng thái mới
                if (!wasAlreadyRejectedOrRevoked)
                {
                    await _notificationService.SendNotificationAsync(
                        userId: application.Channel.UserId,
                        title: "Kiếm Tiền",
                        message: notifyMsg,
                        type: "system",
                        actionUrl: "/studio/monetization"
                    );
                }

                return Ok(new { message = wasAlreadyRejectedOrRevoked ? "Đã cập nhật thông tin thành công." : (wasApproved && targetStatus == "Revoked" ? "Đã tắt tính năng kiếm tiền." : "Đã từ chối đơn đăng ký.") });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.ToString() });
            }
        }

        public class RejectDto
        {
            public string Reason { get; set; } = string.Empty;
            public string? AdminNote { get; set; }
            public string? EvidenceUrl { get; set; }
            public string? ActionType { get; set; }
        }
    }
}

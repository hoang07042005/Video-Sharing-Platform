using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/monetization")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminMonetizationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminMonetizationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("applications")]
        public async Task<IActionResult> GetApplications()
        {
            try
            {
                var applications = await _context.MonetizationApplications
                    .Include(a => a.Channel)
                    .ThenInclude(c => c.User)
                    .ThenInclude(u => u.Profile)
                    .OrderByDescending(a => a.AppliedAt)
                    .Select(a => new
                    {
                        a.Id,
                        a.ChannelId,
                        ChannelName = a.Channel.ChannelName,
                        Handle = a.Channel.Handle,
                        Avatar = a.Channel.User.Profile.AvatarUrl,
                        a.AppliedAt,
                        a.ReviewedAt,
                        a.Status,
                        a.AdminNote
                    })
                    .ToListAsync();

                return Ok(applications);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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

                if (application == null) return NotFound("Không tìm thấy đơn.");
                if (application.Status != "Pending") return BadRequest("Đơn này đã được xử lý.");

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
                return BadRequest(new { message = ex.Message });
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

                if (application == null) return NotFound("Không tìm thấy đơn.");
                if (application.Status != "Pending") return BadRequest("Đơn này đã được xử lý.");

                application.Status = "Rejected";
                application.ReviewedAt = DateTime.UtcNow;
                application.AdminNote = dto.Reason;

                application.Channel.IsMonetized = false;
                application.Channel.MonetizationStatus = "Rejected";

                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã từ chối đơn đăng ký." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class RejectDto
        {
            public string Reason { get; set; } = string.Empty;
        }
    }
}

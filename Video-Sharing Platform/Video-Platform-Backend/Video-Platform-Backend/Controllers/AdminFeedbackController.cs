using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.DTOs;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[Route("api/admin/feedbacks")]
[ApiController]
[Authorize(Roles = "Admin, Moderator")]
public class AdminFeedbackController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminFeedbackController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetFeedbacks([FromQuery] string status = "All")
    {
        var query = _context.Feedbacks
            .Include(f => f.User)
            .ThenInclude(u => u.Profile)
            .Include(f => f.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (status != "All")
        {
            query = query.Where(f => f.Status == status);
        }

        var feedbacks = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackResponseDto
            {
                Id = f.Id,
                UserId = f.UserId,
                UserFullName = f.User.Profile != null ? f.User.Profile.FullName : "Người dùng",
                UserAvatarUrl = f.User.Profile != null ? f.User.Profile.AvatarUrl : null,
                UserEmail = f.User.Email,
                Type = f.Type,
                Content = f.Content,
                AttachmentUrl = f.AttachmentUrl,
                Status = f.Status,
                AdminReply = f.AdminReply,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt,
                IsPremium = f.User.UserRoles.Any(ur => ur.Role.Name == "Admin" || ur.Role.Name == "SuperAdmin") || 
                            (f.User.IsPremium == true && (!f.User.PremiumUntil.HasValue || f.User.PremiumUntil.Value >= DateTime.UtcNow))
            })
            .ToListAsync();

        return Ok(feedbacks);
    }

    [HttpPut("{id}/reply")]
    public async Task<IActionResult> ReplyFeedback(Guid id, [FromBody] ReplyFeedbackDto dto)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null)
        {
            return NotFound(new { Message = "Không tìm thấy phản hồi này." });
        }

        feedback.Status = "Resolved";
        feedback.AdminReply = dto.ReplyContent;
        feedback.UpdatedAt = DateTime.UtcNow;

        // Create a notification for the user
        var notification = new Notification
        {
            UserId = feedback.UserId,
            Title = "📩 Phản hồi từ Quản trị viên",
            Type = "FeedbackReply",
            Message = $"Xin chào, Quản trị viên đã xem xét và phản hồi yêu cầu hỗ trợ của bạn với nội dung: \"{dto.ReplyContent}\". Cảm ơn bạn đã đóng góp ý kiến để chúng tôi phát triển nền tảng tốt hơn!",
            TargetUrl = "/feedback", // Or a specific feedback detail page if they have one
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã gửi phản hồi cho người dùng thành công." });
    }
}

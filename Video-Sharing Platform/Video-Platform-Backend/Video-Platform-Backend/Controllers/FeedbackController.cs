using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Video_Platform_Backend.DTOs;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FeedbackController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitFeedback([FromBody] CreateFeedbackDto dto)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
        {
            return Unauthorized();
        }

        var feedback = new Feedback
        {
            UserId = userId,
            Type = dto.Type,
            Content = dto.Content,
            AttachmentUrl = dto.AttachmentUrl
        };

        _context.Feedbacks.Add(feedback);
        
        // Notify all admins
        var adminIds = await _context.Users
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin"))
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var adminId in adminIds)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = adminId,
                Type = "Feedback",
                Title = "Có phản hồi/góp ý mới",
                Message = $"Một người dùng vừa gửi phản hồi về: {dto.Type}.",
                TargetUrl = "/admin/feedbacks",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Phản hồi của bạn đã được gửi thành công!" });
    }
}

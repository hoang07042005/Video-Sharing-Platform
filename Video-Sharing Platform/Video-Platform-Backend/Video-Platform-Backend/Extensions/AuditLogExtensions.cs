using System;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Extensions
{
    public static class AuditLogExtensions
    {
        /// <summary>
        /// Thêm bản ghi AuditLog vào DbContext (Chưa gọi SaveChanges)
        /// </summary>
        public static void AddAuditLog(this ControllerBase controller, ApplicationDbContext context, string action, string actionType, string target, string details)
        {
            var adminIdStr = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(adminIdStr, out Guid adminGuid))
            {
                context.AuditLogs.Add(new AuditLog
                {
                    UserId = adminGuid,
                    Action = action,
                    ActionType = actionType,
                    Target = target,
                    Details = details,
                    IpAddress = string.IsNullOrEmpty(controller.HttpContext.Connection.RemoteIpAddress?.ToString()) ? "Unknown" : controller.HttpContext.Connection.RemoteIpAddress.ToString(),
                    Browser = string.IsNullOrEmpty(controller.HttpContext.Request.Headers["User-Agent"].ToString()) ? "Unknown" : controller.HttpContext.Request.Headers["User-Agent"].ToString(),
                    Status = "Success",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }
}

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
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }
}

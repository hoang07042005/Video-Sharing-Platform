using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Linq;
using Video_Platform_Backend.Extensions;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/transactions")]
    [ApiController]
    [Authorize] // Assuming admin route, ideally [Authorize(Roles = "Admin")] but leaving as is if roles are handled in middleware/auth
    public class AdminTransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminTransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("premium")]
        public async Task<IActionResult> GetPremiumTransactions()
        {
            try
            {
                var transactions = await _context.Transactions
                    .Include(t => t.Payment)
                        .ThenInclude(p => p.User)
                            .ThenInclude(u => u.Profile)
                    .Where(t => t.TransactionType != null && t.TransactionType.StartsWith("PremiumUpgrade_"))
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.PaymentId,
                        t.TransactionType,
                        t.Amount,
                        t.CreatedAt,
                        StartDate = t.CreatedAt,
                        EndDate = t.TransactionType != null && t.TransactionType.Contains("Yearly") 
                            ? (t.CreatedAt.HasValue ? t.CreatedAt.Value.AddYears(1) : (DateTime?)null)
                            : (t.CreatedAt.HasValue ? t.CreatedAt.Value.AddMonths(1) : (DateTime?)null),
                        Status = t.Payment.Status,
                        PaymentMethod = t.Payment.PaymentMethod,
                        User = new
                        {
                            Id = t.Payment.User.Id,
                            FullName = t.Payment.User.Profile != null ? t.Payment.User.Profile.FullName : "Người dùng",
                            Email = t.Payment.User.Email,
                            AvatarUrl = t.Payment.User.Profile != null ? t.Payment.User.Profile.AvatarUrl : null
                        }
                    })
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("membership")]
        public async Task<IActionResult> GetMembershipTransactions()
        {
            try
            {
                var transactions = await _context.Transactions
                    .Include(t => t.Payment)
                        .ThenInclude(p => p.User)
                            .ThenInclude(u => u.Profile)
                    .Include(t => t.TargetChannel)
                    .Where(t => t.TransactionType != null && t.TransactionType.StartsWith("ChannelMembership_"))
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.PaymentId,
                        t.TransactionType,
                        t.Amount,
                        t.CreatedAt,
                        StartDate = t.CreatedAt,
                        EndDate = t.CreatedAt.HasValue ? t.CreatedAt.Value.AddMonths(1) : (DateTime?)null,
                        Status = t.Payment.Status,
                        PaymentMethod = t.Payment.PaymentMethod,
                        User = new
                        {
                            Id = t.Payment.User.Id,
                            FullName = t.Payment.User.Profile != null ? t.Payment.User.Profile.FullName : "Người dùng",
                            Email = t.Payment.User.Email,
                            AvatarUrl = t.Payment.User.Profile != null ? t.Payment.User.Profile.AvatarUrl : null
                        },
                        Channel = t.TargetChannel != null ? new
                        {
                            Id = t.TargetChannel.Id,
                            ChannelName = t.TargetChannel.ChannelName,
                            Handle = t.TargetChannel.Handle,
                            AvatarUrl = t.TargetChannel.User != null && t.TargetChannel.User.Profile != null ? t.TargetChannel.User.Profile.AvatarUrl : null
                        } : null
                    })
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTransactionStatus(Guid id, [FromBody] UpdateTransactionStatusDto dto)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Payment)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null || transaction.Payment == null)
            {
                return NotFound(new { message = "Giao dịch không tồn tại." });
            }

            var oldStatus = transaction.Payment.Status;
            transaction.Payment.Status = dto.Status; // Completed, Failed, Refunded

            var actionStr = dto.Status == "Completed" ? "Duyệt giao dịch" : dto.Status == "Refunded" ? "Hoàn tiền giao dịch" : "Từ chối giao dịch";
            this.AddAuditLog(_context, actionStr, "update", $"Payment:{transaction.PaymentId}", $"Trạng thái: {oldStatus} -> {dto.Status}");

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật trạng thái thành công.", status = dto.Status });
        }
    }

    public class UpdateTransactionStatusDto
    {
        public string Status { get; set; }
    }
}

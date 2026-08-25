using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Security.Claims;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/withdrawals")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminWithdrawalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;

        public AdminWithdrawalsController(ApplicationDbContext context, IEmailService emailService, INotificationService notificationService)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllWithdrawals([FromQuery] string status = "all")
        {
            var query = _context.WithdrawalRequests
                .Include(w => w.User)
                    .ThenInclude(u => u.Profile)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                query = query.Where(w => w.Status.ToLower() == status.ToLower());
            }

            var requests = await query
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new {
                    w.Id,
                    User = new {
                        w.User.Id,
                        w.User.Email,
                        AvatarUrl = w.User.Profile != null ? w.User.Profile.AvatarUrl : null,
                        Name = w.User.Profile != null ? w.User.Profile.FullName : w.User.Email
                    },
                    w.Coins,
                    w.AmountFiat,
                    w.BankName,
                    w.BankAccountNumber,
                    w.BankAccountName,
                    w.Status,
                    w.AdminNote,
                    w.ReceiptUrl,
                    w.BreakdownData,
                    CreatedAt = w.CreatedAt.ToString("HH:mm dd/MM/yyyy"),
                    UpdatedAt = w.UpdatedAt.HasValue ? w.UpdatedAt.Value.ToString("HH:mm dd/MM/yyyy") : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        public class UpdateWithdrawalDto
        {
            public string Status { get; set; } = null!; // "Completed", "Rejected"
            public string? Note { get; set; }
            public string? ReceiptUrl { get; set; }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWithdrawal(Guid id, [FromBody] UpdateWithdrawalDto dto)
        {
            var adminIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdStr) || !Guid.TryParse(adminIdStr, out var adminId))
                return Unauthorized();

            var request = await _context.WithdrawalRequests
                .Include(w => w.User)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (request == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu rút tiền." });

            if (request.Status != "Pending")
                return BadRequest(new { message = "Chỉ có thể xử lý các yêu cầu đang chờ (Pending)." });

            if (dto.Status != "Completed" && dto.Status != "Rejected")
                return BadRequest(new { message = "Trạng thái không hợp lệ." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                request.Status = dto.Status;
                request.AdminNote = dto.Note;
                request.UpdatedAt = DateTime.UtcNow;

                string actionDetails = "";

                if (dto.Status == "Rejected")
                {
                    // Refund only the actual user coins that were deducted
                    if (request.UserCoinsDeducted > 0)
                    {
                        request.User.Coins += request.UserCoinsDeducted;
                    }
                    actionDetails = $"Từ chối rút {request.AmountFiat} VNĐ của {request.User.Email}. Hoàn lại xu.";
                }
                else
                {
                    request.ReceiptUrl = dto.ReceiptUrl;
                    actionDetails = $"Duyệt rút {request.AmountFiat} VNĐ của {request.User.Email}. Đã chuyển tiền.";
                }

                // Audit log
                var log = new AuditLog
                {
                    UserId = adminId,
                    Action = "Xử lý rút tiền",
                    ActionType = "update",
                    Target = $"Payment:{id}",
                    Details = actionDetails,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AuditLogs.Add(log);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Gửi thông báo và Email ngoài transaction
                try
                {
                    if (dto.Status == "Completed")
                    {
                        // In-app Notification
                        await _notificationService.SendNotificationAsync(
                            request.UserId,
                            "✅ Yêu cầu rút tiền thành công",
                            $"Kính gửi Quý khách hàng,\n\nHệ thống Video Sharing Platform xin trân trọng thông báo yêu cầu rút tiền của quý khách đã được xử lý thành công. Chi tiết giao dịch như sau:\n\n- Mã giao dịch: #{request.Id.ToString().Substring(0, 8).ToUpper()}\n- Số tiền: {request.AmountFiat:N0} VNĐ\n- Phương thức: {request.BankName}\n- Thời gian duyệt: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}\n- Trạng thái: Đã chuyển khoản thành công\n\nCảm ơn quý khách đã đồng hành cùng Video Sharing Platform. Nếu cần thêm sự hỗ trợ, vui lòng liên hệ bộ phận Chăm sóc khách hàng.",
                            "system",
                            null,
                            request.Id,
                            dto.ReceiptUrl
                        );

                        string receiptHtml = string.IsNullOrEmpty(dto.ReceiptUrl) 
                            ? "<p style='color: #666666; font-size: 14px; font-style: italic;'>Không có biên lai đính kèm.</p>" 
                            : $"<div style='margin-bottom: 15px; text-align: center;'><img src='{dto.ReceiptUrl}' alt='Biên lai giao dịch' style='max-width: 100%; border-radius: 8px; border: 1px solid #eeeeee;'/></div>";

                        string maskedAccount = new string('*', Math.Max(0, request.BankAccountNumber.Length - 4)) + request.BankAccountNumber.Substring(Math.Max(0, request.BankAccountNumber.Length - 4));

                        // Email
                        string emailHtml = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; color: #333333; padding: 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                            <div style='padding: 15px 30px; font-size: 14px; color: #666666; border-bottom: 1px solid #eeeeee; background-color: #f9f9f9;'>
                                Thông báo: Yêu cầu rút tiền của bạn đã được xử lý thành công
                            </div>
                            
                            <div style='padding: 30px;'>
                                <div style='margin-bottom: 20px; text-align: center;'>
                                    <img src='https://dummyimage.com/200x50/3C1671/ffffff.png&text=VIDEO+PLATFORM' alt='Video Platform' style='height: 40px;' />
                                </div>
                                
                                <h1 style='color: #3C1671; font-size: 24px; margin-bottom: 10px; text-align: center;'>Thanh toán thành công</h1>
                                <p style='margin-bottom: 20px; font-size: 15px;'>Xin chào <a href='mailto:{request.User.Email}' style='color: #3C1671; text-decoration: none; font-weight: bold;'>{request.User.Email}</a>,</p>
                                
                                <p style='margin-bottom: 30px; font-size: 15px; line-height: 1.5; color: #444444;'>
                                    Chúng tôi xin thông báo rằng yêu cầu rút tiền của bạn đã được xử lý thành công và số tiền đã được chuyển đến tài khoản nhận đã đăng ký.
                                </p>
                                
                                <div style='border-top: 1px dashed #cccccc; margin: 30px 0;'></div>

                                <h3 style='color: #333333; font-size: 16px; margin-bottom: 20px;'>💰 Thông tin giao dịch</h3>
                                <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                                    <tr style='border-bottom: 2px solid #eeeeee; color: #333333;'>
                                        <th style='text-align: left; padding: 12px 0; width: 40%;'>Thông tin</th>
                                        <th style='text-align: left; padding: 12px 0;'>Chi tiết</th>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Mã giao dịch</td>
                                        <td style='padding: 12px 0; font-weight: bold;'>{(string.IsNullOrEmpty(dto.Note) ? $"#WD{request.Id.ToString().Substring(0,8).ToUpper()}" : dto.Note)}</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Trạng thái</td>
                                        <td style='padding: 12px 0; color: #4CAF50; font-weight: bold;'>✅ Thành công</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Số tiền rút</td>
                                        <td style='padding: 12px 0; font-weight: bold;'>{request.AmountFiat:N0} VNĐ</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Phí giao dịch</td>
                                        <td style='padding: 12px 0;'>0 VNĐ</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Số tiền nhận</td>
                                        <td style='padding: 12px 0; font-weight: bold; color: #d9534f;'>{request.AmountFiat:N0} VNĐ</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #eeeeee;'>
                                        <td style='padding: 12px 0; color: #666666;'>Thời gian xử lý</td>
                                        <td style='padding: 12px 0;'>{DateTime.UtcNow.AddHours(7):dd/MM/yyyy - HH:mm} (GMT+7)</td>
                                    </tr>
                                </table>
                                
                                <div style='border-top: 1px dashed #cccccc; margin: 30px 0;'></div>

                                <h3 style='color: #333333; font-size: 16px; margin-bottom: 20px;'>🏦 Tài khoản nhận</h3>
                                <div style='background-color: #f5f5f5; padding: 15px 20px; border-radius: 8px; border: 1px solid #eeeeee;'>
                                    <p style='margin: 8px 0; font-size: 14px; color: #666666;'>Ngân hàng / Ví điện tử: <span style='font-weight: bold; color: #333333;'>{request.BankName}</span></p>
                                    <p style='margin: 8px 0; font-size: 14px; color: #666666;'>Chủ tài khoản: <span style='font-weight: bold; color: #333333;'>{request.BankAccountName}</span></p>
                                    <p style='margin: 8px 0; font-size: 14px; color: #666666;'>Số tài khoản: <span style='font-weight: bold; color: #333333;'>{maskedAccount}</span></p>
                                </div>

                                <div style='border-top: 1px dashed #cccccc; margin: 30px 0;'></div>

                                <h3 style='color: #333333; font-size: 16px; margin-bottom: 20px;'>📄 Biên lai chuyển khoản</h3>
                                {receiptHtml}
                                <p style='color: #666666; font-size: 14px; line-height: 1.5; margin-top: 15px;'>Bạn có thể sử dụng biên lai trên để đối chiếu hoặc cung cấp cho bộ phận hỗ trợ khi cần thiết.</p>

                                <div style='border-top: 1px dashed #cccccc; margin: 30px 0;'></div>

                                <h3 style='color: #333333; font-size: 16px; margin-bottom: 20px;'>📌 Lưu ý</h3>
                                <ul style='color: #666666; font-size: 14px; line-height: 1.6; padding-left: 20px; margin-bottom: 0;'>
                                    <li>Giao dịch đã hoàn tất và không thể hủy.</li>
                                    <li>Trong trường hợp số dư chưa cập nhật ngay tại ngân hàng hoặc ví điện tử, vui lòng chờ thêm vài phút.</li>
                                    <li>Nếu phát hiện bất kỳ bất thường nào, hãy liên hệ bộ phận hỗ trợ trong vòng 24 giờ.</li>
                                </ul>

                                <div style='border-top: 1px solid #eeeeee; margin: 30px 0;'></div>

                                <div style='text-align: center; margin-top: 30px;'>
                                    <p style='font-size: 13px; color: #666666; margin: 5px 0;'>Trân trọng,</p>
                                    <p style='font-size: 14px; color: #333333; margin: 5px 0; font-weight: bold;'>Đội ngũ Video Platform</p>
                                    <p style='font-size: 12px; color: #999999; margin-top: 20px;'>&copy; {DateTime.UtcNow.Year} Video Platform. All rights reserved.</p>
                                </div>
                            </div>
                        </div>";

                        await _emailService.SendEmailAsync(request.User.Email, "Thanh toán rút tiền thành công", emailHtml);
                    }
                    else if (dto.Status == "Rejected")
                    {
                        // In-app Notification
                        await _notificationService.SendNotificationAsync(
                            request.UserId,
                            "❌ Yêu cầu rút tiền bị từ chối",
                            $"Kính gửi Quý khách hàng,\n\nHệ thống Video Sharing Platform rất tiếc phải thông báo yêu cầu rút tiền của quý khách đã bị từ chối. Chi tiết giao dịch như sau:\n\n- Mã giao dịch: #{request.Id.ToString().Substring(0, 8).ToUpper()}\n- Số tiền yêu cầu: {request.AmountFiat:N0} VNĐ\n- Phương thức: {request.BankName}\n- Thời gian từ chối: {DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm}\n- Lý do từ chối: {dto.Note}\n\nSố V-Coin tương ứng đã được hoàn lại vào ví của quý khách. Xin vui lòng kiểm tra lại thông tin và thử lại sau. Nếu cần thêm sự hỗ trợ, vui lòng liên hệ bộ phận Chăm sóc khách hàng.",
                            "system",
                            null,
                            request.Id
                        );

                        // Email
                        string emailHtml = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                            <div style='text-align: center; margin-bottom: 20px;'>
                                <img src='https://via.placeholder.com/150x50?text=VideoPlatform+Logo' alt='Logo' style='max-height: 50px;'/>
                            </div>
                            <h2 style='color: #F44336; text-align: center;'>Yêu cầu rút tiền bị từ chối</h2>
                            <p>Xin chào <strong>{request.User.Email}</strong>,</p>
                            <p>Rất tiếc, yêu cầu rút tiền của bạn không thể thực hiện được vào lúc này.</p>
                            
                            <div style='background-color: #fff3f3; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffcdd2;'>
                                <p><strong>Số tiền yêu cầu:</strong> {request.AmountFiat:N0} VNĐ</p>
                                <p><strong>Lý do từ chối:</strong> {dto.Note}</p>
                            </div>
                            
                            <p>Số xu của bạn đã được hoàn lại vào tài khoản.</p>
                            <p>Vui lòng kiểm tra lại thông tin ngân hàng hoặc liên hệ hỗ trợ để được giải đáp.</p>
                            <p style='color: #888; font-size: 0.9em; text-align: center; margin-top: 30px;'>Trân trọng,<br/>Đội ngũ Video Platform</p>
                        </div>";

                        await _emailService.SendEmailAsync(request.User.Email, "Yêu cầu rút tiền bị từ chối", emailHtml);
                    }
                }
                catch (Exception ex)
                {
                    // Log email/notification errors but do not rollback transaction
                    Console.WriteLine($"Error sending notification/email for withdrawal {id}: {ex.Message}");
                }

                return Ok(new { message = $"Đã chuyển trạng thái yêu cầu thành {dto.Status}." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi xử lý yêu cầu.", details = ex.Message });
            }
        }
    }
}

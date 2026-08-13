using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

using Video_Platform_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ApplicationDbContext _context;

        public UploadController(IWebHostEnvironment environment, ApplicationDbContext context)
        {
            _environment = environment;
            _context = context;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Không tìm thấy file" });
            }

            // Chỉ cho phép ảnh
            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest(new { message = "File không phải là định dạng ảnh" });
            }

            // Đảm bảo thư mục tồn tại
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Tạo tên file ngẫu nhiên để tránh trùng lặp
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Lấy BaseUrl (vd: https://localhost:7123)
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
            
            var fileUrl = $"{baseUrl}/uploads/{uniqueFileName}";

            return Ok(new { url = fileUrl });
        }

        [HttpPost("video")]
        [RequestSizeLimit(1073741824)] // 1GB
        [RequestFormLimits(MultipartBodyLengthLimit = 1073741824)]
        public async Task<IActionResult> UploadVideo(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Không tìm thấy file" });
            }

            // Lấy giới hạn từ SystemSettings
            var maxSizeSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "maxUploadSize");
            long maxSizeMB = 1024; // Default 1GB
            if (maxSizeSetting != null && long.TryParse(maxSizeSetting.Value, out var parsedSize))
            {
                maxSizeMB = parsedSize;
            }

            long maxSizeBytes = maxSizeMB * 1024 * 1024;
            if (file.Length > maxSizeBytes)
            {
                return BadRequest(new { message = $"Dung lượng video vượt quá giới hạn cho phép ({maxSizeMB}MB)." });
            }

            // Chỉ cho phép định dạng video cấu hình (nếu có)
            var allowedExtensionsSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "allowedExtensions");
            if (allowedExtensionsSetting != null && !string.IsNullOrWhiteSpace(allowedExtensionsSetting.Value))
            {
                var allowedExts = allowedExtensionsSetting.Value.Split(',').Select(e => e.Trim().ToLower()).ToList();
                var fileExt = Path.GetExtension(file.FileName).TrimStart('.').ToLower();
                if (!allowedExts.Contains(fileExt) && !allowedExts.Contains("." + fileExt))
                {
                    return BadRequest(new { message = $"Định dạng không được hỗ trợ. Các định dạng cho phép: {allowedExtensionsSetting.Value}" });
                }
            }
            else if (!file.ContentType.StartsWith("video/"))
            {
                return BadRequest(new { message = "File không phải là định dạng video" });
            }

            // Đảm bảo thư mục tồn tại
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "videos");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Tạo tên file ngẫu nhiên để tránh trùng lặp
            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
            
            var fileUrl = $"{baseUrl}/uploads/videos/{uniqueFileName}";

            return Ok(new { url = fileUrl });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminCommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminCommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/admincomments
        [HttpGet]
        public async Task<IActionResult> GetComments()
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .ThenInclude(u => u.Profile)
                .Include(c => c.Video)
                .ThenInclude(v => v.VideoThumbnails)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    Id = c.Id,
                    Content = c.Content, // Original content
                    DisplayContent = c.DisplayContent,
                    FilterStatus = c.FilterStatus ?? "Normal",
                    MatchedKeywords = c.MatchedKeywords,
                    CreatedAt = c.CreatedAt,
                    VideoTitle = c.Video != null ? c.Video.Title : null,
                    VideoThumbnail = c.Video != null && c.Video.VideoThumbnails.Any() ? c.Video.VideoThumbnails.FirstOrDefault()!.ThumbnailUrl : null,
                    UserName = c.User.Profile != null ? (c.User.Profile.FullName ?? c.User.Email) : c.User.Email,
                    UserAvatar = c.User.Profile != null ? c.User.Profile.AvatarUrl : null,
                    UserEmail = c.User.Email
                })
                .ToListAsync();

            return Ok(comments);
        }

        // DELETE: api/admincomments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(Guid id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return NotFound("Bình luận không tồn tại");

            _context.Comments.Remove(comment);
            
            // Also decrement the video's CommentsCount
            var video = await _context.Videos.FindAsync(comment.VideoId);
            if (video != null && (video.CommentsCount ?? 0) > 0)
            {
                video.CommentsCount -= 1;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bình luận" });
        }

        // --- BANNED WORDS API ---

        // GET: api/admincomments/bannedwords
        [HttpGet("bannedwords")]
        public async Task<IActionResult> GetBannedWords()
        {
            var words = await _context.BannedWords.OrderByDescending(w => w.CreatedAt).ToListAsync();
            return Ok(words);
        }

        // POST: api/admincomments/bannedwords
        [HttpPost("bannedwords")]
        public async Task<IActionResult> CreateBannedWord([FromBody] BannedWordCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Keyword)) return BadRequest("Từ khóa không được để trống");

            var word = new BannedWord
            {
                Keyword = dto.Keyword.Trim(),
                Level = dto.Level,
                IsActive = dto.IsActive,
                Description = dto.Description,
                HitCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.BannedWords.Add(word);
            await _context.SaveChangesAsync();

            return Ok(word);
        }

        // PUT: api/admincomments/bannedwords/{id}
        [HttpPut("bannedwords/{id}")]
        public async Task<IActionResult> UpdateBannedWord(int id, [FromBody] BannedWordCreateDto dto)
        {
            var word = await _context.BannedWords.FindAsync(id);
            if (word == null) return NotFound("Không tìm thấy từ khóa");

            if (!string.IsNullOrWhiteSpace(dto.Keyword)) word.Keyword = dto.Keyword.Trim();
            word.Level = dto.Level;
            word.IsActive = dto.IsActive;
            word.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(word);
        }

        // DELETE: api/admincomments/bannedwords/{id}
        [HttpDelete("bannedwords/{id}")]
        public async Task<IActionResult> DeleteBannedWord(int id)
        {
            var word = await _context.BannedWords.FindAsync(id);
            if (word == null) return NotFound("Không tìm thấy từ khóa");

            _context.BannedWords.Remove(word);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class BannedWordCreateDto
    {
        [Required]
        public string Keyword { get; set; } = string.Empty;
        
        [Required]
        public string Level { get; set; } = "Medium";
        
        public bool IsActive { get; set; } = true;
        
        public string? Description { get; set; }
    }
}

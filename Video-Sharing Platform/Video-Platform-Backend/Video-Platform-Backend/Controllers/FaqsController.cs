using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FaqsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FaqsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/faqs
        [HttpGet]
        public async Task<IActionResult> GetActiveFaqs()
        {
            var faqs = await _context.Faqs
                .Where(f => f.IsActive)
                .OrderBy(f => f.OrderIndex)
                .ThenBy(f => f.CreatedAt)
                .Select(f => new
                {
                    f.Id,
                    f.Question,
                    f.Answer,
                    f.OrderIndex,
                    f.IsActive
                })
                .ToListAsync();

            return Ok(faqs);
        }

        // GET: api/faqs/all (Admin only)
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllFaqs()
        {
            var faqs = await _context.Faqs
                .OrderBy(f => f.OrderIndex)
                .ThenBy(f => f.CreatedAt)
                .ToListAsync();

            return Ok(faqs);
        }

        // POST: api/faqs
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateFaq([FromBody] Faq request)
        {
            if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
                return BadRequest(new { message = "Câu hỏi và câu trả lời không được để trống." });

            var faq = new Faq
            {
                Id = Guid.NewGuid(),
                Question = request.Question,
                Answer = request.Answer,
                OrderIndex = request.OrderIndex,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Faqs.Add(faq);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActiveFaqs), new { id = faq.Id }, faq);
        }

        // PUT: api/faqs/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFaq(Guid id, [FromBody] Faq request)
        {
            var faq = await _context.Faqs.FindAsync(id);
            if (faq == null) return NotFound(new { message = "Không tìm thấy FAQ." });

            if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
                return BadRequest(new { message = "Câu hỏi và câu trả lời không được để trống." });

            faq.Question = request.Question;
            faq.Answer = request.Answer;
            faq.OrderIndex = request.OrderIndex;
            faq.IsActive = request.IsActive;
            faq.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(faq);
        }

        // DELETE: api/faqs/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFaq(Guid id)
        {
            var faq = await _context.Faqs.FindAsync(id);
            if (faq == null) return NotFound(new { message = "Không tìm thấy FAQ." });

            _context.Faqs.Remove(faq);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xoá FAQ thành công." });
        }
    }
}

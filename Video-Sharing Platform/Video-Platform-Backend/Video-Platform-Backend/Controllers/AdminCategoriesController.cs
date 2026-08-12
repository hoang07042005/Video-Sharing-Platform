using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminCategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/admincategories
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.VideoCategories
                .Select(c => new
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Icon = c.Icon,
                    IsActive = c.IsActive,
                    VideoCount = _context.Videos.Count(v => v.CategoryId == c.Id)
                })
                .OrderByDescending(c => c.VideoCount)
                .ToListAsync();

            return Ok(categories);
        }

        // POST: api/admincategories
        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Tên danh mục không được để trống");

            var category = new VideoCategory
            {
                Name = dto.Name,
                Description = dto.Description,
                Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "LayoutGrid" : dto.Icon,
                IsActive = dto.IsActive
            };

            _context.VideoCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Icon = category.Icon,
                IsActive = category.IsActive,
                VideoCount = 0
            });
        }

        // PUT: api/admincategories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryCreateDto dto)
        {
            var category = await _context.VideoCategories.FindAsync(id);
            if (category == null) return NotFound("Không tìm thấy danh mục");

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                category.Name = dto.Name;
            }
            category.Description = dto.Description;
            category.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "LayoutGrid" : dto.Icon;
            category.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Icon = category.Icon,
                IsActive = category.IsActive,
                VideoCount = await _context.Videos.CountAsync(v => v.CategoryId == category.Id)
            });
        }

        // DELETE: api/admincategories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.VideoCategories.FindAsync(id);
            if (category == null) return NotFound("Không tìm thấy danh mục");

            // Kiểm tra xem danh mục có video nào không
            var videoCount = await _context.Videos.CountAsync(v => v.CategoryId == id);
            if (videoCount > 0)
            {
                return BadRequest("Không thể xóa danh mục đang có video. Vui lòng chuyển các video sang danh mục khác trước.");
            }

            _context.VideoCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class CategoryCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; } = "LayoutGrid";
        public bool IsActive { get; set; } = true;
    }
}

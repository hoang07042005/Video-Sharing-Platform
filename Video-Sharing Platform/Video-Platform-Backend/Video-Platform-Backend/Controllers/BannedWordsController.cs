using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Extensions;

namespace Video_Platform_Backend.Controllers;

[Route("api/admin/[controller]")]
[ApiController]
// [Authorize(Roles = "Admin, Moderator")]
public class BannedWordsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BannedWordsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBannedWords()
    {
        var words = await _context.BannedWords.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(words);
    }

    [HttpPost]
    public async Task<IActionResult> AddBannedWord([FromBody] BannedWord dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Keyword))
            return BadRequest("Keyword is required.");

        var existing = await _context.BannedWords.FirstOrDefaultAsync(b => b.Keyword.ToLower() == dto.Keyword.ToLower());
        if (existing != null)
            return BadRequest("Keyword already exists.");

        var newWord = new BannedWord
        {
            Keyword = dto.Keyword,
            Level = dto.Level ?? "Medium",
            Description = dto.Description,
            IsActive = dto.IsActive
        };

        _context.BannedWords.Add(newWord);
        
        this.AddAuditLog(_context, "Thêm từ khóa cấm", "add", "BannedWords", $"Từ khóa: {newWord.Keyword}");
        
        await _context.SaveChangesAsync();

        return Ok(newWord);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBannedWord(int id, [FromBody] BannedWord dto)
    {
        var word = await _context.BannedWords.FindAsync(id);
        if (word == null) return NotFound();

        word.Keyword = dto.Keyword ?? word.Keyword;
        word.Level = dto.Level ?? word.Level;
        word.Description = dto.Description ?? word.Description;
        word.IsActive = dto.IsActive;

        this.AddAuditLog(_context, "Sửa từ khóa cấm", "update", "BannedWords", $"Từ khóa: {word.Keyword}");

        await _context.SaveChangesAsync();
        return Ok(word);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBannedWord(int id)
    {
        var word = await _context.BannedWords.FindAsync(id);
        if (word == null) return NotFound();

        _context.BannedWords.Remove(word);
        
        this.AddAuditLog(_context, "Xóa từ khóa cấm", "delete", "BannedWords", $"Từ khóa: {word.Keyword}");

        await _context.SaveChangesAsync();
        return NoContent();
    }
}

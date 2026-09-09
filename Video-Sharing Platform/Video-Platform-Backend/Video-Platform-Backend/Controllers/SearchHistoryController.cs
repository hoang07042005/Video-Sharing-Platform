using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Controllers;

[Route("api/search-history")]
[ApiController]
[Authorize]
public class SearchHistoryController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SearchHistoryController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var items = await _db.SearchHistories
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.SearchedAt)
            .Take(100)
            .Select(item => new { item.Id, item.Query, item.SearchedAt })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveSearchHistoryRequest request)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var query = request.Query?.Trim();
        if (string.IsNullOrWhiteSpace(query)) return BadRequest(new { message = "Từ khóa không được để trống." });

        var item = await _db.SearchHistories.FirstOrDefaultAsync(
            history => history.UserId == userId && history.Query == query);
        if (item == null)
        {
            item = new SearchHistory { Id = Guid.NewGuid(), UserId = userId, Query = query };
            _db.SearchHistories.Add(item);
        }
        else
        {
            item.SearchedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { item.Id, item.Query, item.SearchedAt });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var item = await _db.SearchHistories.FirstOrDefaultAsync(history => history.Id == id && history.UserId == userId);
        if (item == null) return NotFound();

        _db.SearchHistories.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var items = await _db.SearchHistories.Where(history => history.UserId == userId).ToListAsync();
        _db.SearchHistories.RemoveRange(items);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out userId);
    }
}

public class SaveSearchHistoryRequest
{
    public string Query { get; set; } = string.Empty;
}

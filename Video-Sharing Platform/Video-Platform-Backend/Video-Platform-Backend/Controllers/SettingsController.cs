using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Extensions;

namespace Video_Platform_Backend.Controllers;

[Route("api/admin/[controller]")]
[ApiController]
// [Authorize(Roles = "Admin")] // Uncomment if needed based on existing roles
public class SettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SettingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/admin/settings
    [HttpGet]
    public async Task<ActionResult<Dictionary<string, object>>> GetSettings()
    {
        var settings = await _context.SystemSettings.ToListAsync();
        
        // Convert to a dictionary for easy frontend mapping
        var result = new Dictionary<string, object>();
        
        foreach (var setting in settings)
        {
            if (setting.Type == "boolean")
            {
                result[setting.Key] = bool.Parse(setting.Value);
            }
            else if (setting.Type == "number")
            {
                result[setting.Key] = double.Parse(setting.Value);
            }
            else
            {
                result[setting.Key] = setting.Value;
            }
        }
        
        // If DB is empty, maybe return some defaults or empty dict
        return Ok(result);
    }

    // GET: api/admin/settings/public
    [HttpGet("public")]
    public async Task<ActionResult<Dictionary<string, object>>> GetPublicSettings()
    {
        var settings = await _context.SystemSettings
            .Where(s => s.Key == "siteName" || s.Key == "logoUrl" || s.Key == "faviconUrl" || s.Key == "allowRegistration" || s.Key == "allowDownloads" || s.Key == "maintenanceMode" || s.Key == "maxUploadSize" || s.Key == "contactEmail" || s.Key == "supportPhone")
            .ToListAsync();
        
        var result = new Dictionary<string, object>();
        foreach (var setting in settings)
        {
            if (setting.Type == "boolean") result[setting.Key] = bool.Parse(setting.Value);
            else if (setting.Type == "number") result[setting.Key] = double.Parse(setting.Value);
            else result[setting.Key] = setting.Value;
        }
        
        // Provide defaults if DB doesn't have them yet
        if (!result.ContainsKey("allowRegistration")) result["allowRegistration"] = true;
        if (!result.ContainsKey("allowDownloads")) result["allowDownloads"] = true;
        if (!result.ContainsKey("maxUploadSize")) result["maxUploadSize"] = 1024;
        if (!result.ContainsKey("contactEmail")) result["contactEmail"] = "support@videosharing.vn";
        if (!result.ContainsKey("supportPhone")) result["supportPhone"] = "1900 1234";
        
        return Ok(result);
    }

    // PUT: api/admin/settings
    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] Dictionary<string, object> payload)
    {
        foreach (var kvp in payload)
        {
            var key = kvp.Key;
            var value = kvp.Value?.ToString() ?? "";
            
            var type = "string";
            if (kvp.Value is System.Text.Json.JsonElement element)
            {
                if (element.ValueKind == System.Text.Json.JsonValueKind.True || element.ValueKind == System.Text.Json.JsonValueKind.False) type = "boolean";
                else if (element.ValueKind == System.Text.Json.JsonValueKind.Number) type = "number";
            }
            else if (kvp.Value is bool) type = "boolean";
            else if (kvp.Value is double || kvp.Value is int || kvp.Value is long) type = "number";

            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            
            if (setting != null)
            {
                setting.Value = value;
                setting.Type = type;
            }
            else
            {
                _context.SystemSettings.Add(new SystemSetting
                {
                    Key = key,
                    Value = value,
                    Type = type,
                    GroupName = "General"
                });
            }
        }

        this.AddAuditLog(_context, "Cập nhật cài đặt hệ thống", "update", "SystemSettings", $"Đã cập nhật {payload.Count} cài đặt");
        
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

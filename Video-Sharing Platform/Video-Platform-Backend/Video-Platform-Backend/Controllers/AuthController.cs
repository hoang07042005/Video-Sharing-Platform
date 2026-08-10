using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;

namespace Video_Platform_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { Message = "Email already in use." });
            }

            if (await _context.Users.AnyAsync(u => u.PhoneNumber == dto.PhoneNumber))
            {
                return BadRequest(new { Message = "Phone number already in use." });
            }

            if (await _context.Channels.AnyAsync(c => c.Handle == dto.Handle))
            {
                return BadRequest(new { Message = "Handle already taken." });
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = passwordHash,
                Role = "User"
            };

            var profile = new Profile
            {
                User = user,
                FullName = dto.FullName
            };

            var channel = new Channel
            {
                User = user,
                ChannelName = dto.ChannelName,
                Handle = dto.Handle
            };

            _context.Users.Add(user);
            _context.Profiles.Add(profile);
            _context.Channels.Add(channel);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Registration successful" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Channel)
                .FirstOrDefaultAsync(u => u.Email == dto.EmailOrPhone || u.PhoneNumber == dto.EmailOrPhone);

            if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new { Message = "Invalid credentials." });
            }

            if (user.IsActive != true || user.IsBanned == true)
            {
                return Unauthorized(new { Message = "Account is inactive or banned." });
            }

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName,
                Role = user.Role ?? "User",
                Handle = user.Channel?.Handle,
                AvatarUrl = user.Profile?.AvatarUrl
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["Secret"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role ?? "User"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

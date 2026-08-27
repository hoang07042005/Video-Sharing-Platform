using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.DTOs;
using Video_Platform_Backend.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Authorization;

namespace Video_Platform_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IMemoryCache cache, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var allowRegistrationSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "allowRegistration");
            if (allowRegistrationSetting != null && allowRegistrationSetting.Value == "false")
            {
                return StatusCode(403, new { Message = "Registration is currently disabled by the administrator." });
            }

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

            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            var userRoles = new List<UserRole>();
            if (userRole != null)
            {
                userRoles.Add(new UserRole { RoleId = userRole.Id });
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = passwordHash,
                UserRoles = userRoles
            };

            var defaultAvatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FullName)}&background=random";

            var profile = new Profile
            {
                User = user,
                FullName = dto.FullName,
                AvatarUrl = defaultAvatar
            };

            var channel = new Channel
            {
                User = user,
                ChannelName = dto.ChannelName,
                Handle = dto.Handle,
                AvatarUrl = defaultAvatar
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
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
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

            var userRoles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            if (!userRoles.Any()) userRoles.Add("User");

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName,
                Roles = userRoles,
                Handle = user.Channel?.Handle,
                AvatarUrl = user.Channel?.AvatarUrl ?? user.Profile?.AvatarUrl,
                Coins = user.Coins
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                // To prevent email enumeration, we still return Ok but do nothing
                return Ok(new { Message = "If that email exists, an OTP has been sent." });
            }

            var otp = new Random().Next(100000, 999999).ToString();
            
            _cache.Set($"OTP_{dto.Email}", otp, TimeSpan.FromMinutes(10));

            var subject = "Khôi phục mật khẩu - Video Sharing Platform";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                    <h2 style='color: #FF5722;'>Mã xác thực của bạn</h2>
                    <p>Bạn đã yêu cầu khôi phục mật khẩu. Dưới đây là mã OTP của bạn (có hiệu lực trong 10 phút):</p>
                    <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;'>
                        {otp}
                    </div>
                    <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(dto.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine("EMAIL EXCEPTION: " + ex.ToString());
                // In production, log this exception
                return StatusCode(500, new { Message = "Could not send email. Please try again later." });
            }

            return Ok(new { Message = "OTP sent successfully." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!_cache.TryGetValue($"OTP_{dto.Email}", out string? storedOtp) || storedOtp != dto.Otp)
            {
                return BadRequest(new { Message = "Mã OTP không hợp lệ hoặc đã hết hạn." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                return BadRequest(new { Message = "Người dùng không tồn tại." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _cache.Remove($"OTP_{dto.Email}");

            return Ok(new { Message = "Mật khẩu đã được cập nhật thành công." });
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.PasswordHash == null)
            {
                return BadRequest(new { Message = "Người dùng không hợp lệ." });
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
            {
                return BadRequest(new { Message = "Mật khẩu cũ không chính xác." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Mật khẩu đã được cập nhật thành công." });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            try
            {
                string email = null;
                string name = null;
                string picture = null;
                string subject = null;

                if (dto.Token.Split('.').Length == 3)
                {
                    var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings();
                    var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(dto.Token, settings);
                    email = payload.Email;
                    name = payload.Name;
                    picture = payload.Picture;
                    subject = payload.Subject;
                }
                else
                {
                    using (var httpClient = new HttpClient())
                    {
                        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", dto.Token);
                        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                        if (!response.IsSuccessStatusCode)
                        {
                            var errContent = await response.Content.ReadAsStringAsync();
                            return BadRequest(new { Message = $"Lỗi từ Google: {response.StatusCode} - {errContent}" });
                        }
                        var content = await response.Content.ReadAsStringAsync();
                        var userInfo = System.Text.Json.JsonDocument.Parse(content);
                        
                        email = userInfo.RootElement.GetProperty("email").GetString();
                        if (userInfo.RootElement.TryGetProperty("name", out var nameProp))
                            name = nameProp.GetString();
                        if (userInfo.RootElement.TryGetProperty("picture", out var pictureProp))
                            picture = pictureProp.GetString();
                        if (userInfo.RootElement.TryGetProperty("sub", out var subProp))
                            subject = subProp.GetString();
                    }
                }

                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { Message = "Không thể lấy thông tin email từ Google." });
                }

                // Check if user exists
                var user = await _context.Users
                    .Include(u => u.Profile)
                    .Include(u => u.Channel)
                    .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(u => u.Email == email);

                bool isNewUser = false;
                if (user == null)
                {
                    isNewUser = true;
                    // Register new user
                    var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
                    var userRoles = new List<UserRole>();
                    if (userRole != null)
                    {
                        userRoles.Add(new UserRole { RoleId = userRole.Id });
                    }

                    user = new User
                    {
                        Email = email,
                        GoogleId = subject,
                        IsEmailVerified = true,
                        UserRoles = userRoles,
                        // No password since they use Google
                    };

                    var profile = new Profile
                    {
                        User = user,
                        FullName = name,
                        AvatarUrl = picture
                    };

                    // Generate a default handle based on email or name
                    var baseHandle = "@" + email.Split('@')[0];
                    var uniqueHandle = baseHandle;
                    int count = 1;
                    while (await _context.Channels.AnyAsync(c => c.Handle == uniqueHandle))
                    {
                        uniqueHandle = $"{baseHandle}{count}";
                        count++;
                    }

                    var channel = new Channel
                    {
                        User = user,
                        ChannelName = name,
                        Handle = uniqueHandle,
                        AvatarUrl = picture
                    };

                    _context.Users.Add(user);
                    _context.Profiles.Add(profile);
                    _context.Channels.Add(channel);

                    await _context.SaveChangesAsync();
                }
                else
                {
                    bool isUpdated = false;
                    // If user exists but doesn't have GoogleId set, update it
                    if (string.IsNullOrEmpty(user.GoogleId))
                    {
                        user.GoogleId = subject;
                        isUpdated = true;
                    }

                    // Fix missing '@' prefix for old accounts
                    if (user.Channel != null && !user.Channel.Handle.StartsWith("@"))
                    {
                        user.Channel.Handle = "@" + user.Channel.Handle;
                        isUpdated = true;
                    }

                    if (isUpdated)
                    {
                        await _context.SaveChangesAsync();
                    }
                }

                if (user.IsActive != true || user.IsBanned == true)
                {
                    return Unauthorized(new { Message = "Account is inactive or banned." });
                }

                var token = GenerateJwtToken(user);
                var roles = user.UserRoles?.Select(ur => ur.Role.Name).ToList() ?? new List<string> { "User" };

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    UserId = user.Id,
                    Email = user.Email,
                    FullName = user.Profile?.FullName,
                    Roles = roles,
                    Handle = user.Channel?.Handle,
                    AvatarUrl = user.Channel?.AvatarUrl ?? user.Profile?.AvatarUrl,
                    Coins = user.Coins,
                    IsNewUser = isNewUser
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Invalid Google token.", Error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Channel)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            var dto = new UserProfileDto
            {
                FullName = user.Profile?.FullName,
                PhoneNumber = user.PhoneNumber,
                Bio = user.Profile?.Bio,
                DateOfBirth = user.Profile?.DateOfBirth.HasValue == true ? user.Profile.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue) : null,
                ChannelName = user.Channel?.ChannelName,
                Handle = user.Channel?.Handle,
                Description = user.Channel?.Description,
                ReceiveNewVideoNotifications = user.ReceiveNewVideoNotifications,
                ReceiveCommentNotifications = user.ReceiveCommentNotifications
            };

            return Ok(dto);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Channel)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            // Check if handle is taken by another user
            if (!string.IsNullOrEmpty(dto.Handle) && dto.Handle != user.Channel?.Handle)
            {
                if (await _context.Channels.AnyAsync(c => c.Handle == dto.Handle))
                {
                    return BadRequest(new { Message = "Handle already taken." });
                }
            }

            user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;
            
            if (dto.ReceiveNewVideoNotifications.HasValue)
                user.ReceiveNewVideoNotifications = dto.ReceiveNewVideoNotifications.Value;
                
            if (dto.ReceiveCommentNotifications.HasValue)
                user.ReceiveCommentNotifications = dto.ReceiveCommentNotifications.Value;

            if (user.Profile != null)
            {
                user.Profile.FullName = dto.FullName ?? user.Profile.FullName;
                user.Profile.Bio = dto.Bio ?? user.Profile.Bio;
                
                if (dto.DateOfBirth.HasValue)
                {
                    user.Profile.DateOfBirth = DateOnly.FromDateTime(dto.DateOfBirth.Value);
                }
            }

            if (user.Channel != null)
            {
                user.Channel.ChannelName = dto.ChannelName ?? user.Channel.ChannelName;
                user.Channel.Handle = dto.Handle ?? user.Channel.Handle;
                user.Channel.Description = dto.Description ?? user.Channel.Description;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Profile updated successfully." });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "YourFallbackSecretKeyHere1234567890";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if (user.UserRoles != null && user.UserRoles.Any())
            {
                foreach (var userRole in user.UserRoles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
                }
            }
            else
            {
                claims.Add(new Claim(ClaimTypes.Role, "User"));
            }

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

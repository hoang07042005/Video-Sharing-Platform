using System.ComponentModel.DataAnnotations;

namespace Video_Platform_Backend.DTOs
{
    public class RegisterDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;
        
        [Required, MinLength(6)]
        public string Password { get; set; } = null!;
        
        [Required, MaxLength(150)]
        public string FullName { get; set; } = null!;
        
        [Required, MaxLength(100)]
        public string ChannelName { get; set; } = null!;
        
        [Required, MaxLength(50)]
        public string Handle { get; set; } = null!;

        [Required, RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Invalid phone number")]
        public string PhoneNumber { get; set; } = null!;
    }

    public class LoginDto
    {
        [Required]
        public string EmailOrPhone { get; set; } = null!;
        
        [Required]
        public string Password { get; set; } = null!;
    }

    public class AuthResponseDto
    {
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string? Handle { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class UpdateUserRolesDto
    {
        public List<string> Roles { get; set; } = new List<string>();
    }
}

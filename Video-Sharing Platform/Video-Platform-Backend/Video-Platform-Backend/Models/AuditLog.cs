using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        public Guid? UserId { get; set; }
        public User User { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; }

        [Required]
        [MaxLength(50)]
        public string ActionType { get; set; } // 'update', 'add', 'delete', 'assign'

        [MaxLength(255)]
        public string Target { get; set; }

        [MaxLength(500)]
        public string Details { get; set; }

        [MaxLength(50)]
        public string IpAddress { get; set; }

        [MaxLength(255)]
        public string Browser { get; set; }

        [MaxLength(50)]
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

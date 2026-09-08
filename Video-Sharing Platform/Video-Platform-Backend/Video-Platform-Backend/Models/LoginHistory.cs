using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Video_Platform_Backend.Models
{
    public class LoginHistory
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public string DeviceName { get; set; }
        public string DeviceType { get; set; }
        public string IpAddress { get; set; }
        public string Location { get; set; }
        public DateTime LoginTime { get; set; }
        public bool IsSuccess { get; set; }
        public string TokenIdentifier { get; set; }
        public bool IsActive { get; set; }
    }
}

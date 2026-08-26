using System;

namespace Video_Platform_Backend.DTOs
{
    public class UserProfileDto
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Bio { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? ChannelName { get; set; }
        public string? Handle { get; set; }
        public string? Description { get; set; }
        public bool ReceiveNewVideoNotifications { get; set; }
        public bool ReceiveCommentNotifications { get; set; }
    }

    public class UpdateProfileDto
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Bio { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? ChannelName { get; set; }
        public string? Handle { get; set; }
        public string? Description { get; set; }
        public bool? ReceiveNewVideoNotifications { get; set; }
        public bool? ReceiveCommentNotifications { get; set; }
    }
}

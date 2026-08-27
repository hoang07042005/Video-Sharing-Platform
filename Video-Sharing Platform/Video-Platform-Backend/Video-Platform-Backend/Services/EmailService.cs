using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public EmailService(IConfiguration configuration, ApplicationDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            var settings = await _context.SystemSettings
                .Where(s => s.Key == "smtpHost" || s.Key == "smtpPort" || s.Key == "smtpUser" || s.Key == "smtpPass")
                .ToDictionaryAsync(s => s.Key, s => s.Value);

            var dbPass = settings.GetValueOrDefault("smtpPass");
            if (string.IsNullOrEmpty(dbPass) || dbPass == "********")
            {
                dbPass = null;
            }
            
            var host = settings.GetValueOrDefault("smtpHost") ?? Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
            var portStr = settings.GetValueOrDefault("smtpPort") ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
            var port = int.Parse(portStr);
            var username = settings.GetValueOrDefault("smtpUser") ?? Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? "";
            var password = dbPass ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "";
            password = password.Replace(" ", "");

            Console.WriteLine($"[EMAIL] Chuẩn bị gửi email đến: {toEmail}");
            Console.WriteLine($"[EMAIL] SMTP Host: {host}:{port}, User: {username}");
            Console.WriteLine($"[EMAIL] Password length: {password.Length} chars");

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(username!),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"[EMAIL] ✅ Đã gửi email thành công đến: {toEmail}");
        }
    }
}

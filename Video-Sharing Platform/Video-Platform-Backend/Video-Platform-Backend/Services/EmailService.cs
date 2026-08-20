using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Video_Platform_Backend.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            var host = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
            var port = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
            var username = Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? "";
            var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "";

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
        }
    }
}

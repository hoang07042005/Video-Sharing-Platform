using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace Video_Platform_Backend.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage, List<string> attachmentUrls = null, Dictionary<string, string> inlineImages = null);
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

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage, List<string> attachmentUrls = null, Dictionary<string, string> inlineImages = null)
        {
            var settings = await _context.SystemSettings
                .Where(s => s.Key == "smtpHost" || s.Key == "smtpPort" || s.Key == "smtpUser" || s.Key == "smtpPass" || s.Key == "siteName")
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
            
            var siteName = settings.GetValueOrDefault("siteName") ?? "Video Platform";

            Console.WriteLine($"[EMAIL] Chuẩn bị gửi email đến: {toEmail} qua {host}:{port}");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(siteName, username));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder();
            string processedHtml = htmlMessage;

            if (inlineImages != null && inlineImages.Any())
            {
                using var httpClient = new HttpClient();
                foreach (var img in inlineImages)
                {
                    try
                    {
                        string cid = img.Key;
                        string url = img.Value;
                        if (string.IsNullOrWhiteSpace(url)) continue;

                        var isUrl = Uri.TryCreate(url, UriKind.Absolute, out Uri uriResult) 
                                    && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
                        
                        Stream stream = null;
                        if (isUrl)
                        {
                            string localPath = uriResult.LocalPath;
                            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                            string physicalPath = Path.Combine(webRoot, localPath.TrimStart('/'));

                            if (System.IO.File.Exists(physicalPath))
                            {
                                stream = System.IO.File.OpenRead(physicalPath);
                            }
                            else
                            {
                                var response = await httpClient.GetAsync(url);
                                if (response.IsSuccessStatusCode)
                                {
                                    stream = await response.Content.ReadAsStreamAsync();
                                }
                            }
                        }
                        else if (System.IO.File.Exists(url))
                        {
                            stream = System.IO.File.OpenRead(url);
                        }
                        else if (!isUrl && url.StartsWith("/"))
                        {
                            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                            string physicalPath = Path.Combine(webRoot, url.TrimStart('/'));
                            if (System.IO.File.Exists(physicalPath))
                            {
                                stream = System.IO.File.OpenRead(physicalPath);
                            }
                        }

                        if (stream != null)
                        {
                            var ms = new MemoryStream();
                            await stream.CopyToAsync(ms);
                            ms.Position = 0;
                            
                            string contentType = "image/png";
                            if (url.ToLower().EndsWith(".jpg") || url.ToLower().EndsWith(".jpeg"))
                            {
                                contentType = "image/jpeg";
                            }
                                
                            var generatedCid = MimeKit.Utils.MimeUtils.GenerateMessageId();
                            var imageAttachment = builder.LinkedResources.Add(cid, ms, MimeKit.ContentType.Parse(contentType));
                            imageAttachment.ContentId = generatedCid;
                            
                            // Dynamically update the HTML to use the strict RFC-compliant CID
                            processedHtml = processedHtml.Replace($"cid:{cid}", $"cid:{generatedCid}");
                            
                            Console.WriteLine($"[EMAIL] Đã đính kèm Inline Image (MailKit): {generatedCid}, Size: {ms.Length} bytes");
                            
                            if (isUrl) await stream.DisposeAsync();
                            else stream.Dispose();
                        }
                        else
                        {
                            // Fallback
                            processedHtml = processedHtml.Replace($"cid:{cid}", url);
                            Console.WriteLine($"[EMAIL] Fallback ảnh {cid} thành external URL: {url}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[EMAIL] Lỗi tải inline image {img.Value}: {ex.Message}");
                        processedHtml = processedHtml.Replace($"cid:{img.Key}", img.Value);
                    }
                }
            }

            builder.HtmlBody = processedHtml;

            if (attachmentUrls != null && attachmentUrls.Any())
            {
                using var httpClient = new HttpClient();
                foreach (var url in attachmentUrls)
                {
                    if (string.IsNullOrWhiteSpace(url)) continue;
                    
                    try
                    {
                        var isUrl = Uri.TryCreate(url, UriKind.Absolute, out Uri uriResult) 
                                    && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
                        
                        if (isUrl)
                        {
                            var response = await httpClient.GetAsync(url);
                            if (response.IsSuccessStatusCode)
                            {
                                var stream = await response.Content.ReadAsStreamAsync();
                                var ms = new MemoryStream();
                                await stream.CopyToAsync(ms);
                                ms.Position = 0;
                                var filename = Path.GetFileName(uriResult.LocalPath);
                                if (string.IsNullOrEmpty(filename) || !filename.Contains(".")) filename = "attachment.png";
                                
                                builder.Attachments.Add(filename, ms);
                            }
                        }
                        else if (System.IO.File.Exists(url)) // Local file
                        {
                            builder.Attachments.Add(url);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[EMAIL] Lỗi khi đính kèm file: {url}. Chi tiết: {ex.Message}");
                    }
                }
            }

            message.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();
            try 
            {
                await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(username, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                Console.WriteLine($"[EMAIL] ✅ Đã gửi email thành công đến: {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL] ❌ Lỗi gửi email đến {toEmail}: {ex.Message}");
                throw;
            }
        }
    }
}

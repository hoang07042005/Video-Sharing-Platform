using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Video_Platform_Backend.Controllers
{
    [Route("api/admin/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SeedController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                var random = new Random();

                // 1. Add 6 Video Categories
                var categoriesToAdd = new List<string> { "Công nghệ", "Ẩm thực", "Giáo dục", "Thể thao", "Du lịch", "Giải trí" };
                var categories = new List<VideoCategory>();
                foreach (var catName in categoriesToAdd)
                {
                    var cat = await _context.VideoCategories.FirstOrDefaultAsync(c => c.Name == catName);
                    if (cat == null)
                    {
                        cat = new VideoCategory
                        {
                            Name = catName,
                            Description = $"Các video về {catName}",
                            Icon = "Folder",
                            IsActive = true
                        };
                        _context.VideoCategories.Add(cat);
                    }
                    categories.Add(cat);
                }
                await _context.SaveChangesAsync();

                // 2. Add Users, Profiles, Channels
                var users = new List<User>();
                var channels = new List<Channel>();
                var fullNames = new string[] {
                    "Nguyễn Minh Tuấn", "Trần Thị Lan", "Lê Hoàng Bách", "Phạm Thanh Hương", "Hoàng Ngọc Hùng",
                    "Đỗ Hải Đăng", "Vũ Mai Phương", "Đặng Quang Minh", "Bùi Thị Yến", "Ngô Đức Trí"
                };
                var channelNames = new string[] {
                    "Tuấn Nguyễn Official", "Lan Góc Bếp", "Bách Gaming", "Hương Beauty & Life", "Hùng Tech Review",
                    "Đăng Vlogs", "Phương Daily", "Quang Minh Studio", "Yến ASMR", "Trí Đức Education"
                };

                for (int i = 1; i <= 10; i++)
                {
                    int index = i - 1;
                    var email = $"user{i}_{Guid.NewGuid().ToString().Substring(0, 5)}@test.com";
                    var user = new User
                    {
                        Email = email,
                        PasswordHash = "hashedpassword", // Mock password
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync(); // Save to get Id
                    users.Add(user);

                    var profile = new Profile
                    {
                        UserId = user.Id,
                        FullName = fullNames[index],
                        Bio = $"Xin chào! Mình là {fullNames[index]}. Rất vui được chia sẻ những video thú vị đến mọi người.",
                        AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={fullNames[index]}"
                    };
                    _context.Profiles.Add(profile);

                    var handleName = fullNames[index].Split(' ').Last().ToLower() + i.ToString();
                    var channel = new Channel
                    {
                        UserId = user.Id,
                        ChannelName = channelNames[index],
                        Handle = $"@{handleName}_{Guid.NewGuid().ToString().Substring(0, 4)}",
                        TotalViews = random.Next(100, 10000),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Channels.Add(channel);
                    channels.Add(channel);
                }
                await _context.SaveChangesAsync();

                // Fetch real categories from DB
                var dbCategories = await _context.VideoCategories.ToListAsync();

                string[] normalTitles = new string[] {
                    "10 Mẹo Lập Trình Giúp Bạn Code Nhanh Hơn", "Khám Phá Vẻ Đẹp Miền Tây Sông Nước", "Đánh Giá Chi Tiết iPhone Mới Nhất Năm Nay", 
                    "Học Tiếng Anh Giao Tiếp Cơ Bản", "Hướng Dẫn Làm Bánh Flan Caramel Ngon Tại Nhà", "Những Điều Cần Biết Trước Khi Đi Du Lịch Đà Lạt", 
                    "Tổng Hợp Bàn Thắng Đẹp Nhất Tuần", "Vlog 1 Ngày Của Một Sinh Viên IT", "Phân Tích Chuyên Sâu Về Công Nghệ AI", 
                    "Nghe Nhạc Thư Giãn Khó Ngủ - Lofi Chill", "Review Quán Ăn Ngon Nhất Sài Gòn", "Cách Setup Góc Làm Việc Tối Ưu",
                    "Hành Trình Chinh Phục Đỉnh Fansipan", "Bí Quyết Chụp Ảnh Bằng Điện Thoại Cực Đẹp", "Hướng Dẫn Tự Học Guitar Tại Nhà",
                    "Toàn Cảnh Sự Kiện Ra Mắt Công Nghệ Mới", "Trải Nghiệm Xe Hơi Điện Tương Lai", "Phim Ngắn Hài Hước Cuối Tuần",
                    "Chơi Thử Tựa Game Đang Hot Nhất Hiện Nay", "Góc Nhìn Chuyên Gia Về Thị Trường Tài Chính"
                };

                string[] shortTitles = new string[] {
                    "Mẹo vặt cuộc sống cực hay #shorts", "Khi sếp bảo bạn làm gấp #funny", "Thử thách ăn cay cấp độ 7",
                    "Cách làm ảo thuật với đồng xu", "Khoảnh khắc hài hước của thú cưng", "Tricks chơi game bạn chưa biết",
                    "Review món ăn vặt tuổi thơ", "Nhảy trend TikTok cực cháy", "Đừng bao giờ làm điều này khi lái xe",
                    "Bí kíp thả thính 100% dính #shorts", "Góc lầy lội cùng hội bạn thân", "Hướng dẫn makeup đi chơi 5 phút",
                    "Hậu trường quay phim siêu bựa", "Trend biến hình cực ngầu", "Khám phá ẩm thực đường phố nhanh"
                };

                string[] descriptions = new string[] {
                    "Video này sẽ mang đến cho bạn những thông tin cực kỳ hữu ích và thú vị. Đừng quên like, share và subscribe kênh để ủng hộ mình ra thêm nhiều nội dung chất lượng hơn nhé!",
                    "Cùng khám phá những bí mật chưa từng được bật mí. Chúc các bạn xem video vui vẻ và để lại bình luận chia sẻ cảm nhận bên dưới nhé.",
                    "Review chân thực, khách quan và chi tiết nhất. Nếu thấy hay hãy cho mình 1 nút đăng ký để không bỏ lỡ các video tiếp theo.",
                    "Trải nghiệm tuyệt vời ngày hôm nay được gói gọn trong video này. Cảm ơn mọi người đã luôn đồng hành và ủng hộ kênh thời gian qua."
                };

                // 3. Add 40 Videos
                var videos = new List<Video>();
                for (int i = 1; i <= 40; i++)
                {
                    var channel = channels[random.Next(channels.Count)];
                    var category = dbCategories[random.Next(dbCategories.Count)];
                    var title = normalTitles[random.Next(normalTitles.Length)];
                    var desc = descriptions[random.Next(descriptions.Length)];
                    
                    var video = new Video
                    {
                        Id = Guid.NewGuid(),
                        ChannelId = channel.Id,
                        CategoryId = category.Id,
                        Title = $"{title} (Phần {random.Next(1, 5)})",
                        Description = desc,
                        ViewsCount = random.Next(10, 5000),
                        LikesCount = random.Next(1, 500),
                        Visibility = "Public",
                        IsShort = false,
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30))
                    };
                    _context.Videos.Add(video);
                    videos.Add(video);

                    // Add a thumbnail
                    _context.VideoThumbnails.Add(new VideoThumbnail
                    {
                        VideoId = video.Id,
                        ThumbnailUrl = $"https://picsum.photos/seed/{video.Id}/1280/720",
                        IsAutoGenerated = true
                    });
                }

                // 4. Add 30 Shorts
                for (int i = 1; i <= 30; i++)
                {
                    var channel = channels[random.Next(channels.Count)];
                    var category = dbCategories[random.Next(dbCategories.Count)];
                    var shortTitle = shortTitles[random.Next(shortTitles.Length)];
                    
                    var shortVideo = new Video
                    {
                        Id = Guid.NewGuid(),
                        ChannelId = channel.Id,
                        CategoryId = category.Id,
                        Title = shortTitle,
                        Description = "Video ngắn giải trí, đăng ký kênh để xem thêm nhiều #shorts thú vị nhé!",
                        ViewsCount = random.Next(100, 10000),
                        LikesCount = random.Next(10, 1000),
                        Visibility = "Public",
                        IsShort = true,
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30))
                    };
                    _context.Videos.Add(shortVideo);
                    videos.Add(shortVideo);

                    // Add a thumbnail for short (vertical)
                    _context.VideoThumbnails.Add(new VideoThumbnail
                    {
                        VideoId = shortVideo.Id,
                        ThumbnailUrl = $"https://picsum.photos/seed/{shortVideo.Id}/720/1280",
                        IsAutoGenerated = true
                    });
                }
                await _context.SaveChangesAsync();

                // 5. Add Banned Keywords
                var keywords = new List<string> { "chửi", "ngu ngốc", "đồi trụy", "phản động", "lừa đảo", "vô văn hóa" };
                foreach (var kw in keywords)
                {
                    if (!await _context.BannedWords.AnyAsync(b => b.Keyword == kw))
                    {
                        _context.BannedWords.Add(new BannedWord { Keyword = kw, CreatedAt = DateTime.UtcNow });
                    }
                }
                await _context.SaveChangesAsync();

                // 6. Add Comments (Normal and Violating)
                var comments = new List<Comment>();
                for (int i = 0; i < 100; i++)
                {
                    var user = users[random.Next(users.Count)];
                    var video = videos[random.Next(videos.Count)];
                    bool isViolating = random.Next(100) < 20; // 20% chance of being violating
                    var randomKeyword = keywords[random.Next(keywords.Count)];
                    string content = isViolating ? $"Video này quá {randomKeyword}!" : "Video rất hay và ý nghĩa, cảm ơn kênh!";
                    
                    var comment = new Comment
                    {
                        Id = Guid.NewGuid(),
                        VideoId = video.Id,
                        UserId = user.Id,
                        Content = content,
                        DisplayContent = isViolating ? "Video này quá ***!" : content,
                        IsFiltered = isViolating,
                        FilterStatus = isViolating ? "Blocked" : "Approved",
                        MatchedKeywords = isViolating ? randomKeyword : null,
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 10))
                    };
                    _context.Comments.Add(comment);
                    comments.Add(comment);
                }
                await _context.SaveChangesAsync();

                // 7. Add Violation Reports
                for (int i = 0; i < 20; i++)
                {
                    var reporter = users[random.Next(users.Count)];
                    var targetVideo = videos[random.Next(videos.Count)];
                    
                    _context.Reports.Add(new Report
                    {
                        ReporterId = reporter.Id,
                        TargetId = targetVideo.Id,
                        TargetType = "Video",
                        Reason = "Nội dung phản cảm, không phù hợp",
                        Description = "Tôi thấy video này có nội dung không tốt cho trẻ em.",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 5))
                    });
                }

                for (int i = 0; i < 15; i++)
                {
                    var reporter = users[random.Next(users.Count)];
                    var targetComment = comments[random.Next(comments.Count)];
                    
                    _context.Reports.Add(new Report
                    {
                        ReporterId = reporter.Id,
                        TargetId = targetComment.Id,
                        TargetType = "Comment",
                        Reason = "Spam hoặc quảng cáo",
                        Description = "Bình luận này liên tục spam các đường link lạ.",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 5))
                    });
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Seeding dữ liệu thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, inner = ex.InnerException?.Message });
            }
        }
    }
}

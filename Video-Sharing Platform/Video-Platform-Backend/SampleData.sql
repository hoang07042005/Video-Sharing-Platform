USE VideoPlatformDB;
GO

-- ======================================================================
-- SAMPLE DATA FOR VIDEO PLATFORM
-- Uses existing users:
-- User 1 (hoang123): D00A952C-B678-4164-9063-289BD5EFE225
-- User 2 (admin123): 9D8A9124-8710-4816-8480-3ABEBEB91329
-- ======================================================================

DECLARE @User1 UNIQUEIDENTIFIER = 'D00A952C-B678-4164-9063-289BD5EFE225';
DECLARE @User2 UNIQUEIDENTIFIER = '9D8A9124-8710-4816-8480-3ABEBEB91329';

-- 1. Profiles (Update because AuthController already created them)
UPDATE Profiles 
SET AvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 
    CoverUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200', 
    Bio = N'Yêu thích công nghệ và lập trình', 
    DateOfBirth = '1998-05-15'
WHERE UserId = @User1;

UPDATE Profiles 
SET AvatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', 
    CoverUrl = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200', 
    Bio = N'Admin hệ thống VividStream', 
    DateOfBirth = '1990-01-01'
WHERE UserId = @User2;

-- 2. Channels (Update and fetch ID)
UPDATE Channels 
SET Description = N'Kênh chia sẻ kiến thức lập trình và công nghệ.', 
    BannerUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200', 
    TotalViews = 15000 
WHERE UserId = @User1;

UPDATE Channels 
SET Description = N'Kênh thông báo chính thức của nền tảng.', 
    BannerUrl = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200', 
    TotalViews = 500000 
WHERE UserId = @User2;

DECLARE @Channel1 UNIQUEIDENTIFIER = (SELECT Id FROM Channels WHERE UserId = @User1);
DECLARE @Channel2 UNIQUEIDENTIFIER = (SELECT Id FROM Channels WHERE UserId = @User2);

-- 3. Settings (Insert if not exists)
IF NOT EXISTS (SELECT 1 FROM Settings WHERE UserId = @User1)
BEGIN
    INSERT INTO Settings (UserId, Theme, Language, PrivacySettings, NotificationSettings) VALUES
    (@User1, 'Dark', 'Vietnamese', '{"allowMessages":true}', '{"email":true, "push":true}');
END

IF NOT EXISTS (SELECT 1 FROM Settings WHERE UserId = @User2)
BEGIN
    INSERT INTO Settings (UserId, Theme, Language, PrivacySettings, NotificationSettings) VALUES
    (@User2, 'System', 'English', '{"allowMessages":false}', '{"email":false, "push":true}');
END

-- 4. Video Categories (Insert if not exists)
IF NOT EXISTS (SELECT 1 FROM VideoCategories WHERE Name = N'Công nghệ')
BEGIN
    INSERT INTO VideoCategories (Name, Description) VALUES
    (N'Công nghệ', N'Review đồ công nghệ, phần mềm, lập trình'),
    (N'Âm nhạc', N'MV, Cover, Live show'),
    (N'Trò chơi', N'Game offline, online, esport'),
    (N'Tin tức', N'Cập nhật tin tức hàng ngày'),
    (N'Thể thao', N'Bóng đá, cầu lông, thể thao điện tử');
END

-- Lấy ID Category để dùng cho Video
DECLARE @CatTech INT = (SELECT Id FROM VideoCategories WHERE Name = N'Công nghệ');
DECLARE @CatMusic INT = (SELECT Id FROM VideoCategories WHERE Name = N'Âm nhạc');

-- 5. Videos
DECLARE @Video1 UNIQUEIDENTIFIER = NEWID(), @Video2 UNIQUEIDENTIFIER = NEWID(), @V3 UNIQUEIDENTIFIER = NEWID(), @V4 UNIQUEIDENTIFIER = NEWID(), @V5 UNIQUEIDENTIFIER = NEWID(), @V6 UNIQUEIDENTIFIER = NEWID(), @V7 UNIQUEIDENTIFIER = NEWID(), @V8 UNIQUEIDENTIFIER = NEWID(), @V9 UNIQUEIDENTIFIER = NEWID(), @V10 UNIQUEIDENTIFIER = NEWID(), @V11 UNIQUEIDENTIFIER = NEWID(), @V12 UNIQUEIDENTIFIER = NEWID(), @V13 UNIQUEIDENTIFIER = NEWID(), @V14 UNIQUEIDENTIFIER = NEWID(), @V15 UNIQUEIDENTIFIER = NEWID(), @V16 UNIQUEIDENTIFIER = NEWID(), @V17 UNIQUEIDENTIFIER = NEWID(), @V18 UNIQUEIDENTIFIER = NEWID(), @V19 UNIQUEIDENTIFIER = NEWID(), @V20 UNIQUEIDENTIFIER = NEWID(), @V21 UNIQUEIDENTIFIER = NEWID(), @V22 UNIQUEIDENTIFIER = NEWID();

INSERT INTO Videos (Id, ChannelId, CategoryId, Title, Description, Visibility, Duration, ViewsCount, LikesCount) VALUES
(@Video1, @Channel1, @CatTech, N'Hướng dẫn ReactJS từ cơ bản đến nâng cao 2024', N'Trong video này mình sẽ hướng dẫn các bạn học ReactJS chi tiết nhất.', 'Public', 1250, 1500, 300),
(@Video2, @Channel2, @CatMusic, N'Nhạc lofi chill giải tỏa căng thẳng', N'Tổng hợp các bài nhạc lofi nhẹ nhàng.', 'Public', 3600, 15000, 2500),
(@V3, @Channel1, @CatTech, N'Học C# .NET Core API trong 1 giờ', N'Khóa học cấp tốc C#', 'Public', 3600, 2000, 150),
(@V4, @Channel1, @CatTech, N'Review Macbook Pro M3 Max 2024', N'Đánh giá chi tiết siêu phẩm của Apple.', 'Public', 1500, 50000, 3200),
(@V5, @Channel1, @CatTech, N'Build PC 15 Triệu cân mọi loại game', N'Hướng dẫn build PC giả rẻ.', 'Public', 1200, 45000, 1200),
(@V6, @Channel1, @CatTech, N'Lộ diện iPhone 16 Pro Max - Có đáng mua?', N'Tin đồn về thiết kế mới.', 'Public', 800, 120000, 4500),
(@V7, @Channel1, @CatTech, N'Cài đặt môi trường Node.js cho người mới', N'Hướng dẫn step by step.', 'Public', 500, 8000, 200),
(@V8, @Channel1, @CatTech, N'Tìm hiểu Docker và Kubernetes', N'DevOps cơ bản.', 'Public', 2100, 15000, 800),
(@V9, @Channel1, @CatTech, N'So sánh ReactJS vs VueJS', N'Nên học framework nào năm nay?', 'Public', 900, 25000, 950),
(@V10, @Channel1, @CatTech, N'Khóa học SQL Server từ A-Z', N'Học cơ sở dữ liệu quan hệ.', 'Public', 5400, 30000, 1200),
(@V11, @Channel1, @CatTech, N'Mẹo dùng VS Code hiệu quả', N'Tăng tốc độ code của bạn.', 'Public', 600, 42000, 2100),
(@V12, @Channel1, @CatTech, N'Thiết kế UI/UX với Figma', N'Cơ bản về thiết kế giao diện.', 'Public', 1800, 18000, 700),
(@V13, @Channel2, @CatMusic, N'Top 50 Bài Hát Nhạc Trẻ Hay Nhất 2024', N'Playlist nhạc trẻ gây nghiện.', 'Public', 7200, 500000, 12000),
(@V14, @Channel2, @CatMusic, N'Nhạc EDM TikTok Remix Cực Mạnh', N'Lên đỉnh cùng EDM.', 'Public', 3600, 250000, 8000),
(@V15, @Channel2, @CatMusic, N'Acoustic Chill - Nhạc Cafe Buổi Sáng', N'Thư giãn cùng acoustic.', 'Public', 5400, 80000, 1500),
(@V16, @Channel2, @CatMusic, N'Nhạc Sóng Não Học Tập Hiệu Quả', N'Tập trung làm việc.', 'Public', 10800, 120000, 4500),
(@V17, @Channel2, @CatMusic, N'Những Bản Tình Ca Bất Hủ 9x', N'Ôn lại kỷ niệm.', 'Public', 4500, 350000, 8500),
(@V18, @Channel2, @CatMusic, N'Cover - Có Ai Thương Em Như Anh', N'Giọng ca bí ẩn.', 'Public', 300, 50000, 2000),
(@V19, @Channel2, @CatMusic, N'Nhạc Không Lời Thư Giãn Dễ Ngủ', N'Giấc ngủ sâu.', 'Public', 7200, 900000, 25000),
(@V20, @Channel2, @CatMusic, N'Tuyển Tập Nhạc Thiền Tĩnh Tâm', N'Chữa lành tâm hồn.', 'Public', 3600, 110000, 3000),
(@V21, @Channel2, @CatMusic, N'Nhạc Rap Việt Hay Nhất Mọi Thời Đại', N'Hip hop never die.', 'Public', 2800, 420000, 15000),
(@V22, @Channel2, @CatMusic, N'Nhạc Phim K-Drama Gây Bão', N'Nhạc phim cảm động.', 'Public', 1800, 210000, 6000);

-- 6. Video Files
INSERT INTO VideoFiles (VideoId, Resolution, FileUrl, FileSize, Format) VALUES
(@Video1, '1080p', 'https://example.com/videos/reactjs-1080p.mp4', 500000000, 'MP4'),
(@Video2, '1080p', 'https://example.com/videos/lofi-1080p.mp4', 800000000, 'MP4'),
(@V3, '1080p', 'https://example.com/videos/csharp.mp4', 500000000, 'MP4'),
(@V4, '1080p', 'https://example.com/videos/macbook.mp4', 800000000, 'MP4'),
(@V5, '1080p', 'https://example.com/videos/pc.mp4', 500000000, 'MP4'),
(@V6, '1080p', 'https://example.com/videos/iphone.mp4', 800000000, 'MP4'),
(@V7, '1080p', 'https://example.com/videos/node.mp4', 500000000, 'MP4'),
(@V8, '1080p', 'https://example.com/videos/docker.mp4', 800000000, 'MP4'),
(@V9, '1080p', 'https://example.com/videos/react.mp4', 500000000, 'MP4'),
(@V10, '1080p', 'https://example.com/videos/sql.mp4', 800000000, 'MP4'),
(@V11, '1080p', 'https://example.com/videos/vscode.mp4', 500000000, 'MP4'),
(@V12, '1080p', 'https://example.com/videos/figma.mp4', 800000000, 'MP4'),
(@V13, '1080p', 'https://example.com/videos/nhactre.mp4', 500000000, 'MP4'),
(@V14, '1080p', 'https://example.com/videos/edm.mp4', 800000000, 'MP4'),
(@V15, '1080p', 'https://example.com/videos/acoustic.mp4', 500000000, 'MP4'),
(@V16, '1080p', 'https://example.com/videos/study.mp4', 800000000, 'MP4'),
(@V17, '1080p', 'https://example.com/videos/9x.mp4', 500000000, 'MP4'),
(@V18, '1080p', 'https://example.com/videos/cover.mp4', 800000000, 'MP4'),
(@V19, '1080p', 'https://example.com/videos/sleep.mp4', 500000000, 'MP4'),
(@V20, '1080p', 'https://example.com/videos/meditation.mp4', 800000000, 'MP4'),
(@V21, '1080p', 'https://example.com/videos/rap.mp4', 500000000, 'MP4'),
(@V22, '1080p', 'https://example.com/videos/kdrama.mp4', 800000000, 'MP4');

-- 7. Video Thumbnails
INSERT INTO VideoThumbnails (VideoId, ThumbnailUrl, IsAutoGenerated) VALUES
(@Video1, 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@Video2, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V3, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V4, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V5, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V6, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V7, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V8, 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V9, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V10, 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V11, 'https://images.unsplash.com/photo-1627398225058-f9a88eb594b2?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V12, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V13, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V14, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V15, 'https://images.unsplash.com/photo-1493225457124-a1a2a5f564dc?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V16, 'https://images.unsplash.com/photo-1516280440502-613b2c6a0b12?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V17, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V18, 'https://images.unsplash.com/photo-1507838153428-973ead70ce2e?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V19, 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V20, 'https://images.unsplash.com/photo-1515281239448-223d06965a39?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V21, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600&h=400', 0),
(@V22, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600&h=400', 0);

-- 8. Video Tags
INSERT INTO VideoTags (VideoId, Tag) VALUES
(@Video1, 'ReactJS'), (@Video1, 'Programming'), (@Video1, 'Frontend'),
(@Video2, 'Lofi'), (@Video2, 'Chill'), (@Video2, 'Music');

-- 9. Likes
INSERT INTO Likes (UserId, VideoId, IsLike) VALUES
(@User2, @Video1, 1),
(@User1, @Video2, 1);

-- 10. Comments
DECLARE @Comment1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Comments (Id, VideoId, UserId, Content, LikesCount) VALUES
(@Comment1, @Video1, @User2, N'Video rất hữu ích, cảm ơn bạn!', 5),
(NEWID(), @Video2, @User1, N'Nhạc hay quá admin ơi!', 12);

-- 11. Comment Replies
INSERT INTO CommentReplies (ParentCommentId, UserId, Content, LikesCount) VALUES
(@Comment1, @User1, N'Cảm ơn bạn đã ủng hộ nha!', 1);

-- 12. Comment Likes
INSERT INTO CommentLikes (UserId, CommentId, IsLike) VALUES
(@User1, @Comment1, 1);

-- 13. Followers (Subscriptions)
INSERT INTO Followers (FollowerId, ChannelId) VALUES
(@User1, @Channel2),
(@User2, @Channel1);

-- 14. Playlists
DECLARE @Playlist1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Playlists (Id, ChannelId, Title, Description, Visibility) VALUES
(@Playlist1, @Channel1, N'Học Lập Trình Web', N'Danh sách phát các video học web', 'Public');

-- 15. Playlist Videos
INSERT INTO PlaylistVideos (PlaylistId, VideoId, SortOrder) VALUES
(@Playlist1, @Video1, 1);

-- 16. Watch Histories
INSERT INTO WatchHistories (UserId, VideoId, WatchedDuration) VALUES
(@User2, @Video1, 500),
(@User1, @Video2, 1200);

-- 17. Views
INSERT INTO Views (VideoId, UserId, IpAddress) VALUES
(@Video1, @User2, '192.168.1.1'),
(@Video2, @User1, '192.168.1.2');

-- 18. Conversations & Messages
DECLARE @Conv1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO Conversations (Id) VALUES (@Conv1);

INSERT INTO ConversationParticipants (ConversationId, UserId) VALUES
(@Conv1, @User1), (@Conv1, @User2);

INSERT INTO Messages (ConversationId, SenderId, Content) VALUES
(@Conv1, @User1, N'Chào admin, hệ thống rất tuyệt!'),
(@Conv1, @User2, N'Cảm ơn bạn nhé!');

-- 19. Notifications
INSERT INTO Notifications (UserId, Type, Message, TargetUrl) VALUES
(@User1, 'Subscribe', N'VividStream Official đã theo dõi kênh của bạn.', '/channel/vividstream'),
(@User2, 'Comment', N'Hoang Dev đã bình luận vào video của bạn.', '/video/' + CAST(@Video2 AS VARCHAR(36)));

-- 20. Livestreams
INSERT INTO Livestreams (ChannelId, Title, StreamKey, Status) VALUES
(@Channel1, N'Code xuyen dem cung anh em', 'LIVE_KEY_HOANG_123', 'Scheduled');

-- 21. Subscriptions (Premium/Monetization)
INSERT INTO Subscriptions (SubscriberId, ChannelId, Tier, Price) VALUES
(@User1, @Channel2, 'Premium', 50000);
GO

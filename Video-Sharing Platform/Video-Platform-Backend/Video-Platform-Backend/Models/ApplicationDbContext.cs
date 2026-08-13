using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Video_Platform_Backend.Models;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Channel> Channels { get; set; }

    public virtual DbSet<BannedWord> BannedWords { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<CommentLike> CommentLikes { get; set; }

    public virtual DbSet<CommentReply> CommentReplies { get; set; }

    public virtual DbSet<Conversation> Conversations { get; set; }

    public virtual DbSet<ConversationParticipant> ConversationParticipants { get; set; }

    public virtual DbSet<CopyrightClaim> CopyrightClaims { get; set; }

    public virtual DbSet<Follower> Followers { get; set; }

    public virtual DbSet<Like> Likes { get; set; }

    public virtual DbSet<LiveMessage> LiveMessages { get; set; }

    public virtual DbSet<Livestream> Livestreams { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Playlist> Playlists { get; set; }

    public virtual DbSet<PlaylistVideo> PlaylistVideos { get; set; }

    public virtual DbSet<Profile> Profiles { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<SystemSetting> SystemSettings { get; set; }

    public virtual DbSet<Setting> Settings { get; set; }

    public virtual DbSet<Subscription> Subscriptions { get; set; }

    public virtual DbSet<Transaction> Transactions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Video> Videos { get; set; }

    public virtual DbSet<VideoCategory> VideoCategories { get; set; }

    public virtual DbSet<VideoFile> VideoFiles { get; set; }

    public virtual DbSet<VideoTag> VideoTags { get; set; }

    public virtual DbSet<VideoThumbnail> VideoThumbnails { get; set; }

    public virtual DbSet<View> Views { get; set; }

    public virtual DbSet<VideoResolution> VideoResolutions { get; set; }

    public virtual DbSet<WatchHistory> WatchHistories { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Channel>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Channels__3214EC076E951DEC");

            entity.HasIndex(e => e.UserId, "UQ__Channels__1788CC4D6C0993F2").IsUnique();

            entity.HasIndex(e => e.ChannelName, "UQ__Channels__3DC071E9A2DE1E71").IsUnique();

            entity.HasIndex(e => e.Handle, "UQ__Channels__FE5BB31A4B33066A").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BannerUrl).HasMaxLength(500);
            entity.Property(e => e.ChannelName).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Handle).HasMaxLength(50);
            entity.Property(e => e.TotalViews).HasDefaultValue(0L);

            entity.HasOne(d => d.User).WithOne(p => p.Channel)
                .HasForeignKey<Channel>(d => d.UserId)
                .HasConstraintName("FK__Channels__UserId__4BAC3F29");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Comments__3214EC07A0F8A2CA");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsPinned).HasDefaultValue(false);
            entity.Property(e => e.LikesCount).HasDefaultValue(0);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Comments__UserId__7F2BE32F");

            entity.HasOne(d => d.Video).WithMany(p => p.Comments)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__Comments__VideoI__7E37BEF6");
        });

        modelBuilder.Entity<CommentLike>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CommentL__3214EC074E5772F6");

            entity.HasIndex(e => new { e.UserId, e.CommentId }, "UQ__CommentL__ABB381B1EA11EE92").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Comment).WithMany(p => p.CommentLikes)
                .HasForeignKey(d => d.CommentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CommentLi__Comme__0D7A0286");

            entity.HasOne(d => d.User).WithMany(p => p.CommentLikes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CommentLi__UserI__0C85DE4D");
        });

        modelBuilder.Entity<CommentReply>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CommentR__3214EC07AF9B69DC");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.LikesCount).HasDefaultValue(0);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.ParentComment).WithMany(p => p.CommentReplies)
                .HasForeignKey(d => d.ParentCommentId)
                .HasConstraintName("FK__CommentRe__Paren__05D8E0BE");

            entity.HasOne(d => d.User).WithMany(p => p.CommentReplies)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CommentRe__UserI__06CD04F7");
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Conversa__3214EC07EBB29E63");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<ConversationParticipant>(entity =>
        {
            entity.HasKey(e => new { e.ConversationId, e.UserId }).HasName("PK__Conversa__112854B35A112EB6");

            entity.Property(e => e.JoinedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Conversation).WithMany(p => p.ConversationParticipants)
                .HasForeignKey(d => d.ConversationId)
                .HasConstraintName("FK__Conversat__Conve__32AB8735");

            entity.HasOne(d => d.User).WithMany(p => p.ConversationParticipants)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Conversat__UserI__339FAB6E");
        });

        modelBuilder.Entity<CopyrightClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Copyrigh__3214EC07F824FEE9");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Claimant).WithMany(p => p.CopyrightClaims)
                .HasForeignKey(d => d.ClaimantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Copyright__Claim__4C6B5938");

            entity.HasOne(d => d.Video).WithMany(p => p.CopyrightClaims)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__Copyright__Video__4B7734FF");
        });

        modelBuilder.Entity<Follower>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Follower__3214EC07326771F8");

            entity.HasIndex(e => new { e.FollowerId, e.ChannelId }, "UQ__Follower__BBD57E993307A1D1").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Channel).WithMany(p => p.Followers)
                .HasForeignKey(d => d.ChannelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Followers__Chann__14270015");

            entity.HasOne(d => d.FollowerNavigation).WithMany(p => p.Followers)
                .HasForeignKey(d => d.FollowerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Followers__Follo__1332DBDC");
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Likes__3214EC0700C37BDD");

            entity.HasIndex(e => new { e.UserId, e.VideoId }, "UQ__Likes__AC269D6B76C18C64").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Likes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Likes__UserId__75A278F5");

            entity.HasOne(d => d.Video).WithMany(p => p.Likes)
                .HasForeignKey(d => d.VideoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Likes__VideoId__76969D2E");
        });

        modelBuilder.Entity<LiveMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LiveMess__3214EC07A4686ED7");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.SentAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Livestream).WithMany(p => p.LiveMessages)
                .HasForeignKey(d => d.LivestreamId)
                .HasConstraintName("FK__LiveMessa__Lives__57DD0BE4");

            entity.HasOne(d => d.User).WithMany(p => p.LiveMessages)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LiveMessa__UserI__58D1301D");
        });

        modelBuilder.Entity<Livestream>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Livestre__3214EC076652396D");

            entity.HasIndex(e => e.StreamKey, "UQ__Livestre__4FBF370F2C44D24F").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ActualStartTime).HasColumnType("datetime");
            entity.Property(e => e.CurrentViewers).HasDefaultValue(0);
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.ScheduledStartTime).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Scheduled");
            entity.Property(e => e.StreamKey).HasMaxLength(255);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.Channel).WithMany(p => p.Livestreams)
                .HasForeignKey(d => d.ChannelId)
                .HasConstraintName("FK__Livestrea__Chann__531856C7");
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Messages__3214EC07136798FD");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AttachmentUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsSeen).HasDefaultValue(false);

            entity.HasOne(d => d.Conversation).WithMany(p => p.Messages)
                .HasForeignKey(d => d.ConversationId)
                .HasConstraintName("FK__Messages__Conver__395884C4");

            entity.HasOne(d => d.Sender).WithMany(p => p.Messages)
                .HasForeignKey(d => d.SenderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Messages__Sender__3A4CA8FD");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC0716A739FA");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.TargetUrl).HasMaxLength(500);
            entity.Property(e => e.Type).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Notificat__UserI__40058253");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Payments__3214EC07B7F4290B");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .HasDefaultValue("VND");
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.User).WithMany(p => p.Payments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Payments__UserId__671F4F74");
        });

        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Playlist__3214EC07CD29254E");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Visibility)
                .HasMaxLength(20)
                .HasDefaultValue("Public");

            entity.HasOne(d => d.Channel).WithMany(p => p.Playlists)
                .HasForeignKey(d => d.ChannelId)
                .HasConstraintName("FK__Playlists__Chann__19DFD96B");
        });

        modelBuilder.Entity<PlaylistVideo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Playlist__3214EC072978DD35");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.SortOrder).HasDefaultValue(0);

            entity.HasOne(d => d.Playlist).WithMany(p => p.PlaylistVideos)
                .HasForeignKey(d => d.PlaylistId)
                .HasConstraintName("FK__PlaylistV__Playl__1F98B2C1");

            entity.HasOne(d => d.Video).WithMany(p => p.PlaylistVideos)
                .HasForeignKey(d => d.VideoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PlaylistV__Video__208CD6FA");
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Profiles__3214EC0762E0618F");

            entity.HasIndex(e => e.UserId, "UQ__Profiles__1788CC4D5C8A59DD").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.CoverUrl).HasMaxLength(500);
            entity.Property(e => e.FullName).HasMaxLength(150);

            entity.HasOne(d => d.User).WithOne(p => p.Profile)
                .HasForeignKey<Profile>(d => d.UserId)
                .HasConstraintName("FK__Profiles__UserId__4316F928");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reports__3214EC074D09DB98");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(100);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TargetType).HasMaxLength(50);

            entity.HasOne(d => d.Reporter).WithMany(p => p.Reports)
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Reports__Reporte__45BE5BA9");
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Settings__3214EC077D0F117D");

            entity.HasIndex(e => e.UserId, "UQ__Settings__1788CC4DE975C866").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Language)
                .HasMaxLength(20)
                .HasDefaultValue("Vietnamese");
            entity.Property(e => e.Theme)
                .HasMaxLength(20)
                .HasDefaultValue("System");

            entity.HasOne(d => d.User).WithOne(p => p.Setting)
                .HasForeignKey<Setting>(d => d.UserId)
                .HasConstraintName("FK__Settings__UserId__52593CB8");
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Subscrip__3214EC07BB4C2D7A");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.Price)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.StartDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Active");
            entity.Property(e => e.Tier).HasMaxLength(50);

            entity.HasOne(d => d.Channel).WithMany(p => p.Subscriptions)
                .HasForeignKey(d => d.ChannelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Subscript__Chann__607251E5");

            entity.HasOne(d => d.Subscriber).WithMany(p => p.Subscriptions)
                .HasForeignKey(d => d.SubscriberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Subscript__Subsc__5F7E2DAC");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Transact__3214EC0709449DA9");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TransactionType).HasMaxLength(50);

            entity.HasOne(d => d.Payment).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.PaymentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transacti__Payme__6BE40491");

            entity.HasOne(d => d.TargetChannel).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.TargetChannelId)
                .HasConstraintName("FK__Transacti__Targe__6CD828CA");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC0720385D8E");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D105340CC41E73").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FacebookId).HasMaxLength(255);
            entity.Property(e => e.GoogleId).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsBanned).HasDefaultValue(false);
            entity.Property(e => e.IsEmailVerified).HasDefaultValue(false);
            entity.Property(e => e.IsPhoneVerified).HasDefaultValue(false);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Videos__3214EC0700E44899");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CommentsCount).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DislikesCount).HasDefaultValue(0);
            entity.Property(e => e.IsShort).HasDefaultValue(false);
            entity.Property(e => e.LikesCount).HasDefaultValue(0);
            entity.Property(e => e.ScheduledAt).HasColumnType("datetime");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ViewsCount).HasDefaultValue(0L);
            entity.Property(e => e.Visibility)
                .HasMaxLength(20)
                .HasDefaultValue("Public");

            entity.HasOne(d => d.Category).WithMany(p => p.Videos)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK__Videos__Category__619B8048");

            entity.HasOne(d => d.Channel).WithMany(p => p.Videos)
                .HasForeignKey(d => d.ChannelId)
                .HasConstraintName("FK__Videos__ChannelI__60A75C0F");
        });

        modelBuilder.Entity<VideoCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VideoCat__3214EC0721DA0E61");

            entity.HasIndex(e => e.Name, "UQ__VideoCat__737584F6CA260E13").IsUnique();

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<VideoFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VideoFil__3214EC071189063F");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.FileUrl).HasMaxLength(500);
            entity.Property(e => e.Format).HasMaxLength(20);
            entity.Property(e => e.Resolution).HasMaxLength(20);

            entity.HasOne(d => d.Video).WithMany(p => p.VideoFiles)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__VideoFile__Video__66603565");
        });

        modelBuilder.Entity<VideoTag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VideoTag__3214EC07C489D5B6");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Tag).HasMaxLength(50);

            entity.HasOne(d => d.Video).WithMany(p => p.VideoTags)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__VideoTags__Video__6FE99F9F");
        });

        modelBuilder.Entity<VideoThumbnail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__VideoThu__3214EC079C392F03");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsAutoGenerated).HasDefaultValue(false);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);

            entity.HasOne(d => d.Video).WithMany(p => p.VideoThumbnails)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__VideoThum__Video__6C190EBB");
        });

        modelBuilder.Entity<View>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Views__3214EC07A00C0A30");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.ViewedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Video).WithMany(p => p.Views)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__Views__VideoId__2B0A656D");
        });

        modelBuilder.Entity<WatchHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WatchHis__3214EC07CDDB227B");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.LastWatchedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.WatchHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WatchHist__UserI__25518C17");

            entity.HasOne(d => d.Video).WithMany(p => p.WatchHistories)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__WatchHist__Video__2645B050");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(255);

            entity.HasData(
                new Role { 
                    Id = 1, 
                    Name = "Admin", 
                    Description = "Toàn quyền quản trị hệ thống",
                    Label = "Quản trị viên",
                    Color = "from-red-500 to-orange-500",
                    TextColor = "text-red-400",
                    BgColor = "bg-red-500/10",
                    BorderColor = "border-red-500/20",
                    Icon = "Crown",
                    PermissionsJson = "[\"Quản lý người dùng\", \"Quản lý video\", \"Quản lý bình luận\", \"Quản lý danh mục\", \"Xem báo cáo\", \"Cấu hình hệ thống\", \"Phân quyền vai trò\", \"Quản lý giao dịch\"]"
                },
                new Role { 
                    Id = 2, 
                    Name = "Moderator", 
                    Description = "Kiểm duyệt nội dung và bình luận",
                    Label = "Kiểm duyệt viên",
                    Color = "from-blue-500 to-purple-500",
                    TextColor = "text-blue-400",
                    BgColor = "bg-blue-500/10",
                    BorderColor = "border-blue-500/20",
                    Icon = "ShieldCheck",
                    PermissionsJson = "[\"Quản lý bình luận\", \"Ẩn / xóa video vi phạm\", \"Xem báo cáo người dùng\", \"Quản lý từ khóa cấm\"]"
                },
                new Role { 
                    Id = 3, 
                    Name = "User", 
                    Description = "Người dùng thông thường",
                    Label = "Người dùng",
                    Color = "from-gray-500 to-gray-600",
                    TextColor = "text-gray-400",
                    BgColor = "bg-gray-500/10",
                    BorderColor = "border-gray-500/20",
                    Icon = "Users",
                    PermissionsJson = "[\"Xem video\", \"Bình luận\", \"Thích video\", \"Đăng ký kênh\", \"Upload video\"]"
                }
            );
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });
        
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<VideoResolution>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(d => d.Video).WithMany(p => p.VideoResolutions)
                .HasForeignKey(d => d.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

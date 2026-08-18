using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Controllers;
using Video_Platform_Backend.DTOs;
using Video_Platform_Backend.Hubs;
using Xunit;
using Microsoft.AspNetCore.Mvc;

namespace Video_Platform_Backend.Tests;

public class LivestreamsControllerTests
{
    [Fact]
    public async void Create_ReturnsCreated_WhenValid()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_CreateLivestream")
            .Options;

        using var db = new ApplicationDbContext(options);
        // Seed a channel
        var channel = new Channel { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), ChannelName = "Test", Handle = "@test" };
        db.Channels.Add(channel);
        await db.SaveChangesAsync();

        var controller = new LivestreamsController(db);
        var dto = new CreateLivestreamDTO { ChannelId = channel.Id, Title = "Unit Test Stream" };

        var result = await controller.Create(dto);

        Assert.IsType<CreatedAtActionResult>(result);
        var created = (result as CreatedAtActionResult).Value as Livestream;
        Assert.NotNull(created);
        Assert.Equal(channel.Id, created.ChannelId);
    }

    [Fact]
    public async Task HandleViolationAction_HidesComment_WhenRequested()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_HandleViolationAction_HidesComment")
            .Options;

        using var db = new ApplicationDbContext(options);

        var channel = new Channel { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), ChannelName = "Test", Handle = "@test" };
        var video = new Video { Id = Guid.NewGuid(), ChannelId = channel.Id, Title = "Test video", Visibility = "Public" };
        var user = new User { Id = Guid.NewGuid(), Email = "user@test.com", IsActive = true, IsBanned = false };
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            VideoId = video.Id,
            UserId = user.Id,
            Content = "Bad comment",
            FilterStatus = "Normal",
            CreatedAt = DateTime.UtcNow
        };

        db.Channels.Add(channel);
        db.Users.Add(user);
        db.Videos.Add(video);
        db.Comments.Add(comment);
        await db.SaveChangesAsync();

        var mockHubContext = new Mock<IHubContext<LivestreamHub>>();
        var controller = new AdminReportsController(db, mockHubContext.Object);
        var result = await controller.HandleViolationAction(new AdminReportsController.AdminViolationActionRequest
        {
            Action = "hide",
            TargetType = "Comment",
            TargetId = comment.Id,
            Reason = "Spam"
        });

        Assert.IsType<OkObjectResult>(result);
        var updated = await db.Comments.FindAsync(comment.Id);
        Assert.NotNull(updated);
        Assert.Equal("Blocked", updated.FilterStatus);
    }
}

using System;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Controllers;
using Video_Platform_Backend.DTOs;
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
}

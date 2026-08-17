using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Hubs;

public class LivestreamHub : Hub
{
    private readonly ApplicationDbContext _db;
    private readonly IContentModerationService _moderationService;

    public LivestreamHub(ApplicationDbContext db, IContentModerationService moderationService)
    {
        _db = db;
        _moderationService = moderationService;
    }

    public Task JoinGroup(string livestreamId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, livestreamId);
    }

    public Task LeaveGroup(string livestreamId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, livestreamId);
    }

    public async Task SendMessage(Guid livestreamId, Guid? userId, string content)
    {
      if (string.IsNullOrWhiteSpace(content))
      {
        throw new ArgumentException("Message content cannot be empty");
      }

      var livestream = await _db.Livestreams.FindAsync(livestreamId);
      if (livestream == null) return;

      // Check membership
      bool isMember = false;
      if (userId.HasValue)
      {
          isMember = await _db.Subscriptions
              .AnyAsync(s => s.SubscriberId == userId.Value && s.ChannelId == livestream.ChannelId && (s.Status == "active" || s.Status == "Active"));
      }

      // Check inappropriate content
      bool isAppropriate = _moderationService.IsContentAppropriate(content);
      var filteredContent = _moderationService.FilterContent(content);

      var msg = new LiveMessage
      {
          Id = Guid.NewGuid(),
          LivestreamId = livestreamId,
          UserId = userId,
          Content = filteredContent,
          SentAt = DateTime.UtcNow,
          IsDeleted = !isAppropriate, // Auto-hide if inappropriate
          IsPinned = false,
          MessageType = "Normal",
      };

      _db.LiveMessages.Add(msg);
      await _db.SaveChangesAsync();

      // Only broadcast if not deleted (not hidden)
      if (!msg.IsDeleted)
      {
          await Clients.Group(livestreamId.ToString()).SendAsync("ReceiveMessage", new
          {
              id = msg.Id,
              livestreamId = msg.LivestreamId,
              userId = msg.UserId,
              content = msg.Content,
              sentAt = msg.SentAt,
              isPinned = msg.IsPinned,
              messageType = msg.MessageType,
              isMember = isMember
          });
      }
    }

    public async Task SendReaction(Guid livestreamId, string emoji)
    {
      // Validate emoji (optional - you can add validation)
      if (string.IsNullOrWhiteSpace(emoji) || emoji.Length > 2)
      {
        throw new ArgumentException("Invalid emoji");
      }

      // Broadcast reaction to all viewers in the group
      await Clients.Group(livestreamId.ToString()).SendAsync("ReceiveReaction", new
      {
        livestreamId = livestreamId,
        emoji = emoji,
        timestamp = DateTime.UtcNow
      });
    }

    public async Task SendSuperChat(Guid livestreamId, Guid? userId, string donorName, string message, decimal amount)
    {
      // Validate input
      if (string.IsNullOrWhiteSpace(donorName)) throw new ArgumentException("Donor name is required");
      if (string.IsNullOrWhiteSpace(message)) throw new ArgumentException("Message is required");
      if (amount <= 0) throw new ArgumentException("Amount must be greater than 0");

      // Filter message content
      var filteredMessage = _moderationService.FilterContent(message);

      // Create Donation record
      var donation = new Donation
      {
        Id = Guid.NewGuid(),
        LivestreamId = livestreamId,
        UserId = userId,
        DonorName = donorName,
        Message = filteredMessage,
        Amount = amount,
        Currency = "VND",
        IsSuperChat = true,
        Status = "pending",
        CreatedAt = DateTime.UtcNow
      };

      _db.Donations.Add(donation);
      await _db.SaveChangesAsync();

      // Broadcast super chat to all viewers
      await Clients.Group(livestreamId.ToString()).SendAsync("ReceiveSuperChat", new
      {
        id = donation.Id,
        livestreamId = donation.LivestreamId,
        donorName = donation.DonorName,
        message = filteredMessage,
        amount = donation.Amount,
        currency = donation.Currency,
        createdAt = donation.CreatedAt
      });
    }
}

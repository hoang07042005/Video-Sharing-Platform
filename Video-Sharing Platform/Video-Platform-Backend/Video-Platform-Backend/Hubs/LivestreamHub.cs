using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Video_Platform_Backend.Models;
using Video_Platform_Backend.Services;

namespace Video_Platform_Backend.Hubs;

public class LivestreamHub : Hub
{
    private readonly ApplicationDbContext _db;
    private readonly IContentModerationService _moderationService;

    // Track viewer counts: livestreamId -> HashSet of connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _viewerConnections = new();
    // Track violations: "livestreamId:userId" -> count
    private static readonly ConcurrentDictionary<string, int> _violations = new();
    // Track kicked users: "livestreamId:userId" -> true
    private static readonly ConcurrentDictionary<string, bool> _kickedUsers = new();
    private const int MaxViolationsBeforeKick = 3;

    public LivestreamHub(ApplicationDbContext db, IContentModerationService moderationService)
    {
        _db = db;
        _moderationService = moderationService;
    }

    public async Task JoinGroup(string livestreamId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, livestreamId);

        // Track viewer
        _viewerConnections.AddOrUpdate(
            livestreamId,
            _ => new HashSet<string> { Context.ConnectionId },
            (_, set) => { lock (set) { set.Add(Context.ConnectionId); } return set; }
        );

        // Update viewer count in DB and broadcast
        await UpdateViewerCount(livestreamId);
    }

    public async Task LeaveGroup(string livestreamId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, livestreamId);

        if (_viewerConnections.TryGetValue(livestreamId, out var set))
        {
            lock (set) { set.Remove(Context.ConnectionId); }
        }

        await UpdateViewerCount(livestreamId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove this connection from all streams on disconnect
        foreach (var kv in _viewerConnections)
        {
            bool removed;
            lock (kv.Value) { removed = kv.Value.Remove(Context.ConnectionId); }
            if (removed)
            {
                await UpdateViewerCount(kv.Key);
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    private async Task UpdateViewerCount(string livestreamId)
    {
        int count = 0;
        if (_viewerConnections.TryGetValue(livestreamId, out var set))
        {
            lock (set) { count = set.Count; }
        }

        // Update DB
        if (Guid.TryParse(livestreamId, out var lsGuid))
        {
            var ls = await _db.Livestreams.FindAsync(lsGuid);
            if (ls != null)
            {
                ls.CurrentViewers = count;
                await _db.SaveChangesAsync();
            }
        }

        // Broadcast to group
        await Clients.Group(livestreamId).SendAsync("ViewerCountUpdated", count);
    }

    public async Task SendMessage(Guid livestreamId, Guid? userId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content cannot be empty");

        var lsId = livestreamId.ToString();

        // Check if user is kicked
        if (userId.HasValue)
        {
            var kickKey = $"{lsId}:{userId.Value}";
            if (_kickedUsers.ContainsKey(kickKey))
            {
                // Notify only this caller they are muted
                await Clients.Caller.SendAsync("YouAreKicked",
                    "Bạn đã bị cấm bình luận trong phiên live này do vi phạm quy định.");
                return;
            }
        }

        var livestream = await _db.Livestreams.FindAsync(livestreamId);
        if (livestream == null) return;

        // Check membership
        bool isMember = false;
        if (userId.HasValue)
        {
            isMember = await _db.Subscriptions
                .AnyAsync(s => s.SubscriberId == userId.Value
                            && s.ChannelId == livestream.ChannelId
                            && (s.Status == "active" || s.Status == "Active"));
        }

        // Content moderation
        bool isAppropriate = _moderationService.IsContentAppropriate(content);
        var filteredContent = _moderationService.FilterContent(content);

        if (!isAppropriate && userId.HasValue)
        {
            // Increment violation count
            var violKey = $"{lsId}:{userId.Value}";
            var violations = _violations.AddOrUpdate(violKey, 1, (_, v) => v + 1);

            if (violations >= MaxViolationsBeforeKick)
            {
                // Kick the user
                _kickedUsers[violKey] = true;
                _violations.TryRemove(violKey, out _);

                // Notify caller they are now kicked
                await Clients.Caller.SendAsync("YouAreKicked",
                    $"Bạn đã bị cấm bình luận do vi phạm quy định {MaxViolationsBeforeKick} lần.");

                // Notify channel owner about the kick via system message
                await Clients.Group(lsId).SendAsync("ReceiveMessage", new
                {
                    id = Guid.NewGuid(),
                    livestreamId = livestreamId,
                    userId = (Guid?)null,
                    content = $"⚠️ Một tài khoản đã bị cấm bình luận do vi phạm nội quy.",
                    sentAt = DateTime.UtcNow,
                    isPinned = false,
                    messageType = "System",
                    isMember = false
                });
            }
            else
            {
                // Warn the caller how many violations remain
                await Clients.Caller.SendAsync("YouAreWarned",
                    $"Tin nhắn của bạn không phù hợp và đã bị ẩn. Cảnh báo {violations}/{MaxViolationsBeforeKick}.");
            }

            // Save but mark deleted (hidden)
            var hiddenMsg = new LiveMessage
            {
                Id = Guid.NewGuid(),
                LivestreamId = livestreamId,
                UserId = userId,
                Content = filteredContent,
                SentAt = DateTime.UtcNow,
                IsDeleted = true,
                IsPinned = false,
                MessageType = "Normal",
            };
            _db.LiveMessages.Add(hiddenMsg);
            await _db.SaveChangesAsync();
            return;
        }

        var msg = new LiveMessage
        {
            Id = Guid.NewGuid(),
            LivestreamId = livestreamId,
            UserId = userId,
            Content = filteredContent,
            SentAt = DateTime.UtcNow,
            IsDeleted = false,
            IsPinned = false,
            MessageType = "Normal",
        };

        _db.LiveMessages.Add(msg);
        await _db.SaveChangesAsync();

        await Clients.Group(lsId).SendAsync("ReceiveMessage", new
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

    public async Task SendReaction(Guid livestreamId, string emoji)
    {
        if (string.IsNullOrWhiteSpace(emoji) || emoji.Length > 2)
            throw new ArgumentException("Invalid emoji");

        await Clients.Group(livestreamId.ToString()).SendAsync("ReceiveReaction", new
        {
            livestreamId = livestreamId,
            emoji = emoji,
            timestamp = DateTime.UtcNow
        });
    }

    public async Task SendSuperChat(Guid livestreamId, Guid? userId, string donorName, string message, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(donorName)) throw new ArgumentException("Donor name is required");
        if (string.IsNullOrWhiteSpace(message)) throw new ArgumentException("Message is required");
        if (amount <= 0) throw new ArgumentException("Amount must be greater than 0");

        var filteredMessage = _moderationService.FilterContent(message);

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

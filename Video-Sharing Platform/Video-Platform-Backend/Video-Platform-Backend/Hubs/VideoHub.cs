using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Video_Platform_Backend.Hubs;

public class VideoHub : Hub
{
    public async Task JoinVideo(string videoId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, videoId);
    }

    public async Task LeaveVideo(string videoId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, videoId);
    }
}

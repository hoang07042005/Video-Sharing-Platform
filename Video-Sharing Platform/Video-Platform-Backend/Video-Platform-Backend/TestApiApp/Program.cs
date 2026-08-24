using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var content = new StringContent("{\"ChannelId\":\"69014f42-24ca-4fe8-8d05-7dcf2d9ef91c\", \"Title\":\"Test Stream\"}", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("http://localhost:5139/api/livestreams", content);
        var responseString = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"STATUS: {response.StatusCode}");
        Console.WriteLine(responseString);
    }
}

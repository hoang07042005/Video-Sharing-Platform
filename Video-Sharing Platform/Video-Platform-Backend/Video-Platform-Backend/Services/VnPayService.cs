using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Video_Platform_Backend.Models;

namespace Video_Platform_Backend.Services;

public class VnPayResponse
{
    public bool Success { get; set; }
    public string OrderId { get; set; }
    public string TransactionId { get; set; }
    public string ResponseCode { get; set; }
    public string OrderInfo { get; set; }
    public decimal Amount { get; set; }
}

public interface IVnPayService
{
    Task<string> CreatePaymentUrl(HttpContext context, decimal amount, string orderInfo, string returnUrl);
    VnPayResponse ValidateReturn(IQueryCollection collections);
}

public class VnPayService : IVnPayService
{
    private readonly ApplicationDbContext _context;

    public VnPayService(ApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<(string tmnCode, string hashSecret, string baseUrl)> GetConfigAsync()
    {
        var keys = new[] { "vnpayTmnCode", "vnpayHashSecret", "vnpayBaseUrl" };
        var settings = await _context.SystemSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var dbSecret = settings.GetValueOrDefault("vnpayHashSecret");
        if (string.IsNullOrEmpty(dbSecret) || dbSecret == "********")
            dbSecret = null;

        var tmnCode    = settings.GetValueOrDefault("vnpayTmnCode")   ?? Environment.GetEnvironmentVariable("VNPAY_TMN_CODE")    ?? "";
        var hashSecret = dbSecret                                      ?? Environment.GetEnvironmentVariable("VNPAY_HASH_SECRET") ?? "";
        var baseUrl    = settings.GetValueOrDefault("vnpayBaseUrl")   ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

        return (tmnCode, hashSecret, baseUrl);
    }

    public async Task<string> CreatePaymentUrl(HttpContext context, decimal amount, string orderInfo, string returnUrl)
    {
        var (tmnCode, hashSecret, baseUrl) = await GetConfigAsync();

        var tick = DateTime.Now.Ticks.ToString();

        var vnpay = new VnPayLibrary();
        vnpay.AddRequestData("vnp_Version", VnPayLibrary.VERSION);
        vnpay.AddRequestData("vnp_Command", "pay");
        vnpay.AddRequestData("vnp_TmnCode", tmnCode);
        vnpay.AddRequestData("vnp_Amount", (amount * 100).ToString()); // Số tiền nhân 100

        vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
        vnpay.AddRequestData("vnp_CurrCode", "VND");
        vnpay.AddRequestData("vnp_IpAddr", context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1");
        vnpay.AddRequestData("vnp_Locale", "vn");

        vnpay.AddRequestData("vnp_OrderInfo", orderInfo);
        vnpay.AddRequestData("vnp_OrderType", "other");
        vnpay.AddRequestData("vnp_ReturnUrl", returnUrl);
        vnpay.AddRequestData("vnp_TxnRef", tick);

        string paymentUrl = vnpay.CreateRequestUrl(baseUrl, hashSecret);
        return paymentUrl;
    }

    public VnPayResponse ValidateReturn(IQueryCollection collections)
    {
        // Validate signature requires hashSecret synchronously.
        // We read it from DB or env var.
        var keys = new[] { "vnpayHashSecret" };
        var setting = _context.SystemSettings
            .Where(s => keys.Contains(s.Key))
            .FirstOrDefault();

        var dbSecret = setting?.Value;
        if (string.IsNullOrEmpty(dbSecret) || dbSecret == "********")
            dbSecret = null;

        var hashSecret = dbSecret ?? Environment.GetEnvironmentVariable("VNPAY_HASH_SECRET") ?? "";

        var vnpay = new VnPayLibrary();
        foreach (var (key, value) in collections)
        {
            if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
            {
                vnpay.AddResponseData(key, value.ToString());
            }
        }

        string vnp_SecureHash = collections["vnp_SecureHash"].ToString() ?? "";
        bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, hashSecret);

        Console.WriteLine($"[VNPay] SecureHash received: {vnp_SecureHash}");
        Console.WriteLine($"[VNPay] Signature valid: {checkSignature}");
        if (!checkSignature)
        {
            Console.WriteLine($"[VNPay] Response data string: {vnpay.GetResponseDataStringForLog()}");
        }

        if (checkSignature)
        {
            return new VnPayResponse
            {
                Success = collections["vnp_ResponseCode"] == "00",
                ResponseCode = collections["vnp_ResponseCode"].ToString() ?? "",
                OrderId = collections["vnp_TxnRef"].ToString() ?? "",
                TransactionId = collections["vnp_TransactionNo"].ToString() ?? "",
                OrderInfo = collections["vnp_OrderInfo"].ToString() ?? "",
                Amount = decimal.TryParse(collections["vnp_Amount"], out var amt) ? amt / 100 : 0
            };
        }

        return new VnPayResponse { Success = false, ResponseCode = "Invalid Signature" };
    }
}

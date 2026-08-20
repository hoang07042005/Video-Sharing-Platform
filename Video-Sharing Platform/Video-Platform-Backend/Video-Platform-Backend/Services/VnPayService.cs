using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

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
    string CreatePaymentUrl(HttpContext context, decimal amount, string orderInfo, string returnUrl);
    VnPayResponse ValidateReturn(IQueryCollection collections);
}

public class VnPayService : IVnPayService
{
    // Cấu hình Sandbox VNPay (bạn cần thay thế bằng config thực tế)
    private readonly string _tmnCode = Environment.GetEnvironmentVariable("VNPAY_TMN_CODE") ?? "";
    private readonly string _hashSecret = Environment.GetEnvironmentVariable("VNPAY_HASH_SECRET") ?? "";
    private readonly string _baseUrl = Environment.GetEnvironmentVariable("VNPAY_BASE_URL") ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public string CreatePaymentUrl(HttpContext context, decimal amount, string orderInfo, string returnUrl)
    {
        var tick = DateTime.Now.Ticks.ToString();

        var vnpay = new VnPayLibrary();
        vnpay.AddRequestData("vnp_Version", VnPayLibrary.VERSION);
        vnpay.AddRequestData("vnp_Command", "pay");
        vnpay.AddRequestData("vnp_TmnCode", _tmnCode);
        vnpay.AddRequestData("vnp_Amount", (amount * 100).ToString()); // Số tiền nhân 100
        
        vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
        vnpay.AddRequestData("vnp_CurrCode", "VND");
        vnpay.AddRequestData("vnp_IpAddr", context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1");
        vnpay.AddRequestData("vnp_Locale", "vn");
        
        vnpay.AddRequestData("vnp_OrderInfo", orderInfo);
        vnpay.AddRequestData("vnp_OrderType", "other"); // default
        vnpay.AddRequestData("vnp_ReturnUrl", returnUrl);
        vnpay.AddRequestData("vnp_TxnRef", tick); // Mã tham chiếu duy nhất

        string paymentUrl = vnpay.CreateRequestUrl(_baseUrl, _hashSecret);
        return paymentUrl;
    }

    public VnPayResponse ValidateReturn(IQueryCollection collections)
    {
        var vnpay = new VnPayLibrary();
        foreach (var (key, value) in collections)
        {
            if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
            {
                vnpay.AddResponseData(key, value.ToString());
            }
        }

        string vnp_SecureHash = collections["vnp_SecureHash"].ToString() ?? "";
        bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, _hashSecret);

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

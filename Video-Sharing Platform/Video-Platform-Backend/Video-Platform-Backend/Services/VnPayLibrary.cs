using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace Video_Platform_Backend.Services;

public class VnPayLibrary
{
    public const string VERSION = "2.1.0";
    private SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayCompare());
    private SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayCompare());

    public void AddRequestData(string key, string value)
    {
        if (!string.IsNullOrEmpty(value))
        {
            _requestData.Add(key, value);
        }
    }

    public void AddResponseData(string key, string value)
    {
        if (!string.IsNullOrEmpty(value))
        {
            _responseData.Add(key, value);
        }
    }

    public string GetResponseData(string key)
    {
        return _responseData.TryGetValue(key, out var retValue) ? retValue : string.Empty;
    }

    public string CreateRequestUrl(string baseUrl, string vnp_HashSecret)
    {
        StringBuilder data = new StringBuilder();
        foreach (KeyValuePair<string, string> kv in _requestData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                data.Append(Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value) + "&");
            }
        }
        
        string queryString = data.ToString();
        baseUrl += "?" + queryString;
        string signData = queryString;
        if (signData.Length > 0)
        {
            signData = signData.Remove(data.Length - 1, 1);
        }
        
        string vnp_SecureHash = HmacSHA512(vnp_HashSecret, signData);
        baseUrl += "vnp_SecureHash=" + vnp_SecureHash;

        return baseUrl;
    }

    public bool ValidateSignature(string inputHash, string secretKey)
    {
        string rspRaw = GetResponseDataString();
        string myChecksum = HmacSHA512(secretKey, rspRaw);
        return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
    }

    private string GetResponseDataString()
    {
        StringBuilder data = new StringBuilder();
        if (_responseData.ContainsKey("vnp_SecureHashType"))
        {
            _responseData.Remove("vnp_SecureHashType");
        }
        if (_responseData.ContainsKey("vnp_SecureHash"))
        {
            _responseData.Remove("vnp_SecureHash");
        }
        foreach (KeyValuePair<string, string> kv in _responseData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                data.Append(Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value) + "&");
            }
        }
        if (data.Length > 0)
        {
            data.Remove(data.Length - 1, 1);
        }
        return data.ToString();
    }

    public string GetResponseDataStringForLog()
    {
        return GetResponseDataString();
    }

    private static string HmacSHA512(string key, string inputData)
    {
        var hash = new StringBuilder();
        byte[] keyBytes = Encoding.UTF8.GetBytes(key);
        byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);
        using (var hmac = new HMACSHA512(keyBytes))
        {
            byte[] hashValue = hmac.ComputeHash(inputBytes);
            foreach (var theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }
}

public class VnPayCompare : IComparer<string>
{
    public int Compare(string x, string y)
    {
        if (x == y) return 0;
        if (x == null) return -1;
        if (y == null) return 1;
        var vnpCompare = System.Globalization.CompareInfo.GetCompareInfo("en-US");
        return vnpCompare.Compare(x, y, System.Globalization.CompareOptions.Ordinal);
    }
}

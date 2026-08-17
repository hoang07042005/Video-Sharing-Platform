using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Video_Platform_Backend.Services;

public interface IContentModerationService
{
    string FilterContent(string content);
    bool IsContentAppropriate(string content);
}

public class ContentModerationService : IContentModerationService
{
    private readonly HashSet<string> _bannedWords;
    private readonly HashSet<string> _spamPatterns;

    public ContentModerationService()
    {
        // Danh sách từ cấm (tiếng Việt + tiếng Anh)
        _bannedWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            // Tiếng Việt - chửi rủa
            "đéo", "đút", "chó", "lồn", "buồi", "ngu", "điên", "nực", "cmm", "dmm", "vkl", "vl",
            // Tiếng Anh - chửi rủa cơ bản
            "fuck", "shit", "ass", "bitch", "bastard", "damn", "crap", "piss", "cock",
            "dick", "pussy", "slut", "whore", "asshole", "idiot", "stupid", "dumb",
            // Thêm các từ spam
            "buy now", "click here", "follow me", "subscribe now"
        };

        _spamPatterns = new HashSet<string>
        {
            @"http[s]?://",  // URLs
            @"www\.",        // www links
            @"[0-9]{10,}",   // Dài số điện thoại
            @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"  // Email
        };
    }

    public string FilterContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return content;

        var result = content;

        // Lọc từ cấm
        foreach (var word in _bannedWords)
        {
            var pattern = new Regex($@"\b{Regex.Escape(word)}\b", RegexOptions.IgnoreCase);
            result = pattern.Replace(result, new string('*', word.Length));
        }

        // Lọc URL, email
        foreach (var pattern in _spamPatterns)
        {
            result = Regex.Replace(result, pattern, "[REMOVED]", RegexOptions.IgnoreCase);
        }

        return result;
    }

    public bool IsContentAppropriate(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return true;

        var lowerContent = content.ToLower();

        // Kiểm tra từ cấm
        foreach (var word in _bannedWords)
        {
            if (Regex.IsMatch(lowerContent, $@"\b{Regex.Escape(word)}\b"))
                return false;
        }

        // Kiểm tra spam patterns
        foreach (var pattern in _spamPatterns)
        {
            if (Regex.IsMatch(lowerContent, pattern, RegexOptions.IgnoreCase))
                return false;
        }

        // Kiểm tra caps lock quá nhiều (> 70% chữ hoa)
        var upperCount = content.Count(char.IsUpper);
        var letterCount = content.Count(char.IsLetter);
        if (letterCount > 5 && (double)upperCount / letterCount > 0.7)
            return false;

        // Kiểm tra spam ký tự lặp lại (5+ ký tự giống nhau liên tiếp)
        if (Regex.IsMatch(content, @"(.)\1{4,}"))
            return false;

        return true;
    }
}

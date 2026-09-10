import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';

class NotificationService {
  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<List<dynamic>> getNotifications({int limit = 50}) async {
    final response = await http
        .get(
          Uri.parse('${AppConstants.apiUrl}/notifications?limit=$limit'),
          headers: await _headers(),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) {
      throw Exception('Không thể tải thông báo.');
    }
    final data = jsonDecode(response.body);
    return data is List ? data : [];
  }

  static Future<int> getUnreadCount() async {
    final response = await http
        .get(
          Uri.parse('${AppConstants.apiUrl}/notifications/unread-count'),
          headers: await _headers(),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) return 0;
    final data = jsonDecode(response.body);
    return (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  static Future<void> markAsRead(String id) async {
    final response = await http
        .put(
          Uri.parse('${AppConstants.apiUrl}/notifications/$id/read'),
          headers: await _headers(),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể đánh dấu thông báo đã đọc.');
    }
  }

  static Future<void> markAllAsRead() async {
    final response = await http
        .put(
          Uri.parse('${AppConstants.apiUrl}/notifications/read-all'),
          headers: await _headers(),
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể đánh dấu thông báo đã đọc.');
    }
  }
}

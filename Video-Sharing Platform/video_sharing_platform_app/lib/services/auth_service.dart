import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';

class AuthService {
  static Future<Map<String, dynamic>> getPublicSettings() async {
    try {
      final response = await http.get(Uri.parse('${AppConstants.apiUrl}/admin/settings/public')).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return {};
  }

  static Future<Map<String, dynamic>> login(String emailOrPhone, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'emailOrPhone': emailOrPhone,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        if (data['userId'] != null) await prefs.setString('userId', data['userId'].toString());
        if (data['handle'] != null) await prefs.setString('handle', data['handle']);
        if (data['fullName'] != null) await prefs.setString('fullName', data['fullName']);
        if (data['avatarUrl'] != null) await prefs.setString('avatarUrl', data['avatarUrl']);
        return {'success': true, 'data': data};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> formData) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(formData),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'message': data['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
    await prefs.remove('handle');
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey('token');
  }

  static Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return null;

      // Try fetching from a standard endpoint if it exists
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        // Fallback to local data
        return {
          'id': prefs.getString('userId'),
          'handle': prefs.getString('handle'),
          'fullName': prefs.getString('fullName') ?? prefs.getString('handle') ?? 'Người dùng',
          'avatarUrl': prefs.getString('avatarUrl'),
        };
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      return {
        'id': prefs.getString('userId'),
        'handle': prefs.getString('handle'),
        'fullName': prefs.getString('handle') ?? 'Người dùng', // Fallback
      };
    }
  }
}

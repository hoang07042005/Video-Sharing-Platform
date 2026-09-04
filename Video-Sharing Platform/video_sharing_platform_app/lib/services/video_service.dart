import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants.dart';

class VideoService {
  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> getVideoDetails(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  static Future<List<dynamic>> getRecommendedVideos() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/recommended'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // print('Error fetching recommended videos: $e');
    }
    return [];
  }

  static Future<List<dynamic>> getShorts() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/shorts'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // print('Error fetching shorts: $e');
    }
    return [];
  }

  static Future<List<dynamic>> getActiveLivestreams() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/livestreams/active'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // print('Error fetching livestreams: $e');
    }
    return [];
  }

  static Future<void> recordView(String videoId) async {
    try {
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId/record-view'),
        headers: headers,
      );
    } catch (e) {
      // ignore
    }
  }

  static Future<bool> likeVideo(String videoId, bool isLike) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId/like'),
        headers: headers,
        body: jsonEncode({'isLike': isLike}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> followChannel(String channelId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/channels/$channelId/follow'),
        headers: headers,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> saveVideo(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/playlists/save'),
        headers: headers,
        body: jsonEncode({'videoId': videoId}),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data['isSaved'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> reportVideo(String videoId, String reason, String description) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId/report'),
        headers: headers,
        body: jsonEncode({
          'reason': reason,
          'description': description,
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  static Future<List<dynamic>> getMyPlaylists({String? videoId}) async {
    try {
      final headers = await _getHeaders();
      final query = videoId != null ? '?videoId=$videoId' : '';
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/playlists/my$query'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  static Future<bool> toggleVideoInPlaylist(String playlistId, String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/playlists/$playlistId/toggle-video'),
        headers: headers,
        body: jsonEncode({'videoId': videoId}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<dynamic> createPlaylist(String title, String visibility) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/playlists/create'),
        headers: headers,
        body: jsonEncode({'title': title, 'visibility': visibility}),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  static Future<List<dynamic>> getComments(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId/comments'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  static Future<dynamic> postComment(String videoId, String content) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/videos/$videoId/comments'),
        headers: headers,
        body: jsonEncode({'content': content}),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  static Future<dynamic> postCommentReply(String commentId, String content) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('${AppConstants.apiUrl}/videos/comments/$commentId/replies'),
        headers: headers,
        body: jsonEncode({'content': content}),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }
}

import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
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

  static Future<List<dynamic>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/admincategories'),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  static Future<List<dynamic>> getLatestPublicPlaylists({int limit = 20}) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/playlists/public/latest?limit=$limit'),
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
      }
    } catch (_) {}
    return [];
  }

  static Future<List<dynamic>> getLatestCommunityPosts({int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/community/latest?limit=$limit'),
        headers: await _getHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
      }
    } catch (_) {}
    return [];
  }

  static Future<Map<String, dynamic>> search(String query, {int limit = 30}) async {
    final headers = await _getHeaders();
    final uri = Uri.parse('${AppConstants.apiUrl}/search').replace(
      queryParameters: {'q': query, 'limit': '$limit'},
    );
    final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) return data;
    }
    throw Exception('Không thể tìm kiếm (${response.statusCode}).');
  }

  static Future<void> saveSearchHistory(String query) async {
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/search-history'),
      headers: await _getHeaders(),
      body: jsonEncode({'query': query}),
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể lưu lịch sử tìm kiếm.');
    }
  }

  static Future<List<dynamic>> getSearchHistory() async {
    final response = await http.get(
      Uri.parse('${AppConstants.apiUrl}/search-history'),
      headers: await _getHeaders(),
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is List) return data;
    }
    throw Exception('Không thể tải lịch sử tìm kiếm.');
  }

  static Future<void> deleteSearchHistory(String id) async {
    final response = await http.delete(
      Uri.parse('${AppConstants.apiUrl}/search-history/$id'),
      headers: await _getHeaders(),
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể xóa lịch sử tìm kiếm.');
    }
  }

  static Future<void> clearSearchHistory() async {
    final response = await http.delete(
      Uri.parse('${AppConstants.apiUrl}/search-history'),
      headers: await _getHeaders(),
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể xóa lịch sử tìm kiếm.');
    }
  }

  static Future<List<dynamic>> getVideosByCategory(String categoryName) async {
    try {
      final headers = await _getHeaders();
      final uri = Uri.parse('${AppConstants.apiUrl}/videos/explore').replace(queryParameters: {
        if (categoryName != 'Tất cả' && categoryName != 'All') 'category': categoryName,
      });
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
        if (data is Map && data['items'] != null) return data['items'];
      }
    } catch (e) {
      // ignore
    }
    return [];
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

  static Future<List<dynamic>> getAllVideos() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos'),
        headers: headers,
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is List) return data;
      }
    } catch (_) {}
    return [];
  }

  static Future<List<dynamic>> getSubscriptionVideos() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/subscriptions'),
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

  static Future<Map<String, dynamic>> createLivestream({
    required String title,
    required String description,
    required String channelId,
    required String streamKey,
    String tags = '',
    int? categoryId,
    String thumbnailUrl = '',
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/livestreams'),
      headers: headers,
      body: jsonEncode({
        'title': title,
        'channelId': channelId,
        'streamKey': streamKey,
        'description': description,
        'thumbnailUrl': thumbnailUrl,
        'hlsUrl': '',
        'vodUrl': '',
        'tags': tags,
        'categoryId': categoryId,
        'totalViews': 0,
        'status': 'scheduled',
        'scheduledStartTime': DateTime.now().toUtc().toIso8601String(),
      }),
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) return data;
    }
    throw Exception('Không thể tạo phòng livestream (${response.statusCode}).');
  }

  static Future<String> uploadImage(File file) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${AppConstants.apiUrl}/upload/image'),
    );
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    final detectedMime = lookupMimeType(file.path) ?? 'image/jpeg';
    final mimeParts = detectedMime.split('/');
    final contentType = mimeParts.length == 2
        ? MediaType(mimeParts[0], mimeParts[1])
        : MediaType('image', 'jpeg');
    request.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
      contentType: contentType,
    ));
    final response = await request.send().timeout(const Duration(seconds: 30));
    final body = await response.stream.bytesToString();
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(body);
      final url = data['url']?.toString();
      if (url != null && url.isNotEmpty) {
        return url
        .replaceFirst('://localhost', '://${AppConstants.serverIp}')
        .replaceFirst('://127.0.0.1', '://${AppConstants.serverIp}');
      }
    }
    String message = 'Không thể tải ảnh thumbnail lên.';
    try {
      final data = jsonDecode(body);
      message = data['message']?.toString() ?? message;
    } catch (_) {}
    throw Exception('$message (HTTP ${response.statusCode})${body.isEmpty ? '' : ': $body'}');
  }

  static Future<Map<String, dynamic>?> getMyChannel() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('${AppConstants.apiUrl}/channels/me'),
      headers: headers,
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) return data;
    }
    return null;
  }

  static Future<void> endLivestream(String livestreamId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/livestreams/$livestreamId/end'),
      headers: headers,
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể kết thúc livestream.');
    }
  }

  static Future<void> startLivestream(String livestreamId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/livestreams/$livestreamId/start'),
      headers: headers,
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể bắt đầu livestream.');
    }
  }

  static Future<void> pauseLivestream(String livestreamId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/livestreams/$livestreamId/pause'),
      headers: headers,
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể tạm dừng livestream.');
    }
  }

  static Future<void> resumeLivestream(String livestreamId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('${AppConstants.apiUrl}/livestreams/$livestreamId/resume'),
      headers: headers,
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Không thể tiếp tục livestream.');
    }
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

  static Future<dynamic> getPlaylistVideos(String playlistId) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/playlists/$playlistId/videos'),
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

  static Future<List<dynamic>> getWatchHistory() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/history'),
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

  static Future<List<dynamic>> getLikedVideos() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/videos/liked'),
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

  static Future<List<dynamic>> getSavedPlaylists() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${AppConstants.apiUrl}/playlists/saved'),
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

  static Future<dynamic> uploadVideo({
    required String title,
    required String description,
    required String visibility,
    required bool isShort,
    required File videoFile,
    File? thumbnailFile,
    int? categoryId,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final headers = {
        if (token != null) 'Authorization': 'Bearer $token',
      };

      // 1. Upload Video File
      String uploadedVideoUrl = '';
      final videoUri = Uri.parse('${AppConstants.apiUrl}/upload/video');
      final videoReq = http.MultipartRequest('POST', videoUri);
      videoReq.headers.addAll(headers);
      
      final videoMimeType = lookupMimeType(videoFile.path) ?? 'video/mp4';
      final videoTypeData = videoMimeType.split('/');
      videoReq.files.add(await http.MultipartFile.fromPath(
        'file', 
        videoFile.path,
        contentType: MediaType(videoTypeData[0], videoTypeData.length > 1 ? videoTypeData[1] : ''),
      ));
      
      final videoStreamRes = await videoReq.send();
      final videoRes = await http.Response.fromStream(videoStreamRes);
      if (videoRes.statusCode == 200 || videoRes.statusCode == 201) {
        uploadedVideoUrl = jsonDecode(videoRes.body)['url'];
      } else {
        String errMsg = 'Lỗi đăng tải file video (HTTP ${videoRes.statusCode}).';
        try {
          errMsg = jsonDecode(videoRes.body)['message'] ?? errMsg;
        } catch (_) {}
        throw Exception(errMsg);
      }

      // 2. Upload Thumbnail File (if any)
      String uploadedThumbUrl = '';
      if (thumbnailFile != null) {
        final thumbUri = Uri.parse('${AppConstants.apiUrl}/upload/image');
        final thumbReq = http.MultipartRequest('POST', thumbUri);
        thumbReq.headers.addAll(headers);
        
        final thumbMimeType = lookupMimeType(thumbnailFile.path) ?? 'image/jpeg';
        final thumbTypeData = thumbMimeType.split('/');
        thumbReq.files.add(await http.MultipartFile.fromPath(
          'file', 
          thumbnailFile.path,
          contentType: MediaType(thumbTypeData[0], thumbTypeData.length > 1 ? thumbTypeData[1] : ''),
        ));
        
        final thumbStreamRes = await thumbReq.send();
        final thumbRes = await http.Response.fromStream(thumbStreamRes);
        if (thumbRes.statusCode == 200 || thumbRes.statusCode == 201) {
          uploadedThumbUrl = jsonDecode(thumbRes.body)['url'];
        } else {
          String errMsg = 'Lỗi đăng tải ảnh bìa (HTTP ${thumbRes.statusCode}).';
          try {
            errMsg = jsonDecode(thumbRes.body)['message'] ?? errMsg;
          } catch (_) {}
          throw Exception(errMsg);
        }
      }

      // 3. Create Video Record
      final createUri = Uri.parse('${AppConstants.apiUrl}/videos');
      final createRes = await http.post(
        createUri,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: jsonEncode({
          'title': title,
          'description': description,
          'visibility': visibility == 'Riêng tư' ? 'Private' : 'Public',
          'isShort': isShort,
          'thumbnailUrl': uploadedThumbUrl,
          'videoUrl': uploadedVideoUrl,
          'categoryId': categoryId,
          'duration': 0, // Server will calculate or we ignore
        }),
      );

      if (createRes.statusCode == 200 || createRes.statusCode == 201) {
        if (createRes.body.isEmpty) return {'success': true};
        return jsonDecode(createRes.body);
      } else {
        if (createRes.body.isEmpty) {
          throw Exception('Lỗi tạo video (HTTP ${createRes.statusCode}).');
        }
        final data = jsonDecode(createRes.body);
        throw Exception(data['message'] ?? 'Lỗi tạo video.');
      }
    } on Exception {
      rethrow;
    } catch (e) {
      throw Exception('Lỗi kết nối hoặc đăng tải: $e');
    }
  }
}

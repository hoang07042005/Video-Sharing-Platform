import 'dart:convert';
import 'package:flutter/material.dart';
import '../constants.dart';
import '../screens/video/videos/video_detail_screen.dart';

class VideoListTile extends StatelessWidget {
  final Map<String, dynamic> video;
  final VoidCallback? onVideoTapped;

  const VideoListTile({
    super.key,
    required this.video,
    this.onVideoTapped,
  });

  String _getImageUrl(String? url, {bool isAvatar = false}) {
    if (url == null || url.isEmpty) {
      return isAvatar ? 'https://ui-avatars.com/api/?name=User&background=random' : 'https://placehold.co/640x360.png';
    }
    if (url.contains('api.dicebear.com') && url.contains('/svg')) {
      url = url.replaceAll('/svg', '/png');
    }
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http') && !url.startsWith('data:image')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  String _formatDuration(dynamic duration) {
    if (duration == null) return '0:00';
    if (duration is String) return duration;
    if (duration is num) {
      final totalSeconds = duration.toInt();
      final minutes = totalSeconds ~/ 60;
      final seconds = totalSeconds % 60;
      return '$minutes:${seconds.toString().padLeft(2, '0')}';
    }
    return duration.toString();
  }

  String _timeAgo(dynamic dateString, {bool isEndedLive = false}) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString.toString());
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays > 365) return '${(diff.inDays / 365).floor()} năm trước';
      if (diff.inDays > 30) return '${(diff.inDays / 30).floor()} tháng trước';
      if (diff.inDays > 0) return '${diff.inDays} ngày trước';
      if (diff.inHours > 0) return '${isEndedLive ? "Phát trực tiếp " : ""}${diff.inHours} giờ trước';
      if (diff.inMinutes > 0) return '${isEndedLive ? "Phát trực tiếp " : ""}${diff.inMinutes} phút trước';
      return isEndedLive ? 'Phát trực tiếp Vừa xong' : 'Vừa xong';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail'] ?? video['channelBannerUrl'] ?? video['channelAvatarUrl'] ?? video['channelAvatar'] ?? video['avatar']);
    final avatar = _getImageUrl(video['channelAvatarUrl'] ?? video['channelAvatar'] ?? video['avatar'], isAvatar: true);
    final title = video['title'] ?? 'Untitled Video';
    final channelName = video['channelName'] ?? 'Unknown Channel';
    final bool isLive = video['status'] == 'live';
    final bool isEndedLive = (video['isLivestream'] == true || video['actualStartTime'] != null) && !isLive;
    final rawViews = isLive 
        ? (video['currentViewers'] ?? 0)
        : (video['viewCount'] ?? video['viewsCount'] ?? video['views'] ?? video['totalViews'] ?? 0);
    
    String formatViews(dynamic v) {
      double count = v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
      if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')}M';
      if (count >= 1000) return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')}K';
      return count.toInt().toString();
    }
    
    final views = formatViews(rawViews);
    
    dynamic calcDuration() {
      if (video['duration'] != null) return video['duration'];
      if (video['actualStartTime'] != null && video['endTime'] != null) {
        final start = DateTime.tryParse(video['actualStartTime'].toString());
        final end = DateTime.tryParse(video['endTime'].toString());
        if (start != null && end != null) {
          return end.difference(start).inSeconds;
        }
      }
      return null;
    }
    
    final rawDuration = calcDuration();
    final duration = _formatDuration(rawDuration);
    final time = _timeAgo(video['createdAt'] ?? video['time'] ?? video['actualStartTime'] ?? video['scheduledStartTime'], isEndedLive: isEndedLive);

    final bool isVerified = video['channelIsVerified'] == true || video['isVerified'] == true;

    return GestureDetector(
      onTap: () {
        if (onVideoTapped != null) onVideoTapped!();
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'])),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: Colors.transparent,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left: Thumbnail (16:9 ratio, fixed width 180)
            SizedBox(
              width: 180,
              height: 101,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: thumbnail.startsWith('data:image') 
                      ? Image.memory(
                          base64Decode(thumbnail.split(',').last),
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (c, e, s) => Container(color: Colors.grey[900]),
                        )
                      : Image.network(
                          thumbnail,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (c, e, s) => Container(color: Colors.grey[900]),
                        ),
                  ),
                  // Duration Badge
                  if (!isLive && rawDuration != null)
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          duration,
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),
                  // Live Badge
                  if (isLive)
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.sensors, color: Colors.white, size: 10),
                            SizedBox(width: 2),
                            Text(
                              'TRỰC TIẾP',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Right: Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500, height: 1.3),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.more_vert, color: Colors.white54, size: 16),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Channel Avatar and Name
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 8,
                        backgroundColor: Colors.grey[800],
                        backgroundImage: NetworkImage(avatar),
                        onBackgroundImageError: (_, __) {},
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                channelName,
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.check_circle, color: Colors.white70, size: 12),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  // Views and Time
                  Text(
                    '$views lượt xem • $time',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

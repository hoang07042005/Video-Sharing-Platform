import 'package:flutter/material.dart';
import '../constants.dart';
import '../screens/video/videos/video_detail_screen.dart';

class VideoCard extends StatelessWidget {
  final Map<String, dynamic> video;
  final double? width;

  const VideoCard({super.key, required this.video, this.width = 280});

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
    if (!url.startsWith('http')) {
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

  String _timeAgo(dynamic dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString.toString());
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays > 365) return '${(diff.inDays / 365).floor()} năm trước';
      if (diff.inDays > 30) return '${(diff.inDays / 30).floor()} tháng trước';
      if (diff.inDays > 0) return '${diff.inDays} ngày trước';
      if (diff.inHours > 0) return '${diff.inHours} giờ trước';
      if (diff.inMinutes > 0) return '${diff.inMinutes} phút trước';
      return 'Vừa xong';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);
    final avatar = _getImageUrl(video['channelAvatarUrl'] ?? video['channelAvatar'] ?? video['avatar'], isAvatar: true);
    final title = video['title'] ?? 'Untitled Video';
    final channelName = video['channelName'] ?? 'Unknown Channel';
    final bool isVerified = video['channelIsVerified'] == true || video['isVerified'] == true;
    final rawViews = video['viewCount'] ?? video['viewsCount'] ?? video['views'] ?? 0;
    
    String formatViews(dynamic v) {
      double count = v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
      if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} Tr';
      if (count >= 1000) return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} N';
      return count.toInt().toString();
    }
    
    final views = formatViews(rawViews);
    final duration = _formatDuration(video['duration']);
    final time = _timeAgo(video['createdAt'] ?? video['time']);
    final bool isMembersOnly = video['isMembersOnly'] == true;
    
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'])),
        );
      },
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(
                    thumbnail,
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(color: Colors.grey[900]),
                  ),
                ),
                // Members Only Badge
                if (isMembersOnly)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853), // Green
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium, color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'Dành cho hội viên',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Duration Badge
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      duration,
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
            
            // Info
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.network(
                      avatar,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[800],
                        child: const Icon(Icons.person, color: Colors.white54, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Texts
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
                                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            // 3-dots Menu
                            PopupMenuButton<String>(
                              padding: EdgeInsets.zero,
                              color: const Color(0xFF1E1E1E),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'add_to_list',
                                  child: Row(
                                    children: [
                                      Icon(Icons.playlist_add, color: Colors.white, size: 20),
                                      SizedBox(width: 12),
                                      Text('Thêm vào danh sách', style: TextStyle(color: Colors.white, fontSize: 14)),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'share',
                                  child: Row(
                                    children: [
                                      Icon(Icons.share, color: Colors.white, size: 20),
                                      SizedBox(width: 12),
                                      Text('Chia sẻ', style: TextStyle(color: Colors.white, fontSize: 14)),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'download',
                                  child: Row(
                                    children: [
                                      Icon(Icons.download, color: Colors.white, size: 20),
                                      SizedBox(width: 12),
                                      Text('Tải video', style: TextStyle(color: Colors.white, fontSize: 14)),
                                    ],
                                  ),
                                ),
                              ],
                              child: const Icon(Icons.more_vert, color: Colors.white70, size: 18),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                channelName,
                                style: const TextStyle(color: Colors.grey, fontSize: 13),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(Icons.check_circle, color: Colors.green, size: 12),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$views lượt xem • $time',
                          style: const TextStyle(color: Colors.grey, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

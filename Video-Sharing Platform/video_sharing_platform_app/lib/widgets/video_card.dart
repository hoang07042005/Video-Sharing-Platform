import 'dart:convert';
import 'package:flutter/material.dart';
import '../constants.dart';
import '../screens/video/videos/video_detail_screen.dart';
import '../screens/channel/channel_screen.dart';
import 'verified_badge.dart';

class VideoCard extends StatelessWidget {
  final Map<String, dynamic> video;
  final double? width;
  final bool hideAvatar;
  final bool singleRowInfo;
  final BorderRadius thumbnailBorderRadius;
  final VoidCallback? onVideoTapped;

  const VideoCard({
    super.key,
    required this.video,
    this.width = 280,
    this.hideAvatar = false,
    this.singleRowInfo = false,
    this.thumbnailBorderRadius = BorderRadius.zero,
    this.onVideoTapped,
  });

  String _getImageUrl(String? url, {bool isAvatar = false}) {
    if (url == null || url.isEmpty) {
      return isAvatar
          ? 'https://ui-avatars.com/api/?name=User&background=random'
          : 'https://placehold.co/640x360.png';
    }
    if (url.contains('api.dicebear.com') && url.contains('/svg')) {
      url = url.replaceAll('/svg', '/png');
    }
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return url
          .replaceAll('localhost', AppConstants.serverIp)
          .replaceAll('127.0.0.1', AppConstants.serverIp);
    }
    if (!url.startsWith('http') && !url.startsWith('data:image')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl != null && parsedUrl.host.startsWith('192.168.24.')) {
      return parsedUrl.replace(host: AppConstants.serverIp).toString();
    }
    return url;
  }

  String _formatDuration(dynamic duration) {
    if (duration == null) return '0:00';
    if (duration is String) return duration;
    if (duration is num) {
      final totalSeconds = duration.toInt();
      final hours = totalSeconds ~/ 3600;
      final minutes = totalSeconds ~/ 60;
      final seconds = totalSeconds % 60;
      if (hours > 0) {
        final remainingMinutes = (totalSeconds % 3600) ~/ 60;
        return '$hours:${remainingMinutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
      }
      return '$minutes:${seconds.toString().padLeft(2, '0')}';
    }
    return duration.toString();
  }

  String _timeAgo(dynamic dateString, {bool isEndedLive = false}) {
    if (dateString == null) return '';
    try {
      final rawDate = dateString.toString().trim();
      final hasTimezone = rawDate.endsWith('Z') ||
          RegExp(r'[+-]\d{2}:?\d{2}$').hasMatch(rawDate);
      final date =
          DateTime.parse(hasTimezone ? rawDate : '${rawDate}Z').toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.isNegative) return 'Đã lên lịch';

      if (diff.inDays > 365) return '${(diff.inDays / 365).floor()} năm trước';
      if (diff.inDays > 30) return '${(diff.inDays / 30).floor()} tháng trước';
      if (diff.inDays > 0) return '${diff.inDays} ngày trước';
      if (diff.inHours > 0)
        return '${isEndedLive ? "Phát trực tiếp " : ""}${diff.inHours} giờ trước';
      if (diff.inMinutes > 0)
        return '${isEndedLive ? "Phát trực tiếp " : ""}${diff.inMinutes} phút trước';
      return isEndedLive ? 'Phát trực tiếp Vừa xong' : 'Vừa xong';
    } catch (e) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ??
        video['thumbnail'] ??
        video['channelBannerUrl'] ??
        video['channelAvatarUrl'] ??
        video['channelAvatar'] ??
        video['avatar']);
    final avatar = _getImageUrl(
        video['channelAvatarUrl'] ?? video['channelAvatar'] ?? video['avatar'],
        isAvatar: true);
    final title = video['title'] ?? 'Untitled Video';
    final channelName = video['channelName'] ?? 'Unknown Channel';
    final handle = video['channelHandle'] ?? video['channelName'] ?? 'Unknown';
    final bool isVerified =
        video['channelIsVerified'] == true || video['isVerified'] == true;
    final bool isLive =
        (video['status'] ?? '').toString().toLowerCase() == 'live';
    final bool isEndedLive =
        (video['isLivestream'] == true || video['actualStartTime'] != null) &&
            !isLive;
    final rawViews = isLive
        ? (video['currentViewers'] ?? 0)
        : (video['viewCount'] ??
            video['viewsCount'] ??
            video['views'] ??
            video['totalViews'] ??
            0);

    String formatViews(dynamic v) {
      double count =
          v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
      if (count >= 1000000)
        return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} Tr';
      if (count >= 1000)
        return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} N';
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
    final time = _timeAgo(
      video['actualStartTime'] ??
          video['endTime'] ??
          video['createdAt'] ??
          video['time'] ??
          video['scheduledStartTime'],
      isEndedLive: isEndedLive,
    );
    final bool isMembersOnly = video['isMembersOnly'] == true;

    return SizedBox(
      width: width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail
          GestureDetector(
            onTap: () {
              if (onVideoTapped != null) onVideoTapped!();
              Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) =>
                        VideoDetailScreen(videoId: video['id'])),
              );
            },
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: thumbnailBorderRadius,
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: thumbnail.startsWith('data:image')
                        ? Image.memory(
                            base64Decode(thumbnail.split(',').last),
                            fit: BoxFit.cover,
                            errorBuilder: (c, e, s) =>
                                Container(color: Colors.grey[900]),
                          )
                        : Image.network(
                            thumbnail,
                            fit: BoxFit.cover,
                            errorBuilder: (c, e, s) =>
                                Container(color: Colors.grey[900]),
                          ),
                  ),
                ),
                // Members Only Badge
                if (isMembersOnly)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853), // Green
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 4,
                              offset: const Offset(0, 2)),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium,
                              color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'Dành cho hội viên',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Duration or LIVE Badge
                if (isLive || rawDuration != null)
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isLive
                            ? Colors.red
                            : Colors.black.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isLive ? 'TRỰC TIẾP' : duration,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Info
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                if (!hideAvatar) ...[
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) =>
                                ChannelScreen(handle: handle)),
                      );
                    },
                    child: Container(
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
                          child: const Icon(Icons.person,
                              color: Colors.white54, size: 20),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                // Texts
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (context) => VideoDetailScreen(
                                          videoId: video['id'])),
                                );
                              },
                              child: Text(
                                title,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          // 3-dots Menu
                          PopupMenuButton<String>(
                            padding: EdgeInsets.zero,
                            color: const Color(0xFF1E1E1E),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'add_to_list',
                                child: Row(
                                  children: [
                                    Icon(Icons.playlist_add,
                                        color: Colors.white, size: 20),
                                    SizedBox(width: 12),
                                    Text('Thêm vào danh sách',
                                        style: TextStyle(
                                            color: Colors.white, fontSize: 14)),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'share',
                                child: Row(
                                  children: [
                                    Icon(Icons.share,
                                        color: Colors.white, size: 20),
                                    SizedBox(width: 12),
                                    Text('Chia sẻ',
                                        style: TextStyle(
                                            color: Colors.white, fontSize: 14)),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'download',
                                child: Row(
                                  children: [
                                    Icon(Icons.download,
                                        color: Colors.white, size: 20),
                                    SizedBox(width: 12),
                                    Text('Tải video',
                                        style: TextStyle(
                                            color: Colors.white, fontSize: 14)),
                                  ],
                                ),
                              ),
                            ],
                            child: const Icon(Icons.more_vert,
                                color: Colors.white70, size: 18),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (singleRowInfo)
                        Text(
                          '$channelName${isVerified ? ' ✓ ' : ' '}• ${isLive ? '$views đang xem' : '$views lượt xem'}${time.isNotEmpty ? ' • $time' : ''}',
                          style:
                              const TextStyle(color: Colors.grey, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        )
                      else ...[
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) =>
                                      ChannelScreen(handle: handle)),
                            );
                          },
                          child: Row(
                            children: [
                              Flexible(
                                child: Text(
                                  channelName,
                                  style: const TextStyle(
                                      color: Colors.grey, fontSize: 13),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isVerified) ...[
                                const SizedBox(width: 4),
                                const VerifiedBadge(size: 12),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${isLive ? '$views đang xem' : '$views lượt xem'}${time.isNotEmpty ? ' • $time' : ''}',
                          style:
                              const TextStyle(color: Colors.grey, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ]
                    ],
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

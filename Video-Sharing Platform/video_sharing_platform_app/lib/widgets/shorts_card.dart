import 'package:flutter/material.dart';
import '../constants.dart';

class ShortsCard extends StatelessWidget {
  final dynamic video;
  final VoidCallback onTap;
  final double width;

  const ShortsCard({
    super.key,
    required this.video,
    required this.onTap,
    this.width = 180,
  });

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/360x640.png';
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

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);
    final title = video['title'] ?? 'Untitled Short';
    String formatViews(dynamic v) {
      double count = v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
      if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} Tr';
      if (count >= 1000) return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} N';
      return count.toInt().toString();
    }
    
    final rawViews = video['viewsCount'] ?? video['viewCount'] ?? video['views'] ?? 0;
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

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      thumbnail,
                      fit: BoxFit.cover,
                      errorBuilder: (c, e, s) => Container(color: Colors.grey[900]),
                    ),
                    // Gradient overlay at bottom for text readability
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.9)],
                          ),
                        ),
                      ),
                    ),
                      // Views overlay
                      Positioned(
                        bottom: 8,
                        left: 8,
                        child: Row(
                          children: [
                            const Icon(Icons.visibility_outlined, color: Colors.white, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '$views lượt xem',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      // Duration Badge
                      if (rawDuration != null)
                        Positioned(
                          bottom: 8,
                          right: 8,
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
                    ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            // Info
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, height: 1.2),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../constants.dart';

class ShortsCard extends StatelessWidget {
  final dynamic video;
  final VoidCallback onTap;

  const ShortsCard({
    super.key,
    required this.video,
    required this.onTap,
  });

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/360x640.png';
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', '192.168.24.11');
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);
    final title = video['title'] ?? 'Untitled Short';
    final views = video['viewCount'] ?? video['views'] ?? 0;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 180,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
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

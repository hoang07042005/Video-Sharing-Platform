import 'package:flutter/material.dart';
import '../constants.dart';

class ShortsCard extends StatelessWidget {
  final dynamic video;
  final VoidCallback onTap;
  final double width;
  final bool titleOverlay;
  final bool durationAtTop;
  final bool viewsAtTop;

  const ShortsCard({
    super.key,
    required this.video,
    required this.onTap,
    this.width = 180,
    this.titleOverlay = false,
    this.durationAtTop = false,
    this.viewsAtTop = false,
  });

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/360x640.png';
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return url.replaceAll('localhost', AppConstants.serverIp).replaceAll('127.0.0.1', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl != null && _isPrivateNetworkHost(parsedUrl.host)) {
      return parsedUrl.replace(host: AppConstants.serverIp).toString();
    }
    return url;
  }

  bool _isPrivateNetworkHost(String host) {
    return host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        RegExp(r'^172\.(1[6-9]|2[0-9]|3[0-1])\.').hasMatch(host);
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

  @override
  Widget build(BuildContext context) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);
    final title = video['title'] ?? 'Untitled Short';
    final rawViews = video['viewsCount'] ?? video['viewCount'] ?? video['views'] ?? 0;
    final views = rawViews is num ? rawViews.toInt().toString() : (int.tryParse(rawViews.toString()) ?? 0).toString();
    final rawDuration = video['duration'];
    final duration = _formatDuration(rawDuration);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(thumbnail, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey[900])),
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
                    Positioned(
                      top: viewsAtTop ? 8 : null,
                      bottom: viewsAtTop ? null : 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                        child: Row(
                          children: [
                            const Icon(Icons.visibility_outlined, color: Colors.white, size: 14),
                            const SizedBox(width: 4),
                            Text('$views lượt xem', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    if (titleOverlay)
                      Positioned(
                        left: 8,
                        right: 8,
                        bottom: 30,
                        child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, height: 1.2), maxLines: 2, overflow: TextOverflow.ellipsis),
                      ),
                    if (rawDuration != null)
                      Positioned(
                        top: durationAtTop ? 8 : null,
                        bottom: durationAtTop ? null : 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(4)),
                          child: Text(duration, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w500)),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (!titleOverlay) ...[
              const SizedBox(height: 10),
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, height: 1.2), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
          ],
        ),
      ),
    );
  }
}

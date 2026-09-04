import 'package:flutter/material.dart';
import '../../../../constants.dart';


class RecommendedVideosWidget extends StatelessWidget {
  final List<dynamic> videos;
  final Function(String) onVideoTap;

  const RecommendedVideosWidget({
    super.key,
    required this.videos,
    required this.onVideoTap,
  });

  String _formatViews(dynamic v) {
    if (v == null) return "0";
    double count = v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} Tr';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} N';
    return count.toInt().toString();
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return "Vừa xong";
    final date = DateTime.tryParse(dateStr);
    if (date == null) return "Vừa xong";
    final diff = DateTime.now().difference(date);
    if (diff.inDays >= 365) return '${diff.inDays ~/ 365} năm trước';
    if (diff.inDays >= 30) return '${diff.inDays ~/ 30} tháng trước';
    if (diff.inDays >= 1) return '${diff.inDays} ngày trước';
    if (diff.inHours >= 1) return '${diff.inHours} giờ trước';
    if (diff.inMinutes >= 1) return '${diff.inMinutes} phút trước';
    return 'Vừa xong';
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/640x360.png';
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
    if (videos.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text('Video tiếp theo', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        ListView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          itemCount: videos.length,
          itemBuilder: (context, index) {
            final video = videos[index];
            final channel = video['channel'] ?? {};
            
            return InkWell(
              onTap: () => onVideoTap(video['id']),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Thumbnail
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            _getImageUrl(video['thumbnailUrl']),
                            width: 160,
                            height: 90,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 160, height: 90, color: Colors.grey[900],
                              child: const Icon(Icons.error, color: Colors.white54),
                            ),
                          ),
                        ),
                        // Duration (if available)
                        Positioned(
                          bottom: 4, right: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(4)),
                            child: const Text('10:00', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        )
                      ],
                    ),
                    const SizedBox(width: 12),
                    // Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            video['title'] ?? 'Unknown',
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            channel['handle'] ?? channel['userName'] ?? 'Unknown',
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${_formatViews(video['views'])} lượt xem • ${_timeAgo(video['uploadDate'])}',
                            style: const TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.more_vert, color: Colors.white54, size: 16),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

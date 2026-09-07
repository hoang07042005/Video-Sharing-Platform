import 'package:flutter/material.dart';
import '../../../../constants.dart';

class VideoDescriptionSheet extends StatelessWidget {
  final dynamic video;
  final int likesCount;
  final int subscriberCount;

  const VideoDescriptionSheet({
    super.key,
    required this.video,
    required this.likesCount,
    required this.subscriberCount,
  });

  String _formatViews(dynamic v) {
    if (v == null) return "0";
    double count = v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} Tr';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1).replaceAll('.0', '').replaceAll('.', ',')} N';
    return count.toInt().toString();
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return "Không rõ";
    final date = DateTime.tryParse(dateStr);
    if (date == null) return "Không rõ";
    return '${date.day} thg ${date.month} ${date.year}';
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/100x100.png';
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  @override
  Widget build(BuildContext context) {
    final title = video['title'] ?? 'Đang tải...';
    final description = video['description'] ?? 'Không có mô tả';
    final views = video['viewCount'] ?? video['viewsCount'] ?? video['views'] ?? 0;
    
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0F0F0F),
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Nội dung mô tả',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white24, height: 1),
              
              // Scrollable Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16.0),
                  children: [
                    // Full Title
                    Text(
                      title,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    
                    // Stats Row
                    Row(
                      children: [
                        _buildStatBox(
                          value: _formatViews(likesCount),
                          label: 'Lượt thích',
                        ),
                        const SizedBox(width: 8),
                        _buildStatBox(
                          value: _formatViews(views),
                          label: 'Lượt xem',
                        ),
                        const SizedBox(width: 8),
                        _buildStatBox(
                          value: _formatDate(video['createdAt'] ?? video['time']),
                          label: 'Ngày đăng',
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Description Box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white12,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        description,
                        style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Channel Info
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundImage: NetworkImage(_getImageUrl(video['channelAvatarUrl'])),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                video['channelName'] ?? 'Unknown',
                                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${_formatViews(subscriberCount)} người đăng ký',
                                style: const TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.play_circle_outline, color: Colors.white, size: 18),
                            label: const Text('Video', style: TextStyle(color: Colors.white)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white24),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.person_outline, color: Colors.white, size: 18),
                            label: const Text('Giới thiệu', style: TextStyle(color: Colors.white)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white24),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    const Text('Chi tiết video', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    _buildDetailRow('Ngày', _formatDate(video['createdAt'] ?? video['time'])),
                    const SizedBox(height: 8),
                    _buildDetailRow('Lượt xem', views.toString()),
                    const SizedBox(height: 8),
                    _buildDetailRow('Lượt thích', likesCount.toString()),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatBox({required String value, required String label}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white12,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }
}

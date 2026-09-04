import 'package:flutter/material.dart';
import '../../../../constants.dart';
import 'video_report_dialog.dart';
import 'save_to_playlist_sheet.dart';

class VideoInfoWidget extends StatefulWidget {
  final dynamic video;
  final bool isLiked;
  final bool isDisliked;
  final bool isSaved;
  final bool isSubscribed;
  final int likesCount;
  final int subscriberCount;
  final VoidCallback onLike;
  final VoidCallback onDislike;
  final VoidCallback onSave;
  final VoidCallback onSubscribe;

  const VideoInfoWidget({
    super.key,
    required this.video,
    required this.isLiked,
    required this.isDisliked,
    required this.isSaved,
    required this.isSubscribed,
    required this.likesCount,
    required this.subscriberCount,
    required this.onLike,
    required this.onDislike,
    required this.onSave,
    required this.onSubscribe,
  });

  @override
  State<VideoInfoWidget> createState() => _VideoInfoWidgetState();
}

class _VideoInfoWidgetState extends State<VideoInfoWidget> {
  bool _showFullInfo = false;

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
    if (url == null || url.isEmpty) return 'https://placehold.co/100x100.png';
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
    final handle = widget.video['channelHandle'] ?? widget.video['channelName'] ?? 'Unknown';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title & Brief Info
        GestureDetector(
          onTap: () => setState(() => _showFullInfo = !_showFullInfo),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.video['title'] ?? 'Đang tải...',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: _showFullInfo ? null : 1,
                  overflow: _showFullInfo ? TextOverflow.visible : TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (!_showFullInfo)
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: '$handle • ${_formatViews(widget.likesCount)} lượt thích • ${_formatViews(widget.video['viewCount'] ?? widget.video['viewsCount'] ?? widget.video['views'])} lượt xem • ${_timeAgo(widget.video['createdAt'] ?? widget.video['time'])} ',
                          style: const TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                        const TextSpan(
                          text: '...xem thêm',
                          style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (_showFullInfo) ...[
                  Text(
                    '$handle',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      _buildInfoChip('${_formatViews(widget.likesCount)} lượt thích'),
                      const SizedBox(width: 8),
                      _buildInfoChip('${_formatViews(widget.video['viewCount'] ?? widget.video['viewsCount'] ?? widget.video['views'])} lượt xem'),
                      const SizedBox(width: 8),
                      _buildInfoChip(_timeAgo(widget.video['createdAt'] ?? widget.video['time'])),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if ((widget.video['description'] ?? '').isNotEmpty)
                    Text(
                      widget.video['description'],
                      style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
                    ),
                  const SizedBox(height: 4),
                  const Text('Ẩn bớt', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ],
            ),
          ),
        ),

        // Channel & Actions Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            children: [
              // Channel Avatar
              CircleAvatar(
                radius: 16,
                backgroundImage: NetworkImage(_getImageUrl(widget.video['channelAvatarUrl'])),
              ),
              const SizedBox(width: 8),
              // Subscribe Button
              ElevatedButton(
                onPressed: widget.onSubscribe,
                style: ElevatedButton.styleFrom(
                  backgroundColor: widget.isSubscribed ? Colors.grey[800] : Colors.white,
                  foregroundColor: widget.isSubscribed ? Colors.white : Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  minimumSize: const Size(0, 32),
                ),
                child: Text(
                  widget.isSubscribed ? 'Đã đăng ký' : 'Đăng ký',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              
              const Spacer(),
              
              // Like / Dislike grouping
              Container(
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.white12,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    InkWell(
                      onTap: widget.onLike,
                      borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          children: [
                            Icon(
                              widget.isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(_formatViews(widget.likesCount), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                      ),
                    ),
                    Container(width: 1, height: 16, color: Colors.white30),
                    InkWell(
                      onTap: widget.onDislike,
                      borderRadius: const BorderRadius.only(topRight: Radius.circular(20), bottomRight: Radius.circular(20)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Icon(
                          widget.isDisliked ? Icons.thumb_down : Icons.thumb_down_outlined,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Share Action
              _buildCircleButton(Icons.share_outlined, () {}),
              
              const SizedBox(width: 4),
              
              // More Actions - Dropdown popup
              Theme(
                data: Theme.of(context).copyWith(
                  popupMenuTheme: PopupMenuThemeData(
                    color: const Color(0xFF2A2A2A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 8,
                  ),
                ),
                child: PopupMenuButton<String>(
                  icon: Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Colors.white12,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.more_vert, color: Colors.white, size: 18),
                  ),
                  padding: EdgeInsets.zero,
                  offset: const Offset(0, 40),
                  onSelected: (value) {
                    if (value == 'save') {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => SaveToPlaylistSheet(
                          videoId: widget.video['id'].toString(),
                        ),
                      );
                    } else if (value == 'download') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tính năng đang phát triển')),
                      );
                    } else if (value == 'report') {
                      showDialog(
                        context: context,
                        builder: (context) => VideoReportDialog(videoId: widget.video['id']),
                      );
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem<String>(
                      value: 'save',
                      child: Row(
                        children: [
                          Icon(
                            widget.isSaved ? Icons.bookmark : Icons.bookmark_border,
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            widget.isSaved ? 'Bỏ lưu' : 'Lưu vào danh sách phát',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem<String>(
                      value: 'download',
                      child: Row(
                        children: [
                          Icon(Icons.download_outlined, color: Colors.white, size: 20),
                          SizedBox(width: 12),
                          Text('Tải video xuống', style: TextStyle(color: Colors.white, fontSize: 14)),
                        ],
                      ),
                    ),
                    const PopupMenuItem<String>(
                      value: 'report',
                      child: Row(
                        children: [
                          Icon(Icons.flag_outlined, color: Colors.red, size: 20),
                          SizedBox(width: 12),
                          Text('Báo cáo vi phạm', style: TextStyle(color: Colors.red, fontSize: 14)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),
      ],
    );
  }
  Widget _buildCircleButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white12,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  Widget _buildInfoChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }
}

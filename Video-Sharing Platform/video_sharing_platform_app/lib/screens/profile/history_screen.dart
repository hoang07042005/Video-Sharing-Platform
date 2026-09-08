import 'package:flutter/material.dart';
import '../../services/video_service.dart';
import '../../constants.dart';
import '../../widgets/shorts_card.dart';
import '../video/videos/video_detail_screen.dart';
import '../video/short/short_detail_screen.dart';
import '../channel/channel_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _history = [];
  bool _isLoading = true;
  bool _isPaused = false;
  bool _isSearchVisible = false;
  String _searchQuery = '';
  String _selectedFilter = 'Tất cả';
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  final List<String> _filters = ['Tất cả', 'Video', 'Shorts', 'Podcast', 'Âm nhạc'];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      final history = await VideoService.getWatchHistory();
      if (mounted) {
        setState(() {
          _history = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/640x360.png';
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
      final hours = totalSeconds ~/ 3600;
      final minutes = (totalSeconds % 3600) ~/ 60;
      final seconds = totalSeconds % 60;
      if (hours > 0) {
        return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
      }
      return '$minutes:${seconds.toString().padLeft(2, '0')}';
    }
    return duration.toString();
  }

  String _formatViews(dynamic v) {
    if (v == null) return '0';
    num views = v is String ? (num.tryParse(v) ?? 0) : (v as num);
    if (views >= 1000000) return '${(views / 1000000).toStringAsFixed(1).replaceAll('.0', '')} Tr';
    if (views >= 1000) return '${(views / 1000).toStringAsFixed(1).replaceAll('.0', '')} N';
    return views.toString();
  }

  List<dynamic> _getFilteredHistory() {
    return _history.where((item) {
      final video = item['video'] ?? item['Video'] ?? item;
      final title = (video['title'] ?? '').toLowerCase();
      if (_searchQuery.isNotEmpty && !title.contains(_searchQuery.toLowerCase())) {
        return false;
      }
      if (_selectedFilter == 'Video' && video['isShort'] == true) return false;
      if (_selectedFilter == 'Shorts' && video['isShort'] != true) return false;
      return true;
    }).toList();
  }

  List<Map<String, dynamic>> _groupHistory(List<dynamic> videos) {
    final Map<String, List<dynamic>> groups = {};
    for (var item in videos) {
      final video = item['video'] ?? item['Video'] ?? item;
      final dateString = item['viewedAt'] ?? item['createdAt'] ?? video['createdAt'];
      DateTime date;
      try {
        date = dateString != null ? DateTime.parse(dateString.toString()).toLocal() : DateTime.now();
      } catch (_) {
        date = DateTime.now();
      }
      final now = DateTime.now();
      final diffDays = DateTime(now.year, now.month, now.day)
          .difference(DateTime(date.year, date.month, date.day))
          .inDays;
      String label;
      if (diffDays == 0) {
        label = 'Hôm nay';
      } else if (diffDays == 1) {
        label = 'Hôm qua';
      } else if (diffDays < 7) {
        label = 'Tuần này';
      } else if (diffDays < 30) {
        label = 'Tháng này';
      } else {
        label = 'Cũ hơn';
      }
      groups.putIfAbsent(label, () => []).add(item);
    }
    const order = ['Hôm nay', 'Hôm qua', 'Tuần này', 'Tháng này', 'Cũ hơn'];
    return order.where((k) => groups.containsKey(k)).map((k) => {
      'label': k,
      'items': groups[k]!,
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredHistory = _getFilteredHistory();
    final groupedHistory = _groupHistory(filteredHistory);

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.only(left: 4, right: 4, top: 4, bottom: 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white, size: 26),
                    onPressed: () => Navigator.pop(context),
                  ),
                  // Show title in bar when not searching
                  if (!_isSearchVisible)
                    const Text(
                      'Video đã xem',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(
                      _isSearchVisible ? Icons.close : Icons.search,
                      color: Colors.white,
                      size: 26,
                    ),
                    onPressed: () {
                      setState(() {
                        _isSearchVisible = !_isSearchVisible;
                        if (!_isSearchVisible) {
                          _searchQuery = '';
                          _searchController.clear();
                        } else {
                          // auto focus
                          Future.delayed(const Duration(milliseconds: 100), () {
                            _searchFocusNode.requestFocus();
                          });
                        }
                      });
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.more_vert, color: Colors.white, size: 26),
                    onPressed: () => _showManageHistorySheet(context),
                  ),
                ],
              ),
            ),


            // Search Bar (animated show/hide)
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: _isSearchVisible ? 42 : 0,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF272727),
                borderRadius: BorderRadius.circular(8),
              ),
              clipBehavior: Clip.hardEdge,
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                onChanged: (value) => setState(() => _searchQuery = value),
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Tìm kiếm trong danh sách video đã xem',
                  hintStyle: TextStyle(color: Colors.grey, fontSize: 13),
                  prefixIcon: Icon(Icons.search, color: Colors.grey, size: 20),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 0, vertical: 12),
                ),
              ),
            ),

            SizedBox(height: _isSearchVisible ? 12 : 0),

            // Filter chips
            SizedBox(
              height: 38,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filters.length,
                itemBuilder: (context, index) {
                  final filter = _filters[index];
                  final isSelected = _selectedFilter == filter;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFilter = filter),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.white : const Color(0xFF272727),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        filter,
                        style: TextStyle(
                          color: isSelected ? Colors.black : Colors.white70,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 4),

            // Grouped content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF5722)))
                  : groupedHistory.isEmpty
                      ? const Center(
                          child: Text(
                            'Không có video nào trong lịch sử',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          itemCount: groupedHistory.length,
                          itemBuilder: (context, gIndex) {
                            final group = groupedHistory[gIndex];
                            final label = group['label'] as String;
                            final items = group['items'] as List<dynamic>;

                            // Separate shorts and normal videos
                            final List<dynamic> shorts = [];
                            final List<dynamic> normals = [];
                            for (var item in items) {
                              final video = item['video'] ?? item['Video'] ?? item;
                              if (video['isShort'] == true) {
                                shorts.add(video);
                              } else {
                                normals.add(video);
                              }
                            }

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Date Group Header
                                Padding(
                                  padding: const EdgeInsets.only(left: 16, right: 16, top: 20, bottom: 12),
                                  child: Text(
                                    label,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),

                                // Shorts horizontal list
                                if (shorts.isNotEmpty) ...[
                                  SizedBox(
                                    height: 250,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      itemCount: shorts.length,
                                      itemBuilder: (context, sIdx) {
                                        return Padding(
                                          padding: const EdgeInsets.only(right: 10),
                                          child: ShortsCard(
                                            video: shorts[sIdx],
                                            width: 130,
                                            onTap: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) => ShortDetailScreen(
                                                    shorts: shorts,
                                                    initialIndex: sIdx,
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                ],

                                // Normal videos vertical list
                                if (normals.isNotEmpty)
                                  ...normals.map((video) => _buildVideoTile(context, video)).toList(),
                              ],
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  void _showManageHistorySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Quản lý lịch sử',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  // Xoá tất cả
                  InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: const Color(0xFF1A1A1A),
                          title: const Text('Xoá lịch sử xem?', style: TextStyle(color: Colors.white)),
                          content: const Text('Tất cả lịch sử xem sẽ bị xoá vĩnh viễn.', style: TextStyle(color: Colors.grey)),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ', style: TextStyle(color: Colors.grey))),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(ctx);
                                setState(() => _history = []);
                              },
                              child: const Text('Xoá', style: TextStyle(color: Colors.red)),
                            ),
                          ],
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.delete_outline, color: Colors.white, size: 22),
                          const SizedBox(width: 16),
                          const Text('Xoá tất cả lịch sử xem', style: TextStyle(color: Colors.white, fontSize: 15)),
                        ],
                      ),
                    ),
                  ),
                  // Tạm dừng
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        const Icon(Icons.pause_circle_outline, color: Colors.white, size: 22),
                        const SizedBox(width: 16),
                        const Expanded(child: Text('Tạm dừng lịch sử xem', style: TextStyle(color: Colors.white, fontSize: 15))),
                        Switch(
                          value: _isPaused,
                          onChanged: (val) {
                            setSheetState(() {});
                            setState(() => _isPaused = val);
                          },
                          activeColor: Colors.white,
                          activeTrackColor: Colors.grey.shade600,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showVideoOptionsSheet(BuildContext context, dynamic video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Video mini header
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      width: 60,
                      height: 34,
                      color: const Color(0xFF272727),
                      child: Image.network(
                        _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey, size: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      video['title'] ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const Divider(color: Colors.white12, height: 24),
              _sheetOption(Icons.playlist_add, 'Thêm vào danh sách phát', () => Navigator.pop(context)),
              _sheetOption(Icons.delete_outline, 'Xoá khỏi lịch sử xem', () {
                Navigator.pop(context);
                final id = video['id'] ?? video['_id'];
                setState(() {
                  _history.removeWhere((item) {
                    final v = item['video'] ?? item['Video'] ?? item;
                    return (v['id'] ?? v['_id']) == id;
                  });
                });
              }),
              _sheetOption(Icons.share_outlined, 'Chia sẻ', () => Navigator.pop(context)),
              _sheetOption(Icons.download_outlined, 'Tải video', () => Navigator.pop(context)),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _sheetOption(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: Colors.white70, size: 22),
            const SizedBox(width: 16),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 15)),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoTile(BuildContext context, dynamic video) {
    // API trả về channelName và channelAvatarUrl trực tiếp ở cấp video
    // hoặc có thể được bọc trong channel/Channel
    final channel = video['channel'] ?? video['Channel'] ?? {};
    final channelName = video['channelName'] 
        ?? channel['channelName'] 
        ?? channel['name'] 
        ?? '';
    // viewsCount là field chính, viewCount là fallback
    final views = _formatViews(
        video['viewsCount'] ?? video['viewCount'] ?? video['views'] ?? 0);
    final thumbnailUrl = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoDetailScreen(videoId: video['id'] ?? video['_id']),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail with duration badge
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Stack(
                children: [
                  Container(
                    width: 180,
                    height: 120,
                    color: const Color(0xFF272727),
                    child: Image.network(
                      thumbnailUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.grey),
                    ),
                  ),
                  // Duration
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _formatDuration(video['duration']),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          video['title'] ?? 'Video',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            height: 1.3,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => _showVideoOptionsSheet(context, video),
                        child: const Icon(Icons.more_vert, color: Colors.white54, size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () {
                      final channel = video['channel'] ?? video['Channel'] ?? {};
                      final handle = video['channelHandle'] ?? channel['channelHandle'] ?? channelName;
                      Navigator.push(context, MaterialPageRoute(builder: (context) => ChannelScreen(handle: handle)));
                    },
                    child: Text(
                      channelName,
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$views lượt xem',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
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


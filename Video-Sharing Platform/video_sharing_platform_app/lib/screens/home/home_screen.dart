import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../constants.dart';
import '../../services/video_service.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/category_filter.dart';
import '../../widgets/video_card.dart';
import '../../widgets/shorts_card.dart';
import '../../widgets/video_list_tile.dart';
import '../video/short/short_detail_screen.dart';
import '../category/categories_screen.dart';

import '../video/videos/video_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  List<dynamic> _recommendedVideos = [];
  List<dynamic> _randomVideos = [];
  List<dynamic> _shorts = [];
  List<dynamic> _livestreams = [];
  List<dynamic> _categories = [];
  int _currentHeroIndex = 0;
  final PageController _heroPageController = PageController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);

    try {
      final results = await Future.wait([
        VideoService.getRecommendedVideos(),
        VideoService.getShorts(),
        VideoService.getActiveLivestreams(),
        VideoService.getCategories(),
      ]);

      if (mounted) {
        setState(() {
          // Chỉ lấy Video thường (isShort != true)
          final normalVideos = results[0]
              .where((v) => v['isShort'] != true)
              .toList();
          _recommendedVideos = normalVideos;
          
          final shuffledNormal = List<dynamic>.from(normalVideos)..shuffle();
          _randomVideos = shuffledNormal.take(40).toList();

          // Dữ liệu từ getShorts() đã là shorts, không cần filter isShort
          _shorts = results[1].toList();
              
          _livestreams = results[2];
          _categories = results[3];
          
          if (_categories.isEmpty) {
            // Dữ liệu dự phòng
            _categories = [
              {'name': 'Âm nhạc', 'icon': 'Music', 'color': 'cyanAccent'},
              {'name': 'Game', 'icon': 'Gamepad2', 'color': 'greenAccent'},
              {'name': 'Phim ảnh', 'icon': 'Film', 'color': 'blueAccent'},
              {'name': 'Giáo dục', 'icon': 'GraduationCap', 'color': 'purpleAccent'},
              {'name': 'Du lịch', 'icon': 'Plane', 'color': 'lightBlueAccent'},
              {'name': 'Ẩm thực', 'icon': 'Utensils', 'color': 'orangeAccent'},
              {'name': 'Thể thao', 'icon': 'Dumbbell', 'color': 'deepOrangeAccent'},
              {'name': 'Khác', 'icon': 'LayoutGrid', 'color': 'blue'},
            ];
          } else {
             // Lấy tối đa 8 danh mục
             _categories = _categories.take(8).toList();
          }
          
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/640x360.png';
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

  Widget _buildSectionHeader(String title, IconData icon, Color iconColor, {VoidCallback? onSeeAll}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Row(
                children: const [
                  Text(
                    'Xem tất cả',
                    style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                  Icon(Icons.chevron_right, color: Colors.redAccent, size: 16),
                ],
              ),
            )
          else
            Row(
              children: const [
                Text(
                  'Xem tất cả',
                  style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
                ),
                Icon(Icons.chevron_right, color: Colors.redAccent, size: 16),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid() {
    IconData getIcon(String iconName) {
      switch (iconName.toLowerCase()) {
        case 'music': return Icons.music_note;
        case 'gamepad2': return Icons.sports_esports;
        case 'film': return Icons.movie;
        case 'graduationcap': return Icons.school;
        case 'plane': return Icons.flight;
        case 'utensils': return Icons.restaurant;
        case 'dumbbell': return Icons.fitness_center;
        case 'monitor': return Icons.monitor;
        case 'newspaper': return Icons.language;
        case 'tv': return Icons.tv;
        case 'heart': return Icons.favorite;
        default: return Icons.grid_view;
      }
    }

    Color getColor(int index) {
      final colors = [
        Colors.cyanAccent, Colors.greenAccent, Colors.blueAccent, 
        Colors.purpleAccent, Colors.lightBlueAccent, Colors.orangeAccent, 
        Colors.deepOrangeAccent, Colors.pinkAccent
      ];
      return colors[index % colors.length];
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.1,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final iconData = getIcon(cat['icon']?.toString() ?? '');
          final color = getColor(index);
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CategoriesScreen(
                    categories: _categories,
                    initialCategory: cat['name']?.toString() ?? 'Khác',
                  ),
                ),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E212A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(iconData, color: color, size: 24),
                  const SizedBox(height: 8),
                  Text(
                    cat['name']?.toString() ?? 'Khác',
                    style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeroCarousel() {
    final topVideos = _recommendedVideos
      .where((v) => v['isShort'] != true)
      .toList()
      ..sort((a, b) {
        final aViews = a['viewCount'] ?? a['viewsCount'] ?? a['views'] ?? 0;
        final bViews = b['viewCount'] ?? b['viewsCount'] ?? b['views'] ?? 0;
        return (bViews is num ? bViews.toInt() : int.tryParse(bViews.toString()) ?? 0)
            .compareTo(aViews is num ? aViews.toInt() : int.tryParse(aViews.toString()) ?? 0);
      });
    final heroVideos = topVideos.take(5).toList();

    if (heroVideos.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 16, bottom: 24),
      height: 220,
      child: Stack(
        children: [
          PageView.builder(
            controller: _heroPageController,
            onPageChanged: (index) {
              setState(() {
                _currentHeroIndex = index;
              });
            },
            itemCount: heroVideos.length,
            itemBuilder: (context, index) {
              return _buildHeroSlide(heroVideos[index]);
            },
          ),
          
          // Pagination Dots
          Positioned(
            bottom: 16,
            right: 32,
            child: Row(
              children: List.generate(heroVideos.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: _buildDot(index == _currentHeroIndex),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSlide(Map<String, dynamic> video) {
    final thumbnail = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);
    final String title = video['title'] ?? 'Untitled';
    final String description = video['description'] ?? 'Thư giãn • Tập trung • Bắt đầu ngày mới';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'])),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          image: DecorationImage(
            image: NetworkImage(thumbnail),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: LinearGradient(
                  colors: [Colors.black.withValues(alpha: 0.8), Colors.transparent],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 32,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'])),
                        );
                      },
                      icon: const Icon(Icons.play_arrow, color: Colors.black, size: 16),
                      label: const Text('Xem ngay', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDot(bool isActive) {
    return Container(
      width: isActive ? 20 : 6,
      height: 6,
      decoration: BoxDecoration(
        color: isActive ? Colors.white : Colors.white54,
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: const CustomAppBar(),
      body: RefreshIndicator(
        color: AppConstants.accentColor,
        backgroundColor: Colors.grey[900],
        onRefresh: _fetchData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppConstants.accentColor))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Featured Hero Banner
                    _buildHeroCarousel(),

                    // Shorts Section (Shorts nổi bật)
                    if (_shorts.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildSectionHeader('Shorts nổi bật', Icons.play_circle_filled, Colors.redAccent),
                      ),
                      SizedBox(
                        height: 280, // Slightly shorter for shorts
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _shorts.length > 10 ? 10 : _shorts.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: ShortsCard(
                                video: _shorts[index],
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ShortDetailScreen(
                                        shorts: _shorts,
                                        initialIndex: index,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Recommended Videos (Video đề xuất)
                    if (_recommendedVideos.isNotEmpty) ...[
                      _buildSectionHeader('Video đề xuất', Icons.play_circle_filled, Colors.redAccent),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: EdgeInsets.zero,
                        itemCount: _recommendedVideos.length > 8 ? 8 : _recommendedVideos.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: VideoListTile(video: _recommendedVideos[index]),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Trending Videos (Đang thịnh hành)
                    if (_randomVideos.isNotEmpty) ...[
                      _buildSectionHeader('Đang thịnh hành', Icons.local_fire_department, Colors.redAccent),
                      SizedBox(
                        height: 280, // Tăng thêm height để chứa ảnh to hơn
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: math.min(5, _randomVideos.length),
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 16),
                              child: SizedBox(
                                width: 280, // Tăng độ lớn của thẻ/ảnh
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    VideoCard(
                                      video: _randomVideos[index],
                                      width: 280,
                                      hideAvatar: true,
                                      singleRowInfo: false,
                                    ),
                                    Positioned(
                                      top: 8,
                                      left: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.redAccent,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          '#${index + 1}',
                                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // Categories (Danh mục)
                    _buildSectionHeader(
                      'Danh mục', 
                      Icons.grid_view_rounded, 
                      Colors.white70,
                      onSeeAll: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CategoriesScreen(categories: _categories),
                          ),
                        );
                      },
                    ),
                    _buildCategoryGrid(),
                    const SizedBox(height: 32),

                    // Livestreams (Playlist nổi bật)
                    if (_livestreams.isNotEmpty) ...[
                      _buildSectionHeader('Playlist nổi bật', Icons.queue_music, Colors.purpleAccent),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _livestreams.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: VideoCard(
                                video: _livestreams[index],
                                width: 280,
                                hideAvatar: true,
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],

                    // Standard Video Feed (Video thường bất kỳ)
                    if (_randomVideos.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildSectionHeader('Video có thể bạn sẽ thích', Icons.play_circle_filled, Colors.redAccent),
                      ),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: math.min(40, _randomVideos.length),
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: VideoCard(video: _randomVideos[index], width: double.infinity),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}

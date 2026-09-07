import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../constants.dart';
import '../../services/video_service.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/category_filter.dart';
import '../../widgets/video_card.dart';
import '../../widgets/shorts_card.dart';
import '../video/short/short_detail_screen.dart';

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
      ]);

      if (mounted) {
        setState(() {
          // Chỉ lấy Video thường (isShort != true)
          final normalVideos = results[0]
              .where((v) => v['isShort'] != true)
              .toList();
          _recommendedVideos = normalVideos;
          
          final shuffledNormal = List<dynamic>.from(normalVideos)..shuffle();
          _randomVideos = shuffledNormal.take(20).toList();

          // Dữ liệu từ getShorts() đã là shorts, không cần filter isShort
          _shorts = results[1].toList();
              
          _livestreams = results[2];
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

  Widget _buildSectionHeader(String title, IconData icon, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          const Text(
            'Xem tất cả',
            style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const Icon(Icons.chevron_right, color: Colors.redAccent, size: 16),
        ],
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
    final heroVideos = topVideos.take(8).toList();

    if (heroVideos.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 20, bottom: 32),
      height: 300,
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
          
          // Right Navigation Button
          Positioned(
            right: 16,
            top: 134, // (300 / 2) - 16
            child: GestureDetector(
              onTap: () {
                _heroPageController.nextPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              },
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: const Icon(Icons.chevron_right, color: Colors.white, size: 20),
              ),
            ),
          ),
          
          // Pagination Dots
          Positioned(
            bottom: 16,
            right: 20,
            child: Row(
              children: List.generate(heroVideos.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(left: 4),
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
    final rawAvatar = video['channelAvatar'] ?? video['channelAvatarUrl'] ?? video['avatar'];
    final bool hasAvatar = rawAvatar != null && rawAvatar.toString().isNotEmpty;
    final avatar = _getImageUrl(rawAvatar);
    final channelName = video['channelName'] ?? 'Unknown';
    final channelInitials = channelName.isNotEmpty ? channelName[0].toUpperCase() : 'A';
    final bool isVerified = video['channelIsVerified'] == true || video['isVerified'] == true;
    final views = _formatViews(video['viewCount'] ?? video['viewsCount'] ?? video['views']);
    final time = _timeAgo(video['createdAt'] ?? video['time']);
    
    // Split title logic like in React
    final String title = video['title'] ?? 'Untitled';
    final words = title.split(' ');
    final third = math.max(1, words.length ~/ 3);
    final part1 = words.take(third).join(' ');
    
    final endIndex = math.max(third * 2, words.length - 1);
    final part2 = words.skip(third).take(endIndex - third).join(' ');
    final part3 = words.skip(endIndex).join(' ');

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'])),
        );
      },
      child: Container(
        decoration: BoxDecoration(
        
        borderRadius: BorderRadius.circular(0),
        image: DecorationImage(
          image: NetworkImage(thumbnail),
          fit: BoxFit.cover,
        ),
      ),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(0),
              gradient: LinearGradient(
                colors: [Colors.black.withValues(alpha: 0.9), Colors.black.withValues(alpha: 0.2)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Title with multiple colors
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontFamily: 'Arial'), // Fallback font
                    children: [
                      if (part1.isNotEmpty) TextSpan(text: '$part1 ', style: const TextStyle(color: Colors.white)),
                      if (part2.isNotEmpty) TextSpan(
                        text: '$part2 ',
                        style: TextStyle(
                          foreground: Paint()
                            ..shader = const LinearGradient(
                              colors: [Colors.pinkAccent, Color(0xFFFF5722), Colors.orangeAccent],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ).createShader(Rect.fromLTWH(0, 0, MediaQuery.of(context).size.width, 50)),
                        ),
                      ),
                      if (part3.isNotEmpty) TextSpan(text: part3, style: const TextStyle(color: Colors.white)),
                    ],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                
                // Description
                Text(
                  video['description'] ?? 'Tuyển chọn những ca khúc nổi bật nhất đang làm mưa làm gió trên mọi bảng xếp hạng.',
                  style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                // Meta info
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Row 1: Channel Info
                    Row(
                      children: [
                        // Avatar
                        Builder(
                          builder: (context) {
                            final fallback = Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 2),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFFF5722), Color(0xFF9C27B0)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                channelInitials,
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            );

                            if (!hasAvatar || rawAvatar.toString().contains('placeholder.com')) {
                              return fallback;
                            }

                            return Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 2),
                              ),
                              child: ClipOval(
                                child: Image.network(
                                  avatar,
                                  width: 32,
                                  height: 32,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => fallback,
                                ),
                              ),
                            );
                          }
                        ),
                        const SizedBox(width: 8),
                        Text(channelName, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                        if (isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.check_circle, color: Colors.green, size: 14),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    
                    // Row 2: Views and Time
                    Row(
                      children: [
                        // Play icon in orange circle
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF5722),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF5722).withValues(alpha: 0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Padding(
                            padding: EdgeInsets.only(left: 2.0),
                            child: Icon(Icons.play_arrow, color: Colors.white, size: 10),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text('$views lượt xem', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        const SizedBox(width: 8),
                        const Text('•', style: TextStyle(color: Colors.white54, fontSize: 12)),
                        const SizedBox(width: 8),
                        Text(time, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Buttons
                Row(
                  children: [
                    Container(
                      height: 36,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Colors.deepOrangeAccent, Colors.pinkAccent],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.play_arrow, color: Colors.white, size: 14),
                        label: const Text('Xem ngay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 36,
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.add, color: Colors.white, size: 14),
                        label: const Text('Danh sách phát', style: TextStyle(color: Colors.white, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.black.withValues(alpha: 0.5),
                          side: BorderSide.none,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
        ],
      ),
    ));
  }

  Widget _buildDot(bool isActive) {
    return Container(
      width: isActive ? 20 : 6,
      height: 6,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFFF5722) : Colors.white54,
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

                    
                    // Category Grid
                    const CategoryFilter(),

                    // Shorts Section
                    if (_shorts.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildSectionHeader('Shorts (video ngắn)', Icons.bolt, Colors.orangeAccent),
                      ),
                      SizedBox(
                        height: 320, // Taller for shorts
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _shorts.length > 10 ? 10 : _shorts.length, // Max 10 items
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

                    // Recommended Videos (Video thường)
                    if (_randomVideos.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildSectionHeader('Video thường', Icons.play_circle_filled, Colors.redAccent),
                      ),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _randomVideos.length,
                        itemBuilder: (context, index) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: VideoCard(video: _randomVideos[index], width: double.infinity),
                          );
                        },
                      ),
                    ],



                    // Livestreams (Playlist nổi bật)
                    if (_livestreams.isNotEmpty) ...[
                      _buildSectionHeader('Playlist nổi bật', Icons.queue_music, Colors.purpleAccent),
                      SizedBox(
                        height: 260,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _livestreams.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 16),
                              child: VideoCard(video: _livestreams[index], width: 280),
                            );
                          },
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
      ),
    );
  }
}

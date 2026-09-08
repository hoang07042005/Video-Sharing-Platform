import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../constants.dart';
import '../../services/channel_service.dart';
import '../../services/video_service.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/video_card.dart';
import '../../widgets/shorts_card.dart';
import '../video/short/short_detail_screen.dart';
import 'all_subscriptions_screen.dart';
import '../channel/channel_screen.dart';

class SubscriptionsScreen extends StatefulWidget {
  const SubscriptionsScreen({super.key});

  @override
  State<SubscriptionsScreen> createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen> {
  bool _isLoading = true;
  List<dynamic> _channels = [];
  List<dynamic> _videos = [];
  String _activeFilter = 'Tất cả';
  final List<String> _filters = ['Tất cả', 'Hôm nay', 'Video', 'Shorts', 'Trực tiếp'];
  String? _selectedChannelId;
  dynamic _selectedChannel;
  Set<String> _watchedVideoIds = {};

  @override
  void initState() {
    super.initState();
    _loadWatchedVideos();
    _fetchData();
  }

  Future<void> _loadWatchedVideos() async {
    final prefs = await SharedPreferences.getInstance();
    final watched = prefs.getStringList('watched_videos') ?? [];
    setState(() {
      _watchedVideoIds = watched.toSet();
    });
  }

  Future<void> _markVideoAsWatched(String videoId) async {
    if (_watchedVideoIds.contains(videoId)) return;
    
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _watchedVideoIds.add(videoId);
    });
    await prefs.setStringList('watched_videos', _watchedVideoIds.toList());
  }

  Future<void> _markAllChannelVideosAsWatched(String channelId) async {
    final channelVideos = _videos.where((v) => v['channelId']?.toString() == channelId).toList();
    bool hasChanges = false;
    for (var v in channelVideos) {
      if (!_watchedVideoIds.contains(v['id'].toString())) {
        _watchedVideoIds.add(v['id'].toString());
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      final prefs = await SharedPreferences.getInstance();
      setState(() {});
      await prefs.setStringList('watched_videos', _watchedVideoIds.toList());
    }
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ChannelService.getSubscribedChannels(),
        VideoService.getSubscriptionVideos(),
      ]);

      if (mounted) {
        setState(() {
          _channels = results[0];
          _videos = results[1];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
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

  List<dynamic> _getFilteredVideos() {
    List<dynamic> list = _videos;
    
    if (_selectedChannelId != null) {
      list = list.where((v) => v['channelId']?.toString() == _selectedChannelId).toList();
    }

    if (_activeFilter == 'Tất cả') return list;
    if (_activeFilter == 'Video') return list.where((v) => v['isShort'] != true && v['status'] != 'live').toList();
    if (_activeFilter == 'Shorts') return list.where((v) => v['isShort'] == true).toList();
    if (_activeFilter == 'Trực tiếp') return list.where((v) => v['status'] == 'live').toList();
    
    if (_activeFilter == 'Hôm nay') {
      final now = DateTime.now();
      return list.where((v) {
        final dateStr = v['createdAt'] ?? v['scheduledStartTime'];
        if (dateStr == null) return false;
        final date = DateTime.tryParse(dateStr.toString());
        if (date == null) return false;
        return date.year == now.year && date.month == now.month && date.day == now.day;
      }).toList();
    }
    return list;
  }

  Widget _buildChannelItem(dynamic channel) {
    final avatarUrl = _getImageUrl(channel['avatarUrl']);
    final channelName = channel['channelName'] ?? channel['handle'] ?? '';
    final channelIdStr = channel['id'].toString();
    
    // Xử lý logic có thông báo mới (chấm xanh)
    bool hasNewVideo = false;
    final channelVideos = _videos.where((v) => v['channelId']?.toString() == channelIdStr).toList();
    for (var v in channelVideos) {
      if (!_watchedVideoIds.contains(v['id'].toString())) {
        hasNewVideo = true;
        break;
      }
    }
    
    final isSelected = _selectedChannelId == channelIdStr;

    return GestureDetector(
      onTap: () {
        _markAllChannelVideosAsWatched(channelIdStr);
        setState(() {
          if (isSelected) {
            _selectedChannelId = null;
            _selectedChannel = null;
          } else {
            _selectedChannelId = channel['id'].toString();
            _selectedChannel = channel;
          }
        });
      },
      child: Container(
        width: 72,
        margin: const EdgeInsets.only(right: 8),
        child: Column(
          children: [
            Stack(
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: isSelected ? Colors.blue : Colors.transparent, width: 2), // Highlight selected
                  ),
                  child: CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.grey.shade800,
                    backgroundImage: NetworkImage(avatarUrl),
                    onBackgroundImageError: (_, __) {},
                  ),
                ),
                if (hasNewVideo)
                  Positioned(
                    right: 4,
                    bottom: 4,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 24, 141, 4),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppConstants.primaryColor, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              channelName,
              style: const TextStyle(color: Colors.white70, fontSize: 11),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: _filters.map((filter) {
          final isActive = filter == _activeFilter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _activeFilter = filter;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: isActive ? Colors.white : Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  filter,
                  style: TextStyle(
                    color: isActive ? Colors.black : Colors.white,
                    fontWeight: isActive ? FontWeight.w500 : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredVideos = _getFilteredVideos();

    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: const CustomAppBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.red))
          : RefreshIndicator(
              onRefresh: _fetchData,
              color: Colors.red,
              backgroundColor: const Color(0xFF212121),
              child: CustomScrollView(
                slivers: [
                  // Channels List
                  if (_channels.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Container(
                        height: 100,
                        padding: const EdgeInsets.only(top: 12, left: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: _channels.length,
                                itemBuilder: (context, index) {
                                  return _buildChannelItem(_channels[index]);
                                },
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => const AllSubscriptionsScreen()));
                              },
                              child: Container(
                                width: 60,
                                alignment: Alignment.center,
                                child: const Text(
                                  'Tất cả',
                                  style: TextStyle(color: Colors.blue, fontWeight: FontWeight.w500, fontSize: 14),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  
                  // Divider
                  if (_channels.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Divider(color: Colors.white.withOpacity(0.1), height: 1),
                    ),

                  // Filters
                  SliverToBoxAdapter(
                    child: _buildFilters(),
                  ),

                  // View Channel Button when a channel is selected
                  if (_selectedChannel != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 4.0),
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => ChannelScreen(handle: _selectedChannel['handle'] ?? _selectedChannel['id'].toString())));
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.blue),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text('Truy cập vào kênh', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),

                  // Section Title
                  if (_activeFilter != 'Shorts')
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Text(
                          'Phù hợp nhất',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),

                  // Horizontal Shorts Shelf (if not explicitly filtering Shorts only or Video only)
                  if ((_activeFilter == 'Tất cả' || _activeFilter == 'Hôm nay') &&
                      _videos.where((v) => v['isShort'] == true).isNotEmpty)
                    SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            child: Row(
                              children: [
                                Icon(Icons.bolt, color: Colors.orangeAccent, size: 24),
                                const SizedBox(width: 8),
                                const Text('Shorts', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 320,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _videos.where((v) => v['isShort'] == true).length,
                              itemBuilder: (context, index) {
                                final shortsList = _videos.where((v) => v['isShort'] == true).toList();
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: ShortsCard(
                                    video: shortsList[index],
                                    onTap: () {
                                      _markVideoAsWatched(shortsList[index]['id'].toString());
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ShortDetailScreen(
                                            shorts: shortsList,
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
                      ),
                    ),

                  // Video/Shorts Feed
                  if (filteredVideos.isEmpty)
                    const SliverFillRemaining(
                      child: Center(
                        child: Text(
                          'Không có nội dung nào.',
                          style: TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      ),
                    )
                  else if (_activeFilter == 'Shorts')
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.6,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            return ShortsCard(
                              video: filteredVideos[index],
                              onTap: () {
                                _markVideoAsWatched(filteredVideos[index]['id'].toString());
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ShortDetailScreen(
                                      shorts: filteredVideos,
                                      initialIndex: index,
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                          childCount: filteredVideos.length,
                        ),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final video = filteredVideos[index];
                          if (video['isShort'] == true) {
                            return const SizedBox.shrink(); // Hide shorts in vertical list if not filtered
                          }
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: VideoCard(
                              video: video, 
                              width: double.infinity,
                              onVideoTapped: () => _markVideoAsWatched(video['id'].toString()),
                            ),
                          );
                        },
                        childCount: filteredVideos.length,
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

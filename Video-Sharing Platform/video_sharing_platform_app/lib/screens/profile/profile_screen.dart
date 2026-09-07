import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../services/video_service.dart';
import '../video/videos/video_detail_screen.dart';
import '../video/short/short_detail_screen.dart';
import '../../constants.dart';
import '../../widgets/shorts_card.dart';
import 'settings_screen.dart';
import 'history_screen.dart';
import '../channel/channel_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  List<dynamic> _historyNormal = [];
  List<dynamic> _historyShorts = [];
  List<dynamic> _playlists = [];
  List<dynamic> _likedVideos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final user = await AuthService.getCurrentUser();
      final history = await VideoService.getWatchHistory();
      final playlists = await VideoService.getMyPlaylists();
      final likedVideos = await VideoService.getLikedVideos();

      final normal = [];
      final shorts = [];
      for (var item in history) {
        final video = item['video'] ?? item['Video'] ?? item;
        if (video['isShort'] == true) {
          if (shorts.length < 20) shorts.add(video);
        } else {
          if (normal.length < 20) normal.add(video);
        }
      }

      if (mounted) {
        setState(() {
          _user = user;
          _historyNormal = normal;
          _historyShorts = shorts;
          _playlists = playlists;
          _likedVideos = likedVideos;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        elevation: 0,
        title: Row(
          children: [
            const Text('Tài khoản', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_none, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.search, color: Colors.white), onPressed: () {}),
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white), 
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            }
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileHeader(),
            const SizedBox(height: 24),
            if (_historyNormal.isNotEmpty || _historyShorts.isNotEmpty) ...[
              _buildSectionTitle('Video đã xem', hasArrow: true, onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const HistoryScreen()));
              }),
              if (_historyNormal.isNotEmpty) ...[
                _buildHorizontalHistory(),
                const SizedBox(height: 16),
              ],
              if (_historyShorts.isNotEmpty) ...[
                _buildShortsHistory(),
                const SizedBox(height: 24),
              ],
            ],
            _buildSectionTitle('Thư viện'),
            _buildPlaylists(),
            _buildLibraryItem(
              thumbnail: _buildCenteredIconThumbnail(Icons.download, const Color(0xFF272727)),
              title: 'Nội dung tải xuống',
              subtitle: '0 video',
              onTap: () {},
            ),
            if (_likedVideos.isNotEmpty)
              _buildLibraryItem(
                thumbnail: _buildVideoThumbnailWithIcon(
                  imageUrl: _likedVideos[0]['thumbnailUrl'] ?? _likedVideos[0]['thumbnail'],
                  icon: Icons.thumb_up_alt_outlined,
                ),
                title: 'Video đã thích',
                subtitle: 'Riêng tư',
                onTap: () {},
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    final name = _user?['fullName'] ?? _user?['handle'] ?? 'Người dùng';
    final handle = _user?['handle'] != null ? '@${_user!['handle']}' : '@user';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    String? avatarUrl = _user?['avatarUrl'];
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      if (avatarUrl.contains('localhost')) {
        avatarUrl = avatarUrl.replaceAll('localhost', AppConstants.serverIp);
      } else if (!avatarUrl.startsWith('http')) {
        avatarUrl = '${AppConstants.apiUrl.replaceAll('/api', '')}$avatarUrl';
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Column(
        children: [
          GestureDetector(
            onTap: () {
              final handle = _user?['handle'];
              if (handle != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ChannelScreen(handle: handle),
                  ),
                );
              }
            },
            child: Row(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Colors.green.shade700,
                  backgroundImage: (avatarUrl != null && avatarUrl.isNotEmpty)
                      ? NetworkImage(avatarUrl)
                      : null,
                  onBackgroundImageError: (avatarUrl != null && avatarUrl.isNotEmpty)
                      ? (_, __) {}
                      : null,
                  child: (avatarUrl == null || avatarUrl.isEmpty)
                      ? Text(initial, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold))
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        handle,
                        style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.workspace_premium, color: Color(0xFFFFD700), size: 16),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.08),
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  label: const Text('Nâng cấp Pro', style: TextStyle(color: Colors.white, fontSize: 13)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.diamond, color: Color(0xFF7C4DFF), size: 16),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.08),
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  label: const Text('Nâng cấp Premium', style: TextStyle(color: Colors.white, fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, {bool hasArrow = false, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
        child: Row(
          children: [
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            if (hasArrow) ...[
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Colors.white, size: 20),
            ],
          ],
        ),
      ),
    );
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) {
      return 'https://placehold.co/640x360.png';
    }
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  Widget _buildHorizontalHistory() {
    return SizedBox(
      height: 160,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        scrollDirection: Axis.horizontal,
        itemCount: _historyNormal.length,
        itemBuilder: (context, index) {
          final video = _historyNormal[index];
          final channel = video['channel'] ?? video['Channel'] ?? {};
          final channelName = channel['channelName'] ?? channel['name'] ?? '';
          
          String thumbnailUrl = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail']);

          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: video['id'] ?? video['_id'])),
              );
            },
            child: Container(
              width: 150,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Stack(
                      children: [
                        Container(
                          width: 150,
                          height: 84,
                          color: Colors.grey.shade900,
                          child: thumbnailUrl.isNotEmpty
                              ? Image.network(thumbnailUrl, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.broken_image))
                              : const Icon(Icons.video_library, color: Colors.white54),
                        ),
                        // Duration badge
                        Positioned(
                          bottom: 4,
                          right: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            decoration: BoxDecoration(color: Colors.black.withOpacity(0.8), borderRadius: BorderRadius.circular(4)),
                            child: Text(
                              _formatDuration(video['duration']),
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    video['title'] ?? 'Video',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    channelName,
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 11),
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

  Widget _buildShortsHistory() {
    return SizedBox(
      height: 200, // Smaller for profile history
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _historyShorts.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ShortsCard(
              video: _historyShorts[index],
              width: 120, // Smaller width
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ShortDetailScreen(
                      shorts: _historyShorts,
                      initialIndex: index,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlaylists() {
    return Column(
      children: _playlists.map((pl) {
        final title = pl['title'] ?? 'Danh sách phát';
        final visibility = pl['visibility'] == 'private' ? 'Riêng tư' : 'Công khai';
        final videoCount = pl['videoCount'] ?? 0;
        final firstThumb = pl['thumbnailUrl'];

        if (title == 'Xem sau') {
          return _buildLibraryItem(
            thumbnail: _buildCenteredIconThumbnail(
              Icons.access_time, 
              Colors.white,
              iconColor: Colors.black,
            ),
            title: title,
            subtitle: 'Riêng tư',
            onTap: () {},
          );
        }

        return _buildLibraryItem(
          thumbnail: _buildPlaylistThumbnail(firstThumb),
          title: title,
          subtitle: '$visibility • Danh sách phát • Cậ...',
          onTap: () {},
        );
      }).toList(),
    );
  }

  Widget _buildLibraryItem({
    required Widget thumbnail,
    required String title,
    required String subtitle,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 140,
              height: 80,
              child: thumbnail,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.more_vert, color: Colors.white, size: 20),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaylistThumbnail(String? imageUrl) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        // Stacked card background
        Positioned(
          top: 0, left: 8, right: 8, bottom: 12,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        // Main image
        Positioned(
          top: 6, left: 0, right: 0, bottom: 0,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: imageUrl != null && imageUrl.isNotEmpty
                ? Image.network(_getImageUrl(imageUrl), fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900))
                : Container(color: Colors.grey.shade800),
          ),
        ),
        // Overlay icon
        Positioned(
          bottom: 4, right: 4,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.8),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(Icons.playlist_play, color: Colors.white, size: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoThumbnailWithIcon({required String? imageUrl, required IconData icon}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Stack(
        fit: StackFit.expand,
        children: [
          imageUrl != null && imageUrl.isNotEmpty
              ? Image.network(_getImageUrl(imageUrl), fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900))
              : Container(color: Colors.grey.shade800),
          Positioned(
            bottom: 4, right: 4,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Icon(icon, color: Colors.white, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCenteredIconThumbnail(IconData icon, Color bgColor, {Color iconColor = Colors.white}) {
    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Icon(icon, color: iconColor, size: 36),
      ),
    );
  }

  String _formatDuration(dynamic duration) {
    if (duration == null) return '0:00';
    if (duration is num) {
      final totalSeconds = duration.toInt();
      final minutes = totalSeconds ~/ 60;
      final seconds = totalSeconds % 60;
      return '$minutes:${seconds.toString().padLeft(2, '0')}';
    }
    return duration.toString();
  }
}

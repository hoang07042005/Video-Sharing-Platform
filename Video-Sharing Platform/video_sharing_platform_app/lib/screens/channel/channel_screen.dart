import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants.dart';
import '../video/videos/video_detail_screen.dart';
import '../video/short/short_detail_screen.dart';
import '../../widgets/shorts_card.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../services/auth_service.dart';
import 'community_screen.dart';
import 'membership_screen.dart';

class ChannelScreen extends StatefulWidget {
  final String handle;
  const ChannelScreen({super.key, required this.handle});

  @override
  State<ChannelScreen> createState() => _ChannelScreenState();
}

class _ChannelScreenState extends State<ChannelScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _channel;
  List<dynamic> _videos = [];
  List<dynamic> _shorts = [];
  List<dynamic> _livestreams = [];
  List<dynamic> _playlists = [];
  bool _isLoading = true;
  bool _isFollowing = false;
  Map<String, dynamic>? _currentUser;
  bool _isMember = false;
  late TabController _tabController;

  // Search state
  bool _isSearching = false;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _fetchChannel();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
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

  Future<void> _fetchChannel() async {
    setState(() => _isLoading = true);
    try {
      final user = await AuthService.getCurrentUser();
      setState(() => _currentUser = user);

      final headers = await _getHeaders();
      final channelRes = await http.get(
        Uri.parse('${AppConstants.apiUrl}/channels/${widget.handle}'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      if (channelRes.statusCode == 200) {
        final channelData = jsonDecode(channelRes.body);
        setState(() => _channel = channelData);
        if (channelData['id'] != null) {
          final videoRes = await http.get(
            Uri.parse('${AppConstants.apiUrl}/videos?channelId=${channelData['id']}&limit=50'),
            headers: headers,
          ).timeout(const Duration(seconds: 10));
          if (videoRes.statusCode == 200) {
            final all = jsonDecode(videoRes.body) as List;
            setState(() {
              _videos = all.where((v) => v['isShort'] != true).toList();
              _shorts = all.where((v) => v['isShort'] == true).toList();
            });
          }

          try {
            final liveRes = await http.get(Uri.parse('${AppConstants.apiUrl}/livestreams/channel/${channelData['id']}'), headers: headers).timeout(const Duration(seconds: 5));
            if (liveRes.statusCode == 200) {
              setState(() => _livestreams = jsonDecode(liveRes.body));
            }
          } catch (_) {}

          try {
            final plRes = await http.get(Uri.parse('${AppConstants.apiUrl}/playlists/channel/${channelData['id']}'), headers: headers).timeout(const Duration(seconds: 5));
            if (plRes.statusCode == 200) {
              setState(() => _playlists = jsonDecode(plRes.body));
            }
          } catch (_) {}

          try {
            if (user != null && user['handle'] != channelData['handle']) {
              final memberRes = await http.get(Uri.parse('${AppConstants.apiUrl}/channels/${channelData['id']}/membership'), headers: headers).timeout(const Duration(seconds: 5));
              if (memberRes.statusCode == 200) {
                final memberData = jsonDecode(memberRes.body);
                setState(() => _isMember = memberData['isMember'] == true);
              }
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  String _formatCount(dynamic n) {
    if (n == null) return '0';
    final num val = n is String ? (num.tryParse(n) ?? 0) : (n as num);
    if (val >= 1000000) return '${(val / 1000000).toStringAsFixed(1).replaceAll('.0', '')} Tr';
    if (val >= 1000) return '${(val / 1000).toStringAsFixed(1).replaceAll('.0', '')} N';
    return val.toString();
  }

  Widget _buildSocialLinks() {
    dynamic rawLinks = _channel?['socialLinks'];
    List<Map<String, String>> activeLinks = [];
    
    try {
      if (rawLinks is String && rawLinks.isNotEmpty) {
        rawLinks = jsonDecode(rawLinks);
        if (rawLinks is String) {
          rawLinks = jsonDecode(rawLinks); // Sometimes double-encoded
        }
      }
      
      if (rawLinks is Map) {
        rawLinks.forEach((key, value) {
          if (value != null && value.toString().isNotEmpty) {
            activeLinks.add({'platform': key.toString(), 'url': value.toString()});
          }
        });
      } else if (rawLinks is List) {
        for (var item in rawLinks) {
          if (item is Map) {
            final p = item['platform']?.toString() ?? item['name']?.toString() ?? item['title']?.toString() ?? 'link';
            final u = item['url']?.toString() ?? item['link']?.toString() ?? '';
            if (u.isNotEmpty) {
              activeLinks.add({'platform': p, 'url': u});
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error parsing social links: $e');
    }

    if (activeLinks.isEmpty) return const SizedBox();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Wrap(
        spacing: 16,
        runSpacing: 12,
        children: activeLinks.map((link) {
          final platform = link['platform']!.toLowerCase();
          final url = link['url']!;
          IconData iconData = Icons.link;
          Color iconColor = Colors.blue;

          if (platform.contains('facebook')) {
            iconData = FontAwesomeIcons.facebook;
            iconColor = Colors.blueAccent;
          } else if (platform.contains('instagram')) {
            iconData = FontAwesomeIcons.instagram;
            iconColor = Colors.pinkAccent;
          } else if (platform.contains('youtube')) {
            iconData = FontAwesomeIcons.youtube;
            iconColor = Colors.red;
          } else if (platform.contains('tiktok')) {
            iconData = FontAwesomeIcons.tiktok;
            iconColor = Colors.white;
          } else if (platform.contains('twitter') || platform.contains('x')) {
            iconData = FontAwesomeIcons.xTwitter;
            iconColor = Colors.white;
          } else if (platform.contains('discord')) {
            iconData = FontAwesomeIcons.discord;
            iconColor = const Color(0xFF5865F2);
          } else if (platform.contains('github')) {
            iconData = FontAwesomeIcons.github;
            iconColor = Colors.white;
          }

          return InkWell(
            onTap: () async {
              final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(iconData, color: iconColor, size: 16),
                const SizedBox(width: 6),
                Text(
                  platform.substring(0, 1).toUpperCase() + platform.substring(1),
                  style: const TextStyle(color: Color.fromARGB(255, 172, 172, 175), fontSize: 13),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatDuration(dynamic d) {
    if (d == null) return '0:00';
    if (d is String) return d;
    if (d is num) {
      final s = d.toInt();
      final h = s ~/ 3600;
      final m = (s % 3600) ~/ 60;
      final sec = s % 60;
      if (h > 0) return '$h:${m.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}';
      return '$m:${sec.toString().padLeft(2, '0')}';
    }
    return d.toString();
  }

  @override
  Widget build(BuildContext context) {
    final bannerUrl = _getImageUrl(_channel?['bannerUrl']);
    final avatarUrl = _getImageUrl(_channel?['avatarUrl']);
    final channelName = _channel?['channelName'] ?? _channel?['handle'] ?? '';
    final handle = _channel?['handle'] != null ? '@${_channel!['handle']}' : '';
    final subscribers = _formatCount(_channel?['subscriberCount']);
    final totalViews = _formatCount(_channel?['totalViews']);
    final isVerified = _channel?['isVerified'] == true;
    final description = (_channel?['description'] ?? '') as String;

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF5722)))
          : _channel == null
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: Colors.grey, size: 48),
                    const SizedBox(height: 12),
                    const Text('Không tìm thấy kênh', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 12),
                    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Quay lại')),
                  ]))
              : Stack(
                  children: [
                    NestedScrollView(
                      headerSliverBuilder: (context, _) => [
                        SliverToBoxAdapter(
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              // 1. The Banner (Positioned absolute)
                              Positioned(
                                top: 0, left: 0, right: 0,
                                height: 180,
                                child: Stack(fit: StackFit.expand, children: [
                                  Image.network(bannerUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900)),
                                  Container(decoration: const BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter, 
                                      end: Alignment.bottomCenter,
                                      colors: [Colors.transparent, Color(0xFF0F0F0F)],
                                      stops: [0.5, 1.0],
                                    ),
                                  )),
                                ]),
                              ),
                              // 2. The Content
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 140), // 180 - 40 (overlap banner by 40px)
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          CircleAvatar(
                                            radius: 44,
                                            backgroundColor: Colors.grey.shade800,
                                            backgroundImage: NetworkImage(avatarUrl),
                                            onBackgroundImageError: (_, __) {},
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                            Row(children: [
                                              Flexible(child: Text(channelName,
                                                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                                                maxLines: 1, overflow: TextOverflow.ellipsis)),
                                              if (isVerified) ...[
                                                const SizedBox(width: 4),
                                                Container(
                                                  width: 20, height: 20,
                                                  decoration: BoxDecoration(
                                                    color: const Color.fromARGB(255, 73, 198, 0),
                                                    shape: BoxShape.circle,
                                                    border: Border.all(color: Colors.white, width: 1.5),
                                                  ),
                                                  child: const Center(child: Icon(Icons.check, color: Colors.white, size: 14, weight: 700)),
                                                ),
                                              ],
                                            ]),
                                            Text(handle, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                                            const SizedBox(height: 4),
                                            Text('$subscribers người đăng ký  -  $totalViews lượt xem', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                          ])),
                                        ]
                                      ),
                                      const SizedBox(height: 8),
                                      if (description.isNotEmpty) ...[
                                        Text(description, style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4), maxLines: 3, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 16),
                                      ],
                                      _buildSocialLinks(),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        crossAxisAlignment: WrapCrossAlignment.center,
                                        children: [
                                          if (_currentUser != null && _currentUser!['handle'] == widget.handle) ...[
                                            OutlinedButton(
                                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MembershipScreen(channel: _channel!))),
                                              style: OutlinedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1), side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                                              child: const Text('Danh sách hội viên', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                            ),
                                            OutlinedButton(
                                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CommunityScreen(channel: _channel!))),
                                              style: OutlinedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1), side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                                              child: const Text('Cộng đồng', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                            ),
                                          ] else ...[
                                            ElevatedButton(
                                              onPressed: () => setState(() => _isFollowing = !_isFollowing),
                                              style: ElevatedButton.styleFrom(backgroundColor: _isFollowing ? const Color(0xFF272727) : Colors.white, foregroundColor: _isFollowing ? Colors.white : Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                                              child: Text(_isFollowing ? 'Đã đăng ký' : 'Đăng ký', style: const TextStyle(fontWeight: FontWeight.bold)),
                                            ),
                                            if (_isFollowing)
                                              Container(decoration: BoxDecoration(color: const Color(0xFF272727), borderRadius: BorderRadius.circular(20)), child: IconButton(icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 20), onPressed: () {})),
                                            OutlinedButton(
                                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MembershipScreen(channel: _channel!))),
                                              style: OutlinedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1), side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                                              child: Text(_isMember ? 'Quyền lợi hội viên' : 'Hội viên', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                            ),
                                            OutlinedButton(
                                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CommunityScreen(channel: _channel!))),
                                              style: OutlinedButton.styleFrom(backgroundColor: Colors.white.withOpacity(0.1), side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                                              child: const Text('Cộng đồng', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                            ),
                                            Container(decoration: BoxDecoration(color: const Color(0xFF272727), borderRadius: BorderRadius.circular(20)), child: IconButton(icon: const Icon(Icons.search, color: Colors.white, size: 20), onPressed: () {})),
                                          ]
                                        ]
                                      ),
                                    ]),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        SliverPersistentHeader(
                          pinned: true,
                          delegate: _StickyTabBarDelegate(TabBar(
                            controller: _tabController,
                            indicatorColor: Colors.white,
                            labelColor: Colors.white,
                            unselectedLabelColor: Colors.grey,
                            isScrollable: true,
                            tabAlignment: TabAlignment.start,
                            tabs: const [
                              Tab(text: 'Trang chủ'),
                              Tab(text: 'Video'),
                              Tab(text: 'Shorts'),
                              Tab(text: 'Phát trực tiếp'),
                              Tab(text: 'Danh sách phát'),
                            ],
                          )),
                        ),
                      ],

                  body: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildHomeTab(), 
                      _buildVideosTab(), 
                      _buildShortsTab(),
                      _buildLivestreamsTab(),
                      _buildPlaylistsTab(),
                    ],
                  ),
                ),
                // Pinned transparent App Bar overlay
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: SafeArea(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.arrow_back, color: Colors.white, shadows: [Shadow(blurRadius: 10, color: Colors.black)]),
                            onPressed: () => Navigator.pop(context),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.search, color: Colors.white, shadows: [Shadow(blurRadius: 10, color: Colors.black)]),
                                onPressed: () => setState(() {
                                  _isSearching = true;
                                  _searchQuery = '';
                                  _searchController.clear();
                                }),
                              ),
                              IconButton(
                                icon: const Icon(Icons.more_vert, color: Colors.white, shadows: [Shadow(blurRadius: 10, color: Colors.black)]), 
                                onPressed: () {
                                  showModalBottomSheet(
                                    context: context,
                                    useRootNavigator: true,
                                    backgroundColor: const Color(0xFF1A1A1A),
                                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
                                    builder: (context) => SafeArea(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const SizedBox(height: 8),
                                          ListTile(
                                            leading: const Icon(Icons.settings, color: Colors.white),
                                            title: const Text('Cài đặt', style: TextStyle(color: Colors.white)),
                                            onTap: () {
                                              Navigator.pop(context);
                                              // Navigate to settings (if needed on channel screen, or assume global settings)
                                              // We need to import settings screen if we want to navigate there.
                                              // Actually, since this is the channel screen, they can just use the global SettingsScreen.
                                              // Wait, I should make sure I don't cause compile error if SettingsScreen is not imported.
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cài đặt đang phát triển.')));
                                            },
                                          ),
                                          ListTile(
                                            leading: const Icon(Icons.share, color: Colors.white),
                                            title: const Text('Chia sẻ', style: TextStyle(color: Colors.white)),
                                            onTap: () {
                                              Navigator.pop(context);
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Chức năng chia sẻ đang phát triển.')));
                                            },
                                          ),
                                          ListTile(
                                            leading: const Icon(Icons.info_outline, color: Colors.white),
                                            title: const Text('Giới thiệu về kênh', style: TextStyle(color: Colors.white)),
                                            onTap: () {
                                              Navigator.pop(context);
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Giới thiệu về kênh.')));
                                            },
                                          ),
                                          ListTile(
                                            leading: const Icon(Icons.help_outline, color: Colors.white),
                                            title: const Text('Trợ giúp và phản hồi', style: TextStyle(color: Colors.white)),
                                            onTap: () {
                                              Navigator.pop(context);
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Trợ giúp và phản hồi đang phát triển.')));
                                            },
                                          ),
                                          const SizedBox(height: 16),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                ),
            // ── Search overlay ──
            if (_isSearching)
              Positioned.fill(
                child: Material(
                  color: const Color(0xFF0F0F0F),
                  child: Column(
                    children: [
                      SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.arrow_back, color: Colors.white),
                                onPressed: () => setState(() {
                                  _isSearching = false;
                                  _searchQuery = '';
                                  _searchController.clear();
                                }),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _searchController,
                                  autofocus: true,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    hintText: 'Tìm trong kênh...',
                                    hintStyle: TextStyle(color: Colors.grey.shade500),
                                    filled: true,
                                    fillColor: const Color(0xFF1E1E1E),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(24),
                                      borderSide: BorderSide.none,
                                    ),
                                    suffixIcon: _searchQuery.isNotEmpty
                                        ? IconButton(
                                            icon: const Icon(Icons.close, color: Colors.grey, size: 20),
                                            onPressed: () => setState(() {
                                              _searchQuery = '';
                                              _searchController.clear();
                                            }),
                                          )
                                        : null,
                                  ),
                                  onChanged: (v) => setState(() => _searchQuery = v.trim().toLowerCase()),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Divider(color: Color(0xFF2A2A2A), height: 1),
                      Expanded(
                        child: _searchQuery.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.search, color: Colors.grey.shade700, size: 64),
                                    const SizedBox(height: 12),
                                    Text('Nhập từ khoá để tìm kiếm', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                                  ],
                                ),
                              )
                            : _buildSearchResults(),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
    );
  }

  Widget _buildSearchResults() {
    final q = _searchQuery;
    final matchedVideos = [..._videos, ..._shorts]
        .where((v) => (v['title'] ?? '').toString().toLowerCase().contains(q))
        .toList();
    final matchedPlaylists = _playlists
        .where((p) => (p['title'] ?? '').toString().toLowerCase().contains(q))
        .toList();

    if (matchedVideos.isEmpty && matchedPlaylists.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, color: Colors.grey.shade700, size: 64),
            const SizedBox(height: 12),
            Text('Không tìm thấy kết quả cho "$_searchQuery"', style: TextStyle(color: Colors.grey.shade500)),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        if (matchedVideos.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text('Video (${matchedVideos.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
          ),
          ...matchedVideos.map((v) => ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.network(
                _getImageUrl(v['thumbnailUrl'] ?? v['thumbnail']),
                width: 100, height: 60, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(width: 100, height: 60, color: Colors.grey.shade800, child: const Icon(Icons.videocam, color: Colors.white30)),
              ),
            ),
            title: Text(v['title'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
            subtitle: Text(v['isShort'] == true ? 'Shorts' : 'Video', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            onTap: () {
              setState(() => _isSearching = false);
              if (v['isShort'] == true) {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ShortDetailScreen(shorts: [v], initialIndex: 0)));
              } else {
                Navigator.push(context, MaterialPageRoute(builder: (_) => VideoDetailScreen(videoId: v['id'].toString())));
              }
            },
          )),
        ],
        if (matchedPlaylists.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Danh sách phát (${matchedPlaylists.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
          ),
          ...matchedPlaylists.map((p) {
            final thumb = p['thumbnailUrl'] ?? p['thumbnail'] ?? '';
            final count = p['videoCount'] ?? p['totalVideos'] ?? 0;
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: thumb.isNotEmpty
                    ? Image.network(_getImageUrl(thumb), width: 100, height: 60, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _playlistPlaceholder())
                    : _playlistPlaceholder(),
              ),
              title: Text(p['title'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
              subtitle: Text('$count video', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
              onTap: () {},
            );
          }),
        ],
      ],
    );
  }

  Widget _playlistPlaceholder() => Container(
    width: 100, height: 60,
    color: Colors.grey.shade800,
    child: const Icon(Icons.playlist_play, color: Colors.white30, size: 32),
  );

  Widget _buildHomeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (_shorts.isNotEmpty) ...[
          const Padding(padding: EdgeInsets.only(left: 16, top: 16, bottom: 12),
            child: Text('Shorts', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold))),
          SizedBox(height: 240, child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _shorts.take(8).length,
            itemBuilder: (ctx, i) => Padding(
              padding: const EdgeInsets.only(right: 10),
              child: ShortsCard(video: _shorts[i], width: 140,
                onTap: () => Navigator.push(ctx, MaterialPageRoute(
                  builder: (_) => ShortDetailScreen(shorts: _shorts, initialIndex: i)))),
            ),
          )),
        ],
        if (_videos.isNotEmpty) ...[
          const Padding(padding: EdgeInsets.only(left: 16, top: 16, bottom: 12),
            child: Text('Video mới nhất', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold))),
          ..._videos.take(5).map(_buildVideoTile).toList(),
        ],
        if (_videos.isEmpty && _shorts.isEmpty)
          const Padding(padding: EdgeInsets.all(32),
            child: Center(child: Text('Kênh này chưa có nội dung', style: TextStyle(color: Colors.grey)))),
      ]),
    );
  }

  Widget _buildVideosTab() {
    if (_videos.isEmpty) return const Center(child: Text('Kênh này chưa có video', style: TextStyle(color: Colors.grey)));
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _videos.length,
      itemBuilder: (ctx, i) => _buildVideoTile(_videos[i]),
    );
  }

  Widget _buildShortsTab() {
    if (_shorts.isEmpty) return const Center(child: Text('Kênh này chưa có Shorts', style: TextStyle(color: Colors.grey)));
    return GridView.builder(
      padding: const EdgeInsets.all(4),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3, childAspectRatio: 9 / 16, crossAxisSpacing: 2, mainAxisSpacing: 2),
      itemCount: _shorts.length,
      itemBuilder: (ctx, i) {
        final v = _shorts[i];
        return GestureDetector(
          onTap: () => Navigator.push(ctx, MaterialPageRoute(
            builder: (_) => ShortDetailScreen(shorts: _shorts, initialIndex: i))),
          child: ClipRRect(borderRadius: BorderRadius.circular(4),
            child: Stack(fit: StackFit.expand, children: [
              Image.network(_getImageUrl(v['thumbnailUrl'] ?? v['thumbnail']), fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900)),
              Positioned(bottom: 4, left: 4, right: 4,
                child: Text(v['title'] ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500,
                    shadows: [Shadow(blurRadius: 4)]),
                  maxLines: 2, overflow: TextOverflow.ellipsis)),
            ])),
        );
      },
    );
  }

  Widget _buildLivestreamsTab() {
    if (_livestreams.isEmpty) {
      return const Center(child: Text('Kênh này chưa có buổi phát trực tiếp nào', style: TextStyle(color: Colors.grey)));
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _livestreams.length,
      itemBuilder: (ctx, i) {
        final live = _livestreams[i];
        return _buildVideoTile(live); // Reuse video tile for livestreams
      },
    );
  }

  Widget _buildPlaylistsTab() {
    if (_playlists.isEmpty) {
      return const Center(child: Text('Kênh này chưa có danh sách phát', style: TextStyle(color: Colors.grey)));
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _playlists.length,
      itemBuilder: (ctx, i) {
        final pl = _playlists[i];
        final thumb = _getImageUrl(pl['thumbnailUrl']);
        return InkWell(
          onTap: () {
            // Navigator to playlist
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(children: [
                  Container(
                    width: 160, height: 90, color: Colors.grey.shade900,
                    child: Image.network(thumb, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.playlist_play, color: Colors.grey, size: 40)),
                  ),
                  Positioned(
                    bottom: 4, right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.85), borderRadius: BorderRadius.circular(4)),
                      child: Row(
                        children: [
                          const Icon(Icons.playlist_play, color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text('${pl['videoCount'] ?? 0} video', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ]),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pl['title'] ?? 'Danh sách phát', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500, height: 1.3), maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text('Danh sách phát công khai', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            ]),
          ),
        );
      },
    );
  }

  Widget _buildVideoTile(dynamic video) {
    // Fallback thumbnail: video thumbnail -> livestream thumbnail -> channel banner -> channel avatar
    final thumb = _getImageUrl(video['thumbnailUrl'] ?? video['thumbnail'] ?? _channel?['bannerUrl'] ?? _channel?['avatarUrl']);
    
    // Support both videos (viewsCount/viewCount) and livestreams (totalViews/currentViewers)
    final views = _formatCount(video['viewsCount'] ?? video['viewCount'] ?? video['totalViews'] ?? video['currentViewers'] ?? 0);
    
    // Livestreams might use Status to indicate if they are live
    final isLive = video['status'] == 'live';
    
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => VideoDetailScreen(videoId: video['id'] ?? video['_id']))),
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(borderRadius: BorderRadius.circular(8),
            child: Stack(children: [
              Container(width: 160, height: 90, color: Colors.grey.shade900,
                child: Image.network(thumb, fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.videocam, color: Colors.grey, size: 30)))),
              
              // Duration or LIVE badge
              if (isLive || video['duration'] != null)
                Positioned(bottom: 4, right: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(
                      color: isLive ? Colors.red : Colors.black.withOpacity(0.85), 
                      borderRadius: BorderRadius.circular(4)
                    ),
                    child: Text(
                      isLive ? 'TRỰC TIẾP' : _formatDuration(video['duration']),
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)
                    )
                  )
                ),
            ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(video['title'] ?? 'Video',
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500, height: 1.3),
              maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Text(isLive ? '$views đang xem' : '$views lượt xem', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ])),
          const Icon(Icons.more_vert, color: Colors.white54, size: 20),
        ])),
    );
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _StickyTabBarDelegate(this.tabBar);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: const Color(0xFF0F0F0F), child: tabBar);
  }

  @override double get maxExtent => tabBar.preferredSize.height;
  @override double get minExtent => tabBar.preferredSize.height;
  @override bool shouldRebuild(_StickyTabBarDelegate o) => false;
}


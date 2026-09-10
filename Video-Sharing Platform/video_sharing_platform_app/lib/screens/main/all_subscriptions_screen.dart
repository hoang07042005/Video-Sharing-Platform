import 'package:flutter/material.dart';
import '../../constants.dart';
import '../../services/channel_service.dart';
import '../../widgets/verified_badge.dart';
import '../channel/channel_screen.dart';

class AllSubscriptionsScreen extends StatefulWidget {
  const AllSubscriptionsScreen({super.key});

  @override
  State<AllSubscriptionsScreen> createState() => _AllSubscriptionsScreenState();
}

class _AllSubscriptionsScreenState extends State<AllSubscriptionsScreen> {
  bool _isLoading = true;
  List<dynamic> _channels = [];
  String _sortOption = 'Sắp xếp';
  final List<String> _sortOptions = const [
    'Sắp xếp',
    'A-Z',
    'Kênh nổi bật',
  ];

  @override
  void initState() {
    super.initState();
    _fetchChannels();
  }

  Future<void> _fetchChannels() async {
    setState(() => _isLoading = true);
    final channels = await ChannelService.getSubscribedChannels();
    if (mounted) {
      setState(() {
        _channels = channels;
        _isLoading = false;
      });
    }
  }

  List<dynamic> _sortedChannels() {
    final channels = List<dynamic>.from(_channels);
    if (_sortOption == 'A-Z') {
      channels.sort((a, b) => _channelName(a).toLowerCase().compareTo(_channelName(b).toLowerCase()));
    } else if (_sortOption == 'Kênh nổi bật') {
      channels.sort((a, b) {
        final aVerified = _isFeaturedChannel(a);
        final bVerified = _isFeaturedChannel(b);
        if (aVerified != bVerified) return aVerified ? -1 : 1;
        return _channelName(a).toLowerCase().compareTo(_channelName(b).toLowerCase());
      });
    }
    return channels;
  }

  String _channelName(dynamic channel) {
    if (channel is! Map) return '';
    return (channel['channelName'] ?? channel['name'] ?? channel['handle'] ?? '').toString();
  }

  bool _isFeaturedChannel(dynamic channel) {
    if (channel is! Map) return false;
    return channel['isVerified'] == true ||
        channel['channelIsVerified'] == true ||
        channel['verified'] == true;
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/100x100.png';
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return url
          .replaceAll('localhost', AppConstants.serverIp)
          .replaceAll('127.0.0.1', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl != null && parsedUrl.host.startsWith('192.168.24.')) {
      return parsedUrl.replace(host: AppConstants.serverIp).toString();
    }
    return url;
  }

  String _getChannelAvatarUrl(dynamic channel) {
    if (channel is! Map) return '';
    final user = channel['user'] ?? channel['User'];
    final profile = channel['profile'] ?? channel['Profile'];
    final userProfile = user is Map ? (user['profile'] ?? user['Profile']) : null;
    final candidates = [
      channel['avatarUrl'],
      channel['channelAvatarUrl'],
      channel['userAvatarUrl'],
      profile is Map ? profile['avatarUrl'] : null,
      user is Map ? user['avatarUrl'] : null,
      userProfile is Map ? userProfile['avatarUrl'] : null,
    ];
    for (final candidate in candidates) {
      final rawUrl = candidate?.toString() ?? '';
      if (rawUrl.isNotEmpty) return _getImageUrl(rawUrl);
    }
    return '';
  }

  Widget _buildChannelAvatar(dynamic channel, String name) {
    final avatarUrl = _getChannelAvatarUrl(channel);
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'K';
    final fallback = Container(
      color: Colors.grey.shade800,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
      ),
    );

    if (avatarUrl.isEmpty) return fallback;
    return Image.network(
      avatarUrl,
      width: 48,
      height: 48,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => fallback,
    );
  }

  void _showNotificationBottomSheet(dynamic channel) {
    String currentSetting = 'Dành riêng cho bạn'; // Giả lập trạng thái

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF212121),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Thông báo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 4),
                    const Text('Chọn tần suất bạn muốn nhận thông báo khi kênh này tải nội dung mới lên.', style: TextStyle(fontSize: 14, color: Colors.white70)),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {},
                      child: const Text('Tìm hiểu thêm', style: TextStyle(fontSize: 14, color: Colors.lightBlueAccent)),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white12),
              
              _buildNotificationOption(
                context,
                icon: Icons.notifications,
                text: 'Tất cả',
                isSelected: currentSetting == 'Tất cả',
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Cập nhật API tần suất
                }
              ),
              _buildNotificationOption(
                context,
                icon: Icons.notifications_none,
                text: 'Dành riêng cho bạn',
                isSelected: currentSetting == 'Dành riêng cho bạn',
                onTap: () {
                  Navigator.pop(context);
                }
              ),
              _buildNotificationOption(
                context,
                icon: Icons.notifications_off_outlined,
                text: 'Không nhận thông báo',
                isSelected: currentSetting == 'Không nhận thông báo',
                onTap: () {
                  Navigator.pop(context);
                }
              ),
              const Divider(color: Colors.white12),
              _buildNotificationOption(
                context,
                icon: Icons.person_remove_outlined,
                text: 'Hủy đăng ký',
                isSelected: false,
                onTap: () async {
                  Navigator.pop(context);
                  final res = await ChannelService.toggleFollow(channel['id'].toString());
                  if (res != null && res['isSubscribed'] == false) {
                    setState(() {
                      _channels.removeWhere((c) => c['id'] == channel['id']);
                    });
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Đã hủy đăng ký ${channel['channelName']}')));
                    }
                  }
                }
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNotificationOption(BuildContext context, {required IconData icon, required String text, required bool isSelected, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Text(text, style: const TextStyle(fontSize: 16, color: Colors.white)),
            ),
            if (isSelected)
              const Icon(Icons.check, color: Colors.white, size: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(
        backgroundColor: AppConstants.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Tất cả kênh đã đăng ký', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: PopupMenuButton<String>(
                    initialValue: _sortOption,
                    onSelected: (option) => setState(() => _sortOption = option),
                    color: const Color(0xFF2A2A2A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    itemBuilder: (context) => _sortOptions.map((option) {
                      return PopupMenuItem<String>(
                        value: option,
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(option, style: const TextStyle(color: Colors.white)),
                            ),
                            if (option == _sortOption)
                              const Icon(Icons.check, color: Colors.white, size: 18),
                          ],
                        ),
                      );
                    }).toList(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_sortOption, style: const TextStyle(color: Colors.white, fontSize: 14)),
                          const SizedBox(width: 4),
                          const Icon(Icons.keyboard_arrow_down, color: Colors.white70, size: 18),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: _channels.isEmpty
                      ? const Center(child: Text('Bạn chưa đăng ký kênh nào', style: TextStyle(color: Colors.white54)))
                      : ListView.builder(
                          itemCount: _sortedChannels().length,
                          itemBuilder: (context, index) {
                            final channel = _sortedChannels()[index];
                            final name = channel['channelName'] ?? channel['handle'] ?? '';
                            final handle = channel['handle'] != null ? '${channel['handle']}' : '';

                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              leading: CircleAvatar(
                                radius: 24,
                                backgroundColor: Colors.grey.shade800,
                                child: ClipOval(
                                  child: _buildChannelAvatar(channel, name.toString()),
                                ),
                              ),
                              title: Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                  if (_isFeaturedChannel(channel)) ...[
                                    const SizedBox(width: 5),
                                    const VerifiedBadge(size: 16),
                                  ],
                                ],
                              ),
                              subtitle: Text(handle, style: const TextStyle(color: Colors.white54, fontSize: 13)),
                              trailing: InkWell(
                                onTap: () => _showNotificationBottomSheet(channel),
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(8.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.notifications_none, color: Colors.white, size: 22),
                                      const SizedBox(width: 2),
                                      const Icon(Icons.keyboard_arrow_down, color: Colors.white70, size: 16),
                                    ],
                                  ),
                                ),
                              ),
                              onTap: () {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => ChannelScreen(handle: channel['handle'] ?? channel['id'].toString())));
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

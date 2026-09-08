import 'package:flutter/material.dart';
import '../../constants.dart';
import '../../services/channel_service.dart';
import '../channel/channel_screen.dart';

class AllSubscriptionsScreen extends StatefulWidget {
  const AllSubscriptionsScreen({super.key});

  @override
  State<AllSubscriptionsScreen> createState() => _AllSubscriptionsScreenState();
}

class _AllSubscriptionsScreenState extends State<AllSubscriptionsScreen> {
  bool _isLoading = true;
  List<dynamic> _channels = [];
  String _sortOption = 'Liên quan nhất';

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

  void _showNotificationBottomSheet(dynamic channel) {
    String currentSetting = 'Dành riêng cho bạn'; // Giả lập trạng thái

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
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
                    const Text('Thông báo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                    const SizedBox(height: 4),
                    const Text('Chọn tần suất bạn muốn nhận thông báo khi kênh này tải nội dung mới lên.', style: TextStyle(fontSize: 14, color: Colors.black54)),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {},
                      child: const Text('Tìm hiểu thêm', style: TextStyle(fontSize: 14, color: Colors.blue)),
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.black12),
              
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
              const Divider(color: Colors.black12),
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
            Icon(icon, color: Colors.black87, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Text(text, style: const TextStyle(fontSize: 16, color: Colors.black87)),
            ),
            if (isSelected)
              const Icon(Icons.check, color: Colors.black87, size: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // YouTube uses white for this specific screen in the image provided
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Tất cả kênh đã đăng ký', style: TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: Colors.black), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert, color: Colors.black), onPressed: () {}),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_sortOption, style: const TextStyle(color: Colors.black87, fontSize: 14)),
                        const SizedBox(width: 4),
                        const Icon(Icons.keyboard_arrow_down, color: Colors.black87, size: 18),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: _channels.isEmpty
                      ? const Center(child: Text('Bạn chưa đăng ký kênh nào', style: TextStyle(color: Colors.black54)))
                      : ListView.builder(
                          itemCount: _channels.length,
                          itemBuilder: (context, index) {
                            final channel = _channels[index];
                            final avatarUrl = _getImageUrl(channel['avatarUrl']);
                            final name = channel['channelName'] ?? channel['handle'] ?? '';
                            final handle = channel['handle'] != null ? '@${channel['handle']}' : '';
                            
                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              leading: CircleAvatar(
                                radius: 24,
                                backgroundColor: Colors.grey.shade300,
                                backgroundImage: NetworkImage(avatarUrl),
                                onBackgroundImageError: (_, __) {},
                              ),
                              title: Text(name, style: const TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.w500)),
                              subtitle: Text(handle, style: const TextStyle(color: Colors.black54, fontSize: 13)),
                              trailing: InkWell(
                                onTap: () => _showNotificationBottomSheet(channel),
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(8.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.notifications_none, color: Colors.black87, size: 22),
                                      const SizedBox(width: 2),
                                      const Icon(Icons.keyboard_arrow_down, color: Colors.black87, size: 16),
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

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../../constants.dart';

class NotificationSettingItem {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  bool inApp;
  bool email;
  bool push;
  bool enabled;

  NotificationSettingItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.inApp,
    required this.email,
    required this.push,
    required this.enabled,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'inApp': inApp,
        'email': email,
        'push': push,
        'enabled': enabled,
      };
}

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _globalInApp = true;
  bool _globalEmail = true;
  bool _globalPush = true;

  List<NotificationSettingItem> _items = [
    NotificationSettingItem(
      id: 'new_video',
      title: 'Thông báo video mới',
      subtitle: 'Nhận thông báo khi kênh bạn theo dõi đăng video mới.',
      icon: Icons.play_circle_outline,
      iconColor: const Color(0xFFE040FB),
      iconBg: const Color(0xFF3B1F4F),
      inApp: true,
      email: true,
      push: false,
      enabled: true,
    ),
    NotificationSettingItem(
      id: 'comment',
      title: 'Thông báo bình luận',
      subtitle: 'Nhận thông báo khi có người bình luận vào video của bạn.',
      icon: Icons.comment_outlined,
      iconColor: const Color(0xFF69F0AE),
      iconBg: const Color(0xFF1B4231),
      inApp: true,
      email: true,
      push: false,
      enabled: true,
    ),
    NotificationSettingItem(
      id: 'system_email',
      title: 'Email hệ thống & cập nhật',
      subtitle: 'Nhận các email về cập nhật chính sách và tính năng mới.',
      icon: Icons.mail_outline,
      iconColor: const Color(0xFF448AFF),
      iconBg: const Color(0xFF152A4A),
      inApp: false,
      email: true,
      push: false,
      enabled: true,
    ),
    NotificationSettingItem(
      id: 'suggestions',
      title: 'Gợi ý cá nhân hóa',
      subtitle: 'Nhận thông báo về các video đề xuất dành riêng cho bạn.',
      icon: Icons.star_border,
      iconColor: const Color(0xFFFFD740),
      iconBg: const Color(0xFF4A3D15),
      inApp: true,
      email: true,
      push: false,
      enabled: true,
    ),
    NotificationSettingItem(
      id: 'livestream',
      title: 'Thông báo Livestream',
      subtitle: 'Nhận thông báo ngay khi kênh bạn theo dõi bắt đầu phát trực tiếp.',
      icon: Icons.videocam_outlined,
      iconColor: const Color(0xFFFF5252),
      iconBg: const Color(0xFF4A1A1A),
      inApp: true,
      email: false,
      push: false,
      enabled: true,
    ),
    NotificationSettingItem(
      id: 'reminder',
      title: 'Nhắc nhở xem tiếp',
      subtitle: 'Gửi thông báo nhắc nhở xem các video trong danh sách \'Xem sau\'.',
      icon: Icons.notifications_none,
      iconColor: const Color(0xFFFF6E40),
      iconBg: const Color(0xFF4A2515),
      inApp: true,
      email: true,
      push: false,
      enabled: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _globalInApp = prefs.getBool('notif_global_inapp') ?? true;
      _globalEmail = prefs.getBool('notif_global_email') ?? true;
      _globalPush = prefs.getBool('notif_global_push') ?? true;

      final savedItemsStr = prefs.getString('notif_items');
      if (savedItemsStr != null) {
        final List<dynamic> savedItems = jsonDecode(savedItemsStr);
        for (var savedItem in savedItems) {
          final index = _items.indexWhere((item) => item.id == savedItem['id']);
          if (index != -1) {
            _items[index].inApp = savedItem['inApp'] ?? _items[index].inApp;
            _items[index].email = savedItem['email'] ?? _items[index].email;
            _items[index].push = savedItem['push'] ?? _items[index].push;
            _items[index].enabled = savedItem['enabled'] ?? _items[index].enabled;
          }
        }
      }
    });

    try {
      final token = prefs.getString('token');
      if (token == null) return;
      
      final res = await http.get(
        Uri.parse('${AppConstants.apiUrl}/notifications/preferences'),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _globalEmail = data['enableEmailNotifications'] ?? _globalEmail;
          _globalPush = data['enablePushNotifications'] ?? _globalPush;
          
          if (data['enableStreamNotifications'] != null) {
            _items.firstWhere((i) => i.id == 'livestream').enabled = data['enableStreamNotifications'];
          }
          if (data['enableCommentNotifications'] != null) {
            _items.firstWhere((i) => i.id == 'comment').enabled = data['enableCommentNotifications'];
          }
          if (data['enableFollowNotifications'] != null) {
            _items.firstWhere((i) => i.id == 'new_video').enabled = data['enableFollowNotifications'];
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notif_global_inapp', _globalInApp);
    await prefs.setBool('notif_global_email', _globalEmail);
    await prefs.setBool('notif_global_push', _globalPush);
    
    final itemsJson = _items.map((item) => item.toJson()).toList();
    await prefs.setString('notif_items', jsonEncode(itemsJson));

    try {
      final token = prefs.getString('token');
      if (token == null) return;
      
      bool enableStream = _items.firstWhere((i) => i.id == 'livestream').enabled;
      bool enableComment = _items.firstWhere((i) => i.id == 'comment').enabled;
      bool enableFollow = _items.firstWhere((i) => i.id == 'new_video').enabled;
      
      await http.put(
        Uri.parse('${AppConstants.apiUrl}/notifications/preferences'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: jsonEncode({
          'enableEmailNotifications': _globalEmail,
          'enablePushNotifications': _globalPush,
          'enableStreamNotifications': enableStream,
          'enableCommentNotifications': enableComment,
          'enableFollowNotifications': enableFollow,
        }),
      );
    } catch (_) {}
  }

  Widget _buildGlobalToggle(String title, IconData icon, Color color, bool value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: value ? color.withValues(alpha: 0.1) : Colors.transparent,
          border: Border.all(color: value ? color.withValues(alpha: 0.5) : Colors.white24),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: value ? color : Colors.grey, size: 16),
            const SizedBox(width: 6),
            Text(title, style: TextStyle(color: value ? Colors.white : Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(width: 8),
            if (value)
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 10),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildListItem(NotificationSettingItem item, int index) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      decoration: BoxDecoration(
        border: index < _items.length - 1 ? const Border(bottom: BorderSide(color: Colors.white10)) : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: item.iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(item.icon, color: item.iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(item.subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.3)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Switch(
                value: item.enabled,
                onChanged: (val) {
                  setState(() => item.enabled = val);
                  _saveSettings();
                },
                activeColor: Colors.white,
                activeTrackColor: Colors.green,
                inactiveThumbColor: Colors.grey,
                inactiveTrackColor: Colors.white24,
              ),
              const SizedBox(height: 8),
              // Mini icons for delivery channels
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () {
                      setState(() => item.inApp = !item.inApp);
                      _saveSettings();
                    },
                    child: Icon(Icons.notifications, color: item.inApp ? const Color(0xFFE040FB) : Colors.white24, size: 18),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                      setState(() => item.email = !item.email);
                      _saveSettings();
                    },
                    child: Icon(Icons.mail_outline, color: item.email ? const Color(0xFFFF6E40) : Colors.white24, size: 18),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                      setState(() => item.push = !item.push);
                      _saveSettings();
                    },
                    child: Icon(Icons.devices, color: item.push ? const Color(0xFFFF6E40) : Colors.white24, size: 18),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            // Header Section
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Kênh thông báo',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Chọn kênh bạn muốn nhận thông báo từ nền tảng',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildGlobalToggle('Trong ứng dụng', Icons.notifications, const Color(0xFFE040FB), _globalInApp, () {
                      setState(() {
                        _globalInApp = !_globalInApp;
                        for (var item in _items) {
                          item.inApp = _globalInApp;
                        }
                      });
                      _saveSettings();
                    }),
                    _buildGlobalToggle('Email', Icons.mail_outline, const Color(0xFFFF6E40), _globalEmail, () {
                      setState(() {
                        _globalEmail = !_globalEmail;
                        for (var item in _items) {
                          item.email = _globalEmail;
                        }
                      });
                      _saveSettings();
                    }),
                    _buildGlobalToggle('Push', Icons.devices, const Color(0xFFFF6E40), _globalPush, () {
                      setState(() {
                        _globalPush = !_globalPush;
                        for (var item in _items) {
                          item.push = _globalPush;
                        }
                      });
                      _saveSettings();
                    }),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            // List of settings
            Container(
              child: Column(
                children: List.generate(_items.length, (index) {
                  return _buildListItem(_items[index], index);
                }),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChannelDisplaySettingsScreen extends StatefulWidget {
  const ChannelDisplaySettingsScreen({super.key});

  @override
  State<ChannelDisplaySettingsScreen> createState() => _ChannelDisplaySettingsScreenState();
}

class _ChannelDisplaySettingsScreenState extends State<ChannelDisplaySettingsScreen> {
  bool _showMembership = true;
  bool _showCommunity = true;
  bool _showSubscriberCount = true;
  bool _moderateComments = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _showMembership = prefs.getBool('show_membership') ?? true;
      _showCommunity = prefs.getBool('show_community') ?? true;
      _showSubscriberCount = prefs.getBool('show_subscriber_count') ?? true;
      _moderateComments = prefs.getBool('moderate_comments') ?? false;
    });
  }

  Future<void> _saveSetting(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  Widget _buildSwitchItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required String activeText,
    required String inactiveText,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.3)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Switch(
                value: value,
                onChanged: onChanged,
                activeColor: Colors.white,
                activeTrackColor: Colors.green,
                inactiveThumbColor: Colors.grey,
                inactiveTrackColor: Colors.white24,
              ),
              const SizedBox(height: 2),
              Text(value ? activeText : inactiveText, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          )
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
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2C1935),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.star_border_rounded, color: Color(0xFFFF7A45), size: 28),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hiển thị trang kênh', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Quản lý các cài đặt hiển thị và quyền truy cập trên trang kênh của bạn', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Container(
              child: Column(
                children: [
                  _buildSwitchItem(
                    icon: Icons.auto_awesome,
                    iconColor: const Color(0xFFE040FB),
                    iconBg: const Color(0xFF3B1F4F),
                    title: 'Nút "Hội viên"',
                    subtitle: 'Hiển thị nút Hội viên trên trang kênh của bạn để khán giả có thể đăng ký hội viên.',
                    value: _showMembership,
                    activeText: 'Hiển thị',
                    inactiveText: 'Tắt',
                    onChanged: (val) {
                      setState(() => _showMembership = val);
                      _saveSetting('show_membership', val);
                    },
                  ),
                  _buildSwitchItem(
                    icon: Icons.people_alt_outlined,
                    iconColor: const Color(0xFF64B5F6),
                    iconBg: const Color(0xFF15335A),
                    title: 'Nút "Cộng đồng"',
                    subtitle: 'Hiển thị nút Cộng đồng trên trang kênh giúp khán giả tương tác dễ hơn.',
                    value: _showCommunity,
                    activeText: 'Hiển thị',
                    inactiveText: 'Tắt',
                    onChanged: (val) {
                      setState(() => _showCommunity = val);
                      _saveSetting('show_community', val);
                    },
                  ),
                  _buildSwitchItem(
                    icon: Icons.visibility_outlined,
                    iconColor: const Color(0xFF4DB6AC),
                    iconBg: const Color(0xFF103A36),
                    title: 'Hiển thị số người đăng ký',
                    subtitle: 'Cho phép công khai minh bạch tổng số người đăng ký kênh của bạn.',
                    value: _showSubscriberCount,
                    activeText: 'Hiển thị',
                    inactiveText: 'Tắt',
                    onChanged: (val) {
                      setState(() => _showSubscriberCount = val);
                      _saveSetting('show_subscriber_count', val);
                    },
                  ),
                  _buildSwitchItem(
                    icon: Icons.speaker_notes_off_outlined,
                    iconColor: const Color(0xFFF06292),
                    iconBg: const Color(0xFF4A1A31),
                    title: 'Kiểm duyệt bình luận',
                    subtitle: 'Tự động giữ lại các bình luận có chứa từ khóa nhạy cảm để xem xét.',
                    value: _moderateComments,
                    activeText: 'Bật',
                    inactiveText: 'Tắt',
                    onChanged: (val) {
                      setState(() => _moderateComments = val);
                      _saveSetting('moderate_comments', val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.transparent,
                border: Border.all(color: const Color(0xFF4A148C), width: 1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_outlined, color: Color(0xFFCE93D8), size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Lưu ý về hiển thị kênh', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        SizedBox(height: 4),
                        Text('Các cài đặt này chỉ ảnh hưởng đến trang kênh của bạn. Một số thay đổi có thể mất vài phút để cập nhật.', style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.4)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

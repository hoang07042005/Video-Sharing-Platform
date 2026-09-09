import 'package:flutter/material.dart';
import 'about_app_screen.dart';
import 'help_feedback_screen.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import 'policies_screen.dart';
import 'account_info_screen.dart';
import 'notification_settings_screen.dart';
import 'security_settings_screen.dart';
import 'data_settings_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {

  void _logout(BuildContext context) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Đăng xuất', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text('Bạn có chắc chắn muốn đăng xuất không?', style: TextStyle(color: Colors.white60)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy', style: TextStyle(color: Colors.white60)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await AuthService.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Đăng xuất', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
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
        title: const Text('Cài đặt', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),

            // ── Nhóm Tài khoản ──
            _SectionLabel('Tài khoản'),
            _SettingsGroup(items: [
              _SettingsItem(
                icon: Icons.person_rounded,
                iconColor: const Color(0xFF64B5F6),
                iconBg: const Color(0xFF0D47A1),
                title: 'Thông tin tài khoản',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountInfoScreen())),
              ),
              _SettingsItem(
                icon: Icons.live_tv_rounded,
                iconColor: const Color(0xFFCE93D8),
                iconBg: const Color(0xFF4A148C),
                title: 'Hiển thị kênh',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AccountInfoScreen())),
              ),
            ]),

            _SectionLabel('Cá nhân hoá'),
            _SettingsGroup(items: [
              _SettingsItem(
                icon: Icons.notifications_rounded,
                iconColor: const Color(0xFFFFCC02),
                iconBg: const Color(0xFF4A3900),
                title: 'Thông báo',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationSettingsScreen())),
              ),
              _SettingsItem(
                icon: Icons.palette_rounded,
                iconColor: const Color(0xFF80CBC4),
                iconBg: const Color(0xFF004D40),
                title: 'Giao diện',
                onTap: () => _showToast(context, 'Giao diện đang phát triển.'),
                isLast: true,
              ),
            ]),

            _SectionLabel('Dữ liệu'),
            _SettingsGroup(items: [
              _SettingsItem(
                icon: Icons.storage_rounded,
                iconColor: const Color(0xFF90CAF9),
                iconBg: const Color(0xFF0D47A1),
                title: 'Dữ liệu',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DataSettingsScreen())),
                isLast: true,
              ),
            ]),
            
            _SectionLabel('Bảo mật'),
            _SettingsGroup(items: [
              _SettingsItem(
                icon: Icons.security_rounded,
                iconColor: const Color(0xFF81C784),
                iconBg: const Color(0xFF1B5E20),
                title: 'Bảo mật',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsScreen())),
                isLast: true,
              ),
            ]),

            _SectionLabel('Hỗ trợ'),
            _SettingsGroup(items: [
              _SettingsItem(
                icon: Icons.info_rounded,
                iconColor: const Color(0xFF4FC3F7),
                iconBg: const Color(0xFF01579B),
                title: 'Về ứng dụng',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutAppScreen())),
              ),
              _SettingsItem(
                icon: Icons.help_rounded,
                iconColor: const Color(0xFFFFAB91),
                iconBg: const Color(0xFF4E1500),
                title: 'Trợ giúp & Phản hồi',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpFeedbackScreen())),
              ),
              _SettingsItem(
                icon: Icons.policy_rounded,
                iconColor: const Color(0xFFBCAAA4),
                iconBg: const Color(0xFF3E2723),
                title: 'Chính sách & Điều khoản',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PoliciesScreen())),
                isLast: true,
              ),
            ]),

            // ── Đăng xuất ──
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => _logout(context),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1C1E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.3), width: 1),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                    SizedBox(width: 10),
                    Text('Đăng xuất', style: TextStyle(color: Colors.redAccent, fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  void _showToast(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: const Color(0xFF1C1C1E),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(color: Color(0xFF636366), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.8),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final List<_SettingsItem> items;
  const _SettingsGroup({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: items,
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final VoidCallback onTap;
  final bool isLast;

  const _SettingsItem({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.onTap,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Color(0xFF48484A), size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

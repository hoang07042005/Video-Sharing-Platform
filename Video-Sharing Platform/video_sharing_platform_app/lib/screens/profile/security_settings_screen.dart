import 'package:flutter/material.dart';
import 'change_password_screen.dart';
import 'logged_in_devices_screen.dart';
import 'login_history_screen.dart';

class SecuritySettingsScreen extends StatelessWidget {
  const SecuritySettingsScreen({super.key});

  Widget _buildListItem({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Widget? trailing,
    bool showBottomBorder = true,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        decoration: BoxDecoration(
          border: showBottomBorder ? const Border(bottom: BorderSide(color: Colors.white10)) : null,
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
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.3)),
                ],
              ),
            ),
            const SizedBox(width: 16),
            if (trailing != null) trailing,
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Colors.white24, size: 20),
          ],
        ),
      ),
    );
  }

  void _showToast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: Colors.white10,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 2),
    ));
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
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(Icons.security, color: Colors.greenAccent, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Bảo mật tài khoản', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Bảo vệ tài khoản của bạn bằng các lớp bảo mật mạnh mẽ', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            // Tăng cường bảo mật section
            const Text('Tăng cường bảo mật', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Các tính năng giúp bảo vệ tài khoản của bạn tốt hơn', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            const SizedBox(height: 16),
            
            Container(
              child: Column(
                children: [
                  _buildListItem(
                    icon: Icons.key_rounded,
                    iconColor: Colors.amber,
                    iconBg: Colors.amber.withValues(alpha: 0.1),
                    title: 'Đổi mật khẩu',
                    subtitle: 'Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản.',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
                  ),
                  _buildListItem(
                    icon: Icons.lock_outline_rounded,
                    iconColor: Colors.greenAccent,
                    iconBg: Colors.greenAccent.withValues(alpha: 0.1),
                    title: 'Xác thực 2 lớp (2FA)',
                    subtitle: 'Thêm lớp bảo mật bằng mã xác thực từ ứng dụng hoặc SMS.',
                    onTap: () => _showToast(context, 'Chức năng xác thực 2 lớp đang phát triển.'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                      ),
                      child: const Text('Đã bật', style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.w500)),
                    ),
                  ),
                  _buildListItem(
                    icon: Icons.devices_rounded,
                    iconColor: Colors.purpleAccent,
                    iconBg: Colors.purpleAccent.withValues(alpha: 0.1),
                    title: 'Thiết bị đăng nhập',
                    subtitle: 'Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn.',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoggedInDevicesScreen())),
                  ),
                  _buildListItem(
                    icon: Icons.access_time_rounded,
                    iconColor: Colors.blueAccent,
                    iconBg: Colors.blueAccent.withValues(alpha: 0.1),
                    title: 'Lịch sử đăng nhập',
                    subtitle: 'Xem các lần đăng nhập gần đây và địa điểm đăng nhập.',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginHistoryScreen())),
                  ),
                  _buildListItem(
                    icon: Icons.warning_amber_rounded,
                    iconColor: Colors.redAccent,
                    iconBg: Colors.redAccent.withValues(alpha: 0.1),
                    title: 'Email đăng nhập & khôi phục',
                    subtitle: 'Quản lý email dùng để đăng nhập và khôi phục tài khoản.',
                    onTap: () => _showToast(context, 'Chức năng email khôi phục đang phát triển.'),
                    showBottomBorder: false,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Xóa tài khoản section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF181520), // Dark purple/red tint
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Xóa tài khoản', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Khi xóa tài khoản, mọi dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  InkWell(
                    onTap: () => _showToast(context, 'Chức năng xóa tài khoản đang phát triển.'),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.delete_outline, color: Colors.redAccent, size: 16),
                          SizedBox(width: 8),
                          Text('Yêu cầu xóa tài khoản', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

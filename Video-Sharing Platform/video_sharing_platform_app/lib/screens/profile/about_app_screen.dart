import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../constants.dart';
import 'policies_screen.dart';
import 'help_feedback_screen.dart';

class AboutAppScreen extends StatelessWidget {
  const AboutAppScreen({super.key});

  Widget _buildMenuCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0A),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
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
                  const SizedBox(height: 2),
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11, height: 1.3)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Icon(Icons.chevron_right, color: Colors.white24, size: 20),
            ),
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
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(Icons.monitor_rounded, color: Colors.redAccent, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Về ứng dụng', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Thông tin về phiên bản và bản quyền', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            // App Info Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0A0A),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Logo Placeholder
                  Center(
                    child: Container(
                      height: 140,
                      width: double.infinity,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FutureBuilder<Map<String, dynamic>>(
                            future: AuthService.getPublicSettings(),
                            builder: (context, snapshot) {
                              if (snapshot.connectionState == ConnectionState.waiting) {
                                return const SizedBox(height: 100, width: 100, child: Center(child: CircularProgressIndicator(color: Colors.deepOrangeAccent)));
                              }

                              final settings = snapshot.data ?? {};
                              String? logoUrl = settings['logoUrl'] as String?;
                              
                              if (logoUrl != null && logoUrl.isNotEmpty) {
                                // Replace localhost with dynamic server IP for mobile
                                logoUrl = logoUrl.replaceAll('localhost', AppConstants.serverIp);
                                return Image.network(
                                  logoUrl,
                                  height: 100,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.white, size: 80),
                                );
                              }
                              
                              return Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Video-', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                                  Row(
                                    children: [
                                      const Text('Sharing.', style: TextStyle(color: Colors.deepOrangeAccent, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Colors.deepOrangeAccent, Colors.purpleAccent],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 24),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  const Text('SHARE  •  WATCH  •  CONNECT', style: TextStyle(color: Colors.grey, fontSize: 8, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
                                ],
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Expanded(
                        child: Text(
                          'Video Sharing Platform',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, height: 1.2),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Description
                  Text(
                    'Nền tảng chia sẻ video hiện đại, giúp bạn kết nối, chia sẻ và khám phá những nội dung tuyệt vời nhất.',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
                  ),
                  const SizedBox(height: 20),
                  
                  // Version Row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('v1.0.0', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 12),
                      const Text('Phiên bản mới nhất', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(width: 4),
                      const Icon(Icons.check_circle, color: Colors.green, size: 14),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Info & Button Row
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Cập nhật mới nhất', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                            const SizedBox(height: 2),
                            const Text('15/05/2026', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Kích thước ứng dụng', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                            const SizedBox(height: 2),
                            const Text('42.6 MB', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showToast(context, 'Ứng dụng đang ở phiên bản mới nhất.'),
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
                      label: const Text('Kiểm tra cập nhật', style: TextStyle(color: Colors.white)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Grid / List of menu items
            _buildMenuCard(
              icon: Icons.description_outlined,
              iconColor: Colors.purpleAccent,
              iconBg: Colors.purpleAccent.withValues(alpha: 0.1),
              title: 'Điều khoản dịch vụ',
              subtitle: 'Đọc các điều khoản và điều kiện sử dụng nền tảng.',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PoliciesScreen())),
            ),
            const SizedBox(height: 12),
            _buildMenuCard(
              icon: Icons.shield_outlined,
              iconColor: Colors.greenAccent,
              iconBg: Colors.greenAccent.withValues(alpha: 0.1),
              title: 'Chính sách quyền riêng tư',
              subtitle: 'Cách chúng tôi bảo vệ và sử dụng dữ liệu của bạn.',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PoliciesScreen())),
            ),
            const SizedBox(height: 12),
            _buildMenuCard(
              icon: Icons.insert_drive_file_outlined,
              iconColor: Colors.amber,
              iconBg: Colors.amber.withValues(alpha: 0.1),
              title: 'Giấy phép mã nguồn mở',
              subtitle: 'Thông tin về các thư viện mã nguồn mở được sử dụng.',
              onTap: () => showLicensePage(
                context: context,
                applicationName: 'Video Sharing Platform',
                applicationVersion: '1.0.0',
              ),
            ),
            const SizedBox(height: 12),
            _buildMenuCard(
              icon: Icons.help_outline_rounded,
              iconColor: Colors.blueAccent,
              iconBg: Colors.blueAccent.withValues(alpha: 0.1),
              title: 'Trung tâm trợ giúp',
              subtitle: 'Câu hỏi thường gặp và hướng dẫn sử dụng.',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpFeedbackScreen())),
            ),
            const SizedBox(height: 24),

            // Feedback Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF161618),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.purple.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.chat_bubble_outline_rounded, color: Colors.purpleAccent, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Gửi phản hồi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện ứng dụng tốt hơn.', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  OutlinedButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpFeedbackScreen())),
                    icon: const Icon(Icons.open_in_new_rounded, color: Colors.white, size: 14),
                    label: const Text('Gửi phản hồi', style: TextStyle(color: Colors.white, fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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

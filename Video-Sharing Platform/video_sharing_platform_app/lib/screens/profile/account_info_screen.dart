import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../services/auth_service.dart';
import '../../constants.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class AccountInfoScreen extends StatefulWidget {
  const AccountInfoScreen({super.key});

  @override
  State<AccountInfoScreen> createState() => _AccountInfoScreenState();
}

class _AccountInfoScreenState extends State<AccountInfoScreen> {
  final _fullNameController = TextEditingController(text: 'Đỗ Việt Hoàng');
  final _phoneController = TextEditingController(text: '0987654321');
  final _dobController = TextEditingController(text: '15/05/1998');
  final _handleController = TextEditingController(text: 'doviethoang0704');
  final _channelNameController = TextEditingController(text: 'Hoàng Đỗ');
  final _bioController = TextEditingController(text: 'Yêu thích công nghệ và lập trình');
  final _descriptionController = TextEditingController(
      text: 'Xin chào, đây là kênh chính thức của "Hoàng Đỗ".\nTầm nhìn của kênh trong tương lai là trở thành một trong những điểm đến hàng đầu về cung cấp nội dung số chất lượng tại Việt Nam.');

  final _websiteController = TextEditingController();
  final _facebookController = TextEditingController();
  final _instagramController = TextEditingController();
  final _tiktokController = TextEditingController();
  final _emailController = TextEditingController();

  bool _isLoading = true;
  Map<String, dynamic>? _channel;
  Map<String, dynamic>? _currentUser;
  List<Map<String, String>> _activeLinks = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final user = await AuthService.getCurrentUser();
    if (user != null) {
      _currentUser = user;
      _fullNameController.text = user['fullName'] ?? '';
      _handleController.text = user['handle'] ?? '';
      _emailController.text = user['email'] ?? '';
      
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      try {
        final channelRes = await http.get(
          Uri.parse('${AppConstants.apiUrl}/channels/${user['handle']}'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
        ).timeout(const Duration(seconds: 10));

        if (channelRes.statusCode == 200) {
          _channel = jsonDecode(channelRes.body);
          _channelNameController.text = _channel?['channelName'] ?? '';
          _descriptionController.text = _channel?['description'] ?? '';
          
          _activeLinks.clear();
          dynamic rawLinks = _channel?['socialLinks'];
          if (rawLinks != null) {
            try {
              if (rawLinks is String) {
                rawLinks = jsonDecode(rawLinks);
              }
              if (rawLinks is Map) {
                rawLinks.forEach((key, value) {
                  if (value != null && value.toString().isNotEmpty) {
                    _activeLinks.add({'platform': key.toString(), 'url': value.toString()});
                  }
                });
              } else if (rawLinks is List) {
                for (var item in rawLinks) {
                  if (item is Map) {
                    final p = item['platform']?.toString() ?? item['name']?.toString() ?? item['title']?.toString() ?? 'link';
                    final u = item['url']?.toString() ?? item['link']?.toString() ?? '';
                    if (u.isNotEmpty) {
                      _activeLinks.add({'platform': p, 'url': u});
                    }
                  }
                }
              }
            } catch (e) {
              debugPrint('Error parsing social links in AccountInfoScreen: $e');
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    setState(() => _isLoading = false);
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

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd/MM/yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  String _formatCount(dynamic count) {
    if (count == null) return '0';
    if (count is int) return count.toString();
    return count.toString();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _handleController.dispose();
    _channelNameController.dispose();
    _bioController.dispose();
    _descriptionController.dispose();
    _websiteController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _tiktokController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _saveChanges() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Đã lưu thay đổi'),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
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
        title: const Text(
          'Thông tin tài khoản',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _saveChanges,
            child: const Text('Lưu', style: TextStyle(color: Color(0xFF4FC3F7), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4FC3F7)))
          : SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Banners & Avatar ──
            _buildBannerAndAvatar(),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  
                  // ── Thông tin cá nhân ──
                  _buildSectionTitle('Thông tin cá nhân', Icons.person_outline),
                  const SizedBox(height: 16),
                  _buildRowFields(
                    _buildTextField('Họ và tên', _fullNameController, icon: Icons.badge_outlined),
                    _buildTextField('Số điện thoại', _phoneController, icon: Icons.phone_outlined, keyboardType: TextInputType.phone),
                  ),
                  const SizedBox(height: 16),
                  _buildRowFields(
                    _buildTextField('Ngày sinh', _dobController, icon: Icons.calendar_today_outlined),
                    _buildTextField('Mã định danh', _handleController, icon: Icons.alternate_email, prefix: '@'),
                  ),
                  const SizedBox(height: 16),
                  _buildTextField('Tên kênh', _channelNameController, icon: Icons.tv_outlined),
                  const SizedBox(height: 16),
                  _buildTextField('Tiểu sử cá nhân', _bioController, maxLines: 3),
                  const SizedBox(height: 16),
                  _buildTextField('Mô tả kênh', _descriptionController, maxLines: 5),

                  const SizedBox(height: 32),
                  const Divider(color: Color(0xFF1C1C1E)),
                  const SizedBox(height: 24),

                  // ── Đường liên kết & Kết nối ──
                  Row(
                    children: [
                      _buildSectionTitle('Đường liên kết & Kết nối', Icons.link_rounded),
                      const SizedBox(width: 8),
                      const Icon(Icons.edit, color: Colors.white54, size: 16),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_activeLinks.isEmpty)
                    const Text('Chưa có liên kết nào', style: TextStyle(color: Colors.white54, fontSize: 14, fontStyle: FontStyle.italic))
                  else
                    ..._activeLinks.map((link) {
                      final platform = link['platform']!.toLowerCase();
                      IconData icon = Icons.link;
                      if (platform.contains('facebook')) icon = Icons.facebook;
                      else if (platform.contains('instagram')) icon = Icons.camera_alt_outlined;
                      else if (platform.contains('youtube')) icon = Icons.video_library;
                      else if (platform.contains('tiktok')) icon = Icons.music_note_outlined;
                      else if (platform.contains('website')) icon = Icons.language;
                      
                      String title = platform.substring(0, 1).toUpperCase() + platform.substring(1);
                      if (platform.contains('youtube')) title = 'YouTube';
                      else if (platform.contains('facebook')) title = 'Facebook';
                      
                      return _buildSocialLink(title, link['url']!, icon);
                    }),

                  const SizedBox(height: 32),
                  const Divider(color: Color(0xFF1C1C1E)),
                  const SizedBox(height: 24),

                  // ── Thông tin khác ──
                  _buildSectionTitle('Thông tin khác', Icons.info_outline, color: Colors.white),
                  const SizedBox(height: 16),
                  _buildOtherInfoRow(Icons.email_outlined, _emailController.text.isEmpty ? 'Chưa cập nhật email' : _emailController.text),
                  _buildOtherInfoRow(Icons.tv_outlined, 'www.videoplatform.com/@${_handleController.text}'),
                  _buildOtherInfoRow(Icons.language, 'Chưa cập nhật quốc gia'),
                  _buildOtherInfoRow(Icons.info_outline, 'Đã tham gia ${_formatDate(_channel?['createdAt'] ?? _currentUser?['createdAt'])}'),
                  _buildOtherInfoRow(Icons.people_outline, '${_formatCount(_channel?['subscriberCount'])} người đăng ký'),
                  _buildOtherInfoRow(Icons.video_library_outlined, '${_formatCount(_channel?['videoCount'])} video'),
                  _buildOtherInfoRow(Icons.trending_up, '${_formatCount(_channel?['totalViews'])} lượt xem'),

                  const SizedBox(height: 32),
                  const Divider(color: Color(0xFF1C1C1E)),
                  const SizedBox(height: 24),

                  // ── Vùng nguy hiểm ──
                  _buildSectionTitle('Vùng nguy hiểm', Icons.warning_amber_rounded, color: Colors.redAccent),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.red.withValues(alpha: 0.05),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Xóa tài khoản', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                              const SizedBox(height: 4),
                              Text('Xóa vĩnh viễn tài khoản và mọi dữ liệu liên quan. Hành động này không thể hoàn tác.', 
                                style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.delete_outline, size: 18),
                          label: const Text('Xóa'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            foregroundColor: Colors.redAccent,
                            elevation: 0,
                            side: const BorderSide(color: Colors.redAccent),
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
          ],
        ),
      ),
    );
  }

  Widget _buildBannerAndAvatar() {
    final bannerUrl = _getImageUrl(_channel?['bannerUrl']);
    final avatarUrl = _getImageUrl(_currentUser?['avatarUrl']);

    return SizedBox(
      height: 200,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Banner
          Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C1E),
              image: DecorationImage(
                image: NetworkImage(bannerUrl),
                fit: BoxFit.cover,
              ),
            ),
            child: Stack(
              children: [
                Container(color: Colors.black.withValues(alpha: 0.4)),
                Positioned(
                  right: 16,
                  bottom: 16,
                  child: _buildEditButton(Icons.camera_alt, 'Đổi ảnh bìa'),
                ),
              ],
            ),
          ),
          // Avatar
          Positioned(
            left: 16,
            bottom: 10,
            child: Stack(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF0A0A0A), width: 4),
                    image: DecorationImage(
                      image: NetworkImage(avatarUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Color(0xFF2C2C2E),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.edit, color: Colors.white, size: 16),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtherInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(width: 16),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildSocialLink(String title, String url, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.white54, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                Text(url, style: const TextStyle(color: Color(0xFF4FC3F7), fontSize: 12), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditButton(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, {Color color = const Color(0xFF4FC3F7)}) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildRowFields(Widget field1, Widget field2) {
    return Row(
      children: [
        Expanded(child: field1),
        const SizedBox(width: 16),
        Expanded(child: field2),
      ],
    );
  }

  Widget _buildTextField(
    String label, 
    TextEditingController controller, {
    IconData? icon, 
    String? prefix, 
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF1C1C1E),
            prefixIcon: icon != null ? Icon(icon, color: const Color(0xFF636366), size: 18) : null,
            prefixText: prefix != null ? '\$prefix ' : null,
            prefixStyle: const TextStyle(color: Colors.white54, fontSize: 14),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines > 1 ? 12 : 0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF2C2C2E)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF4FC3F7)),
            ),
          ),
        ),
      ],
    );
  }
}

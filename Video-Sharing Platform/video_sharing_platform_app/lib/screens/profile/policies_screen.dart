import 'package:flutter/material.dart';

class PoliciesScreen extends StatelessWidget {
  const PoliciesScreen({super.key});

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
          'Chính sách & Điều khoản',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            _SectionLabel('Pháp lý & Quyền riêng tư'),
            _PolicyMenuItem(
              icon: Icons.gavel_rounded,
              iconColor: const Color(0xFF64B5F6),
              title: 'Điều khoản dịch vụ',
              subtitle: 'Các điều khoản và điều kiện sử dụng nền tảng',
              onTap: () => _openDetail(context, 'Điều khoản dịch vụ', _termsOfService),
            ),
            _PolicyMenuItem(
              icon: Icons.privacy_tip_rounded,
              iconColor: const Color(0xFF81C784),
              title: 'Quyền riêng tư',
              subtitle: 'Cách chúng tôi thu thập và sử dụng dữ liệu',
              onTap: () => _openDetail(context, 'Quyền riêng tư', _privacyPolicy),
            ),
            _PolicyMenuItem(
              icon: Icons.security_rounded,
              iconColor: const Color(0xFFFFB300),
              title: 'Chính sách bảo mật',
              subtitle: 'Cam kết bảo vệ tài khoản của bạn',
              onTap: () => _openDetail(context, 'Chính sách bảo mật', _securityPolicy),
            ),
            _SectionLabel('Cộng đồng & Sáng tạo'),
            _PolicyMenuItem(
              icon: Icons.people_rounded,
              iconColor: const Color(0xFFCE93D8),
              title: 'Nguyên tắc cộng đồng',
              subtitle: 'Tiêu chuẩn hành vi và nội dung trên nền tảng',
              onTap: () => _openDetail(context, 'Nguyên tắc cộng đồng', _communityGuidelines),
            ),
            _PolicyMenuItem(
              icon: Icons.copyright_rounded,
              iconColor: const Color(0xFFFFAB91),
              title: 'Chính sách bản quyền',
              subtitle: 'Quy định về sở hữu trí tuệ và nội dung',
              onTap: () => _openDetail(context, 'Chính sách bản quyền', _copyrightPolicy),
            ),
            _PolicyMenuItem(
              icon: Icons.monetization_on_rounded,
              iconColor: const Color(0xFF4FC3F7),
              title: 'Chính sách kiếm tiền',
              subtitle: 'Điều kiện kiếm thu nhập trên nền tảng',
              onTap: () => _openDetail(context, 'Chính sách kiếm tiền', _monetizationPolicy),
            ),
            const SizedBox(height: 32),
            Center(
              child: Text(
                '© 2025 Video Platform. Mọi quyền được bảo lưu.',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _openDetail(BuildContext context, String title, String content) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => _PolicyDetailScreen(title: title, content: content)),
    );
  }
}

// ── Policy Detail Screen ──
class _PolicyDetailScreen extends StatelessWidget {
  final String title;
  final String content;

  const _PolicyDetailScreen({required this.title, required this.content});

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
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Text(
          content,
          style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 14, height: 1.8, letterSpacing: 0.2),
        ),
      ),
    );
  }
}

// ── Menu Item Widget (giống Settings) ──
class _PolicyMenuItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _PolicyMenuItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Row(
          children: [
            SizedBox(
              width: 36,
              height: 36,
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 12),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF48484A), size: 20),
          ],
        ),
      ),
    );
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
        style: const TextStyle(
          color: Color(0xFF636366),
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

// ── Nội dung chính sách ──
const String _termsOfService = '''Điều khoản dịch vụ
Cập nhật lần cuối: 01/01/2025

1. Chấp thuận điều khoản
Bằng cách truy cập hoặc sử dụng nền tảng Video Platform, bạn đồng ý bị ràng buộc bởi các điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào, bạn không thể sử dụng dịch vụ.

2. Tài khoản người dùng
Bạn có trách nhiệm duy trì tính bảo mật của tài khoản và mật khẩu. Bạn đồng ý thông báo cho chúng tôi ngay lập tức về bất kỳ vi phạm bảo mật nào.

3. Nội dung người dùng
Bạn giữ quyền sở hữu nội dung bạn đăng lên nền tảng. Bằng cách đăng nội dung, bạn cấp cho chúng tôi giấy phép không độc quyền để sử dụng, phân phối và hiển thị nội dung đó.

4. Hành vi bị cấm
- Đăng nội dung bạo lực, khiêu dâm hoặc phân biệt đối xử
- Quấy rối hoặc đe dọa người dùng khác
- Vi phạm quyền sở hữu trí tuệ
- Cố gắng truy cập trái phép hệ thống của chúng tôi

5. Chấm dứt dịch vụ
Chúng tôi có quyền chấm dứt hoặc tạm ngưng tài khoản của bạn nếu bạn vi phạm các điều khoản này.''';

const String _privacyPolicy = '''Chính sách quyền riêng tư
Cập nhật lần cuối: 01/01/2025

1. Thông tin chúng tôi thu thập
- Thông tin tài khoản (tên, email, ảnh đại diện)
- Dữ liệu sử dụng (lịch sử xem, tìm kiếm, tương tác)
- Thông tin thiết bị (loại thiết bị, hệ điều hành)
- Dữ liệu vị trí (nếu được cho phép)

2. Cách chúng tôi sử dụng thông tin
- Cung cấp và cải thiện dịch vụ
- Cá nhân hoá trải nghiệm người dùng
- Gửi thông báo liên quan đến dịch vụ
- Phân tích xu hướng và hành vi sử dụng

3. Chia sẻ thông tin
Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba.

4. Bảo mật dữ liệu
Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ thông tin của bạn.

5. Quyền của bạn
Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất kỳ lúc nào.''';

const String _securityPolicy = '''Chính sách bảo mật
Cập nhật lần cuối: 01/01/2025

1. Cam kết bảo mật
Chúng tôi cam kết bảo vệ tài khoản và dữ liệu của bạn bằng các công nghệ bảo mật hiện đại.

2. Mã hoá dữ liệu
Tất cả dữ liệu được truyền tải qua kết nối HTTPS được mã hoá. Mật khẩu được lưu trữ dưới dạng mã hoá một chiều.

3. Xác thực hai yếu tố (2FA)
Chúng tôi khuyến khích bật xác thực hai yếu tố để tăng cường bảo mật tài khoản.

4. Phát hiện hoạt động bất thường
Hệ thống tự động phát hiện và thông báo về các hoạt động đăng nhập bất thường.

5. Báo cáo lỗ hổng bảo mật
Nếu bạn phát hiện lỗ hổng, vui lòng liên hệ: security@videoplatform.com.''';

const String _communityGuidelines = '''Nguyên tắc cộng đồng
Cập nhật lần cuối: 01/01/2025

1. Tôn trọng lẫn nhau
Đối xử với tất cả thành viên bằng sự tôn trọng và lịch sự. Không chấp nhận hành vi quấy rối, bắt nạt hay phân biệt đối xử.

2. Nội dung phù hợp
- Không đăng nội dung bạo lực hoặc gây thù hận
- Không đăng nội dung khiêu dâm hoặc không phù hợp với trẻ em
- Không đăng thông tin sai lệch hoặc tin giả

3. Bảo vệ sự riêng tư
Không chia sẻ thông tin cá nhân của người khác mà không có sự đồng ý của họ.

4. Hoạt động trung thực
- Không sử dụng bot để tạo lượt xem, lượt thích giả
- Không spam hoặc gửi tin nhắn quảng cáo không mong muốn

5. Báo cáo vi phạm
Nếu bạn thấy nội dung vi phạm, hãy sử dụng tính năng báo cáo trong ứng dụng.''';

const String _copyrightPolicy = '''Chính sách bản quyền
Cập nhật lần cuối: 01/01/2025

1. Tôn trọng bản quyền
Không được đăng nội dung mà bạn không có quyền sử dụng.

2. Nội dung có bản quyền
- Nhạc: Chỉ sử dụng nhạc được cấp phép hoặc miễn phí bản quyền
- Video: Không sử dụng đoạn phim từ phim, chương trình TV mà không được phép
- Hình ảnh: Chỉ sử dụng hình ảnh bạn tự chụp hoặc được cấp phép

3. Khiếu nại vi phạm bản quyền (DMCA)
Gửi thông báo đến: copyright@videoplatform.com

4. Hậu quả vi phạm
- Vi phạm lần đầu: Cảnh báo và gỡ nội dung
- Vi phạm lặp lại: Tạm ngưng hoặc xóa kênh

5. Tranh chấp bản quyền
Chúng tôi có quy trình giải quyết tranh chấp công bằng cho cả hai bên.''';

const String _monetizationPolicy = '''Chính sách kiếm tiền
Cập nhật lần cuối: 01/01/2025

1. Điều kiện tham gia
Để đủ điều kiện kiếm tiền, kênh của bạn cần:
- Tối thiểu 1.000 người đăng ký
- Tối thiểu 4.000 giờ xem trong 12 tháng qua
- Tuân thủ đầy đủ các chính sách của nền tảng

2. Các hình thức kiếm tiền
- Quảng cáo trên video
- Hội viên kênh (membership)
- Super Chat và Super Sticker
- Merchandise và sản phẩm

3. Chia sẻ doanh thu
Chúng tôi chia sẻ 70% doanh thu quảng cáo cho nhà sáng tạo nội dung.

4. Thanh toán
- Thanh toán hàng tháng khi số dư đạt tối thiểu 500.000 VNĐ
- Hỗ trợ chuyển khoản ngân hàng và ví điện tử

5. Vi phạm chính sách kiếm tiền
Các hành vi gian lận sẽ dẫn đến đình chỉ quyền kiếm tiền mà không được hoàn tiền.''';

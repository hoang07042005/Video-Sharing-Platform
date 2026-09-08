import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Main Policies Screen
// ─────────────────────────────────────────────────────────────────────────────
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
              icon: Icons.gavel_rounded, iconColor: const Color(0xFF64B5F6),
              title: 'Điều khoản dịch vụ',
              subtitle: 'Các điều khoản và điều kiện sử dụng nền tảng',
              onTap: () => _openDetail(context, 'Điều khoản dịch vụ', _buildTermsOfService),
            ),
            _PolicyMenuItem(
              icon: Icons.privacy_tip_rounded, iconColor: const Color(0xFF81C784),
              title: 'Quyền riêng tư',
              subtitle: 'Cách chúng tôi thu thập và sử dụng dữ liệu',
              onTap: () => _openDetail(context, 'Quyền riêng tư', _buildPrivacyPolicy),
            ),
            _PolicyMenuItem(
              icon: Icons.security_rounded, iconColor: const Color(0xFFFFB300),
              title: 'Chính sách bảo mật',
              subtitle: 'Cam kết bảo vệ tài khoản của bạn',
              onTap: () => _openDetail(context, 'Chính sách bảo mật', _buildSecurityPolicy),
            ),
            _SectionLabel('Cộng đồng & Sáng tạo'),
            _PolicyMenuItem(
              icon: Icons.people_rounded, iconColor: const Color(0xFFCE93D8),
              title: 'Nguyên tắc cộng đồng',
              subtitle: 'Tiêu chuẩn hành vi và nội dung trên nền tảng',
              onTap: () => _openDetail(context, 'Nguyên tắc cộng đồng', _buildCommunityGuidelines),
            ),
            _PolicyMenuItem(
              icon: Icons.copyright_rounded, iconColor: const Color(0xFFFFAB91),
              title: 'Chính sách bản quyền',
              subtitle: 'Quy định về sở hữu trí tuệ và nội dung',
              onTap: () => _openDetail(context, 'Chính sách bản quyền', _buildCopyrightPolicy),
            ),
            _PolicyMenuItem(
              icon: Icons.monetization_on_rounded, iconColor: const Color(0xFF4FC3F7),
              title: 'Chính sách kiếm tiền',
              subtitle: 'Điều kiện kiếm thu nhập trên nền tảng',
              onTap: () => _openDetail(context, 'Chính sách kiếm tiền', _buildMonetizationPolicy),
            ),
            const SizedBox(height: 32),
            Center(child: Text('© 2025 Video Platform. Mọi quyền được bảo lưu.', style: TextStyle(color: Colors.grey.shade600, fontSize: 12))),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _openDetail(BuildContext context, String title, Widget Function() builder) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => _PolicyDetailScreen(title: title, contentBuilder: builder),
    ));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Detail Screen
// ─────────────────────────────────────────────────────────────────────────────
class _PolicyDetailScreen extends StatelessWidget {
  final String title;
  final Widget Function() contentBuilder;
  const _PolicyDetailScreen({required this.title, required this.contentBuilder});

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
        title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
        child: contentBuilder(),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────────────────────────────────────
Widget _card({required Widget child, Color? bg, Color? border}) => Container(
  width: double.infinity,
  margin: const EdgeInsets.only(bottom: 12),
  padding: const EdgeInsets.all(18),
  decoration: BoxDecoration(
    color: bg ?? const Color(0xFF18181B),
    borderRadius: BorderRadius.circular(8),
    border: Border.all(color: border ?? Colors.white.withValues(alpha: 0.06)),
  ),
  child: child,
);

Widget _secHead(String num, String title, IconData icon, Color c) => Row(children: [
  Container(width: 44, height: 44,
    decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: c.withValues(alpha: 0.3))),
    child: Icon(icon, color: c, size: 20)),
  const SizedBox(width: 12),
  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(num, style: TextStyle(color: c, fontSize: 16, fontWeight: FontWeight.w900)),
    Text(title, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
  ]),
]);

Widget _check(String bold, String text, {Color c = const Color(0xFF9333EA)}) => Padding(
  padding: const EdgeInsets.only(bottom: 9),
  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.only(top: 3), child: Icon(Icons.check_circle, color: c, size: 15)),
    const SizedBox(width: 8),
    Expanded(child: RichText(text: TextSpan(children: [
      if (bold.isNotEmpty) TextSpan(text: '$bold ', style: const TextStyle(color: Color(0xFFE5E7EB), fontWeight: FontWeight.w600, fontSize: 13)),
      TextSpan(text: text, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, height: 1.5)),
    ]))),
  ]),
);

Widget _miniCard(IconData icon, String title, String desc, Color c) => Container(
  padding: const EdgeInsets.all(13),
  decoration: BoxDecoration(color: const Color(0xFF1F1F23), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(children: [Icon(icon, color: c, size: 14), const SizedBox(width: 5), Expanded(child: Text(title, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700)))]),
    const SizedBox(height: 5),
    Text(desc, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11, height: 1.4)),
  ]),
);

Widget _twoCol(String title, Color tc, List<Widget> items) => Container(
  padding: const EdgeInsets.all(14),
  decoration: BoxDecoration(color: const Color(0xFF1F1F23), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: TextStyle(color: tc, fontWeight: FontWeight.w700, fontSize: 12)),
    const SizedBox(height: 10),
    ...items,
  ]),
);

Widget _step(String num, Color c, String title, String desc) => Padding(
  padding: const EdgeInsets.only(bottom: 12),
  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(width: 34, height: 34, decoration: BoxDecoration(color: c.withValues(alpha: 0.12), shape: BoxShape.circle, border: Border.all(color: c.withValues(alpha: 0.35))),
      child: Center(child: Text(num, style: TextStyle(color: c, fontWeight: FontWeight.w900, fontSize: 13)))),
    const SizedBox(width: 11),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
      const SizedBox(height: 3),
      Text(desc, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, height: 1.5)),
    ])),
  ]),
);

Widget _shareRow(IconData icon, Color c, String bold, String text) => Padding(
  padding: const EdgeInsets.only(bottom: 11),
  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(width: 34, height: 34, decoration: BoxDecoration(color: c.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: c.withValues(alpha: 0.3))),
      child: Icon(icon, color: c, size: 16)),
    const SizedBox(width: 10),
    Expanded(child: RichText(text: TextSpan(children: [
      TextSpan(text: '$bold ', style: const TextStyle(color: Color(0xFFE5E7EB), fontWeight: FontWeight.w600, fontSize: 13)),
      TextSpan(text: text, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, height: 1.5)),
    ]))),
  ]),
);

Widget _reqRow(IconData icon, Color c, String val, String label) => Padding(
  padding: const EdgeInsets.only(bottom: 11),
  child: Row(children: [
    Container(padding: const EdgeInsets.all(9), decoration: BoxDecoration(color: c.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: c.withValues(alpha: 0.3))),
      child: Icon(icon, color: c, size: 16)),
    const SizedBox(width: 11),
    Text(val, style: TextStyle(color: c, fontWeight: FontWeight.w800, fontSize: 15)),
    const SizedBox(width: 7),
    Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
  ]),
);

Widget _redDot(String text) => Padding(
  padding: const EdgeInsets.only(bottom: 8),
  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.only(top: 6), child: Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle))),
    const SizedBox(width: 9),
    Expanded(child: Text(text, style: const TextStyle(color: Color(0xFFFFCDD2), fontSize: 13, height: 1.4))),
  ]),
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Điều khoản dịch vụ
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildTermsOfService() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF18181B), child: Row(children: [
    const Icon(Icons.description_outlined, color: Color(0xFF9333EA), size: 28),
    const SizedBox(width: 12),
    Expanded(child: Text('Vui lòng đọc kỹ trước khi sử dụng. Bằng việc truy cập, bạn đồng ý với các điều khoản này.', style: TextStyle(color: Colors.grey.shade300, fontSize: 13, height: 1.5))),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('1', 'Chấp nhận điều khoản', Icons.favorite, const Color(0xFF9333EA)),
    const SizedBox(height: 12),
    Text('Khi bạn tạo tài khoản, tải lên video hoặc sử dụng bất kỳ tính năng nào, bạn xác nhận đã đọc, hiểu và đồng ý với các Điều khoản Dịch vụ này.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.6)),
    const SizedBox(height: 7),
    Text('Nếu bạn đại diện cho một tổ chức, bạn xác nhận có đủ thẩm quyền ràng buộc tổ chức đó với các điều khoản này.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.6)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('2', 'Tài khoản & Bảo mật', Icons.lock_outline, const Color(0xFFEC4899)),
    const SizedBox(height: 12),
    _check('Độ tuổi:', 'Phải đủ 13 tuổi trở lên. Dưới 18 tuổi cần có sự đồng ý của cha mẹ.', c: const Color(0xFFEC4899)),
    _check('Bảo mật:', 'Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động trên tài khoản.', c: const Color(0xFFEC4899)),
    _check('Thông tin chính xác:', 'Cung cấp thông tin đầy đủ khi đăng ký. Danh tính giả có thể dẫn đến đình chỉ ngay.', c: const Color(0xFFEC4899)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('3', 'Quyền sở hữu & Giấy phép', Icons.description, const Color(0xFF3B82F6)),
    const SizedBox(height: 10),
    Text('Bạn giữ quyền sở hữu nội dung tải lên. Tuy nhiên, bạn cấp cho chúng tôi giấy phép:', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
    const SizedBox(height: 12),
    GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.4,
      children: [
        _miniCard(Icons.public, 'Toàn cầu', 'Để phân phối và hiển thị công khai.', const Color(0xFF3B82F6)),
        _miniCard(Icons.copyright, 'Không độc quyền', 'Sử dụng trong phạm vi Dịch vụ.', const Color(0xFF3B82F6)),
        _miniCard(Icons.label_off, 'Không thu phí', 'Chúng tôi không trả tiền cho nội dung.', const Color(0xFF3B82F6)),
        _miniCard(Icons.swap_horiz, 'Có thể chuyển nhượng', 'Cấp phép lại cho đối tác trong phạm vi Dịch vụ.', const Color(0xFF3B82F6)),
      ]),
    const SizedBox(height: 8),
    Text('Giấy phép kết thúc khi bạn xóa nội dung khỏi hệ thống.', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('4', 'Các hành vi bị nghiêm cấm', Icons.warning_amber, const Color(0xFF22C55E)),
    const SizedBox(height: 12),
    _check('', 'Sử dụng Dịch vụ cho mục đích bất hợp pháp hoặc vi phạm pháp luật.', c: const Color(0xFF22C55E)),
    _check('', 'Dùng bot, spider để thu thập dữ liệu hoặc tăng lượt xem giả tạo.', c: const Color(0xFF22C55E)),
    _check('', 'Đăng tải nội dung vi phạm bản quyền hoặc quyền sở hữu trí tuệ.', c: const Color(0xFF22C55E)),
    _check('', 'Can thiệp hoặc làm gián đoạn tính toàn vẹn của Dịch vụ.', c: const Color(0xFF22C55E)),
    _check('', 'Phân tán virus, phần mềm độc hại hoặc mã phá hoại.', c: const Color(0xFF22C55E)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('5', 'Chấm dứt dịch vụ', Icons.close, const Color(0xFFF59E0B)),
    const SizedBox(height: 12),
    Text('Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu vi phạm các Điều khoản này.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.6)),
    const SizedBox(height: 7),
    Text('Bạn cũng có thể chấm dứt thỏa thuận bất kỳ lúc nào bằng cách xóa tài khoản.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.6)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('6', 'Giới hạn trách nhiệm', Icons.balance, const Color(0xFF8B5CF6)),
    const SizedBox(height: 12),
    Text('Dịch vụ được cung cấp trên cơ sở "NGUYÊN TRẠNG". Chúng tôi không đảm bảo Dịch vụ sẽ không bị gián đoạn hoặc hoàn toàn an toàn.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.6)),
  ])),
]);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Quyền riêng tư
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildPrivacyPolicy() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF1E1135).withValues(alpha: 0.5), border: const Color(0xFF9333EA), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Chính sách Quyền riêng tư', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
    const SizedBox(height: 7),
    Text('VideoSharing cam kết bảo vệ thông tin cá nhân. Chúng tôi minh bạch về cách thu thập, sử dụng và bảo vệ dữ liệu của bạn.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('01', 'Dữ liệu chúng tôi thu thập', Icons.storage, const Color(0xFF9333EA)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Thông tin bạn cung cấp', Colors.white, [
        _check('Hồ sơ:', 'Tên, email, số điện thoại, mật khẩu.'),
        _check('Thanh toán:', 'Khi mua Premium, Donate hoặc Mua Coin.'),
        _check('Nội dung tạo:', 'Video, bình luận, tin nhắn.'),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Thu thập tự động', const Color(0xFF9333EA), [
        _check('Hành vi:', 'Lịch sử xem, thời gian xem.'),
        _check('Kỹ thuật:', 'IP, thiết bị, hệ điều hành.'),
        _check('Cookie:', 'Tối ưu trải nghiệm.'),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('02', 'Cách chúng tôi sử dụng dữ liệu', Icons.settings, const Color(0xFF9333EA)),
    const SizedBox(height: 12),
    GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.4,
      children: [
        _miniCard(Icons.star, 'Cung cấp dịch vụ', 'Duy trì hoạt động ổn định và các tính năng.', const Color(0xFFEC4899)),
        _miniCard(Icons.person_pin, 'Cá nhân hóa', 'Đề xuất nội dung phù hợp sở thích.', const Color(0xFF8B5CF6)),
        _miniCard(Icons.bar_chart, 'Quảng cáo & phân tích', 'Hiển thị quảng cáo phù hợp.', const Color(0xFF6366F1)),
        _miniCard(Icons.lock, 'Bảo mật & an toàn', 'Phát hiện và xử lý vi phạm.', const Color(0xFF8B5CF6)),
      ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('03', 'Chia sẻ thông tin của bạn', Icons.share, const Color(0xFF9333EA)),
    const SizedBox(height: 8),
    Text('Chúng tôi KHÔNG bán thông tin cá nhân. Thông tin chỉ được chia sẻ trong các trường hợp:', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
    const SizedBox(height: 12),
    _shareRow(Icons.business, const Color(0xFF3B82F6), 'Với nhà cung cấp dịch vụ:', 'Hỗ trợ vận hành (thanh toán, lưu trữ, CDN...).'),
    _shareRow(Icons.balance, const Color(0xFFEC4899), 'Vì lý do pháp lý:', 'Khi được yêu cầu bởi cơ quan chức năng.'),
    _shareRow(Icons.group, const Color(0xFF8B5CF6), 'Dữ liệu công khai:', 'Nội dung bạn đăng công khai hiển thị cho mọi người.'),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('04', 'Quyền kiểm soát của bạn', Icons.how_to_reg, const Color(0xFF9333EA)),
    const SizedBox(height: 12),
    _check('', 'Xem, chỉnh sửa hoặc xóa thông tin cá nhân bất kỳ lúc nào.'),
    _check('', 'Tải xuống dữ liệu của bạn dưới dạng tệp (Data Export).'),
    _check('', 'Quản lý cài đặt quyền riêng tư và tùy chọn hiển thị.'),
    _check('', 'Yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.'),
  ])),
  _card(bg: const Color(0xFF1A1A1D), child: Row(children: [
    Container(padding: const EdgeInsets.all(9), decoration: BoxDecoration(color: const Color(0xFF3B82F6).withValues(alpha: 0.1), shape: BoxShape.circle, border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.3))), child: const Icon(Icons.info_outline, color: Color(0xFF3B82F6), size: 18)),
    const SizedBox(width: 12),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Cam kết của chúng tôi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      const SizedBox(height: 4),
      Text('Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để bảo vệ dữ liệu khỏi truy cập trái phép.', style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, height: 1.5)),
    ])),
  ])),
]);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Chính sách bảo mật
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildSecurityPolicy() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF052E16).withValues(alpha: 0.5), border: const Color(0xFF22C55E), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Chính sách Bảo mật', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
    const SizedBox(height: 7),
    Text('VideoSharing cam kết bảo vệ dữ liệu bằng tiêu chuẩn bảo mật cao nhất.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('01', 'Mã hóa dữ liệu', Icons.lock, const Color(0xFF22C55E)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Mã hóa đường truyền', Colors.white, [
        _check('SSL/TLS:', 'Mọi thông tin truyền giữa thiết bị và máy chủ đều được mã hóa.', c: const Color(0xFF22C55E)),
        _check('HSTS:', 'Ép buộc HTTPS, ngăn chặn tấn công đánh cắp dữ liệu.', c: const Color(0xFF22C55E)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Mã hóa lưu trữ', const Color(0xFF22C55E), [
        _check('Hashing:', 'Mật khẩu được băm an toàn, ngay cả nhân viên cũng không thể xem.', c: const Color(0xFF22C55E)),
        _check('Token:', 'Session token lưu trữ mã hóa chuẩn AES-256.', c: const Color(0xFF22C55E)),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('02', 'Bảo vệ tài khoản', Icons.shield, const Color(0xFF3B82F6)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Xác thực 2 yếu tố', Colors.white, [
        _check('OTP Email:', 'Các thao tác quan trọng yêu cầu xác thực OTP.', c: const Color(0xFF3B82F6)),
        _check('Cảnh báo lạ:', 'Email báo động khi phát hiện đăng nhập từ thiết bị mới.', c: const Color(0xFF3B82F6)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Quản lý phiên', const Color(0xFF3B82F6), [
        _check('Tự động đăng xuất:', 'Phiên hết hạn tự động, bảo vệ tài khoản.', c: const Color(0xFF3B82F6)),
        _check('Đăng xuất từ xa:', 'Xem và đăng xuất tất cả thiết bị.', c: const Color(0xFF3B82F6)),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('03', 'Giám sát & Chống tấn công', Icons.monitor_heart, const Color(0xFF8B5CF6)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Tường lửa & Quét lỗ hổng', Colors.white, [
        _check('WAF:', 'Đánh chặn DDoS, SQL Injection liên tục 24/7.', c: const Color(0xFF8B5CF6)),
        _check('Quét bảo mật:', 'Rà soát lỗ hổng định kỳ sau mỗi bản cập nhật.', c: const Color(0xFF8B5CF6)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Khóa IP & Chống Bot', const Color(0xFF8B5CF6), [
        _check('Rate Limiting:', 'Tự động chặn IP đăng nhập sai nhiều lần.', c: const Color(0xFF8B5CF6)),
        _check('CAPTCHA:', 'Phân biệt người thật và bot tự động.', c: const Color(0xFF8B5CF6)),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('04', 'Kiểm soát truy cập nội bộ', Icons.how_to_reg, const Color(0xFFF59E0B)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Phân quyền nghiêm ngặt', Colors.white, [
        _check('Đặc quyền tối thiểu:', 'Nhân viên chỉ có quyền tối thiểu để hoàn thành công việc.', c: const Color(0xFFF59E0B)),
        _check('Cách ly dữ liệu:', 'Đội hỗ trợ không trực tiếp truy xuất dữ liệu nhạy cảm.', c: const Color(0xFFF59E0B)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Ghi Log & Kiểm toán', const Color(0xFFF59E0B), [
        _check('Nhật ký hệ thống:', 'Mọi hành động của Admin đều được ghi log.', c: const Color(0xFFF59E0B)),
        _check('Thanh tra định kỳ:', 'Xem xét quyền truy cập nhân viên theo từng quý.', c: const Color(0xFFF59E0B)),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('05', 'Báo cáo lỗ hổng (Bug Bounty)', Icons.campaign, const Color(0xFFEF4444)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Cách thức báo cáo', Colors.white, [
        _check('Kênh liên lạc:', 'Gửi mô tả lỗi qua security@videosharing.com.', c: const Color(0xFFEF4444)),
        _check('Safe Harbor:', 'Chúng tôi bảo vệ danh tính người báo cáo thiện chí.', c: const Color(0xFFEF4444)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Chính sách trả thưởng', const Color(0xFFEF4444), [
        _check('Bug Bounty:', 'Phần thưởng tiền mặt cho lỗi bảo mật nguy hiểm hợp lệ.', c: const Color(0xFFEF4444)),
        _check('Tri ân công khai:', 'Đưa tên vào Bảng vàng Vinh danh trên website.', c: const Color(0xFFEF4444)),
      ])),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('06', 'Sao lưu & Phục hồi', Icons.storage, const Color(0xFF14B8A6)),
    const SizedBox(height: 12),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: _twoCol('Backup định kỳ', Colors.white, [
        _check('Sao lưu hàng ngày:', 'Video, cài đặt và hồ sơ được backup tự động.', c: const Color(0xFF14B8A6)),
        _check('Lưu trữ tách biệt:', 'Bản sao lưu cất ở server độc lập với hệ thống chính.', c: const Color(0xFF14B8A6)),
      ])),
      const SizedBox(width: 8),
      Expanded(child: _twoCol('Cụm máy chủ phân tán', const Color(0xFF14B8A6), [
        _check('Chống chịu lỗi:', 'Kích hoạt server dự phòng ngay lập tức khi cần.', c: const Color(0xFF14B8A6)),
        _check('Cam kết Uptime:', 'Trải nghiệm mượt mà và ít bị gián đoạn.', c: const Color(0xFF14B8A6)),
      ])),
    ]),
  ])),
]);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Nguyên tắc cộng đồng
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildCommunityGuidelines() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF1E1135).withValues(alpha: 0.5), border: const Color(0xFF9333EA), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Nguyên tắc Cộng đồng', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
    const SizedBox(height: 7),
    Text('Nền tảng là nơi kết nối và sáng tạo. Để bảo vệ cộng đồng an toàn, vui lòng tuân thủ các nguyên tắc sau.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
  ])),
  // Zero Tolerance
  Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(color: const Color(0xFF1A1111), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.35))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Row(children: [
        Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 20),
        SizedBox(width: 8),
        Expanded(child: Text('KHÔNG DUNG THỨ — Cấm vĩnh viễn ngay vi phạm đầu tiên', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 13))),
      ]),
      const SizedBox(height: 12),
      _zeroItem(Icons.monitor, 'Hình ảnh lạm dụng tình dục hoặc bóc lột trẻ em dưới mọi hình thức.'),
      _zeroItem(Icons.flight, 'Nội dung mô tả hoặc khuyến khích các hoạt động khủng bố.'),
      _zeroItem(Icons.warning, 'Đe dọa, doxxing hoặc phát tán thông tin nhạy cảm của người khác.'),
    ]),
  ),
  _ruleItem('01', 'Nội dung bạo lực và đẫm máu', Icons.shield_outlined, const Color(0xFF9333EA), ['Cảnh quay bạo lực thực tế, tai nạn nghiêm trọng hoặc hướng dẫn hành động nguy hiểm.', 'Hành vi ngược đãi, hành hạ hoặc giết hại động vật vô cớ.', 'Nội dung xúc phạm, khuyến khích bạo lực, tự tử hoặc tự gây thương tích.']),
  _ruleItem('02', 'Nội dung tình dục và ảnh khỏa thân', Icons.favorite_outline, const Color(0xFFEC4899), ['Cấm hoàn toàn các video, hình ảnh mô tả hành vi tình dục rõ ràng.', 'Hình ảnh khỏa thân với mục đích khiêu dâm hoặc gợi dục.', 'Ngoại lệ: Ảnh nghệ thuật, giáo dục sức khỏe (có cảnh báo) hoặc y tế.']),
  _ruleItem('03', 'Quấy rối và Bắt nạt', Icons.sentiment_dissatisfied, const Color(0xFFF97316), ['Nội dung lăng mạ, xúc phạm nhằm vào cá nhân hoặc nhóm người.', 'Kích động người xem tấn công, quấy rối hoặc report hàng loạt.', 'Phát tán thông tin cá nhân (địa chỉ nhà, số điện thoại) của người khác.']),
  _ruleItem('04', 'Ngôn từ kích động thù địch', Icons.campaign_outlined, const Color(0xFFEAB308), ['Chủng tộc, dân tộc, giới tính, bản dạng giới.', 'Tôn giáo, xu hướng tình dục, khuyết tật, bệnh tật.', 'Độ tuổi hoặc bất kỳ đặc điểm được pháp luật bảo vệ.']),
  _ruleItem('05', 'Spam, Lừa đảo và Câu view trái phép', Icons.mail_outline, const Color(0xFF14B8A6), ['Đăng nội dung lặp lại vô nghĩa, spam bình luận, quảng cáo trái phép.', 'Dùng tiêu đề, thumbnail sai lệch hoàn toàn nội dung.', 'Bán lượt xem, lượt thích hoặc người đăng ký nhân tạo.', 'Lừa đảo tài chính hoặc hứa hẹn tặng quà giá trị.']),
  // Violation system
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Row(children: [
      Container(padding: const EdgeInsets.all(9), decoration: BoxDecoration(color: const Color(0xFF6366F1).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.3))), child: const Icon(Icons.shield, color: Color(0xFF6366F1), size: 18)),
      const SizedBox(width: 11),
      const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Hệ thống xử lý vi phạm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        Text('Nếu nội dung vi phạm, chúng tôi áp dụng hệ thống cảnh cáo:', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
      ])),
    ]),
    const SizedBox(height: 14),
    _step('1', const Color(0xFF6366F1), 'Cảnh cáo lần 1', 'Xóa video vi phạm. Cấm đăng video, livestream trong 1 tuần.'),
    _step('2', const Color(0xFF6366F1), 'Cảnh cáo lần 2', 'Nhận trong vòng 90 ngày kể từ lần 1. Cấm đăng tải nội dung trong 2 tuần.'),
    _step('3', const Color(0xFFEC4899), 'Cảnh cáo lần 3', 'Kênh bị đóng vĩnh viễn nếu nhận 3 cảnh cáo trong 90 ngày.'),
  ])),
]);

Widget _zeroItem(IconData icon, String text) => Padding(
  padding: const EdgeInsets.only(bottom: 9),
  child: Row(children: [
    Container(padding: const EdgeInsets.all(7), decoration: BoxDecoration(color: const Color(0xFFEF4444).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(7), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2))), child: Icon(icon, color: const Color(0xFFEF4444), size: 14)),
    const SizedBox(width: 9),
    Expanded(child: Text(text, style: const TextStyle(color: Color(0xFFFFCDD2), fontSize: 13, fontWeight: FontWeight.w500, height: 1.4))),
  ]),
);

Widget _ruleItem(String num, String title, IconData icon, Color c, List<String> items) => _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  Row(children: [
    Container(width: 44, height: 44, decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: Colors.white, size: 20)),
    const SizedBox(width: 11),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(num, style: TextStyle(color: c, fontSize: 15, fontWeight: FontWeight.w900)),
      Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
    ]),
  ]),
  const SizedBox(height: 11),
  ...items.map((e) => _check('', e, c: c)),
]));

// ─────────────────────────────────────────────────────────────────────────────
// 5. Chính sách bản quyền
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildCopyrightPolicy() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF1E1135).withValues(alpha: 0.5), border: const Color(0xFF9333EA), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    ShaderMask(shaderCallback: (r) => const LinearGradient(colors: [Color(0xFF9333EA), Color(0xFF6366F1)]).createShader(r),
      child: const Text('Bản quyền & DMCA', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
    const SizedBox(height: 7),
    Text('Chúng tôi tôn trọng quyền sở hữu trí tuệ và yêu cầu cộng đồng tuân thủ Luật Bản quyền DMCA.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
  ])),
  _card(child: Row(children: [
    Container(width: 48, height: 48, decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.3))), child: const Icon(Icons.balance, color: Color(0xFF8B5CF6), size: 22)),
    const SizedBox(width: 12),
    const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Cam kết của chúng tôi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
      SizedBox(height: 4),
      Text('Bảo vệ quyền tác giả, đảm bảo môi trường sáng tạo công bằng cho tất cả mọi người.', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, height: 1.5)),
    ])),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('01', 'Quy tắc cơ bản về Bản quyền', Icons.playlist_add_check, const Color(0xFFEC4899)),
    const SizedBox(height: 11),
    Text('Người sáng tạo chỉ nên tải lên nội dung mà họ có quyền sở hữu hoặc được phép sử dụng.', style: TextStyle(color: Colors.grey.shade300, fontSize: 13, height: 1.5)),
    const SizedBox(height: 12),
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFF1A1111), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Không được phép:', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 9),
        _redDot('Tải lên nội dung sao chép trái phép'),
        _redDot('Sử dụng nhạc, video, hình ảnh khi chưa được cấp phép'),
        _redDot('Xóa hoặc thay đổi thông tin bản quyền gốc'),
        _redDot('Đăng tải nội dung không thuộc quyền sở hữu của bạn'),
      ]),
    ),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('02', 'Quy trình khiếu nại DMCA', Icons.report_problem, const Color(0xFF8B5CF6)),
    const SizedBox(height: 12),
    _step('1', const Color(0xFF8B5CF6), 'Gửi thông báo DMCA', 'Chủ sở hữu bản quyền gửi thông báo DMCA chính thức.'),
    _step('2', const Color(0xFF8B5CF6), 'Xử lý vi phạm', 'Chúng tôi gỡ nội dung và thông báo người tải lên.'),
    _step('3', const Color(0xFF8B5CF6), 'Quyền phản đối', 'Người tải lên có thể gửi phản đối nếu tin rằng nội dung hợp lệ.'),
    _step('4', const Color(0xFF6366F1), 'Quyết định cuối', 'Không có phản đối trong 10 ngày, nội dung bị xóa vĩnh viễn.'),
    const SizedBox(height: 8),
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: const Color(0xFF120A1F), borderRadius: BorderRadius.circular(8)),
      child: Row(children: [
        const Icon(Icons.mail_outline, color: Color(0xFF8B5CF6), size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text('Gửi khiếu nại: copyright@videoplatform.com', style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 13))),
      ]),
    ),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('03', 'Hậu quả vi phạm bản quyền', Icons.gavel, const Color(0xFFF59E0B)),
    const SizedBox(height: 12),
    _step('1', const Color(0xFFF59E0B), 'Vi phạm lần đầu', 'Cảnh báo chính thức và gỡ nội dung vi phạm ngay lập tức.'),
    _step('2', const Color(0xFFF97316), 'Vi phạm lần 2', 'Hạn chế tính năng tải lên trong vòng 30 ngày.'),
    _step('3', const Color(0xFFEF4444), 'Vi phạm lần 3+', 'Tạm ngưng hoặc xóa kênh vĩnh viễn. Không hoàn tiền.'),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('04', 'Sử dụng hợp lý (Fair Use)', Icons.check_circle_outline, const Color(0xFF22C55E)),
    const SizedBox(height: 12),
    _check('Bình luận & Phê bình:', 'Trích dẫn ngắn để bình luận hoặc phê bình tác phẩm.', c: const Color(0xFF22C55E)),
    _check('Giáo dục:', 'Sử dụng cho mục đích dạy học, nghiên cứu phi lợi nhuận.', c: const Color(0xFF22C55E)),
    _check('Tin tức:', 'Đưa tin, báo cáo về sự kiện sử dụng nội dung liên quan.', c: const Color(0xFF22C55E)),
    _check('Parody:', 'Sáng tác mang tính châm biếm rõ ràng tác phẩm gốc.', c: const Color(0xFF22C55E)),
  ])),
]);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Chính sách kiếm tiền
// ─────────────────────────────────────────────────────────────────────────────
Widget _buildMonetizationPolicy() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  _card(bg: const Color(0xFF0A1525).withValues(alpha: 0.8), border: const Color(0xFF3B82F6), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Chính sách Kiếm tiền', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
    const SizedBox(height: 7),
    Text('Điều kiện và quy định để bật kiếm tiền trên nền tảng VideoSharing.', style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('01', 'Điều kiện tham gia', Icons.verified, const Color(0xFF3B82F6)),
    const SizedBox(height: 12),
    _reqRow(Icons.people, const Color(0xFF3B82F6), '1.000+', 'Người đăng ký'),
    _reqRow(Icons.access_time, const Color(0xFF8B5CF6), '4.000+', 'Giờ xem trong 12 tháng'),
    _reqRow(Icons.shield, const Color(0xFF22C55E), '100%', 'Tuân thủ chính sách nền tảng'),
    _reqRow(Icons.location_on, const Color(0xFFF59E0B), 'Đủ điều kiện', 'Quốc gia được hỗ trợ'),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('02', 'Các hình thức kiếm tiền', Icons.attach_money, const Color(0xFF22C55E)),
    const SizedBox(height: 12),
    GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.4,
      children: [
        _miniCard(Icons.play_circle, 'Quảng cáo', 'Doanh thu từ quảng cáo hiển thị trên video.', const Color(0xFF3B82F6)),
        _miniCard(Icons.card_membership, 'Hội viên kênh', 'Thành viên trả phí hàng tháng.', const Color(0xFF8B5CF6)),
        _miniCard(Icons.chat, 'Super Chat', 'Bình luận nổi bật trong livestream.', const Color(0xFFEC4899)),
        _miniCard(Icons.storefront, 'Merchandise', 'Bán sản phẩm qua nền tảng.', const Color(0xFFF59E0B)),
      ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('03', 'Chia sẻ doanh thu', Icons.pie_chart, const Color(0xFF9333EA)),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF1E1135), Color(0xFF0A0A1A)]), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFF9333EA).withValues(alpha: 0.3))),
        child: const Column(children: [
          Text('70%', style: TextStyle(color: Color(0xFF9333EA), fontSize: 34, fontWeight: FontWeight.w900)),
          Text('Nhà sáng tạo', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
          SizedBox(height: 3),
          Text('Của doanh thu quảng cáo', style: TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
        ]),
      )),
      const SizedBox(width: 8),
      Expanded(child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF1F1F23), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
        child: const Column(children: [
          Text('30%', style: TextStyle(color: Color(0xFF6B7280), fontSize: 34, fontWeight: FontWeight.w900)),
          Text('Nền tảng', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
          SizedBox(height: 3),
          Text('Chi phí vận hành & phát triển', style: TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
        ]),
      )),
    ]),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('04', 'Thanh toán', Icons.payment, const Color(0xFF22C55E)),
    const SizedBox(height: 12),
    _check('Định kỳ:', 'Thanh toán hàng tháng khi số dư đạt tối thiểu 500.000 VNĐ.', c: const Color(0xFF22C55E)),
    _check('Hình thức:', 'Hỗ trợ chuyển khoản ngân hàng và ví điện tử (Momo, ZaloPay).', c: const Color(0xFF22C55E)),
    _check('Thời gian xử lý:', 'Trong vòng 5-7 ngày làm việc sau khi yêu cầu rút tiền.', c: const Color(0xFF22C55E)),
    _check('Thuế:', 'Nhà sáng tạo tự chịu trách nhiệm kê khai thuế theo quy định pháp luật.', c: const Color(0xFF22C55E)),
  ])),
  _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _secHead('05', 'Vi phạm chính sách kiếm tiền', Icons.warning_amber, const Color(0xFFEF4444)),
    const SizedBox(height: 12),
    Text('Các hành vi dưới đây sẽ dẫn đến đình chỉ quyền kiếm tiền:', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
    const SizedBox(height: 10),
    _check('', 'Gian lận lượt xem, click gian lận vào quảng cáo.', c: const Color(0xFFEF4444)),
    _check('', 'Đăng nội dung vi phạm trong khi đang kiếm tiền.', c: const Color(0xFFEF4444)),
    _check('', 'Thao túng hệ thống doanh thu hoặc báo cáo sai lệch.', c: const Color(0xFFEF4444)),
    Container(
      margin: const EdgeInsets.only(top: 7),
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(color: const Color(0xFF1A0505), borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2))),
      child: const Row(children: [
        Icon(Icons.info_outline, color: Color(0xFFEF4444), size: 15),
        SizedBox(width: 7),
        Expanded(child: Text('Vi phạm sẽ bị đình chỉ kiếm tiền mà không được hoàn tiền.', style: TextStyle(color: Color(0xFFFFCDD2), fontSize: 12, height: 1.4))),
      ]),
    ),
  ])),
]);

// ─────────────────────────────────────────────────────────────────────────────
// Menu Item & Section Label
// ─────────────────────────────────────────────────────────────────────────────
class _PolicyMenuItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _PolicyMenuItem({required this.icon, required this.iconColor, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Row(children: [
          SizedBox(width: 36, height: 36, child: Icon(icon, color: iconColor, size: 22)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 12)),
          ])),
          const Icon(Icons.chevron_right, color: Color(0xFF48484A), size: 20),
        ]),
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
      child: Text(label.toUpperCase(), style: const TextStyle(color: Color(0xFF636366), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
    );
  }
}


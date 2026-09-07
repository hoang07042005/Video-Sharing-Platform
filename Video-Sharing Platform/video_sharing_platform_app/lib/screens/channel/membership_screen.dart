import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants.dart';
import '../../services/auth_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';

class MembershipScreen extends StatefulWidget {
  final Map<String, dynamic> channel;
  const MembershipScreen({super.key, required this.channel});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  bool _isLoading = true;
  bool _isProcessing = false;
  bool _isOwner = false;
  bool _isMember = false;
  List<dynamic> _members = [];
  int _totalRevenue = 0;
  
  bool _isEditingPrice = false;
  bool _isSavingPrice = false;
  final TextEditingController _priceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _priceController.text = (widget.channel['membershipFee'] ?? 30000).toString();
    _fetchData();
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<void> _fetchData() async {
    try {
      final user = await AuthService.getCurrentUser();
      final headers = await _getHeaders();
      
      final channelId = widget.channel['id'] ?? widget.channel['_id'];

      if (user != null) {
        if (user['handle'] == widget.channel['handle']) {
          _isOwner = true;
          // Fetch revenue
          try {
            final revRes = await http.get(Uri.parse('${AppConstants.apiUrl}/channels/$channelId/membership-revenue'), headers: headers);
            if (revRes.statusCode == 200) {
              _totalRevenue = jsonDecode(revRes.body)['totalRevenue'] ?? 0;
            }
          } catch (_) {}
        } else {
          // Check membership
          try {
            final statusRes = await http.get(Uri.parse('${AppConstants.apiUrl}/channels/$channelId/membership'), headers: headers);
            if (statusRes.statusCode == 200) {
              _isMember = jsonDecode(statusRes.body)['isMember'] == true;
            }
          } catch (_) {}
        }
      }

      // Fetch members unconditionally as per web
      try {
        final memRes = await http.get(Uri.parse('${AppConstants.apiUrl}/channels/$channelId/members'), headers: headers);
        if (memRes.statusCode == 200) {
          _members = jsonDecode(memRes.body);
        }
      } catch (_) {}

    } catch (e) {
      debugPrint('Error fetching membership: $e');
    }
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updatePrice() async {
    final newPrice = int.tryParse(_priceController.text) ?? 0;
    if (newPrice < 10000) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Giá tối thiểu là 10.000đ')));
      return;
    }
    
    setState(() => _isSavingPrice = true);
    try {
      final headers = await _getHeaders();
      final res = await http.put(
        Uri.parse('${AppConstants.apiUrl}/channels/${widget.channel['id'] ?? widget.channel['_id']}'),
        headers: headers,
        body: jsonEncode({
          'channelName': widget.channel['channelName'],
          'handle': widget.channel['handle'],
          'membershipFee': newPrice,
        }),
      );
      if (!mounted) return;
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cập nhật giá thành công!')));
        setState(() {
          widget.channel['membershipFee'] = newPrice;
          _isEditingPrice = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi cập nhật giá!')));
    }
    setState(() => _isSavingPrice = false);
  }

  Future<void> _joinMembership() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng đăng nhập để tham gia!')));
      return;
    }

    setState(() => _isProcessing = true);
    try {
      final headers = await _getHeaders();
      final res = await http.post(
        Uri.parse('${AppConstants.apiUrl}/payment/create-payment-url'),
        headers: headers,
        body: jsonEncode({
          'plan': 'Membership',
          'cycle': 'Basic',
          'amount': widget.channel['membershipFee'] ?? 30000,
          'targetChannelId': widget.channel['id'] ?? widget.channel['_id'],
        }),
      );

      if (!mounted) return;
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['url'] != null) {
          final uri = Uri.parse(data['url']);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi khi tạo giao dịch thanh toán!')));
    }
    setState(() => _isProcessing = false);
  }

  Widget _buildMembersList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF9C27B0).withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8)
              ),
              child: const Icon(FontAwesomeIcons.crown, color: Color(0xFF9C27B0), size: 16),
            ),
            const SizedBox(width: 12),
            Text('Cộng đồng hội viên (${_members.length})', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        if (_isOwner)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xFF9C27B0).withValues(alpha: 0.1), Colors.transparent]),
              border: Border.all(color: const Color(0xFF9C27B0).withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(12)
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tổng doanh thu hội viên (đã cộng dồn gia hạn)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text('${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(_totalRevenue)}', 
                  style: const TextStyle(color: Color(0xFF9C27B0), fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        
        if (_isOwner) const SizedBox(height: 16),

        if (_members.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 32),
            alignment: Alignment.center,
            child: Column(
              children: [
                Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), shape: BoxShape.circle),
                  child: const Icon(FontAwesomeIcons.crown, color: Colors.grey, size: 28),
                ),
                const SizedBox(height: 12),
                const Text('Chưa có hội viên nào', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 4),
                const Text('Hãy trở thành người đầu tiên ủng hộ kênh này!', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _members.length,
            itemBuilder: (context, index) {
              final member = _members[index];
              final user = member['user'] ?? {};
              final avatar = user['avatarUrl'] ?? '';
              final name = user['fullName'] ?? user['handle'] ?? 'Thành viên';
              final joined = member['joinedAt'] != null ? DateFormat('dd/MM/yyyy').format(DateTime.parse(member['joinedAt'])) : '-';
              
              return Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05)))),
                child: Row(
                  children: [
                    Text('${index + 1}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(width: 12),
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.grey.shade800,
                      backgroundImage: avatar.isNotEmpty ? NetworkImage(avatar) : null,
                      child: avatar.isEmpty ? const Icon(Icons.person, color: Colors.white, size: 16) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text('Tham gia: $joined', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                      child: const Text('Đang hoạt động', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildMembershipCard() {
    final price = widget.channel['membershipFee'] ?? 30000;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(FontAwesomeIcons.crown, color: Colors.orange, size: 18),
              SizedBox(width: 8),
              Text('Đăng ký hội viên', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 4),
          const Text('Trở thành hội viên để nhận nhiều đặc quyền hấp dẫn', style: TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 20),

          // Orange Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0x4DE65100), Color(0x1AE53935)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.orange.withValues(alpha: 0.1),
                  blurRadius: 30,
                  spreadRadius: 0
                )
              ]
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Colors.yellow, Colors.orange, Colors.red]),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.yellow.withValues(alpha: 0.5), width: 2),
                        boxShadow: [BoxShadow(color: Colors.orange.withValues(alpha: 0.4), blurRadius: 20)]
                      ),
                      child: const Center(child: Icon(FontAwesomeIcons.crown, color: Colors.white, size: 28)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Hội viên chung', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          if (_isEditingPrice)
                            Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    height: 36,
                                    margin: const EdgeInsets.only(top: 8, bottom: 8),
                                    decoration: BoxDecoration(color: const Color(0xFF0F0F0F), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.orange.withValues(alpha: 0.5))),
                                    child: TextField(
                                      controller: _priceController,
                                      keyboardType: TextInputType.number,
                                      style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 14),
                                      textAlign: TextAlign.center,
                                      decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.only(bottom: 12)),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: _isSavingPrice ? null : _updatePrice,
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, padding: const EdgeInsets.symmetric(horizontal: 12), minimumSize: const Size(0, 36)),
                                  child: _isSavingPrice ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Lưu', style: TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                                IconButton(
                                  onPressed: () => setState(() => _isEditingPrice = false),
                                  icon: const Icon(Icons.close, color: Colors.white70, size: 16),
                                )
                              ],
                            )
                          else
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('${NumberFormat.currency(locale: 'vi_VN', symbol: 'đ').format(price)}', style: const TextStyle(color: Colors.orange, fontSize: 20, fontWeight: FontWeight.bold)),
                                const Padding(
                                  padding: EdgeInsets.only(bottom: 2, left: 4),
                                  child: Text('/ tháng', style: TextStyle(color: Colors.white, fontSize: 12)),
                                ),
                                if (_isOwner)
                                  IconButton(
                                    icon: const Icon(Icons.edit, color: Colors.white54, size: 14),
                                    onPressed: () {
                                      _priceController.text = price.toString();
                                      setState(() => _isEditingPrice = true);
                                    },
                                    constraints: const BoxConstraints(),
                                    padding: const EdgeInsets.only(left: 8, bottom: 4),
                                  )
                              ],
                            ),
                          const SizedBox(height: 16),
                          _buildBenefitRow('Huy hiệu hội viên', 'Hiển thị huy hiệu đặc biệt bên cạnh tên của bạn khi bình luận.'),
                          const SizedBox(height: 12),
                          _buildBenefitRow('Biểu tượng cảm xúc độc quyền', 'Sử dụng các emoji độc quyền của kênh.'),
                          const SizedBox(height: 12),
                          _buildBenefitRow('Ưu tiên trả lời bình luận', 'Bình luận của bạn sẽ được kênh ưu tiên phản hồi.'),
                        ],
                      ),
                    )
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF0F0F0F).withValues(alpha: 0.8), border: Border.all(color: Colors.white.withValues(alpha: 0.05)), borderRadius: BorderRadius.circular(12)),
            child: Row(
              children: [
                Icon(Icons.lock, color: Colors.orange.withValues(alpha: 0.8), size: 16),
                const SizedBox(width: 8),
                const Expanded(child: Text('Khi đăng ký, hệ thống sẽ sử dụng thông tin tài khoản của bạn để liên kết và kích hoạt hội viên.', style: TextStyle(color: Colors.grey, fontSize: 10, height: 1.3))),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (_isOwner)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: null,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.1), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Bạn là chủ kênh', style: TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.bold)),
              ),
            )
          else if (_isMember)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: null,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.1), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Bạn đã là hội viên', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              ),
            )
          else
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Colors.yellow, Colors.orange, Colors.red]),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.orange.withValues(alpha: 0.3), blurRadius: 20)]
              ),
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _joinMembership,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: _isProcessing
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(FontAwesomeIcons.crown, color: Colors.white, size: 16),
                          SizedBox(width: 8),
                          Text('Đăng ký ngay', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                        ],
                      ),
              ),
            )
        ],
      ),
    );
  }

  Widget _buildBenefitRow(String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 2),
          padding: const EdgeInsets.all(2),
          decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
          child: const Icon(Icons.check, color: Colors.white, size: 10),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(desc, style: const TextStyle(color: Colors.grey, fontSize: 10, height: 1.2)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPerks() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), shape: BoxShape.circle),
                child: const Icon(FontAwesomeIcons.crown, color: Colors.orange, size: 12),
              ),
              const SizedBox(width: 8),
              const Text('Quyền lợi khi trở thành hội viên', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  children: const [
                    Icon(FontAwesomeIcons.crown, color: Colors.orange, size: 20),
                    SizedBox(height: 8),
                    Text('Nội dung độc quyền', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Truy cập nội dung chỉ dành riêng cho hội viên.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 9)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  children: const [
                    Icon(FontAwesomeIcons.star, color: Colors.orange, size: 20),
                    SizedBox(height: 8),
                    Text('Hỗ trợ ưu tiên', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Được hỗ trợ nhanh chóng và ưu tiên giải quyết.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 9)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  children: const [
                    Icon(FontAwesomeIcons.shieldHalved, color: Colors.red, size: 20),
                    SizedBox(height: 8),
                    Text('Trải nghiệm tốt hơn', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Xem video không quảng cáo và chất lượng cao hơn.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 9)),
                  ],
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        title: const Text('Trang Hội viên', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Colors.white))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_isOwner) ...[
                  _buildMembersList(),
                  const SizedBox(height: 24),
                ],
                _buildMembershipCard(),
                const SizedBox(height: 16),
                _buildPerks(),
                if (!_isOwner) ...[
                  const SizedBox(height: 32),
                  _buildMembersList(),
                ],
              ],
            ),
          ),
    );
  }
}

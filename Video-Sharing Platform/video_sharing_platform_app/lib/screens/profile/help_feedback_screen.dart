import 'dart:convert';
import 'package:mime/mime.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants.dart';
import 'all_faqs_screen.dart';

class HelpFeedbackScreen extends StatefulWidget {
  const HelpFeedbackScreen({super.key});

  @override
  State<HelpFeedbackScreen> createState() => _HelpFeedbackScreenState();
}

class _HelpFeedbackScreenState extends State<HelpFeedbackScreen> {
  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'account',
      'icon': Icons.person_outline_rounded,
      'title': 'Tài khoản & Bảo mật',
      'subtitle': 'Đăng nhập, bảo mật, xác minh...',
      'color': const Color(0xFF9333EA),
    },
    {
      'id': 'video',
      'icon': Icons.play_circle_outline_rounded,
      'title': 'Video & Nội dung',
      'subtitle': 'Tải lên, xử lý, định dạng...',
      'color': const Color(0xFFEF4444),
    },
    {
      'id': 'revenue',
      'icon': Icons.description_outlined,
      'title': 'Rút tiền & Doanh thu',
      'subtitle': 'Rút tiền, doanh thu, thuế...',
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 'copyright',
      'icon': Icons.shield_outlined,
      'title': 'Bản quyền & Vi phạm',
      'subtitle': 'Báo cáo, khiếu nại, vi phạm...',
      'color': const Color(0xFF3B82F6),
    },
    {
      'id': 'payment',
      'icon': Icons.attach_money_rounded,
      'title': 'Thanh toán & Nạp tiền',
      'subtitle': 'Nạp xu, thanh toán, hóa đơn...',
      'color': const Color(0xFF22C55E),
    },
    {
      'id': 'technical',
      'icon': Icons.settings_outlined,
      'title': 'Lỗi kỹ thuật',
      'subtitle': 'Lỗi hệ thống, không tải được...',
      'color': const Color(0xFF8B5CF6),
    },
  ];

  bool _isSearchVisible = false;
  List<dynamic> _faqs = [];
  bool _isLoadingFaqs = true;
  bool _isSubmitting = false;
  final TextEditingController _contentController = TextEditingController();
  int? _expandedFaqIndex;
  
  final List<String> _attachments = [];
  bool _isUploadingImage = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchFaqs();
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImages() async {
    if (_attachments.length >= 5) {
      _showToast('Bạn chỉ được tải lên tối đa 5 ảnh.', type: _ToastType.warning);
      return;
    }

    try {
      final List<XFile> images = await _picker.pickMultiImage();
      if (images.isEmpty) return;

      int spacesLeft = 5 - _attachments.length;
      List<XFile> filesToUpload = images.take(spacesLeft).toList();

      if (images.length > spacesLeft) {
        _showToast('Chỉ có thể tải lên tối đa 5 ảnh. Một số ảnh đã bị bỏ qua.', type: _ToastType.warning);
      }

      setState(() => _isUploadingImage = true);

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';

      for (var file in filesToUpload) {
        final request = http.MultipartRequest('POST', Uri.parse('${AppConstants.apiUrl}/upload/image'));
        if (token.isNotEmpty) {
          request.headers['Authorization'] = 'Bearer $token';
        }
        final bytes = await file.readAsBytes();
        final mimeType = lookupMimeType(file.name) ?? 'image/jpeg';
        final mediaParts = mimeType.split('/');
        request.files.add(
          http.MultipartFile.fromBytes(
            'file',
            bytes,
            filename: file.name,
            contentType: MediaType(mediaParts[0], mediaParts[1]),
          ),
        );

        final response = await request.send();
        if (response.statusCode == 200 || response.statusCode == 201) {
          final resData = await response.stream.bytesToString();
          final data = jsonDecode(resData);
          if (data['url'] != null) {
            setState(() {
              _attachments.add(data['url']);
            });
          }
        } else {
          _showToast('Lỗi khi tải ảnh ${file.name} lên.', type: _ToastType.error);
        }
      }
    } catch (e) {
      _showToast('Lỗi chọn ảnh: $e', type: _ToastType.error);
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  void _removeAttachment(int index) {
    setState(() {
      _attachments.removeAt(index);
    });
  }

  Future<void> _fetchFaqs() async {
    try {
      final res = await http.get(Uri.parse('${AppConstants.apiUrl}/faqs'));
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _faqs = jsonDecode(res.body);
            _isLoadingFaqs = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoadingFaqs = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingFaqs = false);
    }
  }

  Future<void> _submitFeedback() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) {
      _showToast('Vui lòng nhập chi tiết vấn đề', type: _ToastType.warning);
      return;
    }

    setState(() => _isSubmitting = true);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        _showToast('Bạn chưa đăng nhập.', type: _ToastType.error);
        setState(() => _isSubmitting = false);
        return;
      }

      final res = await http.post(
        Uri.parse('${AppConstants.apiUrl}/feedback'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'type': _selectedIssue,
          'content': content,
          'attachmentUrl': _attachments.isNotEmpty ? jsonEncode(_attachments) : null,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        _showToast('Gửi yêu cầu hỗ trợ thành công!', type: _ToastType.success);
        _contentController.clear();
        setState(() {
          _attachments.clear();
        });
      } else {
        final data = jsonDecode(res.body);
        _showToast(data['message'] ?? 'Lỗi khi gửi yêu cầu.', type: _ToastType.error);
      }
    } catch (e) {
      _showToast('Lỗi kết nối. Vui lòng thử lại sau.', type: _ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String? _selectedIssue = 'technical';

  void _showToast(String message, {_ToastType type = _ToastType.warning}) {
    Color bgColor;
    Color borderColor;
    IconData icon;
    switch (type) {
      case _ToastType.success:
        bgColor = const Color(0xFF166534);
        borderColor = const Color(0xFF22C55E);
        icon = Icons.check_circle_rounded;
        break;
      case _ToastType.error:
        bgColor = const Color(0xFF7F1D1D);
        borderColor = const Color(0xFFEF4444);
        icon = Icons.error_rounded;
        break;
      case _ToastType.warning:
        bgColor = const Color(0xFF78350F);
        borderColor = const Color(0xFFF59E0B);
        icon = Icons.warning_amber_rounded;
        break;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(color: Colors.white, fontSize: 13))),
          ],
        ),
        backgroundColor: bgColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: borderColor.withValues(alpha: 0.5)),
        ),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category) {
    return InkWell(
      onTap: () => _showToast('Danh mục: ${category['title']}'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: category['color'],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(category['icon'], color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(category['title'], style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(category['subtitle'], style: const TextStyle(color: Colors.grey, fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white24, size: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A), // Slightly deep dark blue/black theme like image
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        title: const Text('Trợ giúp & phản hồi', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white), 
            onPressed: () {
              setState(() {
                _isSearchVisible = !_isSearchVisible;
              });
            },
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(icon: const Icon(Icons.notifications_none, color: Colors.white), onPressed: () {}),
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                  child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF1E3A8A).withValues(alpha: 0.3), const Color(0xFF4C1D95).withValues(alpha: 0.3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.circle, color: Colors.red, size: 6),
                        SizedBox(width: 4),
                        Text('Trung tâm hỗ trợ', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Xin chào!', style: TextStyle(color: Colors.blueAccent, fontSize: 24, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  const Text('Chúng tôi có thể giúp gì cho bạn?', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Bạn gặp vấn đề hoặc cần hỗ trợ? Hãy tìm câu trả lời nhanh chóng hoặc gửi yêu cầu cho chúng tôi.', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                  if (_isSearchVisible) ...[
                    const SizedBox(height: 16),
                    // Search Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF161618),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search, color: Colors.grey, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'Nhập từ khóa câu hỏi của bạn...',
                                hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                                border: InputBorder.none,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            decoration: const BoxDecoration(
                              color: Colors.blueAccent,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.search, color: Colors.white, size: 16),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Suggestions
                    Row(
                      children: [
                        const Text('Gợi ý tìm kiếm:', style: TextStyle(color: Colors.grey, fontSize: 11)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: ['tài khoản', 'kết nối', 'bản quyền', 'VIP'].map((e) {
                                return Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.05),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                                  ),
                                  child: Text(e, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Categories
            const Text('Danh mục hỗ trợ', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Chọn danh mục phù hợp để tìm kiếm câu trả lời nhanh hơn.', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 2.5, // width / height
              ),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                return _buildCategoryCard(_categories[index]);
              },
            ),
            const SizedBox(height: 32),

            // FAQs
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Câu hỏi thường gặp', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Những câu hỏi phổ biến nhất từ cộng đồng', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                  ],
                ),
                TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AllFaqsScreen(faqs: _faqs))),
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.blueAccent.withValues(alpha: 0.1),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Xem tất cả câu hỏi →', style: TextStyle(color: Colors.blueAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_isLoadingFaqs)
              const Center(child: CircularProgressIndicator(color: Colors.blueAccent))
            else if (_faqs.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: Text('Chưa có câu hỏi thường gặp nào.', style: TextStyle(color: Colors.grey))),
              )
            else
              ..._faqs.take(5).toList().asMap().entries.map((entry) {
                final idx = entry.key;
                final faq = entry.value;
                final isExpanded = _expandedFaqIndex == idx;
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF161618),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                  ),
                  child: Theme(
                    data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      onExpansionChanged: (expanded) {
                        setState(() {
                          _expandedFaqIndex = expanded ? idx : null;
                        });
                      },
                      initiallyExpanded: isExpanded,
                      title: Text(faq['question'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      iconColor: Colors.blueAccent,
                      collapsedIconColor: Colors.white24,
                      childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                      children: [
                        Text(faq['answer'] ?? '', style: TextStyle(color: Colors.grey.shade400, fontSize: 12, height: 1.5)),
                      ],
                    ),
                  ),
                );
              }),
            const SizedBox(height: 32),

            // Support Form
            const Text('Gửi yêu cầu hỗ trợ', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Không tìm thấy câu trả lời? Hãy gửi yêu cầu cho chúng tôi, đội ngũ hỗ trợ sẽ phản hồi sớm nhất.', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.only(top: 20, bottom: 20,),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: const TextSpan(
                      text: 'Phân loại vấn đề ',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                      children: [TextSpan(text: '*', style: TextStyle(color: Colors.red))],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF161618),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedIssue,
                        isExpanded: true,
                        dropdownColor: const Color(0xFF161618),
                        icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        items: _categories.map((c) => DropdownMenuItem<String>(
                          value: c['id'],
                          child: Text(c['title']),
                        )).toList(),
                        onChanged: (val) => setState(() => _selectedIssue = val),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  RichText(
                    text: const TextSpan(
                      text: 'Mô tả chi tiết ',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                      children: [TextSpan(text: '*', style: TextStyle(color: Colors.red))],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF161618),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: TextField(
                      controller: _contentController,
                      maxLines: 5,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Vui lòng mô tả chi tiết vấn đề bạn gặp phải...',
                        hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text('0/2000', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                  ),
                  const SizedBox(height: 16),
                  const Text('Đính kèm hình ảnh (tùy chọn, tối đa 5 ảnh)', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  if (_attachments.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: List.generate(_attachments.length, (index) {
                        return Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(
                                  image: NetworkImage(
                                    _attachments[index].startsWith('http') 
                                      ? _attachments[index] 
                                      : '${AppConstants.apiUrl.replaceAll('/api', '')}${_attachments[index]}'
                                  ),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: -4,
                              right: -4,
                              child: InkWell(
                                onTap: () => _removeAttachment(index),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, color: Colors.white, size: 12),
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_attachments.length < 5)
                    InkWell(
                      onTap: _isUploadingImage ? null : _pickAndUploadImages,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF161618),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.3), style: BorderStyle.solid),
                        ),
                        child: Column(
                          children: [
                            if (_isUploadingImage)
                              const CircularProgressIndicator(color: Colors.blueAccent)
                            else ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blueAccent.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.cloud_upload_outlined, color: Colors.blueAccent, size: 28),
                              ),
                              const SizedBox(height: 12),
                              const Text('Bấm để chọn hình ảnh', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              const SizedBox(height: 8),
                              const Text('Hỗ trợ JPG, PNG, GIF (tối đa 5MB mỗi file)', style: TextStyle(color: Colors.grey, fontSize: 10)),
                            ],
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submitFeedback,
                      icon: _isSubmitting 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.send_rounded, color: Colors.white, size: 16),
                      label: Text(_isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU HỖ TRỢ', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        elevation: 0,
                        disabledBackgroundColor: Colors.blueAccent.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Sidebar / Extra Info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF161618),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Thông tin hỗ trợ', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Hãy liên hệ qua các kênh dưới đây nếu cần hỗ trợ khẩn cấp.', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, height: 1.5)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.blueAccent.withValues(alpha: 0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.mail_outline, color: Colors.blueAccent, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Email hỗ trợ', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('support@videoplatform.com', style: TextStyle(color: Colors.blueAccent, fontSize: 12)),
                          Text('Phản hồi trong 24h', style: TextStyle(color: Colors.grey, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.chat_bubble_outline, color: Colors.green, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Trò chuyện trực tuyến', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('Chat với nhân viên hỗ trợ', style: TextStyle(color: Colors.grey, fontSize: 11)),
                          Text('Thứ 2 - Chủ nhật: 8:00 - 22:00', style: TextStyle(color: Colors.grey, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), shape: BoxShape.circle),
                        child: const Icon(Icons.phone_outlined, color: Colors.orange, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Hotline', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('1900 1234', style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.w600)),
                          Text('Thứ 2 - Chủ nhật: 8:00 - 22:00', style: TextStyle(color: Colors.grey, fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Community
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF6B21A8), const Color(0xFF312E81)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Cộng đồng VideoSharing', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Tham gia cộng đồng để nhận hỗ trợ nhanh hơn từ người dùng khác.', style: TextStyle(color: Colors.grey.shade300, fontSize: 12, height: 1.5)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _showToast('Tham gia cộng đồng...'),
                      icon: const Icon(Icons.people_alt_outlined, color: Colors.blueAccent, size: 18),
                      label: const Text('Tham gia ngay', style: TextStyle(color: Colors.blueAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Tips
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF161618),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb, color: Colors.amber, size: 20),
                      const SizedBox(width: 8),
                      const Text('Mẹo nhỏ', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTipItem('Mô tả chi tiết vấn đề để được hỗ trợ nhanh hơn.'),
                  const SizedBox(height: 8),
                  _buildTipItem('Đính kèm hình ảnh giúp chúng tôi hiểu rõ hơn.'),
                  const SizedBox(height: 8),
                  _buildTipItem('Kiểm tra câu hỏi thường gặp trước khi gửi.'),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.check_circle_outline, color: Colors.deepOrangeAccent, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: TextStyle(color: Colors.grey.shade400, fontSize: 12, height: 1.4))),
      ],
    );
  }
}

enum _ToastType { success, error, warning }

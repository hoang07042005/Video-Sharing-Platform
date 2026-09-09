import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:math';
import 'package:video_sharing_platform_app/services/video_service.dart';
import 'livestream_studio_screen.dart';

class LivestreamForm extends StatefulWidget {
  const LivestreamForm({super.key});

  @override
  State<LivestreamForm> createState() => _LivestreamFormState();
}

class _LivestreamFormState extends State<LivestreamForm> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _tagsCtrl = TextEditingController();
  bool _isCreating = false;
  String _error = '';
  File? _thumbnailFile;
  int? _categoryId;
  List<dynamic> _categories = [];
  bool _categoriesLoading = true;

  static const _accent = Color(0xFFFF3B5C);
  static const _page = Color(0xFF0F0F0F);
  static const _cardColor = Color(0xFF141418);
  static const _field = Color.fromARGB(88, 42, 43, 44);

  @override
  void initState() {
    super.initState();
    _titleCtrl.addListener(_refreshPreview);
    _descCtrl.addListener(_refreshPreview);
    _tagsCtrl.addListener(_refreshPreview);
    _fetchCategories();
  }

  void _refreshPreview() {
    if (mounted) setState(() {});
  }

  Future<void> _fetchCategories() async {
    try {
      final data = await VideoService.getCategories();
      if (mounted) {
        final normalizedCategories = data
            .whereType<Map>()
            .map((item) {
              final rawId = item['id'] ?? item['Id'];
              final id = rawId is int ? rawId : int.tryParse('$rawId');
              return <String, dynamic>{
                'id': id,
                'name': (item['name'] ?? item['Name'] ?? '').toString(),
              };
            })
            .where((item) => item['id'] != null)
            .toList();
        setState(() {
          _categories = normalizedCategories;
          if (normalizedCategories.isNotEmpty) {
            _categoryId = normalizedCategories.first['id'] as int;
          }
          _categoriesLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _categoriesLoading = false);
    }
  }

  Future<void> _pickThumbnail() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _thumbnailFile = File(picked.path));
  }

  Future<void> _handleCreate() async {
    if (_titleCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Vui lòng nhập tiêu đề livestream.');
      return;
    }
    setState(() { _isCreating = true; _error = ''; });
    try {
      final channel = await VideoService.getMyChannel();
      final channelId = channel?['id']?.toString();
      if (channelId == null || channelId.isEmpty) {
        throw Exception('Bạn chưa có kênh. Vui lòng tạo kênh trước.');
      }

      var thumbnailUrl = '';
      if (_thumbnailFile != null) {
        thumbnailUrl = await VideoService.uploadImage(_thumbnailFile!);
      }

      final streamKey = _createStreamKey();
      final livestream = await VideoService.createLivestream(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        channelId: channelId,
        streamKey: streamKey,
        tags: _tagsCtrl.text.trim(),
        categoryId: _categoryId,
        thumbnailUrl: thumbnailUrl,
      );

      if (mounted) {
        final studioData = <String, dynamic>{
          ...livestream,
          'streamKey': streamKey,
          'title': _titleCtrl.text.trim(),
          'description': _descCtrl.text.trim(),
          'tags': _tagsCtrl.text.trim(),
          'categoryId': _categoryId,
          'thumbnailUrl': thumbnailUrl,
        };
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => LivestreamStudioScreen(livestream: studioData),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  String _createStreamKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  @override
  void dispose() {
    _titleCtrl.removeListener(_refreshPreview);
    _descCtrl.removeListener(_refreshPreview);
    _tagsCtrl.removeListener(_refreshPreview);
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _tagsCtrl.dispose();
    super.dispose();
  }

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(14)}) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(color: _cardColor, borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white12)),
      child: child,
    );
  }

  Widget _heading(IconData icon, String text, {Color color = _accent}) {
    return Row(children: [
      Icon(icon, size: 17, color: color),
      const SizedBox(width: 8),
      Text(text.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
    ]);
  }

  Widget _label(String text, {bool required = false, String? count}) {
    return Row(children: [
      Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
      if (required) const Text(' *', style: TextStyle(color: _accent)),
      if (count != null) ...[const Spacer(), Text(count, style: const TextStyle(color: Colors.white54, fontSize: 9))],
    ]);
  }

  InputDecoration _decoration(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
    filled: true,
    fillColor: _field,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.white12)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.white12)),
    focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10)), borderSide: BorderSide(color: _accent)),
  );

  Widget _buildFormCard() {
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _heading(Icons.edit_note, 'Thông tin livestream'), const SizedBox(height: 16),
      _label('Tiêu đề livestream', required: true, count: '${_titleCtrl.text.length}/100'), const SizedBox(height: 6),
      TextField(controller: _titleCtrl, maxLength: 100, style: const TextStyle(color: Colors.white, fontSize: 12), decoration: _decoration('Nhập tiêu đề livestream hấp dẫn...').copyWith(counterText: '')),
      const SizedBox(height: 12),
      _label('Mô tả (không bắt buộc)', count: '${_descCtrl.text.length}/500'), const SizedBox(height: 6),
      TextField(controller: _descCtrl, maxLines: 5, maxLength: 500, style: const TextStyle(color: Colors.white, fontSize: 12), decoration: _decoration('Nhập mô tả chi tiết về nội dung livestream...').copyWith(counterText: '')),
      const SizedBox(height: 12),
      _label('Danh mục'), const SizedBox(height: 6),
        _categoriesLoading
          ? const SizedBox(height: 46, child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: _accent)))
          : _categories.isEmpty
            ? const Text('Không tải được danh mục', style: TextStyle(color: Colors.white54, fontSize: 11))
            : _dropdown<int>(
              value: _categoryId,
              items: _categories
                .map((item) => DropdownMenuItem<int>(
                  value: item['id'] as int,
                  child: Text(item['name'] as String)))
                .toList(),
              onChanged: (value) => setState(() => _categoryId = value),
            ),
      const SizedBox(height: 12),
      _label('Tags (phân cách bằng dấu phẩy)', count: '${_tagsCtrl.text.length}/100'), const SizedBox(height: 6),
      TextField(controller: _tagsCtrl, maxLength: 100, style: const TextStyle(color: Colors.white, fontSize: 12), decoration: _decoration('Ví dụ: game, giải trí, hướng dẫn').copyWith(counterText: '')),
    ]));
  }

  Widget _dropdown<T>({required T? value, required List<DropdownMenuItem<T>> items, required ValueChanged<T?> onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: _field, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white12)),
      child: DropdownButtonHideUnderline(child: DropdownButton<T>(value: value, isExpanded: true, dropdownColor: const Color(0xFF252836), style: const TextStyle(color: Colors.white, fontSize: 12), hint: const Text('Chọn danh mục phù hợp', style: TextStyle(color: Colors.white54, fontSize: 11)), items: items, onChanged: onChanged)),
    );
  }

  Widget _buildThumbnailCard() {
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _heading(Icons.auto_awesome, 'Hình thu nhỏ livestream', color: const Color(0xFFB77BFF)), const SizedBox(height: 12),
      GestureDetector(onTap: _pickThumbnail, child: Container(
        height: 145, width: double.infinity,
        decoration: BoxDecoration(color: _field, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white24, style: BorderStyle.solid)),
        child: _thumbnailFile == null ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.cloud_upload_outlined, color: Color(0xFFB77BFF), size: 28), const SizedBox(height: 8),
          const Text('Tải lên hình thu nhỏ', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4), const Text('JPG, PNG  •  Tối đa 5MB  •  1280x720px', style: TextStyle(color: Colors.white54, fontSize: 9)),
        ]) : ClipRRect(borderRadius: BorderRadius.circular(9), child: Image.file(_thumbnailFile!, fit: BoxFit.cover, width: double.infinity)),
      )),
    ]));
  }

  Widget _buildPreviewCard() {
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _heading(Icons.visibility_outlined, 'Xem trước', color: const Color(0xFF69B7FF)), const SizedBox(height: 12),
      AspectRatio(aspectRatio: 16 / 9, child: Stack(children: [
        Positioned.fill(child: _thumbnailFile == null ? Container(color: Colors.black, child: const Icon(Icons.image_outlined, color: Colors.white12, size: 32)) : Image.file(_thumbnailFile!, fit: BoxFit.cover)),
        Positioned(top: 8, left: 8, child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3), decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(4)), child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)))),
      ])),
      const SizedBox(height: 10),
      Row(children: [
        const CircleAvatar(radius: 17, backgroundColor: Color(0xFF352044), child: Icon(Icons.person_outline, color: Color(0xFFB77BFF), size: 18)), const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_titleCtrl.text.isEmpty ? 'Tiêu đề livestream' : _titleCtrl.text, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)), const SizedBox(height: 3), const Text('Kênh của bạn  ✓', style: TextStyle(color: Colors.white54, fontSize: 9))])),
      ]),
    ]));
  }

  Widget _statCard(IconData icon, String title, String line, Color color) {
    return Expanded(child: _card(padding: const EdgeInsets.all(10), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon, size: 17, color: color), const SizedBox(height: 8), Text(title, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(line, style: const TextStyle(color: Colors.white54, fontSize: 8))])));
  }

  Widget _buildTips() {
    return _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _heading(Icons.lightbulb_outline, 'Mẹo để có livestream thành công', color: Colors.orange), const SizedBox(height: 12),
      for (final tip in ['Tiêu đề hấp dẫn và mô tả rõ ràng', 'Chọn hình thu nhỏ chất lượng cao', 'Kiểm tra kết nối internet ổn định', 'Tương tác với khán giả thường xuyên']) Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [const Icon(Icons.check_circle, size: 14, color: Color(0xFFFF5C8A)), const SizedBox(width: 7), Expanded(child: Text(tip, style: const TextStyle(color: Colors.white60, fontSize: 9)))])),
    ]));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _page,
      appBar: AppBar(backgroundColor: _page, elevation: 0, leading: IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back, color: Colors.white)), title: const Text('Bắt đầu phát trực tiếp', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700))),
      body: SingleChildScrollView(padding: const EdgeInsets.fromLTRB(15, 8, 15, 100), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Container(width: 44, height: 44, decoration: BoxDecoration(color: const Color(0xFF42133E), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.radio, color: _accent)), const SizedBox(width: 10), const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Bắt đầu phát trực tiếp', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)), SizedBox(height: 3), Text('Tạo livestream mới để kết nối với khán giả của bạn', style: TextStyle(color: Colors.white54, fontSize: 9))]))]),
        const SizedBox(height: 16),
        if (_error.isNotEmpty) _card(child: Text(_error, style: const TextStyle(color: Colors.redAccent, fontSize: 11))),
        if (_error.isNotEmpty) const SizedBox(height: 12),
        _buildFormCard(), const SizedBox(height: 12), _buildThumbnailCard(), const SizedBox(height: 12), _buildPreviewCard(), const SizedBox(height: 12),
        Row(children: [_statCard(Icons.videocam_outlined, 'Chất lượng', 'Tối đa 1080p', Colors.blueAccent), const SizedBox(width: 8), _statCard(Icons.wifi, 'Kết nối', 'Tối thiểu 5 Mbps', Colors.greenAccent)]),
        const SizedBox(height: 8), Row(children: [_statCard(Icons.schedule, 'Thời lượng', 'Không giới hạn', Colors.orange), const SizedBox(width: 8), _statCard(Icons.people_outline, 'Khán giả', 'Không giới hạn', Colors.blueAccent)]),
        const SizedBox(height: 12), _buildTips(),
      ])),
      bottomNavigationBar: SafeArea(child: Container(color: _page, padding: const EdgeInsets.fromLTRB(15, 10, 15, 10), child: Row(children: [Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44), side: const BorderSide(color: Colors.white24), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: const Text('Hủy bỏ', style: TextStyle(color: Colors.white, fontSize: 11)))), const SizedBox(width: 10), Expanded(flex: 2, child: ElevatedButton(onPressed: _isCreating ? null : _handleCreate, style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44), backgroundColor: _accent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _isCreating ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Text('Tạo và bắt đầu livestream', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)), SizedBox(width: 5), Icon(Icons.wifi_tethering, color: Colors.white, size: 15)]))) ]))),
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:video_sharing_platform_app/services/video_service.dart';

// Form dùng chung cho cả Video thường và Shorts
// Truyền initialIsShort: true khi gọi từ tab Shorts
class UploadVideoForm extends StatefulWidget {
  final bool initialIsShort;
  const UploadVideoForm({super.key, this.initialIsShort = false});

  @override
  State<UploadVideoForm> createState() => _UploadVideoFormState();
}

class _UploadVideoFormState extends State<UploadVideoForm> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _visibility = 'Công khai';
  int? _categoryId;
  List<dynamic> _categories = [];
  bool _categoriesLoading = true;
  File? _videoFile;
  File? _thumbnailFile;
  bool _isUploading = false;
  bool _isShort = false;
  String _error = '';
  String _success = '';
  String _videoDuration = '00:00';
  String _videoSize = '-';
  String _videoFormat = '-';

  final ScrollController _scrollController = ScrollController();
  int _currentStep = 1;
  final GlobalKey _key1 = GlobalKey();
  final GlobalKey _key2 = GlobalKey();
  final GlobalKey _key3 = GlobalKey();
  final GlobalKey _key4 = GlobalKey();


  @override
  void initState() {
    super.initState();
    _isShort = widget.initialIsShort;
    _titleCtrl.addListener(() => setState(() {}));
    _descCtrl.addListener(() => setState(() {}));
    _fetchCategories();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateCurrentStep());
  }

  void _onScroll() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateCurrentStep());
  }

  void _updateCurrentStep() {
    if (!mounted || !_scrollController.hasClients) return;

    final viewportContext = _scrollController.position.context.storageContext;
    final viewportObject = viewportContext.findRenderObject();
    if (viewportObject is! RenderBox) return;

    final viewportTop = viewportObject.localToGlobal(Offset.zero).dy;
    // Keep the active step as soon as its section reaches the upper part of
    // the scroll area, below the fixed progress header.
    final threshold = viewportTop + 80;
    final y2 = _getSectionY(_key2);
    final y3 = _getSectionY(_key3);
    final y4 = _getSectionY(_key4);

    final position = _scrollController.position;
    final isNearBottom = position.pixels >= position.maxScrollExtent - 24;

    var newStep = 1;
    if (isNearBottom || (y4 != null && y4 <= threshold)) {
      newStep = 4;
    } else if (y3 != null && y3 <= threshold) {
      newStep = 3;
    } else if (y2 != null && y2 <= threshold) {
      newStep = 2;
    }

    if (newStep != _currentStep) {
      setState(() => _currentStep = newStep);
    }
  }

  double? _getSectionY(GlobalKey key) {
    final context = key.currentContext;
    final renderObject = context?.findRenderObject();
    if (renderObject is RenderBox && renderObject.hasSize) {
      return renderObject.localToGlobal(Offset.zero).dy;
    }
    return null;
  }


  Future<void> _fetchCategories() async {
    try {
      final data = await VideoService.getCategories();
      if (mounted) {
        setState(() {
          _categories = data;
          if (data.isNotEmpty) {
            _categoryId = data[0]['id'];
          }
          _categoriesLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _categoriesLoading = false);
    }
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) {
      final file = File(picked.path);

      // Calculate format
      final format = picked.path.split('.').last.toUpperCase();

      // Calculate size
      final bytes = await file.length();
      String sizeStr;
      if (bytes < 1024 * 1024) {
        sizeStr = '${(bytes / 1024).toStringAsFixed(1)} KB';
      } else {
        sizeStr = '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
      }

      // Calculate duration
      String durationStr = '00:00';
      try {
        final controller = VideoPlayerController.file(file);
        await controller.initialize();
        final duration = controller.value.duration;
        final minutes = duration.inMinutes.toString().padLeft(2, '0');
        final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
        durationStr = '$minutes:$seconds';
        controller.dispose();
      } catch (_) {}

      setState(() {
        _videoFile = file;
        _videoFormat = format;
        _videoSize = sizeStr;
        _videoDuration = durationStr;
        _error = '';
      });
    }
  }

  Future<void> _pickThumbnail() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _thumbnailFile = File(picked.path));
    }
  }

  Future<void> _handleUpload() async {
    if (_titleCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Vui lòng nhập tiêu đề.');
      return;
    }
    if (_videoFile == null) {
      setState(() => _error = 'Vui lòng chọn video.');
      return;
    }
    if (_thumbnailFile == null) {
      setState(() => _error = 'Vui lòng chọn ảnh bìa.');
      return;
    }

    setState(() {
      _isUploading = true;
      _error = '';
      _success = '';
    });

    try {
      await VideoService.uploadVideo(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        visibility: _isShort ? 'Công khai' : _visibility,
        isShort: _isShort,
        videoFile: _videoFile!,
        thumbnailFile: _thumbnailFile,
        categoryId: _categoryId,
      );
      setState(() {
        _success = _isShort
            ? 'Đã tải Shorts lên thành công!'
            : 'Đã tải video lên thành công!';
        _titleCtrl.clear();
        _descCtrl.clear();
        _videoFile = null;
        _thumbnailFile = null;
        _videoDuration = '00:00';
        _videoSize = '-';
        _videoFormat = '-';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isUploading = false);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Color get _accentColor =>
      _isShort ? const Color(0xFFFF3B5C) : Colors.blueAccent;

  String get _fileName =>
      _videoFile != null ? _videoFile!.path.split(RegExp(r'[/\\]')).last : '-';

  String get _thumbName => _thumbnailFile != null
      ? _thumbnailFile!.path.split(RegExp(r'[/\\]')).last
      : '-';

  Widget _sectionCard({
    required Widget child,
    EdgeInsets padding = const EdgeInsets.all(14),
    Color color = const Color(0xFF121A29),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color.fromARGB(95, 80, 80, 80)),
      ),
      child: child,
    );
  }

  Widget _sectionTitle(IconData icon, String title, {String? trailing}) {
    return Row(
      children: [
        Icon(icon, color: _accentColor, size: 17),
        const SizedBox(width: 8),
        Text(title.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: .2,
            )),
        if (trailing != null) ...[
          const Spacer(),
          Text(trailing,
              style: const TextStyle(color: Colors.white54, fontSize: 10)),
        ],
      ],
    );
  }

  Widget _fieldLabel(String label, {String? counter, bool required = false}) {
    return Row(
      children: [
        Text(label.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            )),
        if (required)
          const Text(' *', style: TextStyle(color: Color(0xFFFF6680))),
        if (counter != null) ...[
          const Spacer(),
          Text(counter,
              style: const TextStyle(color: Colors.white54, fontSize: 9)),
        ],
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color.fromARGB(255, 118, 118, 118), fontSize: 12),
      filled: true,
      fillColor: const Color.fromARGB(88, 42, 43, 44),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color.fromARGB(86, 118, 118, 118), width: 0.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color.fromARGB(86, 118, 118, 118), width: 0.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: _accentColor),
      ),
    );
  }

  // ─── Preview Panel ───
  Widget _buildPreviewPanel() {
    final title = _titleCtrl.text.trim();
    final desc = _descCtrl.text.trim();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F0F0F),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
            child: _sectionTitle(
                Icons.video_library_outlined, 'Xem trước video',
                trailing: '● Bản xem trước'),
          ),
          _isShort
              ? _buildShortPreview(title, desc)
              : _buildVideoPreview(title, desc),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(children: [
              const Icon(Icons.tune, color: Colors.white38, size: 13),
              const SizedBox(width: 5),
              const Text('THÔNG SỐ KỸ THUẬT',
                  style: TextStyle(color: Colors.white70, fontSize: 10)),
              const Spacer(),
              const Text('Hệ thống tự nhận diện',
                  style: TextStyle(color: Colors.white30, fontSize: 9)),
            ]),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Column(
              children: [
                _metricChip(Icons.circle, 'Trạng thái', _visibility,
                    Colors.greenAccent),
                _metricChip(Icons.timer_outlined, 'Độ dài', _videoDuration,
                    Colors.white70),
                _metricChip(Icons.video_file_outlined, 'Định dạng',
                    _videoFormat, Colors.white70),
                _metricChip(Icons.sd_storage_outlined, 'Kích thước', _videoSize,
                    Colors.white70),
                _metricChip(Icons.movie_outlined, 'Tệp video',
                    _videoFile == null ? '-' : _fileName, Colors.white70),
                _metricChip(Icons.image_outlined, 'Tệp ảnh thu nhỏ',
                    _thumbnailFile == null ? '-' : _thumbName, Colors.white70),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],
      ),
    );
  }

  Widget _buildVideoPreview(String title, String desc) {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 12, 14, 0),
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          _previewThumbnail(width: 160, height: 100),
          const SizedBox(width: 10),
          Expanded(child: _previewText(title, desc, _visibility)),
        ],
      ),
    );
  }

  Widget _buildShortPreview(String title, String desc) {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 12, 14, 0),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF17111A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFF3B5C).withValues(alpha: .35)),
      ),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              _previewThumbnail(width: 96, height: 150),
              Positioned(
                top: 7,
                left: 7,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF3B5C),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('SHORTS', style: TextStyle(
                    color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800,
                  )),
                ),
              ),
              const Icon(Icons.play_circle_outline, color: Colors.white70, size: 32),
            ],
          ),
          const SizedBox(width: 10),
          Expanded(child: _previewText(title, desc, 'Công khai', accent: const Color(0xFFFF6680))),
        ],
      ),
    );
  }

  Widget _previewThumbnail({required double width, required double height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color.fromARGB(88, 42, 43, 44),
        borderRadius: BorderRadius.circular(9),
        image: _thumbnailFile == null
            ? null
            : DecorationImage(image: FileImage(_thumbnailFile!), fit: BoxFit.cover),
      ),
      child: _thumbnailFile == null
          ? const Icon(Icons.play_circle_outline, color: Colors.white60, size: 34)
          : null,
    );
  }

  Widget _previewText(String title, String desc, String visibility, {Color accent = Colors.white70}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.isEmpty ? 'Tiêu đề video' : title, maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(color: title.isEmpty ? Colors.white54 : Colors.white,
            fontSize: 12, fontWeight: FontWeight.w700)),
        const SizedBox(height: 5),
        Text('Bạn  •  $visibility', style: TextStyle(color: accent, fontSize: 10)),
        const SizedBox(height: 6),
        const Text('0 lượt xem  •  Vừa xong', style: TextStyle(color: Colors.white38, fontSize: 9)),
        const SizedBox(height: 8),
        Text(desc.isEmpty ? 'Chưa có mô tả nào.' : desc, maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white54, fontSize: 10, height: 1.35)),
      ],
    );
  }

  Widget _metricChip(IconData icon, String label, String value, Color color) {
    return Container(
      width: double.infinity,
      // margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Icon(icon, size: 12, color: Colors.white38),
        const SizedBox(width: 5),
        Expanded(
            child: Text(label,
                style: const TextStyle(color: Colors.white60, fontSize: 10))),
        const SizedBox(width: 12),
        Flexible(
            child: Text(value,
                softWrap: true,
                textAlign: TextAlign.right,
                style: TextStyle(
                    color: color, fontSize: 9, fontWeight: FontWeight.w600))),
      ]),
    );
  }

  // ─── Dropdown helper ───
  Widget _styledDropdown<T>({
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
    Color backgroundColor = const Color.fromARGB(88, 42, 43, 44),
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          dropdownColor: const Color(0xFF0F0F0F),
          isExpanded: true,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildUploadLayout() {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
        ),
        titleSpacing: 10,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_isShort ? 'Tải Shorts lên' : 'Tải video lên',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              )),
          const Text('Studio Sáng Tạo Mobile',
              style: TextStyle(color: Colors.white54, fontSize: 9)),
        ]),
  
      ),
      body: Column(children: [
        _buildProgress(),
        Expanded(
            child: SingleChildScrollView(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(15, 14, 15, 100),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (_error.isNotEmpty)
              _buildAlertBox(_error, Icons.error_outline, Colors.redAccent),
            if (_success.isNotEmpty)
              _buildAlertBox(
                  _success, Icons.check_circle_outline, Colors.greenAccent),
            Container(key: _key1, child: _buildMediaCard()),
            const SizedBox(height: 12),
            Container(key: _key2, child: _buildPreviewPanel()),
            const SizedBox(height: 18),
            Container(key: _key3, child: _buildDetailsCard()),
            const SizedBox(height: 18),
            Container(key: _key4, child: _buildPublishCard()),
            const SizedBox(height: 12),
            _buildShortToggle(),
          ]),
        )),
      ]),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  Widget _buildProgress() {
    return Container(
      padding: const EdgeInsets.fromLTRB(15, 0, 15, 12),
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0xFF172131)))),
      child: Row(children: [
        _buildProgressStep(1, 'Tải lên phương tiện'),
        _buildProgressDivider(1),
        _buildProgressStep(2, 'Xem trước video'),
        _buildProgressDivider(2),
        _buildProgressStep(3, 'Thông tin chi tiết'),
        _buildProgressDivider(3),
        _buildProgressStep(4, 'Cài dặt xuất bản & Tùy chọn'),
      ]),
    );
  }

  Widget _buildProgressStep(int step, String title) {
    bool isActive = _currentStep == step;
    bool isPassed = _currentStep > step;
    Color color = (isActive || isPassed) ? _accentColor : const Color(0xFF121923);
    Color textColor = (isActive || isPassed) ? Colors.white : Colors.white54;
    return Row(
      children: [
        Container(
          width: 17,
          height: 17,
          alignment: Alignment.center,
          decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: isActive || isPassed ? _accentColor : Colors.white24)),
          child: Text(step.toString(),
              style: TextStyle(color: textColor, fontSize: 9)),
        ),
        if (isActive) ...[
          const SizedBox(width: 6),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
        ]
      ],
    );
  }

  Widget _buildProgressDivider(int step) {
    bool isPassed = _currentStep > step;
    return Expanded(
      child: Container(
        height: 1,
        margin: const EdgeInsets.symmetric(horizontal: 7),
        color: isPassed ? _accentColor : const Color(0xFF172131),
      ),
    );
  }

  Widget _buildMediaCard() {
    return _sectionCard(
      color: const Color(0xFF0F0F0F),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.folder_copy_outlined, 'Tải lên phương tiện'),
      const SizedBox(height: 18),
      _fieldLabel('Video', required: true),
      const SizedBox(height: 4),
      Text(
          _isShort
              ? 'MP4, MOV. Tỷ lệ 9:16, tối đa 60s.'
              : 'MP4, MOV, AVI, WebM\nTối đa 10GB',
          style: const TextStyle(
              color: Colors.white54, fontSize: 10, height: 1.4)),
      const SizedBox(height: 8),
      GestureDetector(
          onTap: _pickVideo,
          child: Container(
              height: 136,
              width: double.infinity,
              decoration: BoxDecoration(
                 color: const Color.fromARGB(88, 42, 43, 44),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: _videoFile == null
                          ? const Color.fromARGB(247, 71, 71, 71)
                          : _accentColor,
                      width: 0.5)),
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                        _videoFile == null
                            ? Icons.video_camera_back_outlined
                            : Icons.check_circle_outline,
                        color: _videoFile == null
                            ? _accentColor
                            : _accentColor,
                        size: 27),
                    const SizedBox(height: 7),
                    Text(
                        _videoFile == null
                            ? 'Kéo và thả video vào đây'
                            : _fileName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 11)),
                    if (_videoFile == null) ...[
                      const Text('hoặc',
                          style: TextStyle(color: Colors.white38, fontSize: 9)),
                      const SizedBox(height: 5),
                      Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                              color: _accentColor,
                              borderRadius: BorderRadius.circular(15)),
                          child: const Text('+  Chọn file để tải lên',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700))),
                    ],
                  ]))),
      const SizedBox(height: 18),
      _fieldLabel('Ảnh thu nhỏ', required: true),
      const SizedBox(height: 4),
      const Text('Khuyến dùng 16:9 hoặc 9:16',
          style: TextStyle(color: Colors.white54, fontSize: 10)),
      const SizedBox(height: 8),
      GestureDetector(
          onTap: _pickThumbnail,
          child: Container(
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                  color: const Color.fromARGB(88, 42, 43, 44),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white12, width: 0.5)),
              child: Row(children: [
                Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                        color: const Color.fromARGB(88, 42, 43, 44),
                        borderRadius: BorderRadius.circular(8)),
                    child: Icon(Icons.image_outlined,
                        color: _accentColor, size: 17)),
                const SizedBox(width: 9),
                Expanded(
                    child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      const Text('Tải ảnh lên',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600)),
                      Text(
                          _thumbnailFile == null
                              ? 'JPG, PNG, WebP  •  Tải ảnh bìa'
                              : _thumbName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white54, fontSize: 9)),
                    ])),
                Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                        color: const Color(0xFF242C38),
                        borderRadius: BorderRadius.circular(8)),
                    child: const Text('⌃  Duyệt ảnh',
                        style: TextStyle(color: Colors.white, fontSize: 9))),
              ]))),
    ]));
  }

  Widget _buildDetailsCard() {
    return _sectionCard(
      color: const Color(0xFF0F0F0F),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.edit_note, 'Thông tin chi tiết'),
      const SizedBox(height: 14),
      _fieldLabel('Tiêu đề',
          counter: '${_titleCtrl.text.length}/100', required: true),
      const SizedBox(height: 6),
      TextField(
          controller: _titleCtrl,
          maxLength: 100,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          decoration: _inputDecoration('Nhập tiêu đề video của bạn')
              .copyWith(counterText: '')),
      const SizedBox(height: 12),
      _fieldLabel('Mô tả', counter: '${_descCtrl.text.length}/5000'),
      const SizedBox(height: 6),
      TextField(
        controller: _descCtrl,
        minLines: 6, // Số dòng tối thiểu hiển thị ngay từ đầu (tăng chiều cao ban đầu)
        maxLines: 8, // Số dòng tối đa trước khi cuộn
        maxLength: 5000,
        style: const TextStyle(color: Colors.white, fontSize: 12),
        decoration: _inputDecoration(
          'Giới thiệu nội dung video của bạn với người xem...',
        ).copyWith(counterText: ''),
      ),
      const SizedBox(height: 12),
      _fieldLabel('Danh mục'),
      const SizedBox(height: 6),
      _categoriesLoading
          ? const SizedBox(
              height: 45,
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
          : _styledDropdown<int>(
              value: _categoryId ??
                  (_categories.isNotEmpty ? _categories.first['id'] : null),
              items: _categories
                  .map((c) => DropdownMenuItem<int>(
                      value: c['id'], child: Text(c['name']?.toString() ?? '')))
                  .toList(),
              onChanged: (v) => setState(() => _categoryId = v ?? _categoryId)),
    ]));
  }

  Widget _buildPublishCard() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle(Icons.tune, 'Cài đặt xuất bản & tùy chọn'),
      const SizedBox(height: 12),
      _sectionCard(
        color: const Color(0xFF0F0F0F),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _fieldLabel('Trạng thái hiển thị', required: true),
        const SizedBox(height: 4),
        const Text('Chọn ai có thể xem video này',
            style: TextStyle(color: Colors.white54, fontSize: 10)),
        const SizedBox(height: 8),
        _styledDropdown<String>(
            value: _visibility,
            items: [
              _visibilityItem('Công khai', Icons.public,
                  'Mọi người đều có thể xem video này'),
              _visibilityItem('Riêng tư', Icons.lock_outline,
                  'Chỉ dành cho hội viên của kênh'),
            ],
            onChanged: (v) => setState(() => _visibility = v ?? 'Công khai')),
      ])),
    ]);
  }

  Widget _buildShortToggle() {
    return GestureDetector(
        onTap: () => setState(() => _isShort = !_isShort),
        child: _sectionCard(
          color: const Color(0xFF0F0F0F),
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Icon(Icons.bolt,
                  color: _isShort ? const Color(0xFFFF4D78) : Colors.white54,
                  size: 20),
              const SizedBox(width: 9),
              const Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text('Đánh dấu là Video ngắn (Shorts)',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700)),
                    Text('Tối ưu cho hiển thị bằng tin ngắn',
                        style: TextStyle(color: Colors.white54, fontSize: 9)),
                  ])),
              Switch(
                  value: _isShort,
                  onChanged: (value) => setState(() => _isShort = value),
                  activeColor: const Color(0xFFFF4D78)),
            ])));
  }

  Widget _buildBottomActions() {
    return SafeArea(
        child: Container(
            color: const Color(0xFF0F0F0F),
            padding: const EdgeInsets.fromLTRB(15, 10, 15, 10),
            child: Row(children: [
              Expanded(
                  child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 42),
                          side: const BorderSide(color: Colors.white24),
                          backgroundColor: const Color(0xFF0F0F0F),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                      child: const Text('Hủy',
                          style:
                              TextStyle(color: Colors.white, fontSize: 11)))),
              const SizedBox(width: 10),
              Expanded(
                  flex: 2,
                  child: ElevatedButton(
                      onPressed: _isUploading ? null : _handleUpload,
                      style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 42),
                          backgroundColor: _accentColor,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                      child: _isUploading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                  Text('Đăng video',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700)),
                                  SizedBox(width: 6),
                                  Icon(Icons.arrow_upward,
                                      color: Colors.white, size: 15),
                                ]))),
            ])));
  }

  @override
  Widget build(BuildContext context) {
    return _buildUploadLayout();
  }

  DropdownMenuItem<String> _visibilityItem(
      String value, IconData icon, String subtitle) {
    return DropdownMenuItem<String>(
      value: value,
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[400], size: 16),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(value,
                  style: const TextStyle(color: Colors.white, fontSize: 13)),
              Text(subtitle,
                  style: TextStyle(color: Colors.grey[600], fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAlertBox(String message, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(message,
                style: TextStyle(
                    color: color, fontSize: 14, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

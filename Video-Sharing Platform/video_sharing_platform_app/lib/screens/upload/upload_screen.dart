import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'upload_video_form.dart';
import 'upload_shorts_form.dart';
import 'livestream_form.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTab = 0;
  final ScrollController _tabScrollController = ScrollController();
  final List<GlobalKey> _tabKeys = List.generate(3, (_) => GlobalKey());

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging || _tabController.index != _currentTab) {
        setState(() => _currentTab = _tabController.index);
        _scrollTabToCenter(_tabController.index);
      }
    });
  }

  void _scrollTabToCenter(int index) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final keyContext = _tabKeys[index].currentContext;
      if (keyContext != null) {
        Scrollable.ensureVisible(
          keyContext,
          alignment: 0.5,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tabScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            _buildTabBar(),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [
                  _VideoUploadTab(),
                  _ShortsUploadTab(),
                  _LivestreamTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 20),
            ),
          ),
          const Spacer(),
          Column(
            children: [
              const Text(
                'Tạo nội dung',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Spacer(),
          Container(
            width: 36,
            height: 36,
            child: const Icon(Icons.settings_outlined,
                color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = [
      {'icon': Icons.video_camera_back_outlined, 'label': 'Tải video'},
      {'icon': Icons.bolt, 'label': 'Video ngắn'},
      {'icon': Icons.wifi_tethering, 'label': 'Livestream'},
    ];
    final activeColors = [
      Colors.white,
      const Color(0xFFFF3B5C),
      const Color(0xFF00CC77),
    ];
    final activeBgColors = [
      const Color(0xFF383838),
      const Color(0xFF3D1A22),
      const Color(0xFF0F2E1E),
    ];

    return SingleChildScrollView(
      controller: _tabScrollController,
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      child: Row(
        children: List.generate(3, (i) {
          final isActive = _currentTab == i;
          return Padding(
            key: _tabKeys[i],
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                _tabController.animateTo(i);
                _scrollTabToCenter(i);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                decoration: BoxDecoration(
                  color: isActive ? activeBgColors[i] : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: isActive
                      ? Border.all(color: activeColors[i].withValues(alpha: 0.4), width: 1)
                      : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (i == 2)
                      Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CC77),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF00CC77).withValues(alpha: 0.7),
                              blurRadius: 5,
                            )
                          ],
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(
                          tabs[i]['icon'] as IconData,
                          size: 14,
                          color: isActive ? activeColors[i] : Colors.grey[500],
                        ),
                      ),
                    AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 280),
                      style: TextStyle(
                        color: isActive ? activeColors[i] : Colors.grey[500],
                        fontSize: 13,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                      ),
                      child: Text(tabs[i]['label'] as String),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

}

// ─────────────────────────────────────────────
// TAB 1: TẢI VIDEO
// ─────────────────────────────────────────────
class _VideoUploadTab extends StatelessWidget {
  const _VideoUploadTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview Card
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D26),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08), width: 0.5),
            ),
            child: Stack(
              children: [
                // Top labels
                Positioned(
                  top: 12,
                  left: 12,
                  child: Row(
                    children: [
                      _BadgeDot(color: Colors.redAccent, label: 'REC'),
                      const SizedBox(width: 8),
                      _MiniBadge(label: '4K UHD'),
                    ],
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Row(
                    children: [
                      _MiniBadge(label: '60 FPS'),
                      const SizedBox(width: 6),
                      _MiniBadge(label: 'LOG'),
                    ],
                  ),
                ),
                // Center icon
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFF252836),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white24, width: 0.5),
                        ),
                        child: const Icon(Icons.upload_rounded,
                            color: Colors.white70, size: 28),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Tải video lên',
                        style: TextStyle(color: Colors.grey[400], fontSize: 12),
                      ),
                    ],
                  ),
                ),
                // Bottom labels
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: Text('MP4 / MOV / AVI / WEBM',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Text('TỐI ĐA 100MB / 2GB / 10GB',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Tags
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Tag(label: 'HỖ TRỢ LÊN ĐẾN 4K', color: Colors.blueAccent),
              _Tag(label: 'Vlog + Podcast', color: Colors.white24),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Tải video tiêu chuẩn',
            style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                height: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            'Tối ưu cho video dài, vlog và tài liệu. Đi kèm bộ công cụ phân tích chuyên sâu, tạo thumbnail tùy chỉnh và tự động dịch phụ đề AI.',
            style:
                TextStyle(color: Colors.grey[500], fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 16),
          // Stats Row
          Row(
            children: [
              Expanded(
                child: _StatCard(
                    label: 'DUNG LƯỢNG', value: 'Theo gói (Tối đa 10GB)'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                    label: 'ĐỊNH DẠNG', value: 'MP4, MOV, AVI, WMV...'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // CTA Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const UploadVideoForm())),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Chọn video từ thiết bị',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // ── Điều kiện tải video lên ──
          _SectionTitle(title: 'Điều kiện tải video lên'),
          const SizedBox(height: 10),
          _FeatureItem(
            icon: Icons.video_file_outlined,
            title: 'Định dạng hỗ trợ',
            subtitle: 'MP4, MOV, AVI, WEBM, WMV, FLV',
          ),
          _FeatureItem(
            icon: Icons.sd_storage_outlined,
            title: 'Dung lượng & Chất lượng',
            subtitle: 'Tối đa 10GB mỗi video, hỗ trợ độ phân giải lên đến 4K',
          ),
          _FeatureItem(
            icon: Icons.copyright_outlined,
            title: 'Bản quyền nội dung',
            subtitle: 'Chỉ tải lên video do bạn tự tạo hoặc có quyền sử dụng hợp pháp',
          ),
          _FeatureItem(
            icon: Icons.gavel_outlined,
            title: 'Nguyên tắc cộng đồng',
            subtitle: 'Nội dung không chứa bạo lực, khiêu dâm hoặc vi phạm pháp luật',
          ),
          const SizedBox(height: 20),
          // ── Quy trình xử lý ──
          _SectionTitle(title: 'Quy trình xử lý'),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D26),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              children: [
                _SettingRow(label: 'Trạng thái ban đầu', value: 'Riêng tư'),
                const Divider(color: Colors.white12, height: 20),
                _SettingRow(label: 'Kiểm duyệt tự động', value: '1-3 phút'),
                const Divider(color: Colors.white12, height: 20),
                _SettingRow(label: 'Xử lý HD/4K', value: 'Tùy dung lượng'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // ── Lưu ý quan trọng ──
          _TipCard(
            icon: Icons.info_outline,
            color: Colors.blueAccent,
            title: 'Lưu ý quan trọng',
            body:
                'Video của bạn sẽ hoàn toàn riêng tư và không ai có thể xem cho đến khi quá trình tải lên hoàn tất và bạn quyết định "Xuất bản".',
          ),
          const SizedBox(height: 24),
          const _PaginationDots(current: 0, total: 3),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// TAB 2: VIDEO NGẮN (SHORTS)
// ─────────────────────────────────────────────
class _ShortsUploadTab extends StatelessWidget {
  const _ShortsUploadTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview Card
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D26),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08), width: 0.5),
            ),
            child: Stack(
              children: [
                // Left/right bars like audio waveform
                Positioned(
                  left: 20,
                  top: 40,
                  child: _WaveBar(heights: [30, 50, 35, 60, 40]),
                ),
                Positioned(
                  right: 20,
                  top: 40,
                  child: _WaveBar(heights: [40, 55, 30, 65, 45]),
                ),
                // Top labels
                Positioned(
                  top: 12,
                  left: 12,
                  child: Row(
                    children: [
                      const Icon(Icons.music_note,
                          color: Colors.white54, size: 14),
                      Text(' Âm thanh V...',
                          style:
                              TextStyle(color: Colors.grey[500], fontSize: 11)),
                    ],
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome,
                          color: Colors.amberAccent, size: 14),
                      Text(' AR Filters',
                          style:
                              TextStyle(color: Colors.grey[400], fontSize: 11)),
                    ],
                  ),
                ),
                // Phone mockup center
                Center(
                  child: Container(
                    width: 90,
                    height: 160,
                    decoration: BoxDecoration(
                      color: const Color(0xFF252836),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white24, width: 1),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Timer
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('60S',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF3B5C),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                  color: const Color(0xFFFF3B5C)
                                      .withValues(alpha: 0.5),
                                  blurRadius: 12)
                            ],
                          ),
                          child: const Icon(Icons.bolt,
                              color: Colors.white, size: 20),
                        ),
                        const SizedBox(height: 6),
                        Text('9:16 SHORTS',
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 8)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFFFF3B5C).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('Remix Hot  LIVE',
                              style: TextStyle(
                                  color: Color(0xFFFF3B5C), fontSize: 8)),
                        ),
                      ],
                    ),
                  ),
                ),
                // Bottom labels
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: Text('• TỶ LỆ DỌC 9:16',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Text('TỐI ĐA 60S',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Tag(label: 'TỐI ĐA 60 GIÂY', color: Colors.pinkAccent),
              _Tag(label: 'TỶ LỆ DỌC 9:16', color: Colors.white24),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Tạo Video ngắn (Shorts)',
            style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                height: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            'Tải lên các đoạn video ngắn chuẩn dọc (9:16). Thích hợp để chia sẻ những khoảnh khắc nhanh chóng, hấp dẫn và dễ dàng lan truyền (viral).',
            style:
                TextStyle(color: Colors.grey[500], fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatCard(label: 'THỜI LƯỢNG', value: 'Tối đa 60 giây'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                    label: 'TỶ LỆ KHUNG HÌNH', value: 'Chuẩn dọc 9:16'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Primary CTA
          Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF3B5C), Color(0xFFFF6B6B)],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFF3B5C).withValues(alpha: 0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const UploadShortsForm())),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Chọn video Shorts tải lên',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15)),
                  SizedBox(width: 8),
                  Icon(Icons.upload_rounded, color: Colors.white, size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // ── Tính năng ──
          _SectionTitle(title: 'Tính năng tải Shorts'),
          const SizedBox(height: 10),
          _FeatureItem(
            icon: Icons.aspect_ratio_outlined,
            title: 'Tối ưu trải nghiệm dọc',
            subtitle: 'Hiển thị toàn màn hình, vuốt mượt mà không viền đen',
          ),
          _FeatureItem(
            icon: Icons.speed_outlined,
            title: 'Tải lên siêu tốc',
            subtitle: 'Xử lý video nhanh chóng, sẵn sàng phát trong vài giây',
          ),
          const SizedBox(height: 20),
          _TipCard(
            icon: Icons.trending_up,
            color: Colors.pinkAccent,
            title: 'Mẹo tăng viral',
            body:
                'Hãy đảm bảo video có chất lượng ánh sáng tốt, thời lượng súc tích (dưới 60s) và nội dung thu hút ngay từ 3 giây đầu tiên.',
          ),
          const SizedBox(height: 24),
          const _PaginationDots(current: 1, total: 3),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// TAB 3: LIVESTREAM
// ─────────────────────────────────────────────
class _LivestreamTab extends StatelessWidget {
  const _LivestreamTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview Card
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D26),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08), width: 0.5),
            ),
            child: Stack(
              children: [
                // Top labels
                Positioned(
                  top: 12,
                  left: 12,
                  child: Text('1080P • 60FPS',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Text('RTMP / WEB-RTC',
                      style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                ),
                // Center icon
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        alignment: Alignment.topRight,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: const Color(0xFF00CC77)
                                  .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: const Color(0xFF00CC77)
                                      .withValues(alpha: 0.4)),
                            ),
                            child: const Icon(Icons.wifi_tethering,
                                color: Color(0xFF00CC77), size: 32),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF3B5C),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('LIVE',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Độ trễ siêu thấp (<1s)',
                        style: TextStyle(color: Colors.grey[400], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _Tag(label: '• TRỰC TIẾP', color: const Color(0xFF00CC77)),
              const SizedBox(width: 8),
              _Tag(label: 'Đa luồng phát', color: Colors.white24),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Phát trực tiếp',
            style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                height: 1.2),
          ),
          const SizedBox(height: 8),
          Text(
            'Trò chuyện và kết nối thời gian thực với khán giả. Hỗ trợ phát đa kênh chất lượng Full HD 60fps, bình luận trực tiếp, bình chọn và nhận quà tặng.',
            style:
                TextStyle(color: Colors.grey[500], fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatCard(label: 'TƯƠNG TÁC', value: 'Chat & Quà tặng'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(label: 'BĂNG THÔNG', value: 'Không giới hạn'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00CC77), Color(0xFF00AA55)],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00CC77).withValues(alpha: 0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => const LivestreamForm())),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Thiết lập phòng Live',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15)),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded,
                      color: Colors.white, size: 18),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // ── Điều kiện livestream ──
          _SectionTitle(title: 'Điều kiện livestream'),
          const SizedBox(height: 10),
          _FeatureItem(
            icon: Icons.verified_user_outlined,
            title: 'Tài khoản đã xác minh',
            subtitle: 'Kênh cần được xác minh email và số điện thoại hợp lệ',
          ),
          _FeatureItem(
            icon: Icons.wifi_outlined,
            title: 'Kết nối ổn định',
            subtitle: 'Tốc độ upload tối thiểu 5 Mbps, khuyến nghị 10–20 Mbps',
          ),
          _FeatureItem(
            icon: Icons.gavel_outlined,
            title: 'Nguyên tắc cộng đồng',
            subtitle: 'Không phát nội dung bạo lực, 18+ hoặc vi phạm bản quyền',
          ),
          _FeatureItem(
            icon: Icons.schedule_outlined,
            title: 'Thời lượng',
            subtitle: 'Mỗi buổi live tối đa 12 tiếng, không giới hạn số lần phát',
          ),
          const SizedBox(height: 20),
          // ── Thông số kỹ thuật ──
          _SectionTitle(title: 'Thông số kỹ thuật'),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D26),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            ),
            child: Column(
              children: [
                _SettingRow(label: 'Chất lượng tối đa', value: 'Full HD 1080p / 60fps'),
                const Divider(color: Colors.white12, height: 20),
                _SettingRow(label: 'Giao thức hỗ trợ', value: 'RTMP, WebRTC'),
                const Divider(color: Colors.white12, height: 20),
                _SettingRow(label: 'Lưu lại sau live', value: 'Tự động (30 ngày)'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // ── Lưu ý quan trọng ──
          _TipCard(
            icon: Icons.info_outline,
            color: const Color(0xFF00CC77),
            title: 'Lưu ý trước khi live',
            body:
                'Video của bạn sẽ tự động được lưu lại sau khi kết thúc phát sóng. Bạn có thể xem lại, chỉnh sửa hoặc xóa video replay trong phần quản lý kênh.',
          ),
          const SizedBox(height: 24),
          const _PaginationDots(current: 2, total: 3),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// SHARED WIDGETS
// ─────────────────────────────────────────────

class _BadgeDot extends StatelessWidget {
  final Color color;
  final String label;
  const _BadgeDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: color.withValues(alpha: 0.7), blurRadius: 4)
              ]),
        ),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 10)),
      ],
    );
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  const _MiniBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(4),
      ),
      child:
          Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 10)),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;
  final Color color;
  const _Tag({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    final isWhite = color == Colors.white24;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isWhite ? Colors.white12 : color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
            color: isWhite ? Colors.white24 : color.withValues(alpha: 0.4),
            width: 0.5),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isWhite ? Colors.white70 : color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1D26),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.08), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _PaginationDots extends StatelessWidget {
  final int current;
  final int total;
  const _PaginationDots({required this.current, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(total, (i) {
        final isActive = i == current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: isActive ? 24 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: isActive ? Colors.white : Colors.grey[700],
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}

class _WaveBar extends StatefulWidget {
  final List<double> heights;
  const _WaveBar({required this.heights});

  @override
  State<_WaveBar> createState() => _WaveBarState();
}

class _WaveBarState extends State<_WaveBar> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(widget.heights.length, (index) {
        final h = widget.heights[index];
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            // Tạo độ lệch pha (stagger) giữa các cột
            double offset = (index / widget.heights.length) * 0.8;
            double value = _controller.value + offset;
            if (value > 1.0) {
              value -= 1.0;
            }
            // Tạo hiệu ứng sóng (sin wave)
            final sineValue = (math.sin(value * math.pi * 2) + 1) / 2;
            final currentHeight = 8.0 + (h - 8.0) * sineValue;

            // Màu xen kẽ theo index
            final colors = [
              const Color(0xFFFF3B5C),
              const Color(0xFFFF6B9D),
              const Color(0xFFFFB347),
              const Color(0xFFFF3B5C),
              const Color(0xFFFF8C69),
            ];
            final barColor = colors[index % colors.length].withValues(alpha: 0.6 + sineValue * 0.4);

            return Container(
              width: 4,
              height: currentHeight,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: barColor,
                borderRadius: BorderRadius.circular(2),
              ),
            );
          },
        );
      }),
    );
  }
}

// ─── Section Title ───
class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
              color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 8),
        Expanded(
            child: Divider(
                color: Colors.white.withValues(alpha: 0.08), height: 1)),
      ],
    );
  }
}

// ─── Feature Item ───
class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _FeatureItem(
      {required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, color: Colors.white60, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(
                        color: Colors.grey[500], fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Setting Row ───
class _SettingRow extends StatelessWidget {
  final String label;
  final String value;
  const _SettingRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 13)),
        Row(
          children: [
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, color: Colors.white38, size: 16),
          ],
        ),
      ],
    );
  }
}

// ─── Tip Card ───
class _TipCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String body;
  const _TipCard(
      {required this.icon,
      required this.color,
      required this.title,
      required this.body});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 0.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
                const SizedBox(height: 4),
                Text(body,
                    style: TextStyle(
                        color: Colors.grey[400], fontSize: 12, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

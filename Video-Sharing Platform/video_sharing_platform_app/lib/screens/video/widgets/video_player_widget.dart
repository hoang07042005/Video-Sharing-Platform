import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:async';
import '../../../../constants.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool autoPlay;
  final List<dynamic>? resolutions;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.autoPlay = true,
    this.resolutions,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget>
    with SingleTickerProviderStateMixin {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _showControls = true;
  Timer? _hideTimer;

  bool _showSkipLeft = false;
  bool _showSkipRight = false;
  
  late String _currentUrl;
  String _currentResolutionName = 'Tự động';
  double _currentPlaybackSpeed = 1.0;
  String _currentCaption = 'Tắt';

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.videoUrl;
    _initializePlayer();
  }

  String _getRealUrl(String url) {
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    return url;
  }

  Future<void> _initializePlayer({Duration? startAt}) async {
    try {
      final url = _getRealUrl(_currentUrl);
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await controller.initialize();
      await controller.setPlaybackSpeed(_currentPlaybackSpeed);
      if (startAt != null) {
        await controller.seekTo(startAt);
      }
      controller.addListener(() {
        if (mounted) setState(() {});
      });
      if (widget.autoPlay) controller.play();
      if (mounted) {
        setState(() {
          _controller = controller;
          _isInitialized = true;
        });
        _resetHideTimer();
      }
    } catch (e) {
      if (mounted) setState(() => _hasError = true);
    }
  }

  void _resetHideTimer() {
    _hideTimer?.cancel();
    setState(() => _showControls = true);
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && (_controller?.value.isPlaying ?? false)) {
        setState(() => _showControls = false);
      }
    });
  }

  void _toggleControls() {
    _hideTimer?.cancel();
    setState(() => _showControls = !_showControls);
    if (_showControls && (_controller?.value.isPlaying ?? false)) {
      _resetHideTimer();
    }
  }

  void _togglePlayPause() {
    if (_controller?.value.isPlaying ?? false) {
      _controller?.pause();
      setState(() => _showControls = true);
      _hideTimer?.cancel();
    } else {
      _controller?.play();
      _resetHideTimer();
    }
  }

  void _skipForward() {
    final c = _controller;
    if (c == null) return;
    final newPos = c.value.position + const Duration(seconds: 10);
    c.seekTo(newPos > c.value.duration ? c.value.duration : newPos);
    setState(() => _showSkipRight = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) setState(() => _showSkipRight = false);
    });
    _resetHideTimer();
  }

  void _skipBackward() {
    final c = _controller;
    if (c == null) return;
    final newPos = c.value.position - const Duration(seconds: 10);
    c.seekTo(newPos < Duration.zero ? Duration.zero : newPos);
    setState(() => _showSkipLeft = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) setState(() => _showSkipLeft = false);
    });
    _resetHideTimer();
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }

  String _getMockCaption(Duration position) {
    final seconds = position.inSeconds;
    final isEnglish = _currentCaption.contains('Anh');
    
    // Create a rotating mock caption based on the current second
    if (seconds % 8 < 4) {
      return isEnglish 
        ? 'This is an automatically generated subtitle.'
        : 'Đây là phụ đề mẫu được tạo tự động.';
    } else {
      return isEnglish
        ? 'Subtitles are synchronized with playback.'
        : 'Phụ đề sẽ tự động đồng bộ theo thời gian phát.';
    }
  }

  @override
  void reassemble() {
    super.reassemble();
    // On hot reload, re-initialize the player
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
    _hasError = false;
    _initializePlayer();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, color: Colors.white54, size: 48),
              SizedBox(height: 8),
              Text('Không thể tải video', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
      );
    }

    if (!_isInitialized || _controller == null) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.red, strokeWidth: 2),
        ),
      );
    }

    final c = _controller!;
    final position = c.value.position;
    final duration = c.value.duration;
    final progress = duration.inMilliseconds > 0
        ? position.inMilliseconds / duration.inMilliseconds
        : 0.0;

    return GestureDetector(
      onTap: _toggleControls,
      onDoubleTapDown: (details) {
        final w = context.size?.width ?? 300;
        if (details.localPosition.dx < w / 2) {
          _skipBackward();
        } else {
          _skipForward();
        }
      },
      child: Container(
        color: Colors.black,
        child: Stack(
          children: [
            // Video frame
            Center(
              child: AspectRatio(
                aspectRatio: c.value.aspectRatio,
                child: VideoPlayer(c),
              ),
            ),

            // Caption overlay
            if (_currentCaption != 'Tắt' && c.value.isPlaying)
              Positioned(
                bottom: 20,
                left: 20,
                right: 20,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _getMockCaption(c.value.position),
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),

            // Skip left ripple
            if (_showSkipLeft)
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                width: MediaQuery.of(context).size.width / 2,
                child: const _SkipIndicator(isForward: false),
              ),

            // Skip right ripple
            if (_showSkipRight)
              Positioned(
                right: 0,
                top: 0,
                bottom: 0,
                width: MediaQuery.of(context).size.width / 2,
                child: const _SkipIndicator(isForward: true),
              ),

            // Controls overlay
            AnimatedOpacity(
              opacity: _showControls ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 250),
              child: IgnorePointer(
                ignoring: !_showControls,
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x88000000),
                        Color(0x00000000),
                        Color(0x00000000),
                        Color(0xAA000000),
                      ],
                      stops: [0.0, 0.25, 0.7, 1.0],
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Top-right icons row
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Row(
                          children: [
                            _buildTopIcon(Icons.closed_caption_outlined, () {}),
                            _buildTopIcon(Icons.settings_outlined, _showSettingsSheet),
                          ],
                        ),
                      ),

                      // Center play/pause button
                      Center(
                        child: GestureDetector(
                          onTap: _togglePlayPause,
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white38, width: 1),
                            ),
                            child: Icon(
                              c.value.isPlaying
                                  ? Icons.pause
                                  : Icons.play_arrow,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                        ),
                      ),

                      // Bottom: time + progress bar
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Progress bar
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                                  trackHeight: 2.5,
                                  activeTrackColor: Colors.red,
                                  inactiveTrackColor: Colors.white30,
                                  thumbColor: Colors.red,
                                  overlayColor: Colors.red.withValues(alpha: 0.25),
                                ),
                                child: Slider(
                                  value: progress.clamp(0.0, 1.0),
                                  onChanged: (v) {
                                    c.seekTo(Duration(
                                      milliseconds: (v * duration.inMilliseconds).round(),
                                    ));
                                    _resetHideTimer();
                                  },
                                ),
                              ),
                            ),
                            // Time row
                            Padding(
                              padding: const EdgeInsets.only(left: 14, right: 4, bottom: 6),
                              child: Row(
                                children: [
                                  Text(
                                    '${_formatDuration(position)} / ${_formatDuration(duration)}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      shadows: [Shadow(color: Colors.black, blurRadius: 4)],
                                    ),
                                  ),
                                  const Spacer(),
                                  _buildTopIcon(Icons.fullscreen, () {}),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettingsSheet() {
    // Pause video temporarily if it's playing? Optional, but usually YouTube keeps playing.
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.high_quality, color: Colors.white),
                title: const Text('Chất lượng video', style: TextStyle(color: Colors.white)),
                trailing: Text(_currentResolutionName, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                onTap: () {
                  Navigator.pop(context);
                  _showQualitySheet();
                },
              ),
              ListTile(
                leading: const Icon(Icons.speed, color: Colors.white),
                title: const Text('Tốc độ phát', style: TextStyle(color: Colors.white)),
                trailing: Text(_currentPlaybackSpeed == 1.0 ? 'Chuẩn' : '${_currentPlaybackSpeed}x', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                onTap: () {
                  Navigator.pop(context);
                  _showPlaybackSpeedSheet();
                },
              ),

              // mới chỉ làm phụ để mẫu để test xem có hiển thị thôi chứ chưa có phụ đè chuẩn mực theo lời từ video
              ListTile(
                leading: const Icon(Icons.closed_caption_outlined, color: Colors.white),
                title: const Text('Phụ đề', style: TextStyle(color: Colors.white)),
                trailing: Text(_currentCaption, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                onTap: () {
                  Navigator.pop(context);
                  _showCaptionSheet();
                },
              ),
              ListTile(
                leading: const Icon(Icons.settings_outlined, color: Colors.white),
                title: const Text('Tùy chọn khác', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Handle other options
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  void _showQualitySheet() {
    final resList = widget.resolutions;
    if (resList == null || resList.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không có tùy chọn chất lượng khác')),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Chất lượng video', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              ListTile(
                leading: _currentResolutionName == 'Tự động' ? const Icon(Icons.check, color: Colors.white) : const SizedBox(width: 24),
                title: const Text('Tự động', style: TextStyle(color: Colors.white)),
                onTap: () => _changeQuality('Tự động', widget.videoUrl),
              ),
              ...resList.map((res) {
                final resName = res['resolution']?.toString() ?? 'Unknown';
                final resUrl = res['fileUrl']?.toString();
                if (resUrl == null) return const SizedBox.shrink();
                
                final isSelected = _currentResolutionName == resName;
                return ListTile(
                  leading: isSelected ? const Icon(Icons.check, color: Colors.white) : const SizedBox(width: 24),
                  title: Text(resName, style: const TextStyle(color: Colors.white)),
                  onTap: () => _changeQuality(resName, resUrl),
                );
              }),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Future<void> _changeQuality(String name, String url) async {
    Navigator.pop(context); // Close sheet
    if (_currentUrl == url) return;

    final currentPos = _controller?.value.position;
    final wasPlaying = _controller?.value.isPlaying ?? false;
    
    // Cleanup old controller
    await _controller?.dispose();
    
    setState(() {
      _currentUrl = url;
      _currentResolutionName = name;
      _isInitialized = false;
      _controller = null;
    });

    await _initializePlayer(startAt: currentPos);
    if (wasPlaying) {
      _controller?.play();
    }
  }

  void _showPlaybackSpeedSheet() {
    final speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 8),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[600],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Tốc độ phát', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  // Slider
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Icon(Icons.speed, color: Colors.white70),
                        Expanded(
                          child: SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              activeTrackColor: AppConstants.accentColor,
                              inactiveTrackColor: Colors.white24,
                              thumbColor: AppConstants.accentColor,
                              overlayColor: AppConstants.accentColor.withValues(alpha: 0.2),
                              valueIndicatorTextStyle: const TextStyle(color: Colors.white),
                            ),
                            child: Slider(
                              value: _currentPlaybackSpeed,
                              min: 0.25,
                              max: 2.0,
                              divisions: 7, // 0.25 steps
                              label: _currentPlaybackSpeed == 1.0 ? 'Chuẩn' : '${_currentPlaybackSpeed}x',
                              onChanged: (value) {
                                setSheetState(() {
                                  _currentPlaybackSpeed = value;
                                });
                                setState(() {});
                                _controller?.setPlaybackSpeed(value);
                              },
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 50,
                          child: Text(
                            _currentPlaybackSpeed == 1.0 ? 'Chuẩn' : '${_currentPlaybackSpeed}x',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.right,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Colors.white24),
                  // List of options
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: speeds.length,
                      itemBuilder: (context, index) {
                        final speed = speeds[index];
                        final isSelected = _currentPlaybackSpeed == speed;
                        final label = speed == 1.0 ? 'Chuẩn' : '${speed}x';
                        
                        return ListTile(
                          leading: isSelected ? const Icon(Icons.check, color: Colors.white) : const SizedBox(width: 24),
                          title: Text(label, style: const TextStyle(color: Colors.white)),
                          onTap: () {
                            setSheetState(() {
                              _currentPlaybackSpeed = speed;
                            });
                            setState(() {});
                            _controller?.setPlaybackSpeed(speed);
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          }
        );
      },
    );
  }

  void _showCaptionSheet() {
    final captions = ['Tắt', 'Tiếng Việt (tạo tự động)', 'Tiếng Anh (tạo tự động)'];

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Phụ đề', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              ...captions.map((caption) {
                final isSelected = _currentCaption == caption;
                return ListTile(
                  leading: isSelected ? const Icon(Icons.check, color: Colors.white) : const SizedBox(width: 24),
                  title: Text(caption, style: const TextStyle(color: Colors.white)),
                  onTap: () {
                    setState(() {
                      _currentCaption = caption;
                    });
                    Navigator.pop(context);
                    if (caption != 'Tắt') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tính năng hiển thị phụ đề đang được phát triển.')),
                      );
                    }
                  },
                );
              }),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTopIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        child: Icon(
          icon,
          color: Colors.white,
          size: 22,
          shadows: const [Shadow(color: Colors.black, blurRadius: 4)],
        ),
      ),
    );
  }
}

// Skip animation indicator
class _SkipIndicator extends StatelessWidget {
  final bool isForward;
  const _SkipIndicator({required this.isForward});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: isForward
            ? const BorderRadius.only(topLeft: Radius.circular(100), bottomLeft: Radius.circular(100))
            : const BorderRadius.only(topRight: Radius.circular(100), bottomRight: Radius.circular(100)),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isForward ? Icons.fast_forward_rounded : Icons.fast_rewind_rounded,
              color: Colors.white,
              size: 36,
            ),
            const SizedBox(height: 4),
            Text(
              isForward ? '+10 giây' : '-10 giây',
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

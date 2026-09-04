import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:async';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool autoPlay;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.autoPlay = true,
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

  // Skip animation
  bool _showSkipLeft = false;
  bool _showSkipRight = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  String _getRealUrl(String url) {
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', '192.168.24.11');
    }
    return url;
  }

  Future<void> _initializePlayer() async {
    try {
      final url = _getRealUrl(widget.videoUrl);
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await controller.initialize();
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
                            _buildTopIcon(Icons.settings_outlined, () {}),
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

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:video_sharing_platform_app/api_config.dart';
import 'package:video_sharing_platform_app/services/video_service.dart';

class LivestreamStudioScreen extends StatefulWidget {
  final Map<String, dynamic> livestream;

  const LivestreamStudioScreen({super.key, required this.livestream});

  @override
  State<LivestreamStudioScreen> createState() => _LivestreamStudioScreenState();
}

class _LivestreamStudioScreenState extends State<LivestreamStudioScreen> {
  static const _accent = Color(0xFFFF3B5C);
  static const _background = Color(0xFF0F0F0F);
  static const _cardColor = Color(0xFF141418);

  Timer? _timer;
  int _elapsedSeconds = 0;
  bool _isLive = false;
  bool _isPaused = false;
  bool _isEnding = false;
  String _error = '';
  bool _nativeConnected = false;
  static const _rtmpChannel = MethodChannel('video_platform/rtmp');
  Completer<void>? _rtmpConnectionCompleter;

  String get _livestreamId =>
      (widget.livestream['id'] ?? widget.livestream['Id']).toString();

  String get _title =>
      (widget.livestream['title'] ?? widget.livestream['Title'] ?? 'Livestream')
          .toString();

  String get _streamKey =>
      (widget.livestream['streamKey'] ?? widget.livestream['StreamKey'] ?? '')
          .toString();

  String get _rtmpUrl => 'rtmp://${ApiConfig.serverIp}:1935/live/$_streamKey';

  String get _mediaServerUrl => _rtmpUrl;

  @override
  void initState() {
    super.initState();
    _rtmpChannel.setMethodCallHandler(_handleNativeEvent);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _rtmpChannel.invokeMethod('stop');
    super.dispose();
  }

  Future<void> _handleNativeEvent(MethodCall call) async {
    if (!mounted) return;
    if (call.method == 'connected') {
      setState(() => _nativeConnected = true);
      _rtmpConnectionCompleter?.complete();
      _rtmpConnectionCompleter = null;
    } else if (call.method == 'disconnected') {
      setState(() => _nativeConnected = false);
    } else if (call.method == 'error' || call.method == 'authError') {
      final message = 'Media Server không nhận được luồng RTMP: ${call.arguments ?? ''}';
      setState(() {
        _nativeConnected = false;
        _error = message;
      });
      _rtmpConnectionCompleter?.completeError(Exception(message));
      _rtmpConnectionCompleter = null;
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _isLive && !_isPaused) {
        setState(() => _elapsedSeconds++);
      }
    });
  }

  Future<void> _startLive() async {
    setState(() => _error = '');
    try {
      final permissionsGranted = await _requestCapturePermissions();
      if (!permissionsGranted) return;

      _rtmpConnectionCompleter = Completer<void>();
      await _rtmpChannel.invokeMethod('start', {'url': _rtmpUrl});
      await _rtmpConnectionCompleter!.future.timeout(
        const Duration(seconds: 8),
        onTimeout: () => throw TimeoutException('Media Server không phản hồi cổng RTMP 1935.'),
      );

      await VideoService.startLivestream(_livestreamId);
      if (!mounted) return;
      setState(() {
        _isLive = true;
        _isPaused = false;
        _elapsedSeconds = 0;
      });
      _startTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã bắt đầu phiên live. Hãy kết nối nguồn phát màn hình.'),
          backgroundColor: Color(0xFFB51E3D),
        ),
      );
    } catch (e) {
      _rtmpConnectionCompleter = null;
      await _rtmpChannel.invokeMethod('stop');
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<bool> _requestCapturePermissions() async {
    final statuses = await [
      Permission.camera,
      Permission.microphone,
    ].request();

    final cameraGranted = statuses[Permission.camera]?.isGranted == true;
    final microphoneGranted = statuses[Permission.microphone]?.isGranted == true;
    if (cameraGranted && microphoneGranted) return true;

    if (!mounted) return false;
    final permanentlyDenied = statuses.values.any((status) => status.isPermanentlyDenied);
    final message = permanentlyDenied
        ? 'Camera và microphone đang bị chặn. Hãy mở Cài đặt ứng dụng để cấp quyền trước khi phát.'
        : 'Cần cấp quyền camera và microphone để bắt đầu livestream.';
    setState(() => _error = message);
    if (permanentlyDenied) {
      await openAppSettings();
    }
    return false;
  }

  Future<void> _togglePause() async {
    if (!_isLive) return;
    try {
      if (_isPaused) {
        await VideoService.resumeLivestream(_livestreamId);
      } else {
        await VideoService.pauseLivestream(_livestreamId);
      }
      if (mounted) setState(() => _isPaused = !_isPaused);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _endLive() async {
    if (_isEnding) return;
    setState(() {
      _isEnding = true;
      _error = '';
    });
    try {
      await VideoService.endLivestream(_livestreamId);
      if (mounted) {
        _timer?.cancel();
        await _rtmpChannel.invokeMethod('stop');
        if (!mounted) return;
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isEnding = false);
    }
  }

  String _formatTime() {
    final hours = (_elapsedSeconds ~/ 3600).toString().padLeft(2, '0');
    final minutes = ((_elapsedSeconds % 3600) ~/ 60).toString().padLeft(2, '0');
    final seconds = (_elapsedSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(14)}) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
      ),
      child: child,
    );
  }

  Widget _stat(IconData icon, String label, String value) {
    return Expanded(
      child: _card(
        padding: const EdgeInsets.all(11),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: Colors.white54, size: 17),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: Colors.white54, fontSize: 9)),
          const SizedBox(height: 3),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _background,
        elevation: 0,
        leading: IconButton(
          onPressed: _isLive ? null : () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: Colors.white),
        ),
        title: const Text('Studio Livestream', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
            decoration: BoxDecoration(
              color: _isLive ? const Color(0xFF3A111B) : const Color(0xFF202126),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _isLive ? _accent : Colors.white24),
            ),
            child: Row(children: [
              Icon(Icons.circle, size: 7, color: _isLive ? _accent : Colors.white54),
              const SizedBox(width: 5),
              Text(_isLive ? 'ĐANG LIVE' : 'CHƯA PHÁT', style: TextStyle(color: _isLive ? _accent : Colors.white70, fontSize: 9, fontWeight: FontWeight.w700)),
            ]),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(15, 8, 15, 100),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Chia sẻ màn hình để bắt đầu phát trực tiếp', style: TextStyle(color: Colors.white54, fontSize: 10)),
          const SizedBox(height: 16),
          _card(child: Column(children: [
            Container(
              height: 210,
              width: double.infinity,
              decoration: BoxDecoration(color: const Color(0xFF080808), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white12)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(_isLive ? (_isPaused ? Icons.pause_circle_outline : Icons.screen_share_outlined) : Icons.screen_share_outlined, color: _isLive ? _accent : Colors.white24, size: 48),
                      const SizedBox(height: 12),
                      Text(_isLive ? (_isPaused ? 'Đang tạm dừng phát' : (_nativeConnected ? 'Đang phát camera và microphone' : 'Đang kết nối Media Server')) : 'Chưa có tín hiệu', style: TextStyle(color: _isLive ? Colors.white : Colors.white54, fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 5),
                      Text(_isLive ? '$_title  •  ${_formatTime()}' : 'Bấm bắt đầu để mở camera và microphone', style: const TextStyle(color: Colors.white38, fontSize: 10)),
                    ]),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Text(_isLive ? (_isPaused ? 'Phiên live đang tạm dừng' : 'Nguồn màn hình đang hoạt động') : 'Bạn chưa bắt đầu chia sẻ màn hình', style: const TextStyle(color: Colors.white54, fontSize: 10))),
              if (_isLive) Text(_formatTime(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ]),
          ])),
          const SizedBox(height: 12),
          Row(children: [
            _stat(Icons.timer_outlined, 'THỜI LƯỢNG', _formatTime()),
            const SizedBox(width: 8),
            _stat(Icons.people_outline, 'NGƯỜI XEM', '0'),
            const SizedBox(width: 8),
            _stat(Icons.favorite_border, 'LƯỢT THÍCH', '0'),
          ]),
          const SizedBox(height: 12),
          _card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.settings_input_antenna, color: Color(0xFF69B7FF), size: 17), const SizedBox(width: 8), const Text('THÔNG TIN KẾT NỐI', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700))]),
            const SizedBox(height: 12),
            Text(_nativeConnected ? 'Camera và microphone đang được phát qua RTMP tới Media Server.' : 'Camera và microphone sẽ được yêu cầu quyền trước lần phát đầu tiên.', style: const TextStyle(color: Colors.white54, fontSize: 10, height: 1.4)),
            const SizedBox(height: 10),
            _connectionRow('Trạng thái', _isLive ? 'Đang phát' : 'Chờ bắt đầu'),
            _connectionRow('Mã livestream', _livestreamId),
            _connectionRow('StreamKey', _streamKey),
            _connectionRow('Media Server', _mediaServerUrl),
          ])),
          if (_error.isNotEmpty) ...[const SizedBox(height: 12), Text(_error, style: const TextStyle(color: Colors.redAccent, fontSize: 11))],
        ]),
      ),
      bottomNavigationBar: SafeArea(child: Container(color: _background, padding: const EdgeInsets.fromLTRB(15, 10, 15, 10), child: Row(children: [
        if (!_isLive) ...[
          Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44), side: const BorderSide(color: Colors.white24), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: const Text('Quay lại', style: TextStyle(color: Colors.white, fontSize: 11)))),
          const SizedBox(width: 10),
          Expanded(flex: 2, child: ElevatedButton(onPressed: _startLive, style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44), backgroundColor: _accent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.screen_share_outlined, color: Colors.white, size: 16), SizedBox(width: 6), Text('Bắt đầu phát trực tiếp', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700))]))),
        ] else ...[
          Expanded(child: OutlinedButton(onPressed: _togglePause, style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44), side: const BorderSide(color: Colors.white24), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: Text(_isPaused ? 'Tiếp tục' : 'Tạm dừng', style: const TextStyle(color: Colors.white, fontSize: 11)))),
          const SizedBox(width: 10),
          Expanded(flex: 2, child: ElevatedButton(onPressed: _isEnding ? null : _endLive, style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44), backgroundColor: const Color(0xFFB51E3D), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: _isEnding ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Kết thúc livestream', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)))),
        ],
      ]))),
    );
  }

  Widget _connectionRow(String label, String value) {
    return Padding(padding: const EdgeInsets.only(top: 7), child: Row(children: [Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10)), const Spacer(), Flexible(child: Text(value, textAlign: TextAlign.right, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)))]));
  }
}

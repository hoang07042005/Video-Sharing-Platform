import 'package:flutter/material.dart';

import '../../../services/video_service.dart';
import 'short_detail_screen.dart';

class ShortsFeedScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const ShortsFeedScreen({super.key, this.onBack});

  @override
  State<ShortsFeedScreen> createState() => _ShortsFeedScreenState();
}

class _ShortsFeedScreenState extends State<ShortsFeedScreen> {
  bool _isLoading = true;
  List<dynamic> _shorts = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchShorts();
  }

  Future<void> _fetchShorts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final shorts = await VideoService.getShorts();
      if (mounted) {
        setState(() {
          _shorts = shorts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    if (_errorMessage.isNotEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Lỗi tải video:\n$_errorMessage',
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchShorts,
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    if (_shorts.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text(
            'Không có video ngắn nào.',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return ShortDetailScreen(
      shorts: _shorts,
      initialIndex: 0,
      onBack: widget.onBack,
    );
  }
}

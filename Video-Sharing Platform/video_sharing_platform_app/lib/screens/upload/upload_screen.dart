import 'package:flutter/material.dart';
import '../../constants.dart';

class UploadScreen extends StatelessWidget {
  const UploadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Tải lên', style: TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _OptionCard(
              icon: Icons.video_camera_back_outlined,
              title: 'Tải video',
              description: 'Chọn video từ thư viện và đăng lên',
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const VideoUploadScreen()));
              },
            ),
            const SizedBox(height: 12),
            _OptionCard(
              icon: Icons.music_note_outlined,
              title: 'Video ngắn',
              description: 'Tạo Shorts nhanh chóng',
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ShortsUploadScreen()));
              },
            ),
            const SizedBox(height: 12),
            _OptionCard(
              icon: Icons.wifi_tethering_outlined,
              title: 'Livestream',
              description: 'Bắt đầu Live ngay lập tức',
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _OptionCard({required this.icon, required this.title, required this.description, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E212A),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
          ],
        ),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        child: Row(
          children: [
            Icon(icon, color: Colors.white70, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(description, style: const TextStyle(color: Colors.white54, fontSize: 13)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
          ],
        ),
      ),
    );
  }
}

// Placeholder screens – you can extend later with actual upload logic
class VideoUploadScreen extends StatelessWidget {
  const VideoUploadScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(title: const Text('Tải video'), backgroundColor: Colors.transparent, elevation: 0),
      body: const Center(child: Text('UI tải video', style: TextStyle(color: Colors.white))),
    );
  }
}

class ShortsUploadScreen extends StatelessWidget {
  const ShortsUploadScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(title: const Text('Tải Shorts'), backgroundColor: Colors.transparent, elevation: 0),
      body: const Center(child: Text('UI tải Shorts', style: TextStyle(color: Colors.white))),
    );
  }
}

class LiveScreen extends StatelessWidget {
  const LiveScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.primaryColor,
      appBar: AppBar(title: const Text('Livestream'), backgroundColor: Colors.transparent, elevation: 0),
      body: const Center(child: Text('UI Livestream', style: TextStyle(color: Colors.white))),
    );
  }
}

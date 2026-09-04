import 'package:flutter/material.dart';
import '../../../services/video_service.dart';
import '../../../services/auth_service.dart';

class VideoReportDialog extends StatefulWidget {
  final String videoId;

  const VideoReportDialog({super.key, required this.videoId});

  @override
  State<VideoReportDialog> createState() => _VideoReportDialogState();
}

class _VideoReportDialogState extends State<VideoReportDialog> {
  final List<String> _reasons = [
    "Nội dung tình dục hoặc bạo lực",
    "Ngôn từ thù ghét, quấy rối",
    "Spam hoặc lừa đảo",
    "Xâm phạm quyền riêng tư",
    "Vi phạm bản quyền",
    "Lý do khác",
  ];

  String _selectedReason = "Nội dung tình dục hoặc bạo lực";
  final TextEditingController _descriptionController = TextEditingController();
  bool _isSubmitting = false;

  void _submitReport() async {
    final isLoggedIn = await AuthService.isLoggedIn();
    if (!isLoggedIn) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng đăng nhập để báo cáo vi phạm!')),
      );
      Navigator.pop(context);
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final success = await VideoService.reportVideo(
      widget.videoId,
      _selectedReason,
      _descriptionController.text,
    );

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
    });

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cảm ơn bạn. Báo cáo của bạn đã được gửi và sẽ được xem xét.')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Có lỗi xảy ra khi gửi báo cáo.')),
      );
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1E1E1E),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Báo cáo video',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                )
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Chọn một lý do chính xác nhất:',
              style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            ..._reasons.map((reason) {
              return InkWell(
                onTap: () {
                  setState(() {
                    _selectedReason = reason;
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _selectedReason == reason ? const Color(0xFFFF5722) : Colors.grey,
                            width: 2,
                          ),
                        ),
                        child: _selectedReason == reason
                            ? Center(
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFFF5722),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          reason,
                          style: TextStyle(
                            color: _selectedReason == reason ? Colors.white : Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
            const Text(
              'Chi tiết thêm (Không bắt buộc):',
              style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white10,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(12),
                hintText: 'Cung cấp thêm chi tiết giúp chúng tôi hiểu rõ vấn đề...',
                hintStyle: const TextStyle(color: Colors.white30),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Hủy', style: TextStyle(color: Colors.white70)),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitReport,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF5722),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('Báo cáo'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

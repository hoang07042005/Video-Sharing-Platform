import 'package:flutter/material.dart';
import 'upload_video_form.dart';

// UploadShortsForm là alias của UploadVideoForm với isShort được bật sẵn.
// Giữ nguyên tên class để không phải thay đổi các import cũ trong upload_screen.dart.
class UploadShortsForm extends StatelessWidget {
  const UploadShortsForm({super.key});

  @override
  Widget build(BuildContext context) {
    return const UploadVideoForm(initialIsShort: true);
  }
}

import 'package:flutter/material.dart';

class AppConstants {
  // Lấy IP từ biến môi trường (khi chạy lệnh) hoặc dùng IP mặc định bên dưới
  static const String _envApiUrl = String.fromEnvironment('API_URL');
  static const String apiUrl = _envApiUrl == '' ? 'http://192.168.24.11:5139/api' : _envApiUrl;

  static const Color primaryColor = Color(0xFF0F0F0F);
  static const Color accentColor = Color(0xFFFF5722);
  static const Color textColor = Colors.white;
}

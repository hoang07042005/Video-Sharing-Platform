import 'package:flutter/material.dart';

import 'api_config.dart';

class AppConstants {
  // Trỏ về ApiConfig
  static String get apiUrl => ApiConfig.apiBaseUrl;

  static const Color primaryColor = Color(0xFF0F0F0F);
  static const Color accentColor = Color(0xFFFF5722);
  static const Color textColor = Colors.white;

  // Lấy IP từ ApiConfig để dùng chung cho việc replace localhost
  static String get serverIp => ApiConfig.serverIp;
}

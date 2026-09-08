import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import 'package:intl/intl.dart';

class LoginHistoryScreen extends StatefulWidget {
  const LoginHistoryScreen({super.key});

  @override
  State<LoginHistoryScreen> createState() => _LoginHistoryScreenState();
}

class _LoginHistoryScreenState extends State<LoginHistoryScreen> {
  late Future<List<dynamic>> _historyFuture;

  @override
  void initState() {
    super.initState();
    _historyFuture = AuthService.getLoginHistory();
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '';
    try {
      final dt = DateTime.parse(timeStr).toLocal();
      return DateFormat('HH:mm, dd/MM/yyyy').format(dt);
    } catch (e) {
      return timeStr;
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Lịch sử đăng nhập',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _historyFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.deepOrangeAccent));
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Lỗi tải dữ liệu', style: TextStyle(color: Colors.white54)));
          }

          final history = snapshot.data ?? [];
          if (history.isEmpty) {
            return const Center(child: Text('Không có lịch sử đăng nhập nào', style: TextStyle(color: Colors.white54)));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: history.length,
            itemBuilder: (context, index) {
              final item = history[index] as Map<String, dynamic>;
              
              final isSuccess = item['isSuccess'] == true;
              final color = isSuccess ? Colors.greenAccent : Colors.redAccent;
              
              final deviceType = item['deviceType']?.toString() ?? '';
              IconData icon = Icons.device_unknown_rounded;
              if (deviceType.toLowerCase().contains('mobile') || item['deviceName']?.toString().toLowerCase().contains('iphone') == true) {
                icon = Icons.phone_iphone_rounded;
              } else if (deviceType.toLowerCase().contains('desktop') || item['deviceName']?.toString().toLowerCase().contains('windows') == true) {
                icon = Icons.computer_rounded;
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF161618),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['deviceName']?.toString() ?? 'Unknown Device',
                            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.location_on_outlined, color: Colors.grey, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  item['location']?.toString() ?? 'Unknown',
                                  style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.wifi_rounded, color: Colors.grey, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'IP: ${item['ipAddress']}',
                                  style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time_rounded, color: Colors.grey, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  _formatTime(item['loginTime']),
                                  style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isSuccess ? 'Thành công' : 'Thất bại',
                            style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

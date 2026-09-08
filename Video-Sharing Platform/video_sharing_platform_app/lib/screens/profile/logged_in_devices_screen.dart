import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import 'package:intl/intl.dart';

class LoggedInDevicesScreen extends StatefulWidget {
  const LoggedInDevicesScreen({super.key});

  @override
  State<LoggedInDevicesScreen> createState() => _LoggedInDevicesScreenState();
}

class _LoggedInDevicesScreenState extends State<LoggedInDevicesScreen> {
  late Future<List<dynamic>> _devicesFuture;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  void _loadDevices() {
    setState(() {
      _devicesFuture = AuthService.getLoggedInDevices();
    });
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

  void _logoutDevice(String id) async {
    final success = await AuthService.logoutDevice(id);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã đăng xuất khỏi thiết bị này'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _loadDevices();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể đăng xuất. Vui lòng thử lại.'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
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
          'Thiết bị đăng nhập',
          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _devicesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.deepOrangeAccent));
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Lỗi tải dữ liệu', style: TextStyle(color: Colors.white54)));
          }

          final devices = snapshot.data ?? [];
          if (devices.isEmpty) {
            return const Center(child: Text('Không có thiết bị nào', style: TextStyle(color: Colors.white54)));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: devices.length,
            itemBuilder: (context, index) {
              final device = devices[index] as Map<String, dynamic>;
              // Mocking isCurrent for first item or based on some matching logic if available.
              final isCurrent = index == 0; 
              
              final deviceType = device['deviceType']?.toString() ?? '';
              IconData icon = Icons.device_unknown_rounded;
              if (deviceType.toLowerCase().contains('mobile') || device['deviceName']?.toString().toLowerCase().contains('iphone') == true) {
                icon = Icons.phone_iphone_rounded;
              } else if (deviceType.toLowerCase().contains('desktop') || device['deviceName']?.toString().toLowerCase().contains('windows') == true) {
                icon = Icons.computer_rounded;
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF161618),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isCurrent ? Colors.purpleAccent.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.05)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isCurrent ? Colors.purpleAccent.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        icon,
                        color: isCurrent ? Colors.purpleAccent : Colors.white70,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  device['deviceName']?.toString() ?? 'Unknown',
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isCurrent)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                                  ),
                                  child: const Text(
                                    'Hiện tại',
                                    style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.location_on_outlined, color: Colors.grey, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  device['location']?.toString() ?? 'Unknown',
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
                                  isCurrent ? 'Đang hoạt động' : 'Đăng nhập: ${_formatTime(device['loginTime'])}',
                                  style: TextStyle(color: isCurrent ? Colors.greenAccent : Colors.grey.shade400, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (!isCurrent)
                      IconButton(
                        onPressed: () => _logoutDevice(device['id'].toString()),
                        icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                        tooltip: 'Đăng xuất thiết bị này',
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

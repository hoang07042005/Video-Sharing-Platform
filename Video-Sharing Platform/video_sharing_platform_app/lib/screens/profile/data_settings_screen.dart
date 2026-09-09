import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../services/video_service.dart';
import 'search_history_screen.dart';

class DataSettingsScreen extends StatefulWidget {
  const DataSettingsScreen({super.key});

  @override
  State<DataSettingsScreen> createState() => _DataSettingsScreenState();
}

class _DataSettingsScreenState extends State<DataSettingsScreen> {
  static const _saveSearchHistoryKey = 'save_search_history';
  static const _searchHistoryKey = 'search_history';
  static const _searchHistoryEntriesKey = 'search_history_entries';
  bool _saveSearchHistory = true;

  @override
  void initState() {
    super.initState();
    _loadSetting();
  }

  Future<void> _loadSetting() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _saveSearchHistory = prefs.getBool(_saveSearchHistoryKey) ?? true);
  }

  Future<void> _setSaveSearchHistory(bool enabled) async {
    setState(() => _saveSearchHistory = enabled);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_saveSearchHistoryKey, enabled);
    if (!enabled) {
      await prefs.remove(_searchHistoryKey);
      await prefs.remove(_searchHistoryEntriesKey);
      try {
        await VideoService.clearSearchHistory();
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: const Text('Dữ liệu', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('LỊCH SỬ', style: TextStyle(color: Color(0xFF636366), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.8)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: const Color(0xFF1C1C1E), borderRadius: BorderRadius.circular(16)),
            child: Column(children: [
              SwitchListTile(
                secondary: const Icon(Icons.history_rounded, color: Color(0xFF90CAF9)),
                title: const Text('Lưu lịch sử tìm kiếm', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
                subtitle: Text(_saveSearchHistory ? 'Lịch sử được lưu trên thiết bị' : 'Lịch sử sẽ không được lưu', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                value: _saveSearchHistory,
                activeColor: const Color(0xFFFF5722),
                onChanged: _setSaveSearchHistory,
              ),
              const Divider(height: 1, color: Colors.white12),
              ListTile(
                leading: const Icon(Icons.manage_search_rounded, color: Color(0xFFFFB74D)),
                title: const Text('Lịch sử tìm kiếm', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white54),
                enabled: _saveSearchHistory,
                onTap: _saveSearchHistory ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchHistoryScreen())) : null,
              ),
            ]),
          ),
          if (!_saveSearchHistory)
            const Padding(
              padding: EdgeInsets.only(top: 12, left: 4),
              child: Text('Bật tùy chọn lưu lịch sử để xem và quản lý lịch sử tìm kiếm.', style: TextStyle(color: Colors.white54, fontSize: 12)),
            ),
        ]),
      ),
    );
  }
}

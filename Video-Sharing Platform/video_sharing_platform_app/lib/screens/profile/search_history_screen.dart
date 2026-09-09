import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../services/video_service.dart';

class SearchHistoryScreen extends StatefulWidget {
  const SearchHistoryScreen({super.key});

  @override
  State<SearchHistoryScreen> createState() => _SearchHistoryScreenState();
}

class _SearchHistoryScreenState extends State<SearchHistoryScreen> {
  static const _historyKey = 'search_history';
  static const _entriesKey = 'search_history_entries';
  List<_SearchEntry> _entries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  Future<void> _loadEntries() async {
    final prefs = await SharedPreferences.getInstance();
    final loaded = <_SearchEntry>[];
    try {
      final remote = await VideoService.getSearchHistory();
      for (final item in remote) {
        if (item is Map) {
          final query = item['query']?.toString() ?? '';
          final timestamp = _parseTimestamp(item['searchedAt']);
          final id = item['id']?.toString();
          if (query.isNotEmpty && timestamp != null) loaded.add(_SearchEntry(query, timestamp, id));
        }
      }
    } catch (_) {}
    final rawEntries = prefs.getStringList(_entriesKey);
    if (loaded.isEmpty && rawEntries != null) {
      for (final raw in rawEntries) {
        final parts = raw.split('|');
        if (parts.length >= 2) {
          final timestamp = int.tryParse(parts.last);
          final query = parts.sublist(0, parts.length - 1).join('|');
          if (timestamp != null && query.isNotEmpty) loaded.add(_SearchEntry(query, timestamp));
        }
      }
    }
    if (loaded.isEmpty) {
      final legacy = prefs.getStringList(_historyKey) ?? _readLegacyJson(prefs.getString(_historyKey));
      loaded.addAll(legacy.map((query) => _SearchEntry(query, DateTime.now().millisecondsSinceEpoch)));
    }
    if (mounted) setState(() { _entries = loaded; _isLoading = false; });
  }

  int? _parseTimestamp(dynamic value) {
    if (value is num) return value.toInt();
    if (value == null) return null;
    final raw = value.toString();
    final hasTimezone = raw.endsWith('Z') || RegExp(r'[+-]\d{2}:?\d{2}$').hasMatch(raw);
    final parsed = DateTime.tryParse(hasTimezone ? raw : '${raw}Z');
    return parsed?.toLocal().millisecondsSinceEpoch;
  }

  List<String> _readLegacyJson(String? raw) {
    if (raw == null) return [];
    try {
      final value = jsonDecode(raw);
      return value is List ? value.whereType<String>().toList() : [];
    } catch (_) {
      return [];
    }
  }

  Future<void> _deleteAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
    await prefs.remove(_entriesKey);
    try {
      await VideoService.clearSearchHistory();
    } catch (_) {}
    if (mounted) setState(() => _entries = []);
  }

  Future<void> _deleteEntry(_SearchEntry entry) async {
    setState(() => _entries.remove(entry));
    if (entry.id != null) {
      try {
        await VideoService.deleteSearchHistory(entry.id!);
      } catch (_) {}
    }
    await _persistEntries();
  }

  Future<void> _persistEntries() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_entriesKey, _entries.map((entry) => '${entry.query}|${entry.timestamp}').toList());
    await prefs.setStringList(_historyKey, _entries.map((entry) => entry.query).toList());
  }

  String _groupTitle(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final entryDay = DateTime(date.year, date.month, date.day);
    final days = today.difference(entryDay).inDays;
    if (days == 0) return 'Hôm nay';
    if (days == 1) return 'Hôm qua';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  Map<String, List<_SearchEntry>> _groupEntries() {
    final groups = <String, List<_SearchEntry>>{};
    for (final entry in _entries) {
      final title = _groupTitle(DateTime.fromMillisecondsSinceEpoch(entry.timestamp));
      groups.putIfAbsent(title, () => []).add(entry);
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    final groups = _groupEntries();
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18), onPressed: () => Navigator.pop(context)),
        title: const Text('Lịch sử tìm kiếm', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
        centerTitle: true,
        actions: [
          if (_entries.isNotEmpty) IconButton(icon: const Icon(Icons.delete_outline, color: Colors.white), tooltip: 'Xóa lịch sử tìm kiếm', onPressed: _confirmDeleteAll),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF5722)))
          : _entries.isEmpty
              ? const Center(child: Text('Chưa có lịch sử tìm kiếm', style: TextStyle(color: Colors.white54)))
              : ListView(children: groups.entries.map((group) => _buildGroup(group.key, group.value)).toList()),
    );
  }

  Widget _buildGroup(String title, List<_SearchEntry> entries) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 20, 16, 8), child: Text(title, style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w700))),
      ...entries.map((entry) => ListTile(
        leading: const Icon(Icons.history, color: Colors.white54),
        title: Text(entry.query, style: const TextStyle(color: Colors.white)),
        trailing: IconButton(icon: const Icon(Icons.close, color: Colors.white54, size: 19), onPressed: () => _deleteEntry(entry)),
      )),
    ]);
  }

  Future<void> _confirmDeleteAll() async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1E),
        title: const Text('Xóa lịch sử tìm kiếm?', style: TextStyle(color: Colors.white)),
        content: const Text('Toàn bộ lịch sử tìm kiếm sẽ bị xóa.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (shouldDelete == true) await _deleteAll();
  }
}

class _SearchEntry {
  final String query;
  final int timestamp;
  final String? id;

  const _SearchEntry(this.query, this.timestamp, [this.id]);
}

import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../constants.dart';
import '../../services/video_service.dart';
import '../../widgets/video_card.dart';
import '../../widgets/shorts_card.dart';
import '../../widgets/verified_badge.dart';
import '../channel/channel_screen.dart';
import '../video/short/short_detail_screen.dart';
import '../video/videos/video_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static const _historyKey = 'search_history';
  static const _entriesKey = 'search_history_entries';
  final _queryController = TextEditingController();
  final _focusNode = FocusNode();
  List<String> _history = [];
  List<String> _historyEntries = [];
  Map<String, dynamic>? _results;
  bool _isSearching = false;
  bool _saveSearchHistory = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadHistory();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _queryController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    _saveSearchHistory = prefs.getBool('save_search_history') ?? true;
    if (!_saveSearchHistory) return;

    try {
      final remote = await VideoService.getSearchHistory();
      if (remote.isNotEmpty) {
        final latest = remote.take(16).whereType<Map>().map((item) {
          final query = item['query']?.toString() ?? '';
          final timestamp = _parseTimestamp(item['searchedAt']) ?? DateTime.now().millisecondsSinceEpoch;
          return '$query|$timestamp';
        }).where((entry) => entry.split('|').first.isNotEmpty).toList();
        _historyEntries = latest;
        if (mounted) setState(() => _history = latest.map((entry) => entry.split('|').first).toList());
        return;
      }
    } catch (_) {}

    final entries = prefs.getStringList(_entriesKey) ?? [];
    if (entries.isNotEmpty) {
      _historyEntries = entries;
      final latest = entries.take(16).toList();
      _historyEntries = latest;
      if (mounted) setState(() => _history = latest.map((entry) => entry.split('|').first).toList());
      return;
    }
    final raw = prefs.getString(_historyKey);
    if (!mounted || raw == null) return;
    try {
      final values = jsonDecode(raw);
      if (values is List) {
        final history = values.whereType<String>().take(16).toList();
        _historyEntries = history.map((query) => '$query|${DateTime.now().millisecondsSinceEpoch}').toList();
        setState(() => _history = history);
      }
    } catch (_) {}
  }

  int? _parseTimestamp(dynamic value) {
    if (value is num) return value.toInt();
    if (value == null) return null;
    final raw = value.toString();
    final hasTimezone = raw.endsWith('Z') || RegExp(r'[+-]\d{2}:?\d{2}$').hasMatch(raw);
    final parsed = DateTime.tryParse(hasTimezone ? raw : '${raw}Z');
    return parsed?.toLocal().millisecondsSinceEpoch;
  }

  Future<void> _saveHistory(String query) async {
    final normalized = query.trim();
    if (normalized.isEmpty || !_saveSearchHistory) return;
    final updatedEntries = [
      '$normalized|${DateTime.now().millisecondsSinceEpoch}',
      ..._historyEntries.where((entry) => entry.split('|').first.toLowerCase() != normalized.toLowerCase()),
    ].take(16).toList();
    final updated = updatedEntries.map((entry) => entry.split('|').first).toList();
    setState(() {
      _historyEntries = updatedEntries;
      _history = updated;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_historyKey, jsonEncode(updated));
    await prefs.setStringList(_entriesKey, updatedEntries);
    try {
      await VideoService.saveSearchHistory(normalized);
    } catch (_) {
      // Keep the local history when the user is offline or not authenticated.
    }
  }

  Future<void> _removeHistory(String query) async {
    final updated = _history.where((item) => item != query).toList();
    _historyEntries = _historyEntries.where((entry) => entry.split('|').first != query).toList();
    setState(() => _history = updated);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_historyKey, jsonEncode(updated));
    await prefs.setStringList(_entriesKey, _historyEntries);
  }

  Future<void> _clearHistory() async {
    setState(() => _history = []);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
    await prefs.remove(_entriesKey);
  }

  Future<void> _search([String? value]) async {
    final query = (value ?? _queryController.text).trim();
    if (query.isEmpty) return;
    _queryController.text = query;
    _queryController.selection = TextSelection.collapsed(offset: query.length);
    _focusNode.unfocus();
    setState(() {
      _isSearching = true;
      _error = '';
    });
    try {
      final data = await VideoService.search(query);
      if (!mounted) return;
      await _saveHistory(query);
      setState(() {
        _results = data;
        _isSearching = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isSearching = false;
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  List<dynamic> _items(String key) {
    final value = _results?[key];
    return value is List ? value : const [];
  }

  String _imageUrl(dynamic value) {
    final url = value?.toString() ?? '';
    if (url.isEmpty) return '';
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return url.replaceAll('localhost', AppConstants.serverIp).replaceAll('127.0.0.1', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    final parsedUrl = Uri.tryParse(url);
    if (parsedUrl != null && parsedUrl.host.startsWith('192.168.24.')) {
      return parsedUrl.replace(host: AppConstants.serverIp).toString();
    }
    return url;
  }

  String _channelAvatarUrl(dynamic channel) {
    if (channel is! Map) return '';
    final profile = channel['profile'] ?? channel['Profile'];
    final user = channel['user'] ?? channel['User'];
    final userProfile = user is Map ? (user['profile'] ?? user['Profile']) : null;
    final candidates = [
      channel['avatarUrl'],
      channel['channelAvatarUrl'],
      channel['userAvatarUrl'],
      channel['profileAvatarUrl'],
      profile is Map ? profile['avatarUrl'] : null,
      user is Map ? user['avatarUrl'] : null,
      userProfile is Map ? userProfile['avatarUrl'] : null,
    ];
    for (final candidate in candidates) {
      final url = _imageUrl(candidate);
      if (url.isNotEmpty) return url;
    }
    return '';
  }

  Widget _buildChannelAvatar(dynamic channel) {
    final avatarUrl = _channelAvatarUrl(channel);
    final name = channel is Map
        ? (channel['channelName'] ?? channel['name'] ?? channel['handle'] ?? 'K')
            .toString()
        : 'K';
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'K';

    return CircleAvatar(
      backgroundColor: Colors.grey[800],
      child: avatarUrl.isEmpty
          ? Text(initial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600))
          : ClipOval(
              child: Image.network(
                avatarUrl,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Center(
                  child: Text(initial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ),
    );
  }

  void _openChannel(dynamic channel) {
    final handle = channel['handle']?.toString() ?? channel['id']?.toString();
    if (handle == null || handle.isEmpty) return;
    Navigator.push(context, MaterialPageRoute(builder: (_) => ChannelScreen(handle: handle)));
  }

  Future<void> _openPlaylist(dynamic playlist) async {
    final id = playlist['id']?.toString();
    if (id == null || id.isEmpty) return;
    try {
      final data = await VideoService.getPlaylistVideos(id);
      final videos = data is Map && data['videos'] is List ? data['videos'] as List : const [];
      if (!mounted) return;
      if (videos.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Danh sách phát chưa có video.')));
        return;
      }
      final firstId = videos.first['id']?.toString();
      if (firstId != null && firstId.isNotEmpty) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => VideoDetailScreen(videoId: firstId, playlistId: id)));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể mở danh sách phát.')));
    }
  }

  Widget _sectionTitle(String title, int count) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(children: [
        Expanded(child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700))),
        Text('$count', style: const TextStyle(color: Colors.white54, fontSize: 12)),
      ]),
    );
  }

  Widget _thumbnail(String url, {double width = 112, double height = 64}) {
    final image = _imageUrl(url);
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: image.isEmpty
          ? Container(width: width, height: height, color: const Color(0xFF24242A), child: const Icon(Icons.image_outlined, color: Colors.white30))
          : Image.network(image, width: width, height: height, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(width: width, height: height, color: const Color(0xFF24242A), child: const Icon(Icons.image_outlined, color: Colors.white30))),
    );
  }

  Widget _buildHistory() {
    if (_history.isEmpty) {
      return const Center(child: Text('Tìm video, kênh hoặc danh sách phát', style: TextStyle(color: Colors.white54)));
    }
    return ListView(
      padding: const EdgeInsets.only(top: 16),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            const Expanded(child: Text('Lịch sử tìm kiếm', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700))),
            TextButton(onPressed: _clearHistory, child: const Text('Xóa tất cả', style: TextStyle(color: AppConstants.accentColor))),
          ]),
        ),
        ..._history.map((item) => ListTile(
          leading: const Icon(Icons.history, color: Colors.white54),
          title: Text(item, style: const TextStyle(color: Colors.white)),
          trailing: IconButton(icon: const Icon(Icons.close, color: Colors.white54, size: 19), onPressed: () => _removeHistory(item)),
          onTap: () => _search(item),
        )),
      ],
    );
  }

  Widget _buildResults() {
    final channels = _items('channels');
    final playlists = _items('playlists');
    final videos = _items('videos');
    final shorts = _items('shorts');
    if (channels.isEmpty && playlists.isEmpty && videos.isEmpty && shorts.isEmpty) {
      return Center(child: Text('Không tìm thấy kết quả cho "${_queryController.text}"', style: const TextStyle(color: Colors.white54)));
    }
    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        if (channels.isNotEmpty) ...[
          _sectionTitle('Kênh', channels.length),
          ...channels.map((channel) => ListTile(
            leading: _buildChannelAvatar(channel),
            title: Row(
              children: [
                Flexible(
                  child: Text(channel['channelName'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                if (channel['isVerified'] == true || channel['channelIsVerified'] == true || channel['verified'] == true) ...[
                  const SizedBox(width: 4),
                  const VerifiedBadge(size: 15),
                ],
              ],
            ),
            subtitle: Text('${channel['handle'] ?? ''}  •  ${channel['subscriberCount'] ?? 0} người đăng ký', style: const TextStyle(color: Colors.white54, fontSize: 12)),
            onTap: () => _openChannel(channel),
          )),
        ],
        if (playlists.isNotEmpty) ...[
          _sectionTitle('Danh sách phát', playlists.length),
          ...playlists.map((playlist) => InkWell(
            onTap: () => _openPlaylist(playlist),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _thumbnail(playlist['thumbnailUrl'], width: 180, height: 105),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          playlist['title'] ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${playlist['videoCount'] ?? 0} video',
                          style: const TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )),
        ],
        if (shorts.isNotEmpty) ...[
          _sectionTitle('Shorts', shorts.length),
          SizedBox(
            height: 300,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: shorts.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: ShortsCard(
                    video: shorts[index],
                    width: 180,
                    titleOverlay: true,
                    durationAtTop: true,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ShortDetailScreen(
                            shorts: shorts,
                            initialIndex: index,
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
        ],
        if (videos.isNotEmpty) ...[
          _sectionTitle('Video', videos.length),
          ...videos.map((video) => Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: VideoCard(
              video: Map<String, dynamic>.from(video as Map),
              width: double.infinity,
            ),
          )),
        ],
        
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasQuery = _queryController.text.trim().isNotEmpty;
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        titleSpacing: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
        title: TextField(
          controller: _queryController,
          focusNode: _focusNode,
          autofocus: true,
          textInputAction: TextInputAction.search,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          decoration: const InputDecoration(hintText: 'Tìm kiếm video, kênh...', hintStyle: TextStyle(color: Colors.white54), border: InputBorder.none),
          onSubmitted: (_) => _search(),
          onChanged: (_) => setState(() {}),
        ),
        actions: [
          if (hasQuery) IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () { _queryController.clear(); setState(() => _results = null); }),
          IconButton(icon: const Icon(Icons.search, color: Colors.white), onPressed: _isSearching ? null : _search),
        ],
      ),
      body: _isSearching
          ? const Center(child: CircularProgressIndicator(color: AppConstants.accentColor))
          : _error.isNotEmpty
              ? Center(child: Text(_error, style: const TextStyle(color: Colors.redAccent)))
              : _results == null ? _buildHistory() : _buildResults(),
    );
  }
}

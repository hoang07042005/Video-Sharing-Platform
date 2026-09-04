import 'package:flutter/material.dart';
import '../../../services/video_service.dart';

class SaveToPlaylistSheet extends StatefulWidget {
  final String videoId;

  const SaveToPlaylistSheet({super.key, required this.videoId});

  @override
  State<SaveToPlaylistSheet> createState() => _SaveToPlaylistSheetState();
}

class _SaveToPlaylistSheetState extends State<SaveToPlaylistSheet> {
  List<dynamic> _playlists = [];
  bool _isLoading = true;

  // Create new playlist form
  bool _showCreateForm = false;
  final TextEditingController _newPlaylistNameController = TextEditingController();
  String _newPlaylistVisibility = 'Public';
  bool _isCreating = false;

  @override
  void initState() {
    super.initState();
    _loadPlaylists();
  }

  @override
  void dispose() {
    _newPlaylistNameController.dispose();
    super.dispose();
  }

  Future<void> _loadPlaylists() async {
    setState(() => _isLoading = true);
    final playlists = await VideoService.getMyPlaylists(videoId: widget.videoId);
    if (mounted) {
      setState(() {
        _playlists = playlists;
        _isLoading = false;
      });
    }
  }

  Future<void> _togglePlaylist(dynamic playlist) async {
    final playlistId = playlist['id'].toString();
    final currentlyContains = playlist['containsVideo'] == true;

    // Optimistic update
    setState(() {
      final index = _playlists.indexOf(playlist);
      if (index != -1) {
        _playlists[index] = {
          ...Map<String, dynamic>.from(playlist),
          'containsVideo': !currentlyContains,
          'videoCount': currentlyContains
              ? (playlist['videoCount'] ?? 1) - 1
              : (playlist['videoCount'] ?? 0) + 1,
        };
      }
    });

    await VideoService.toggleVideoInPlaylist(playlistId, widget.videoId);
  }

  Future<void> _createPlaylist() async {
    final title = _newPlaylistNameController.text.trim();
    if (title.isEmpty) return;

    setState(() => _isCreating = true);

    final newPlaylist = await VideoService.createPlaylist(title, _newPlaylistVisibility);

    if (!mounted) return;
    final scaffoldMsg = ScaffoldMessenger.of(context);

    if (newPlaylist != null) {
      final playlistId = newPlaylist['id'].toString();
      await VideoService.toggleVideoInPlaylist(playlistId, widget.videoId);

      _newPlaylistNameController.clear();
      setState(() {
        _isCreating = false;
        _showCreateForm = false;
        _playlists.insert(
          1,
          {
            ...Map<String, dynamic>.from(newPlaylist),
            'containsVideo': true,
            'videoCount': 1,
          },
        );
      });

      scaffoldMsg.showSnackBar(
        SnackBar(content: Text('Đã tạo và lưu vào "$title"')),
      );
    } else {
      setState(() => _isCreating = false);
      scaffoldMsg.showSnackBar(
        const SnackBar(content: Text('Có lỗi xảy ra. Vui lòng thử lại.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E1E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Lưu vào danh sách phát',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white12, height: 1),

          // Playlist List
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator(color: Colors.white)),
            )
          else
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.45,
              ),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _playlists.length,
                itemBuilder: (context, index) {
                  final playlist = _playlists[index];
                  final isWatchLater = playlist['title'] == 'Xem sau';
                  final containsVideo = playlist['containsVideo'] == true;
                  final videoCount = playlist['videoCount'] ?? 0;
                  final visibility = playlist['visibility'] ?? 'Public';

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    leading: SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: containsVideo,
                        onChanged: (_) => _togglePlaylist(playlist),
                        activeColor: const Color(0xFFFF5722),
                        side: const BorderSide(color: Colors.white54),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                    ),
                    title: Text(
                      playlist['title'] ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 15),
                    ),
                    subtitle: Text(
                      '$videoCount video • ${visibility == 'Private' ? 'Riêng tư' : 'Công khai'}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    trailing: Icon(
                      isWatchLater || visibility == 'Private'
                          ? Icons.lock_outline
                          : Icons.public,
                      color: Colors.grey,
                      size: 18,
                    ),
                    onTap: () => _togglePlaylist(playlist),
                  );
                },
              ),
            ),

          const Divider(color: Colors.white12, height: 1),

          // "Create new playlist" button OR form
          if (!_showCreateForm)
            // Button to toggle form
            InkWell(
              onTap: () => setState(() => _showCreateForm = true),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    const Icon(Icons.add, color: Color(0xFFFF5722), size: 20),
                    const SizedBox(width: 12),
                    const Text(
                      'Tạo danh sách phát mới',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ],
                ),
              ),
            )
          else
            // Create form
            Padding(
              padding: EdgeInsets.only(
                left: 12,
                right: 12,
                top: 12,
                bottom: MediaQuery.of(context).viewInsets.bottom + 12,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name field
                  TextField(
                    controller: _newPlaylistNameController,
                    autofocus: true,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Tên danh sách phát...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: Colors.white10,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Visibility + action buttons row
                  Row(
                    children: [
                      // Visibility dropdown
                      PopupMenuButton<String>(
                        initialValue: _newPlaylistVisibility,
                        color: const Color(0xFF2A2A2A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        onSelected: (v) => setState(() => _newPlaylistVisibility = v),
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'Public',
                            child: Text('Công khai', style: TextStyle(color: Colors.white)),
                          ),
                          const PopupMenuItem(
                            value: 'Private',
                            child: Text('Riêng tư', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _newPlaylistVisibility == 'Public' ? 'Công khai' : 'Riêng tư',
                                style: const TextStyle(color: Colors.white, fontSize: 13),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
                            ],
                          ),
                        ),
                      ),

                      const Spacer(),

                      // Cancel
                      TextButton(
                        onPressed: () {
                          _newPlaylistNameController.clear();
                          setState(() => _showCreateForm = false);
                        },
                        child: const Text('Hủy', style: TextStyle(color: Colors.white70)),
                      ),

                      const SizedBox(width: 8),

                      // Create
                      ElevatedButton(
                        onPressed: _isCreating ? null : _createPlaylist,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF5722),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          minimumSize: const Size(0, 38),
                        ),
                        child: _isCreating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Tạo', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

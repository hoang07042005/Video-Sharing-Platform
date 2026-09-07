import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../constants.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class CommunityScreen extends StatefulWidget {
  final Map<String, dynamic> channel;
  const CommunityScreen({super.key, required this.channel});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  List<dynamic> _posts = [];
  bool _isLoading = true;
  int _page = 1;
  bool _hasMore = true;
  bool _isFetchingMore = false;
  final ScrollController _scrollController = ScrollController();
  
  bool _isOwner = false;
  bool _isMember = false;
  String _activeFilter = 'all'; // all, image, video, poll, members, pinned
  String _sortFilter = 'latest'; // latest, oldest, popular

  @override
  void initState() {
    super.initState();
    timeago.setLocaleMessages('vi', timeago.ViMessages());
    _checkOwner();
    _fetchPosts();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _checkOwner() async {
    final prefs = await SharedPreferences.getInstance();
    final currentHandle = prefs.getString('handle');
    final token = prefs.getString('token');
    
    if (currentHandle != null && currentHandle == widget.channel['handle']) {
      if (mounted) setState(() => _isOwner = true);
    } else if (token != null) {
      try {
        final res = await http.get(
          Uri.parse('${AppConstants.apiUrl}/channels/${widget.channel['id'] ?? widget.channel['_id']}/membership'),
          headers: {'Authorization': 'Bearer $token'},
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['isMember'] == true) {
            if (mounted) setState(() => _isMember = true);
          }
        }
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && !_isFetchingMore && _hasMore) {
      _fetchMorePosts();
    }
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  String _getImageUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/640x360.png';
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  Future<void> _fetchPosts() async {
    setState(() => _isLoading = true);
    try {
      final headers = await _getHeaders();
      final res = await http.get(
        Uri.parse('${AppConstants.apiUrl}/channels/${widget.channel['id'] ?? widget.channel['_id']}/community?page=1&limit=10&filter=$_sortFilter&type=$_activeFilter'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() {
          _posts = data;
          _hasMore = data.length == 10;
        });
      }
    } catch (e) {
      debugPrint('Error fetching posts: $e');
    }
    setState(() => _isLoading = false);
  }

  Future<void> _fetchMorePosts() async {
    setState(() => _isFetchingMore = true);
    _page++;
    try {
      final headers = await _getHeaders();
      final res = await http.get(
        Uri.parse('${AppConstants.apiUrl}/channels/${widget.channel['id'] ?? widget.channel['_id']}/community?page=$_page&limit=10&filter=$_sortFilter&type=$_activeFilter'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() {
          _posts.addAll(data);
          _hasMore = data.length == 10;
        });
      }
    } catch (e) {
      debugPrint('Error fetching more posts: $e');
      _page--;
    }
    setState(() => _isFetchingMore = false);
  }

  Future<void> _toggleLike(int index) async {
    final post = _posts[index];
    final isLiked = post['isLikedByMe'] == true;
    final postId = post['id'] ?? post['_id'];
    
    setState(() {
      _posts[index]['isLikedByMe'] = !isLiked;
      _posts[index]['likesCount'] = (post['likesCount'] ?? 0) + (isLiked ? -1 : 1);
    });

    try {
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('${AppConstants.apiUrl}/community/$postId/like'),
        headers: headers,
        body: jsonEncode({'isLike': !isLiked})
      );
    } catch (e) {
      // Revert if error
      setState(() {
        _posts[index]['isLikedByMe'] = isLiked;
        _posts[index]['likesCount'] = (post['likesCount'] ?? 0) + (isLiked ? 1 : -1);
      });
    }
  }

  Future<void> _votePoll(int postIndex, String optionId) async {
    final post = _posts[postIndex];
    if (post['myVoteOptionId'] == optionId) return;

    final prevVote = post['myVoteOptionId'];
    
    setState(() {
      post['myVoteOptionId'] = optionId;
      final newTotalVotes = (post['totalVotes'] ?? 0) + (prevVote == null ? 1 : 0);
      post['totalVotes'] = newTotalVotes;
      
      final options = post['pollOptions'] as List;
      for (var opt in options) {
        int vCount = opt['votesCount'] ?? 0;
        if (opt['id'] == prevVote) vCount--;
        if (opt['id'] == optionId) vCount++;
        opt['votesCount'] = vCount;
        opt['votePercentage'] = newTotalVotes > 0 ? (vCount / newTotalVotes * 100).round() : 0;
      }
    });

    try {
      final headers = await _getHeaders();
      await http.post(
        Uri.parse('${AppConstants.apiUrl}/community/poll/$optionId/vote'),
        headers: headers,
      );
    } catch (e) {
      debugPrint('Vote error: $e');
    }
  }

  Widget _buildMediaGrid(List<dynamic> mediaItems) {
    if (mediaItems.isEmpty) return const SizedBox();

    if (mediaItems.length == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(_getImageUrl(mediaItems[0]), fit: BoxFit.cover, width: double.infinity, 
          errorBuilder: (_, __, ___) => const SizedBox(),
        ),
      );
    } else if (mediaItems.length == 2) {
      return SizedBox(
        height: 200,
        child: Row(
          children: mediaItems.map((m) => Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(_getImageUrl(m), fit: BoxFit.cover, height: double.infinity),
              ),
            ),
          )).toList(),
        ),
      );
    } else {
      // 3 or more images (just show up to 4 in a 2x2 grid)
      final items = mediaItems.take(4).toList();
      return SizedBox(
        height: 250,
        child: GridView.count(
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          children: items.map((m) => ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(_getImageUrl(m), fit: BoxFit.cover, width: double.infinity, height: double.infinity),
          )).toList(),
        ),
      );
    }
  }

  Widget _buildPostCard(int index) {
    final post = _posts[index];
    final authorName = post['authorName'] ?? post['channelName'] ?? widget.channel['channelName'] ?? 'Unknown';
    final authorHandle = post['authorHandle'] ?? post['channelHandle'] ?? widget.channel['handle'] ?? '';
    final avatarUrl = _getImageUrl(post['authorAvatarUrl'] ?? post['channelAvatarUrl'] ?? widget.channel['avatarUrl']);
    final isPinned = post['isPinned'] == true;
    final isMembersOnly = post['isMembersOnly'] == true;
    final createdAt = post['createdAt'] != null ? DateTime.parse(post['createdAt']) : DateTime.now();

    List<dynamic> images = post['images'] != null ? List.from(post['images']) : [];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141418),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges
          if (isPinned || isMembersOnly)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  if (isPinned)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                      child: Row(
                        children: const [
                          Icon(FontAwesomeIcons.thumbtack, color: Colors.white70, size: 10),
                          SizedBox(width: 6),
                          Text('Đã ghim', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  if (isPinned && isMembersOnly) const SizedBox(width: 8),
                  if (isMembersOnly)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
                      child: Row(
                        children: const [
                          Icon(FontAwesomeIcons.crown, color: Colors.orange, size: 10),
                          SizedBox(width: 6),
                          Text('Chỉ dành cho hội viên', style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            
          // Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.grey.shade800,
                backgroundImage: NetworkImage(avatarUrl),
                onBackgroundImageError: (_, __) {},
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(authorName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(width: 8),
                        Text('• ${timeago.format(createdAt, locale: 'vi')}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                    if (authorHandle.isNotEmpty)
                      Text(authorHandle.startsWith('@') ? authorHandle : '@$authorHandle', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.more_vert, color: Colors.grey, size: 20),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Content
          if (post['content'] != null && post['content'].isNotEmpty)
            Text(
              post['content'],
              style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5),
            ),
          
          // Media Grid
          if (images.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildMediaGrid(images),
          ],
          
          // Poll
          if (post['pollOptions'] != null && (post['pollOptions'] as List).isNotEmpty) ...[
            const SizedBox(height: 16),
            ...((post['pollOptions'] as List).map((option) {
              final isMyVote = post['myVoteOptionId'] == option['id'];
              final percentage = option['votePercentage'] ?? 0;
              
              return GestureDetector(
                onTap: () => _votePoll(index, option['id']),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isMyVote ? Colors.blue.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.1)),
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                  child: Stack(
                    children: [
                      // Progress bar background
                      FractionallySizedBox(
                        widthFactor: percentage / 100.0,
                        heightFactor: 1.0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: isMyVote ? Colors.blue.withValues(alpha: 0.2) : Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                      // Text
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Expanded(child: Text(option['optionText'] ?? '', style: TextStyle(color: isMyVote ? Colors.white : Colors.white70, fontSize: 14, fontWeight: isMyVote ? FontWeight.bold : FontWeight.normal))),
                            if (post['myVoteOptionId'] != null) // Show percentage only if voted
                              Text('${percentage.toStringAsFixed(0)}%', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            })),
            const SizedBox(height: 4),
            Text('${post['totalVotes'] ?? 0} lượt bình chọn', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],

          const SizedBox(height: 16),
          
          // Actions
          Row(
            children: [
              GestureDetector(
                onTap: () => _toggleLike(index),
                child: Row(
                  children: [
                    Icon(
                      post['isLikedByMe'] == true ? FontAwesomeIcons.solidThumbsUp : FontAwesomeIcons.thumbsUp,
                      color: post['isLikedByMe'] == true ? Colors.blue : Colors.grey,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text('${post['likesCount'] ?? 0}', style: TextStyle(color: post['isLikedByMe'] == true ? Colors.blue : Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 24),
              Row(
                children: [
                  const Icon(FontAwesomeIcons.message, color: Colors.grey, size: 18),
                  const SizedBox(width: 8),
                  Text('${post['commentsCount'] ?? 0}', style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
              const Spacer(),
              const Icon(FontAwesomeIcons.share, color: Colors.grey, size: 18),
            ],
          ),
        ],
      ),
    );
  }

  void _showCreatePostSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent, // allow transparent top
      builder: (context) => _CreatePostSheet(
        channelId: widget.channel['id'] ?? widget.channel['_id'],
        isOwner: _isOwner,
        onPostCreated: () {
          _page = 1;
          _fetchPosts();
        },
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, IconData icon) {
    final isActive = _activeFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() => _activeFilter = value);
        _page = 1;
        _fetchPosts();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: isActive ? Colors.white : Colors.grey),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(color: isActive ? Colors.white : Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final channelName = widget.channel['channelName'] ?? widget.channel['handle'] ?? 'Kênh';

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Cộng đồng - $channelName', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading && _page == 1
          ? const Center(child: CircularProgressIndicator(color: Colors.purple))
          : RefreshIndicator(
              onRefresh: () async {
                _page = 1;
                await _fetchPosts();
              },
              color: Colors.purple,
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_isOwner || _isMember)
                      GestureDetector(
                        onTap: _showCreatePostSheet,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF141418),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!_isOwner && _isMember)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.blue.withValues(alpha: 0.2))),
                                  child: const Text('Đăng bài với tư cách Hội viên', style: TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: Colors.grey.shade800,
                                    backgroundImage: NetworkImage(_getImageUrl(widget.channel['avatarUrl'])),
                                    onBackgroundImageError: (_, __) {},
                                  ),
                                  const SizedBox(width: 12),
                                  const Expanded(
                                    child: Text('Bạn đang nghĩ gì?', style: TextStyle(color: Colors.grey, fontSize: 14)),
                                  ),
                                  const Icon(FontAwesomeIcons.image, color: Colors.grey, size: 20),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    
                    // Filters
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('all', 'Tất cả', FontAwesomeIcons.tableCellsLarge),
                          const SizedBox(width: 8),
                          _buildFilterChip('image', 'Hình ảnh', FontAwesomeIcons.image),
                          const SizedBox(width: 8),
                          _buildFilterChip('video', 'Video', FontAwesomeIcons.video),
                          const SizedBox(width: 8),
                          _buildFilterChip('poll', 'Thăm dò', FontAwesomeIcons.chartSimple),
                          const SizedBox(width: 8),
                          _buildFilterChip('members', 'Chỉ hội viên', FontAwesomeIcons.crown),
                          const SizedBox(width: 8),
                          _buildFilterChip('pinned', 'Đã ghim', FontAwesomeIcons.thumbtack),
                          const SizedBox(width: 16),
                          // Dropdown
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _sortFilter,
                                dropdownColor: const Color(0xFF1A1A1A),
                                icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                                isDense: true,
                                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                items: const [
                                  DropdownMenuItem(value: 'popular', child: Text('Phổ biến')),
                                  DropdownMenuItem(value: 'latest', child: Text('Mới nhất')),
                                  DropdownMenuItem(value: 'oldest', child: Text('Cũ nhất')),
                                ],
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _sortFilter = val);
                                    _page = 1;
                                    _fetchPosts();
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    if (_posts.isEmpty && !_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: Text('Chưa có bài viết nào trên cộng đồng.', style: TextStyle(color: Colors.grey)),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _posts.length,
                        itemBuilder: (context, index) => _buildPostCard(index),
                      ),
                      
                    if (_isFetchingMore)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(child: CircularProgressIndicator(color: Colors.purple)),
                      )
                  ],
                ),
              ),
            ),
    );
  }
}

class _CreatePostSheet extends StatefulWidget {
  final String channelId;
  final bool isOwner;
  final VoidCallback onPostCreated;

  const _CreatePostSheet({required this.channelId, required this.isOwner, required this.onPostCreated});

  @override
  State<_CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends State<_CreatePostSheet> {
  final TextEditingController _contentCtrl = TextEditingController();
  bool _isPoll = false;
  bool _isMembersOnly = false;
  List<String> _pollOptions = ['', ''];
  bool _isSubmitting = false;

  Future<void> _submit() async {
    if (_contentCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng nhập nội dung')));
      return;
    }
    
    if (_isPoll) {
      final valid = _pollOptions.where((o) => o.trim().isNotEmpty).toList();
      if (valid.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cần ít nhất 2 lựa chọn')));
        return;
      }
    }

    setState(() => _isSubmitting = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final res = await http.post(
        Uri.parse('${AppConstants.apiUrl}/community'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'channelId': widget.channelId,
          'content': _contentCtrl.text.trim(),
          'isMembersOnly': _isMembersOnly,
          'pollOptions': _isPoll ? _pollOptions.where((o) => o.trim().isNotEmpty).toList() : null,
        }),
      );

      if (mounted) {
        if (res.statusCode == 201 || res.statusCode == 200) {
          Navigator.pop(context);
          widget.onPostCreated();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng bài thành công!')));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Có lỗi xảy ra khi đăng bài')));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi kết nối mạng')));
    }
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      // Ensure it doesn't go all the way to the top by adding top margin
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 20),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF141418),
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Tạo bài viết', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: () => Navigator.pop(context)),
              ],
            ),
            if (!widget.isOwner)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.blue.withValues(alpha: 0.2))),
                child: const Text('Đăng bài với tư cách Hội viên', style: TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            TextField(
              controller: _contentCtrl,
              style: const TextStyle(color: Colors.white, fontSize: 15),
              maxLines: 4,
              minLines: 2,
              decoration: const InputDecoration(
                hintText: 'Bạn đang nghĩ gì?',
                hintStyle: TextStyle(color: Colors.grey),
                border: InputBorder.none,
              ),
            ),
            if (_isPoll) ...[
              const SizedBox(height: 12),
              const Text('Thăm dò ý kiến', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...List.generate(_pollOptions.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (val) => _pollOptions[index] = val,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Lựa chọn ${index + 1}',
                            hintStyle: const TextStyle(color: Colors.white30),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.05),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                          ),
                        ),
                      ),
                      if (_pollOptions.length > 2)
                        IconButton(
                          icon: const Icon(Icons.remove_circle, color: Colors.red),
                          onPressed: () => setState(() => _pollOptions.removeAt(index)),
                        ),
                    ],
                  ),
                );
              }),
              if (_pollOptions.length < 5)
                TextButton.icon(
                  onPressed: () => setState(() => _pollOptions.add('')),
                  icon: const Icon(Icons.add, color: Colors.blue, size: 16),
                  label: const Text('Thêm lựa chọn', style: TextStyle(color: Colors.blue)),
                ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                IconButton(
                  icon: Icon(FontAwesomeIcons.image, color: Colors.grey.shade400, size: 20),
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tải ảnh trên app đang được phát triển.'))),
                ),
                IconButton(
                  icon: Icon(FontAwesomeIcons.chartSimple, color: _isPoll ? Colors.blue : Colors.grey.shade400, size: 20),
                  onPressed: () => setState(() => _isPoll = !_isPoll),
                ),
                if (widget.isOwner)
                  IconButton(
                    icon: Icon(FontAwesomeIcons.crown, color: _isMembersOnly ? Colors.orange : Colors.grey.shade400, size: 20),
                    onPressed: () => setState(() => _isMembersOnly = !_isMembersOnly),
                  ),
                const Spacer(),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.purple, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                  child: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Đăng bài', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../services/video_service.dart';
import '../../../constants.dart';

class ShortDetailScreen extends StatefulWidget {
  final List<dynamic> shorts;
  final int initialIndex;
  final VoidCallback? onBack;

  const ShortDetailScreen({
    super.key,
    required this.shorts,
    required this.initialIndex,
    this.onBack,
  });

  @override
  State<ShortDetailScreen> createState() => _ShortDetailScreenState();
}

class _ShortDetailScreenState extends State<ShortDetailScreen> {
  late PageController _pageController;
  late int _currentIndex;
  bool _isGlobalMuted = false;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _toggleGlobalMute() {
    setState(() {
      _isGlobalMuted = !_isGlobalMuted;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.6),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: widget.onBack ?? () => Navigator.pop(context),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ),
        ),
      ),
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: widget.shorts.length,
        onPageChanged: _onPageChanged,
        itemBuilder: (context, index) {
          final short = widget.shorts[index];
          return ShortPlayerItem(
            short: short,
            isActive: index == _currentIndex,
            isMuted: _isGlobalMuted,
            onMuteToggle: _toggleGlobalMute,
          );
        },
      ),
    );
  }
}

class ShortPlayerItem extends StatefulWidget {
  final dynamic short;
  final bool isActive;
  final bool isMuted;
  final VoidCallback onMuteToggle;

  const ShortPlayerItem({
    super.key,
    required this.short,
    required this.isActive,
    required this.isMuted,
    required this.onMuteToggle,
  });

  @override
  State<ShortPlayerItem> createState() => _ShortPlayerItemState();
}

class _ShortPlayerItemState extends State<ShortPlayerItem> with SingleTickerProviderStateMixin {
  VideoPlayerController? _videoController;
  bool _isPlaying = false;
  bool _isInitialized = false;
  bool _viewRecorded = false;
  bool _showFlash = false;
  late AnimationController _flashController;
  
  bool _isLiked = false;
  int _likeCount = 0;
  int _commentCount = 0;
  bool _isSubscribed = false;
  bool _isSaved = false;
  bool _isExpanded = false;

  bool _hasError = false;
  String _errorMessage = '';
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.short['isLiked'] == true;
    _likeCount = _parseInt(widget.short['likesCount'] ?? widget.short['likes']);
    _commentCount = _parseInt(widget.short['commentsCount'] ?? widget.short['comments']);
    _isSubscribed = widget.short['isSubscribed'] == true;
    _isSaved = widget.short['isSaved'] == true;
    _flashController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));

    _loadCurrentUser();
    _initVideo();
  }

  Future<void> _loadCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _currentUserId = prefs.getString('userId');
      });
    }
  }

  bool get _isOwnChannel {
    final ownerUserId = widget.short['ownerUserId']?.toString();
    if (_currentUserId != null && ownerUserId != null) {
      return _currentUserId!.toLowerCase() == ownerUserId.toLowerCase();
    }
    return false;
  }
  
  int _parseInt(dynamic val) {
    if (val == null) return 0;
    if (val is int) return val;
    return int.tryParse(val.toString()) ?? 0;
  }

  String _formatUrl(String? url) {
    if (url == null || url.isEmpty) return 'https://placehold.co/640x360.png';
    if (url.contains('api.dicebear.com') && url.contains('/svg')) {
      url = url.replaceAll('/svg', '/png');
    }
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  void _initVideo() {
    final url = _formatUrl(widget.short['videoUrl']);
    if (url.isEmpty) return;
    
    _videoController = VideoPlayerController.networkUrl(Uri.parse(url))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
          _videoController!.setLooping(true);
          _applyMute();
          if (widget.isActive) {
            _playVideo();
            _recordView();
          }
        }
      }).catchError((e) {
        if (mounted) {
          setState(() {
            _hasError = true;
            _errorMessage = e.toString();
          });
        }
      });
  }

  void _applyMute() {
    if (_videoController != null && _videoController!.value.isInitialized) {
      _videoController!.setVolume(widget.isMuted ? 0.0 : 1.0);
    }
  }

  void _playVideo() {
    if (_videoController != null && _videoController!.value.isInitialized) {
      _videoController!.play();
      setState(() {
        _isPlaying = true;
      });
    }
  }

  void _pauseVideo() {
    if (_videoController != null && _videoController!.value.isInitialized) {
      _videoController!.pause();
      setState(() {
        _isPlaying = false;
      });
    }
  }

  void _recordView() {
    if (!_viewRecorded) {
      _viewRecorded = true;
      VideoService.recordView(widget.short['id']);
    }
  }

  @override
  void didUpdateWidget(ShortPlayerItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _playVideo();
        _recordView();
      } else {
        _pauseVideo();
        if (_videoController != null && _videoController!.value.isInitialized) {
          _videoController!.seekTo(Duration.zero);
        }
      }
    }
    
    if (widget.isMuted != oldWidget.isMuted) {
      _applyMute();
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _flashController.dispose();
    super.dispose();
  }

  void _togglePlayPause() {
    if (_isPlaying) {
      _pauseVideo();
    } else {
      _playVideo();
    }
    _showFlashAnimation();
  }

  void _showFlashAnimation() {
    setState(() {
      _showFlash = true;
    });
    _flashController.forward(from: 0.0).then((_) {
      if (mounted) {
        setState(() {
          _showFlash = false;
        });
      }
    });
  }

  String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1).replaceAll('.0', '')}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1).replaceAll('.0', '')}K';
    return n.toString();
  }

  void _handleLike() async {
    final newState = !_isLiked;
    setState(() {
      _isLiked = newState;
      _likeCount += newState ? 1 : -1;
    });
    widget.short['isLiked'] = newState;
    widget.short['likesCount'] = _likeCount;
    await VideoService.likeVideo(widget.short['id'], newState);
  }

  void _handleFollow() async {
    final channelId = widget.short['channelId'];
    if (channelId == null) return;
    final newState = !_isSubscribed;
    setState(() {
      _isSubscribed = newState;
    });
    widget.short['isSubscribed'] = newState;
    await VideoService.followChannel(channelId);
  }

  void _handleSave() async {
    final newState = !_isSaved;
    setState(() {
      _isSaved = newState;
      if (newState) {
        widget.short['saves'] = (widget.short['saves'] ?? 0) + 1;
      } else {
        widget.short['saves'] = (widget.short['saves'] ?? 1) - 1;
      }
    });
    widget.short['isSaved'] = newState;
    await VideoService.saveVideo(widget.short['id']);
  }

  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CommentsSheet(videoId: widget.short['id']),
    ).then((_) {
      // Could fetch comment count again
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlayPause,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video background
          Container(
            color: Colors.black,
            child: _hasError 
                ? Center(child: Text('Lỗi tải video:\n$_errorMessage', style: const TextStyle(color: Colors.white), textAlign: TextAlign.center))
                : _isInitialized
                    ? SizedBox.expand(
                        child: FittedBox(
                          fit: BoxFit.contain,
                          child: SizedBox(
                            width: _videoController!.value.size.width,
                            height: _videoController!.value.size.height,
                            child: VideoPlayer(_videoController!),
                          ),
                        ),
                      )
                    : Image.network(
                        _formatUrl(widget.short['thumbnailUrl'] ?? widget.short['thumbnail']),
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const Center(child: CircularProgressIndicator()),
                      ),
          ),
          
          // Flash animation
          if (_showFlash)
            Center(
              child: AnimatedOpacity(
                opacity: 1.0 - _flashController.value,
                duration: Duration.zero,
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isPlaying ? Icons.play_arrow : Icons.pause,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            
          // Bottom Gradient
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.8),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Content
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Left Info Overlay
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(left: 16, bottom: 24, right: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Channel Info
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundImage: NetworkImage(
                                    _formatUrl(widget.short['channelAvatarUrl'] ?? widget.short['channelAvatar'] ?? 'https://ui-avatars.com/api/?name=${widget.short['channelName']}'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Flexible(
                                  child: Text(
                                    widget.short['channelHandle'] ?? widget.short['channelName'] ?? 'Unknown',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (widget.short['channelIsVerified'] == true || widget.short['channelIsVerified'] == 'true' || widget.short['isVerified'] == true) ...[
                                  const SizedBox(width: 4),
                                  Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Container(
                                        width: 20,
                                        height: 20,
                                        decoration: const BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const Icon(Icons.check_circle, color: Color.fromARGB(255, 73, 198, 0), size: 20),
                                    ],
                                  ),
                                ],
                                const SizedBox(width: 12),
                                if (!_isOwnChannel)
                                  GestureDetector(
                                    onTap: _handleFollow,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _isSubscribed ? Colors.white.withValues(alpha: 0.2) : Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Text(
                                        _isSubscribed ? 'Đã đăng ký' : 'Đăng ký',
                                        style: TextStyle(
                                          color: _isSubscribed ? Colors.white : Colors.black,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Title
                            Text(
                              widget.short['title'] ?? 'Untitled',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (widget.short['description'] != null && widget.short['description'].toString().isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Container(
                                constraints: _isExpanded ? const BoxConstraints(maxHeight: 220) : null,
                                child: SingleChildScrollView(
                                  physics: _isExpanded ? const BouncingScrollPhysics() : const NeverScrollableScrollPhysics(),
                                  child: Text(
                                    widget.short['description'],
                                    style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
                                    maxLines: _isExpanded ? null : 2,
                                    overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              if (widget.short['description'].toString().length > 20 || widget.short['description'].toString().contains('\n'))
                                GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _isExpanded = !_isExpanded;
                                    });
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 4, bottom: 4),
                                    child: Text(
                                      _isExpanded ? 'Ẩn bớt' : 'Xem thêm',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                            const SizedBox(height: 12),
                            // Music
                            Row(
                              children: [
                                const Icon(Icons.music_note, color: Colors.white, size: 16),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    widget.short['music'] ?? 'Âm thanh gốc',
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Right Action Column
                    Padding(
                      padding: const EdgeInsets.only(right: 16, bottom: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildActionButton(
                            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
                            color: _isLiked ? Colors.red : Colors.white,
                            label: _formatCount(_likeCount),
                            onTap: _handleLike,
                          ),
                          const SizedBox(height: 20),
                          _buildActionButton(
                            icon: Icons.comment_rounded,
                            label: _formatCount(_commentCount),
                            onTap: _showComments,
                          ),
                          const SizedBox(height: 20),
                          _buildActionButton(
                            icon: Icons.share,
                            label: 'Chia sẻ',
                            onTap: () {
                              // Share logic
                            },
                          ),
                          const SizedBox(height: 20),
                          _buildActionButton(
                            icon: _isSaved ? Icons.bookmark : Icons.bookmark_border,
                            color: _isSaved ? Colors.yellow : Colors.white,
                            label: _formatCount(widget.short['saves'] ?? 0),
                            onTap: _handleSave,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                // Progress Bar
                if (_isInitialized)
                  VideoProgressIndicator(
                    _videoController!,
                    allowScrubbing: true,
                    colors: const VideoProgressColors(
                      playedColor: Colors.red,
                      bufferedColor: Colors.white30,
                      backgroundColor: Colors.white12,
                    ),
                    padding: const EdgeInsets.only(top: 8),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, Color color = Colors.white, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color, size: 36, shadows: const [Shadow(color: Colors.black54, blurRadius: 4)]),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600, shadows: [Shadow(color: Colors.black54, blurRadius: 2)])),
        ],
      ),
    );
  }
}

class _CommentsSheet extends StatefulWidget {
  final String videoId;

  const _CommentsSheet({required this.videoId});

  @override
  State<_CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<_CommentsSheet> {
  List<dynamic> _comments = [];
  bool _isLoading = true;
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _commentFocusNode = FocusNode();
  String? _replyingToCommentId;
  String? _replyingToName;
  final Set<String> _expandedComments = {};

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _commentFocusNode.dispose();
    super.dispose();
  }

  String _formatUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.contains('api.dicebear.com') && url.contains('/svg')) {
      url = url.replaceAll('/svg', '/png');
    }
    if (url.contains('localhost')) {
      return url.replaceAll('localhost', AppConstants.serverIp);
    }
    if (!url.startsWith('http')) {
      return '${AppConstants.apiUrl.replaceAll('/api', '')}$url';
    }
    return url;
  }

  Future<void> _loadComments() async {
    final comments = await VideoService.getComments(widget.videoId);
    if (mounted) {
      setState(() {
        _comments = comments;
        _isLoading = false;
      });
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    
    if (_replyingToCommentId != null) {
      final newReply = await VideoService.postCommentReply(_replyingToCommentId!, text);
      if (newReply != null && mounted) {
        setState(() {
          final parentIndex = _comments.indexWhere((c) => c['id'] == _replyingToCommentId);
          if (parentIndex != -1) {
            _comments[parentIndex]['replies'] = _comments[parentIndex]['replies'] ?? [];
            _comments[parentIndex]['replies'].add(newReply);
          }
          _commentController.clear();
          _replyingToCommentId = null;
          _replyingToName = null;
          FocusScope.of(context).unfocus();
        });
      }
    } else {
      final newComment = await VideoService.postComment(widget.videoId, text);
      if (newComment != null && mounted) {
        setState(() {
          _comments.insert(0, newComment);
          _commentController.clear();
          FocusScope.of(context).unfocus();
        });
      }
    }
  }

  void _startReply(String commentId, String userName, {bool isReplyToReply = false}) {
    setState(() {
      _replyingToCommentId = commentId;
      _replyingToName = userName;
    });
    if (isReplyToReply) {
      _commentController.text = '@$userName ';
    } else {
      _commentController.text = '';
    }
    _commentFocusNode.requestFocus();
  }

  List<Map<String, dynamic>> _buildReplyTree(List<dynamic> rawReplies) {
    if (rawReplies.isEmpty) return [];
    List<Map<String, dynamic>> nodes = rawReplies.map((r) => Map<String, dynamic>.from(r)..['children'] = []).toList();
    List<Map<String, dynamic>> tree = [];
    for (int i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      bool parentFound = false;
      String content = node['content'] ?? '';
      for (int j = i - 1; j >= 0; j--) {
        String parentName = nodes[j]['fullName'] ?? 'User';
        if (content.startsWith('@$parentName ')) {
          nodes[j]['children'].add(node);
          parentFound = true;
          break;
        }
      }
      if (!parentFound) tree.add(node);
    }
    return tree;
  }

  Widget _renderReplyTree(List<Map<String, dynamic>> nodes, String commentId, {int level = 1}) {
    if (nodes.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: EdgeInsets.only(left: level == 1 ? 0 : 36.0, top: level == 1 ? 8 : 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: nodes.asMap().entries.map((entry) {
          int index = entry.key;
          var reply = entry.value;
          bool isLast = index == nodes.length - 1;
          return IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  width: 24,
                  child: Stack(
                    children: [
                      if (index == 0 && level > 1)
                        Positioned(
                          left: 0, top: -16, height: 16,
                          child: Container(width: 1.5, color: const Color.fromARGB(255, 240, 110, 20)),
                        ),
                      if (!isLast)
                        Positioned(
                          left: 0, top: 0, bottom: -12,
                          child: Container(width: 1.5, color: const Color.fromARGB(255, 240, 110, 20)),
                        ),
                      Positioned(
                        left: 0, top: 0,
                        child: Container(
                          width: 16, height: 16,
                          decoration: const BoxDecoration(
                            border: Border(
                              left: BorderSide(color: Color.fromARGB(255, 240, 110, 20), width: 1.5),
                              bottom: BorderSide(color: Color.fromARGB(255, 240, 110, 20), width: 1.5),
                            ),
                            borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10)),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 14, top: 13.5,
                        child: Container(
                          width: 5, height: 5,
                          decoration: const BoxDecoration(
                            color: Color.fromARGB(255, 240, 110, 20),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 12,
                              backgroundImage: NetworkImage(
                                reply['avatarUrl'] != null && reply['avatarUrl'].toString().isNotEmpty
                                    ? _formatUrl(reply['avatarUrl'])
                                    : 'https://ui-avatars.com/api/?name=${reply['fullName'] ?? 'User'}',
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        reply['fullName'] ?? 'User',
                                        style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _timeAgo(reply['createdAt']),
                                        style: const TextStyle(color: Colors.white38, fontSize: 10),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    reply['content'] ?? '',
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.thumb_up_alt_outlined, color: Colors.white54, size: 14),
                                      if (reply['likesCount'] != null && reply['likesCount'] > 0) ...[
                                        const SizedBox(width: 4),
                                        Text(reply['likesCount'].toString(), style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                      ],
                                      const SizedBox(width: 16),
                                      const Icon(Icons.thumb_down_alt_outlined, color: Colors.white54, size: 14),
                                      const SizedBox(width: 16),
                                      GestureDetector(
                                        onTap: () => _startReply(commentId, reply['fullName'] ?? 'User', isReplyToReply: true),
                                        child: const Text('Phản hồi', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (reply['children'] != null && (reply['children'] as List).isNotEmpty)
                          _renderReplyTree(List<Map<String, dynamic>>.from(reply['children']), commentId, level: level + 1),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      decoration: const BoxDecoration(
        color: AppConstants.primaryColor,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${_comments.length} Bình luận', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white24, height: 1),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppConstants.accentColor))
                : _comments.isEmpty
                    ? const Center(child: Text('Chưa có bình luận nào.', style: TextStyle(color: Colors.white54)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _comments.length,
                        itemBuilder: (context, index) {
                          final c = _comments[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundImage: NetworkImage(
                                    c['avatarUrl'] != null && c['avatarUrl'].toString().isNotEmpty
                                        ? _formatUrl(c['avatarUrl'])
                                        : 'https://ui-avatars.com/api/?name=${c['fullName'] ?? 'User'}',
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Text(
                                            c['fullName'] ?? 'User',
                                            style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            _timeAgo(c['createdAt']),
                                            style: const TextStyle(color: Colors.white38, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        c['content'] ?? '',
                                        style: const TextStyle(color: Colors.white, fontSize: 14),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(Icons.thumb_up_alt_outlined, color: Colors.white54, size: 14),
                                          if (c['likesCount'] != null && c['likesCount'] > 0) ...[
                                            const SizedBox(width: 4),
                                            Text(c['likesCount'].toString(), style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                          ],
                                          const SizedBox(width: 16),
                                          const Icon(Icons.thumb_down_alt_outlined, color: Colors.white54, size: 14),
                                          const SizedBox(width: 16),
                                          GestureDetector(
                                            onTap: () => _startReply(c['id'], c['fullName'] ?? 'User'),
                                            child: const Text('Phản hồi', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ),
                                      if (c['replies'] != null && (c['replies'] as List).isNotEmpty) ...[
                                        GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              if (_expandedComments.contains(c['id'])) {
                                                _expandedComments.remove(c['id']);
                                              } else {
                                                _expandedComments.add(c['id']);
                                              }
                                            });
                                          },
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                            child: Row(
                                              children: [
                                                Icon(
                                                  _expandedComments.contains(c['id']) ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                                  color: Colors.blue,
                                                  size: 18,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  _expandedComments.contains(c['id'])
                                                      ? 'Ẩn phản hồi'
                                                      : '${(c['replies'] as List).length} phản hồi',
                                                  style: const TextStyle(color: Colors.blue, fontSize: 13, fontWeight: FontWeight.bold),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        if (_expandedComments.contains(c['id']))
                                          _renderReplyTree(_buildReplyTree(c['replies']), c['id']),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
          Container(
            padding: EdgeInsets.only(
              left: 16, right: 16, top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Colors.white12)),
              color: AppConstants.primaryColor,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_replyingToName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Đang trả lời $_replyingToName', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _replyingToCommentId = null;
                              _replyingToName = null;
                            });
                          },
                          child: const Icon(Icons.close, color: Colors.white54, size: 16),
                        )
                      ],
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        focusNode: _commentFocusNode,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: _replyingToName != null ? 'Thêm phản hồi...' : 'Thêm bình luận...',
                          hintStyle: const TextStyle(color: Colors.white54),
                          filled: true,
                          fillColor: Colors.white10,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.send, color: AppConstants.accentColor),
                      onPressed: _postComment,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return "Vừa xong";
    final date = DateTime.tryParse(dateStr);
    if (date == null) return "Vừa xong";
    final diff = DateTime.now().difference(date);
    if (diff.inDays >= 365) return '${diff.inDays ~/ 365} năm';
    if (diff.inDays >= 30) return '${diff.inDays ~/ 30} tháng';
    if (diff.inDays >= 1) return '${diff.inDays} ngày';
    if (diff.inHours >= 1) return '${diff.inHours} giờ';
    if (diff.inMinutes >= 1) return '${diff.inMinutes} phút';
    return 'Vừa xong';
  }
}

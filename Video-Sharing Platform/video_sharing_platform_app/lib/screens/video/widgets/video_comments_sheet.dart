import 'package:flutter/material.dart';
import '../../../../constants.dart';
import '../../../../services/video_service.dart';

class VideoCommentsSheet extends StatefulWidget {
  final String videoId;

  const VideoCommentsSheet({super.key, required this.videoId});

  @override
  State<VideoCommentsSheet> createState() => VideoCommentsSheetState();
}

class VideoCommentsSheetState extends State<VideoCommentsSheet> {
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
      return url.replaceAll('localhost', '192.168.24.11');
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


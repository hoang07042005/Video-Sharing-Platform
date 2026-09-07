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

  Widget _buildCommentNode(Map<String, dynamic> c, {required bool isRoot, required String rootId, int level = 0, bool isLastChild = true}) {
    List<dynamic> childrenNodes = [];
    if (isRoot) {
      if (c['replies'] != null && (c['replies'] as List).isNotEmpty) {
        childrenNodes = _buildReplyTree(c['replies']);
      }
    } else {
      if (c['children'] != null && (c['children'] as List).isNotEmpty) {
        childrenNodes = c['children'];
      }
    }
    
    bool hasChildren = childrenNodes.isNotEmpty;
    bool isExpanded = isRoot ? _expandedComments.contains(c['id']) : true;
    double avatarRadius = isRoot ? 16 : 12;
    double hookWidth = (level == 1 ? 16 : 12) + 12.0 + 0.75; // 0.75 added to perfectly merge with parent's vertical line

    return Padding(
      padding: EdgeInsets.only(bottom: isRoot ? 16 : 0, top: isRoot ? 0 : 12),
      child: Stack(
        children: [
            // Vertical line dropping from this node's avatar to cover all its children
            if (hasChildren && isExpanded)
              Positioned(
                left: avatarRadius - 0.75, // perfectly centered under the avatar
                top: avatarRadius * 2 + 8,
                bottom: 8,
                width: 1.5,
                child: Container(color: const Color.fromARGB(255, 240, 110, 20)),
              ),
              
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    // MASK: Erase the leftover parent vertical line below the last child's hook
                    if (!isRoot && isLastChild)
                      Positioned(
                        left: -hookWidth - 1, // slightly wider to cover the line
                        top: 2, // start exactly where the 10px curve begins (12 - 10 = 2)
                        bottom: -2000, // extend downward to hide the rest of the parent's line
                        width: 4,
                        child: Container(color: AppConstants.primaryColor),
                      ),
                    // The L-shape hook
                    if (!isRoot)
                      Positioned(
                        left: -hookWidth,
                        top: -12,
                        child: Container(
                          width: hookWidth,
                          height: 24,
                          decoration: const BoxDecoration(
                            border: Border(
                              left: BorderSide(color: Color.fromARGB(255, 240, 110, 20), width: 1.5),
                              bottom: BorderSide(color: Color.fromARGB(255, 240, 110, 20), width: 1.5),
                            ),
                            borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10)),
                          ),
                        ),
                      ),
                    CircleAvatar(
                      radius: avatarRadius,
                      backgroundImage: NetworkImage(
                        c['avatarUrl'] != null && c['avatarUrl'].toString().isNotEmpty
                            ? _formatUrl(c['avatarUrl'])
                            : 'https://ui-avatars.com/api/?name=${c['fullName'] ?? 'User'}',
                      ),
                    ),
                  ],
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
                            style: TextStyle(color: Colors.white70, fontSize: isRoot ? 12 : 11, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _timeAgo(c['createdAt']),
                            style: TextStyle(color: Colors.white38, fontSize: isRoot ? 11 : 10),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        c['content'] ?? '',
                        style: TextStyle(color: Colors.white, fontSize: isRoot ? 14 : 13),
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
                            onTap: () => _startReply(rootId, c['fullName'] ?? 'User', isReplyToReply: !isRoot),
                            child: Text('Phản hồi', style: TextStyle(color: Colors.white54, fontSize: isRoot ? 12 : 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      if (isRoot && hasChildren)
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
                      if (hasChildren && isExpanded)
                        Column(
                          children: childrenNodes.asMap().entries.map((entry) {
                            return _buildCommentNode(entry.value, isRoot: false, rootId: rootId, level: level + 1, isLastChild: entry.key == childrenNodes.length - 1);
                          }).toList(),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int totalComments = _comments.length;
    for (var c in _comments) {
      if (c['replies'] != null) {
        totalComments += (c['replies'] as List).length;
      }
    }

    return Container(
      height: MediaQuery.of(context).size.height,
      decoration: const BoxDecoration(
        color: AppConstants.primaryColor,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 30.0, left: 16.0, right: 16.0, bottom: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('$totalComments Bình luận', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
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
                          return _buildCommentNode(c, isRoot: true, rootId: c['id']);
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


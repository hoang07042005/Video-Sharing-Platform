import 'package:flutter/material.dart';
import '../../../services/video_service.dart';
import '../widgets/video_player_widget.dart';
import '../widgets/video_info_widget.dart';
import '../widgets/video_comments_sheet.dart';
import '../widgets/recommended_videos_widget.dart';

class VideoDetailScreen extends StatefulWidget {
  final String videoId;

  const VideoDetailScreen({
    super.key,
    required this.videoId,
  });

  @override
  State<VideoDetailScreen> createState() => _VideoDetailScreenState();
}

class _VideoDetailScreenState extends State<VideoDetailScreen> {
  dynamic _video;
  List<dynamic> _recommendedVideos = [];
  bool _isLoading = true;
  String _errorMessage = '';

  bool _isLiked = false;
  bool _isDisliked = false;
  int _likesCount = 0;
  bool _isSaved = false;
  bool _isSubscribed = false;
  int _subscriberCount = 0;
  int _commentsCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void didUpdateWidget(VideoDetailScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoId != widget.videoId) {
      _fetchData();
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final results = await Future.wait([
        VideoService.getVideoDetails(widget.videoId),
        VideoService.getRecommendedVideos(),
      ]);

      final videoData = results[0];
      final recommendedData = results[1] as List<dynamic>;

      if (videoData == null) {
        throw Exception('Không tìm thấy video');
      }

      if (mounted) {
        setState(() {
          _video = videoData;
          _recommendedVideos = recommendedData.where((v) => v['id'] != widget.videoId).toList();
          
          _isLiked = _video['isLiked'] ?? false;
          _isDisliked = _video['isDisliked'] ?? false;
          _likesCount = _video['likesCount'] ?? 0;
          _isSaved = _video['isSaved'] ?? false;
          
          _isSubscribed = _video['isSubscribed'] ?? false;
          _subscriberCount = _video['subscriberCount'] ?? _video['subscribersCount'] ?? 0;
          _commentsCount = _video['commentsCount'] ?? 0;
          
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _handleLike() async {
    setState(() {
      _isLiked = !_isLiked;
      if (_isLiked) {
        _likesCount++;
        _isDisliked = false;
      } else {
        _likesCount--;
      }
    });
    // Fire API call
    await VideoService.likeVideo(widget.videoId, _isLiked);
  }

  void _handleDislike() async {
    setState(() {
      _isDisliked = !_isDisliked;
      if (_isDisliked && _isLiked) {
        _isLiked = false;
        _likesCount--;
      }
    });
    // Add API call for dislike if exists
  }

  void _handleSave() async {
    setState(() {
      _isSaved = !_isSaved;
    });
    final success = await VideoService.saveVideo(widget.videoId);
    if (!success && mounted) {
      setState(() {
        _isSaved = !_isSaved; // Revert
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lưu video thất bại')));
    }
  }

  void _handleSubscribe() async {
    final channelId = _video['channelId'];
    if (channelId == null) return;
    
    setState(() {
      _isSubscribed = !_isSubscribed;
      if (_isSubscribed) {
        _subscriberCount++;
      } else {
        _subscriberCount--;
      }
    });
    
    final success = await VideoService.followChannel(channelId);
    if (!success && mounted) {
      setState(() {
        _isSubscribed = !_isSubscribed; // Revert
        if (_isSubscribed) {
          _subscriberCount++;
        } else {
          _subscriberCount--;
        }
      });
    }
  }

  void _showCommentsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: VideoCommentsSheet(videoId: widget.videoId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.red)),
      );
    }

    if (_errorMessage.isNotEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, leading: const BackButton(color: Colors.white)),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_errorMessage, style: const TextStyle(color: Colors.white)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _fetchData, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }

    if (_video['isMembersOnly'] == true) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, leading: const BackButton(color: Colors.white)),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock, size: 64, color: Colors.orange),
              const SizedBox(height: 16),
              const Text('Video dành riêng cho hội viên', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 32.0),
                child: Text(
                  'Kênh này yêu cầu bạn phải là hội viên mới có thể xem video. Hãy tham gia ngay để ủng hộ kênh!',
                  style: TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                child: const Text('Tham gia Hội viên'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Video Player fixed at top
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                children: [
                  VideoPlayerWidget(
                    videoUrl: _video['videoUrl'],
                    resolutions: _video['resolutions'],
                  ),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: IconButton(
                      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 32, shadows: [Shadow(color: Colors.black, blurRadius: 4)]),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
            ),
            
            // Scrollable info and list
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    VideoInfoWidget(
                      video: _video,
                      isLiked: _isLiked,
                      isDisliked: _isDisliked,
                      isSaved: _isSaved,
                      isSubscribed: _isSubscribed,
                      likesCount: _likesCount,
                      subscriberCount: _subscriberCount,
                      onLike: _handleLike,
                      onDislike: _handleDislike,
                      onSave: _handleSave,
                      onSubscribe: _handleSubscribe,
                    ),
                    
                    // Comments Preview button
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: GestureDetector(
                        onTap: _showCommentsSheet,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white12,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text('Bình luận', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                  const SizedBox(width: 8),
                                  Text(_commentsCount.toString(), style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 12,
                                    backgroundColor: Colors.grey[800],
                                    child: const Icon(Icons.person, size: 16, color: Colors.white),
                                  ),
                                  const SizedBox(width: 8),
                                  const Expanded(
                                    child: Text('Thêm bình luận...', style: TextStyle(color: Colors.white70, fontSize: 13)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    
                    const Divider(color: Colors.white12, height: 24, thickness: 1),
                    
                    RecommendedVideosWidget(
                      videos: _recommendedVideos,
                      onVideoTap: (id) {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (context) => VideoDetailScreen(videoId: id)),
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

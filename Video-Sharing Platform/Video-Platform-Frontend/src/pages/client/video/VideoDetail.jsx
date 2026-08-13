import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, CheckCircle2, ListPlus, Download, Flag, Bell, Zap, ChevronUp, ChevronDown, XCircle } from 'lucide-react';
import VideoCard from '../../../components/home/VideoCard';
import { addDownload } from './Downloads';
import SaveToPlaylistDropdown from '../../../components/video/SaveToPlaylistDropdown';

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [sameChannelVideos, setSameChannelVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Nội dung phản cảm');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.nameid;
    } catch (e) {
      return null;
    }
  };

  const isOwner = video && getCurrentUserId() === video.ownerUserId;

  const requireAuth = (message = 'Vui lòng đăng nhập để thực hiện chức năng này!') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(message);
      navigate('/login');
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await axios.get(`/api/videos/${id}`, { headers });
        let data = res.data;
        if (!data.videoUrl || data.videoUrl.includes('example.com') || data.videoUrl.includes('commondatastorage')) {
          data.videoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
        }
        setVideo(data);
        setIsSubscribed(data.isSubscribed || false);
        setSubscriberCount(res.data.subscriberCount || 0);
        setIsLiked(res.data.isLiked || false);
        setIsDisliked(res.data.isDisliked || false);
        setLikesCount(res.data.likesCount || 0);
        setIsSaved(res.data.isSaved || false);

        // Fetch comments
        const commentsRes = await axios.get(`/api/videos/${id}/comments`);
        setComments(commentsRes.data);
        
        // Fetch recommended videos (all except current)
        const recRes = await axios.get('/api/videos');
        const allOthers = recRes.data.filter(v => v.id !== id);
        setRecommendedVideos(allOthers);

        // Fetch same-channel videos for "Up Next" top 5
        const channelId = res.data.channelId;
        if (channelId) {
          try {
            const chRes = await axios.get(`/api/channels/${channelId}/videos`);
            const chVideos = (chRes.data || []).filter(v => v.id !== id && !v.isShort);
            setSameChannelVideos(chVideos.slice(0, 5));
          } catch {
            setSameChannelVideos([]);
          }
        }
      } catch (err) {
        console.error("Lỗi chi tiết:", err);
        setError(`Lỗi: ${err.message} ${err.response ? `(Mã lỗi: ${err.response.status})` : ''}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoData();
    }
  }, [id]);

  const handleSubscribe = async () => {
    if (!requireAuth('Vui lòng đăng nhập để đăng ký kênh!')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`/api/channels/${video.channelId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSubscribed(res.data.isSubscribed);
      setSubscriberCount(res.data.subscriberCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (isLike) => {
    if (!requireAuth('Vui lòng đăng nhập để thích video!')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`/api/videos/${id}/like`, { isLike }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLikesCount(res.data.likesCount);
      if (isLike) {
        setIsLiked(!isLiked);
        setIsDisliked(false);
      } else {
        setIsDisliked(!isDisliked);
        setIsLiked(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!requireAuth('Vui lòng đăng nhập để lưu video!')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`/api/playlists/save`, { videoId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!requireAuth('Vui lòng đăng nhập để bình luận!')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`/api/videos/${id}/comments`, { content: commentText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments([res.data, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi bình luận";
      alert(typeof msg === 'string' ? msg : "Có lỗi xảy ra");
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    if (!requireAuth('Vui lòng đăng nhập để phản hồi!')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(`/api/videos/comments/${commentId}/replies`, { content: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update comments state with new reply
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), res.data]
          };
        }
        return c;
      }));
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi phản hồi";
      alert(typeof msg === 'string' ? msg : "Có lỗi xảy ra");
    }
  };

  const handleReportSubmit = async () => {
    if (!requireAuth('Vui lòng đăng nhập để báo cáo vi phạm!')) return;
    setIsSubmittingReport(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/videos/${id}/report`, {
        reason: reportReason,
        description: reportDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cảm ơn bạn. Báo cáo của bạn đã được gửi và sẽ được xem xét.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi gửi báo cáo.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCommentLike = async (commentId, isLike) => {
    if (!requireAuth('Vui lòng đăng nhập để thích bình luận!')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/videos/comments/${commentId}/like`, { isLike }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likesCount: res.data.likesCount } : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplyLike = async (commentId, replyId, isLike) => {
    if (!requireAuth('Vui lòng đăng nhập để thích phản hồi!')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/videos/comments/replies/${replyId}/like`, { isLike }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(comments.map(c => {
        if (c.id === commentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => r.id === replyId ? { ...r, likesCount: res.data.likesCount } : r)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const formatViews = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' Tr';
    if (count >= 1000) return (count / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' N';
    return count.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const isoString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = Math.max(0, now - date);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex-1 bg-[#0F0F0F] flex items-center justify-center text-white">
        <p>{error || "Video không tồn tại"}</p>
      </div>
    );
  }

  // Sort comments based on selected option
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // --- Helper to render Reply Input ---
  const renderReplyInput = (targetId, parentId) => {
    if (replyingTo !== targetId) return null;
    return (
      <div className={`flex gap-4 mt-4 w-full ${targetId === parentId ? 'ml-14' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0 z-10">
          <img src="https://ui-avatars.com/api/?name=User" alt="You" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 flex flex-col gap-2 relative z-10">
          <input 
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Viết phản hồi..." 
            className="bg-transparent border-b border-gray-600 focus:border-white text-white text-sm outline-none pb-1 transition-colors"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 py-1.5 hover:bg-[#3F3F3F] rounded-full text-white text-sm font-medium transition-colors cursor-pointer">Hủy</button>
            <button onClick={() => handleReply(parentId)} className={`px-3 py-1.5 rounded-full text-[#0F0F0F] text-sm font-medium transition-colors ${replyText.trim() ? 'bg-[#3EA6FF] hover:bg-[#65B8FF] cursor-pointer' : 'bg-[#272727] text-gray-500'}`}>Phản hồi</button>
          </div>
        </div>
      </div>
    );
  };

  const buildReplyTree = (replies) => {
    if (!replies) return [];
    const nodes = replies.map(r => ({ ...r, children: [] }));
    const tree = [];
    
    nodes.forEach(node => {
      let parentFound = false;
      const currentIndex = nodes.indexOf(node);
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (node.content.startsWith(`@${nodes[i].fullName} `)) {
          nodes[i].children.push(node);
          parentFound = true;
          break;
        }
      }
      if (!parentFound) {
        tree.push(node);
      }
    });
    
    return tree;
  };

  const renderReplyTree = (replies, commentId, level = 1) => {
    if (!replies || replies.length === 0) return null;
    
    const containerMargin = level === 1 ? "ml-[44px]" : "ml-[40px]";
    
    return (
      <div className={`relative mt-3 ${containerMargin} z-0`}>
        <div className="flex flex-col gap-3">
          {replies.map((reply, index) => {
            const isLast = index === replies.length - 1;

            return (
              <div key={reply.id} className="flex flex-col relative z-10">
                
                {/* 1. NÉT NỐI LÊN TRÊN (Chỉ dành cho bình luận đầu tiên để nối vào dây tổng) */}
                {index === 0 && (
                  <div className="absolute top-[-16px] left-[-24px] w-[1px] h-[16px] bg-[#FF5722] z-0"></div>
                )}

                {/* 2. DÂY CONG RẼ NHÁNH (Vẽ từ đỉnh thẻ xuống đúng tâm avatar rồi bẻ ngang) */}
                <div className="absolute top-0 left-[-24px] w-[24px] h-[16px] border-l-[1.5px] border-b-[1.5px] border-[#FF5722] rounded-bl-[16px] z-0"></div>
                
                {/* 3. DÂY DỌC XUYÊN SUỐT (Chỉ vẽ khi không phải comment cuối) */}
                {/* Sử dụng calc(100% - 4px) để đâm thủng chính xác qua khoảng gap 12px mà không phụ thuộc vào bottom */}
                {!isLast && (
                  <div className="absolute top-[16px] left-[-24px] w-[1.5px] h-[calc(100%-4px)] bg-[#FF5722] z-0"></div>
                )}
                
                {/* 4. Chấm tròn điểm nhấn */}
                <div className="absolute top-[13.5px] left-[-2.5px] w-[5px] h-[5px] rounded-full bg-[#FF5722] z-0"></div>

                {/* Reply Content (Giữ nguyên của bạn) */}
                <div className="flex gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0">
                    <img src={reply.avatarUrl || "https://ui-avatars.com/api/?name=" + reply.fullName} alt={reply.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-[13px]">{reply.fullName}</span>
                      {isOwner && reply.userId === video.ownerUserId && (
                        <span className="text-[10px] text-[#FF5722] border border-[#FF5722] rounded px-1.5 py-0.5 font-medium">Tác giả</span>
                      )}
                      <span className="text-gray-400 text-xs">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-white text-sm mt-1">{reply.content}</p>
                    
                    {/* Buttons Action... */}
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => handleReplyLike(commentId, reply.id, true)} className="flex items-center gap-1.5 text-gray-400 hover:text-white cursor-pointer">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs">{reply.likesCount > 0 ? reply.likesCount.toLocaleString('vi-VN') : ''}</span>
                      </button>
                      <button onClick={() => handleReplyLike(commentId, reply.id, false)} className="text-gray-400 hover:text-white cursor-pointer">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setReplyingTo(replyingTo === reply.id ? null : reply.id); setReplyText(`@${reply.fullName} `); }} className="text-gray-400 hover:text-white text-xs font-medium cursor-pointer ml-2">
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Reply Input */}
                {renderReplyInput(reply.id, commentId)}
                
                {/* Recursive Children */}
                {renderReplyTree(reply.children, commentId, level + 1)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#0F0F0F] overflow-y-auto custom-scrollbar flex justify-center">
      <div className="flex flex-col lg:flex-row px-4 md:px-8 py-6 gap-3 xl:gap-8 w-full max-w-[1800px]">
        {/* Left Column - Main Video Content */}
        <div className="flex-1 max-w-[1280px] lg:w-[70%] xl:w-[75%]">
        {/* Video Player */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
          <video 
            src={video.videoUrl} 
            poster={video.thumbnailUrl}
            controls 
            autoPlay 
            className="w-full h-full object-contain"
          ></video>
        </div>

        {/* Video Info */}
        <div className="mt-3">
          <h1 className="text-xl md:text-1xl font-bold text-white mb-2">
            {video.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Channel Info */}
            <div className="flex items-center gap-4">
              <Link to={`/c/${video.channelHandle}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-[#2A2A2A]">
                  <img 
                    src={video.channelAvatarUrl || "https://ui-avatars.com/api/?name=" + video.channelName} 
                    alt={video.channelName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              <div className="flex flex-col">
                <Link to={`/c/${video.channelHandle}`} className="flex items-center gap-1.5 hover:text-gray-200 transition-colors">
                  <span className="font-bold text-white text-base">{video.channelName}</span>
                  {video.subscriberCount > 100000 && <CheckCircle2 className="w-4 h-4 text-gray-400 fill-gray-400/20" />}
                </Link>
                <span className="text-xs text-gray-400">{formatViews(subscriberCount)} người đăng ký</span>
              </div>
              
              {isOwner ? (
                <Link 
                  to="/admin" // Redirect to admin/studio for now
                  className="ml-2 px-4 py-2 rounded-full font-medium text-sm transition-colors bg-[#2A2A2A] text-white hover:bg-[#333333]"
                >
                  Tùy chỉnh
                </Link>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <button 
                    onClick={handleSubscribe}
                    className={`px-4 py-2 rounded-full font-bold text-[13px] transition-colors ${
                      isSubscribed ? 'bg-[#2A2A2A] text-white hover:bg-[#333333]' : 'bg-[#FF5722] text-white hover:brightness-110 shadow-lg shadow-[#FF5722]/20'
                    }`}
                  >
                    {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                  </button>
                  <button className="w-9 h-9 rounded-full bg-[#272727] hover:bg-[#3F3F3F] flex items-center justify-center transition-colors cursor-pointer">
                    <Bell className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap pb-2 md:pb-0">
              <div className="flex items-center bg-[#272727] hover:bg-[#3F3F3F] transition-colors rounded-full overflow-hidden">
                <button onClick={() => handleLike(true)} className={`flex items-center gap-2 px-4 py-2 text-white border-r border-white/20 hover:bg-white/10 cursor-pointer ${isLiked ? 'text-blue-500' : ''}`}>
                  <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-blue-500' : ''}`} />
                  <span className="text-sm font-medium">{likesCount ? likesCount.toLocaleString('vi-VN') : '0'}</span>
                </button>
                <button onClick={() => handleLike(false)} className={`px-4 py-2 text-white hover:bg-white/10 cursor-pointer ${isDisliked ? 'text-blue-500' : ''}`}>
                  <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-blue-500' : ''}`} />
                </button>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] transition-colors rounded-full text-white cursor-pointer">
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Chia sẻ</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    if (!requireAuth('Vui lòng đăng nhập để lưu video!')) return;
                    setShowSaveDropdown(prev => !prev);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3F3F3F] transition-colors rounded-full text-white cursor-pointer ${showSaveDropdown ? 'ring-2 ring-[#FF4E00]/50' : ''}`}
                >
                  <ListPlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Lưu</span>
                </button>
                {showSaveDropdown && (
                  <SaveToPlaylistDropdown
                    videoId={id}
                    onClose={() => setShowSaveDropdown(false)}
                  />
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="w-10 h-10 flex items-center justify-center bg-[#272727] hover:bg-[#3F3F3F] transition-colors rounded-full text-white cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {/* More Actions Dropdown */}
                {showMoreActions && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#272727] rounded-xl shadow-xl py-2 z-50">
                    <button 
                      onClick={() => {
                        setShowMoreActions(false);
                        if (!requireAuth('Vui lòng đăng nhập để tải video!')) return;
                        addDownload({
                          id: video.id,
                          title: video.title,
                          thumbnailUrl: video.thumbnailUrl,
                          duration: video.duration,
                          viewsCount: video.viewsCount,
                          channelName: video.channelName,
                          channelHandle: video.channelHandle,
                        });
                        alert('Đã lưu vào danh sách tải xuống!');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#3F3F3F] transition-colors text-white cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-sm font-medium">Tải xuống</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowMoreActions(false);
                        if (!requireAuth('Vui lòng đăng nhập để báo cáo vi phạm!')) return;
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#3F3F3F] transition-colors text-white cursor-pointer"
                    >
                      <Flag className="w-5 h-5" />
                      <span className="text-sm font-medium">Báo vi phạm</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="mt-6 bg-[#272727] hover:bg-[#3F3F3F] transition-colors rounded-xl p-4 cursor-pointer" onClick={() => setShowFullDescription(!showFullDescription)}>
          <div className="text-sm text-white font-medium mb-2">
            <span>{video.viewsCount ? video.viewsCount.toLocaleString('vi-VN') : '0'} lượt xem</span>
            <span className="mx-2">•</span>
            <span>Đã công chiếu {formatDate(video.createdAt)}</span>
            <span className="mx-2 text-[#3EA6FF]">#Gaming #4K</span>
          </div>
          <div className={`text-sm text-white/90 whitespace-pre-wrap ${!showFullDescription ? 'line-clamp-2' : ''}`}>
            {video.description || "Diving deep into the neon-lit streets. Showcasing the absolute max settings on the new RTX 5090. Make sure to hit that like button!"}
          </div>
          {!showFullDescription && (
            <button className="text-sm font-medium text-white mt-1 hover:underline cursor-pointer">
              Hiện thêm
            </button>
          )}
          {showFullDescription && (
            <button className="text-sm font-medium text-white mt-1 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowFullDescription(false); }}>
              Ẩn bớt
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <div className="flex items-center gap-6 mb-6 relative">
            <h3 className="text-lg font-bold text-white">
              {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)} bình luận
            </h3>
            <div className="relative">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 text-white font-medium hover:bg-[#272727] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z"></path></svg>
                Sắp xếp theo
              </button>

              {/* Sort Dropdown */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-[#272727] rounded-xl shadow-xl py-2 z-50">
                  <button 
                    onClick={() => { setSortBy('top'); setShowSortDropdown(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#3F3F3F] transition-colors cursor-pointer ${sortBy === 'top' ? 'bg-[#3F3F3F]' : ''}`}
                  >
                    <div className="text-white text-sm font-medium">Nổi bật nhất</div>
                    <div className="text-gray-400 text-xs mt-1">Hiện bình luận nổi bật</div>
                  </button>
                  <button 
                    onClick={() => { setSortBy('newest'); setShowSortDropdown(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#3F3F3F] transition-colors cursor-pointer ${sortBy === 'newest' ? 'bg-[#3F3F3F]' : ''}`}
                  >
                    <div className="text-white text-sm font-medium">Mới nhất</div>
                    <div className="text-gray-400 text-xs mt-1">Hiện bình luận gần đây, bao gồm cả những mục có thể là bình luận rác</div>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 items-start mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden shrink-0">
              <img src={localStorage.getItem('avatar') || "https://ui-avatars.com/api/?name=You&background=random"} alt="Your avatar" />
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
                placeholder="Thêm bình luận..." 
                className="w-full bg-transparent border-b border-gray-600 focus:border-white text-white pb-1 focus:outline-none transition-colors text-sm"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setCommentText('')} className="px-4 py-2 text-white hover:bg-[#272727] rounded-full text-sm font-medium transition-colors cursor-pointer">Hủy</button>
                <button onClick={handleComment} disabled={!commentText.trim()} className={`px-4 py-2 rounded-full text-sm font-medium ${commentText.trim() ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600' : 'bg-[#272727] text-gray-400 cursor-not-allowed'}`}>Bình luận</button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="flex flex-col mb-6 relative">
                
                {/* Parent Comment */}
                <div className="flex gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0 z-10">
                    <img src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${comment.fullName}`} alt={comment.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-[13px]">{comment.fullName}</span>
                      {isOwner && comment.userId === video.ownerUserId && (
                        <span className="text-[10px] text-[#FF5722] border border-[#FF5722] rounded px-1.5 py-0.5 font-medium">Tác giả</span>
                      )}
                      <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-white text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => handleCommentLike(comment.id, true)} className="flex items-center gap-1.5 text-gray-400 hover:text-white cursor-pointer">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs">{comment.likesCount > 0 ? comment.likesCount.toLocaleString('vi-VN') : ''}</span>
                      </button>
                      <button onClick={() => handleCommentLike(comment.id, false)} className="text-gray-400 hover:text-white cursor-pointer">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-gray-400 hover:text-white text-xs font-medium cursor-pointer ml-2"
                      >
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Reply Input for Parent Comment */}
                {renderReplyInput(comment.id, comment.id)}

                {/* Replies List */}
                {expandedReplies[comment.id] && renderReplyTree(buildReplyTree(comment.replies), comment.id)}

                {/* Replies Toggle Button */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 ml-[44px]">
                    <button 
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-2 text-[#3ea6ff] hover:bg-[#3ea6ff]/10 px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-fit cursor-pointer"
                    >
                      {expandedReplies[comment.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {expandedReplies[comment.id] ? 'Ẩn phản hồi' : `${comment.replies.length} phản hồi`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        </div>{/* closes left column */}

      {/* Right Column - Up Next Sidebar */}
      <div className="lg:w-[30%] xl:w-[25%]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Tiếp theo</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">Tự động phát</span>
            <button 
              onClick={() => setAutoplay(!autoplay)}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${autoplay ? 'bg-[#FF5722]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${autoplay ? 'left-[22px]' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
        <div className="border-t border-white/10 pt-5">
          {/* Same Channel - Top 5 */}
          {sameChannelVideos.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {sameChannelVideos.map((recVideo) => (
                <Link to={recVideo.isShort ? `/shorts?id=${recVideo.id}` : `/watch/${recVideo.id}`} key={recVideo.id} className="flex gap-2 group">
                  <div className="w-40 md:w-44 h-[90px] md:h-[100px] rounded-xl overflow-hidden shrink-0 relative bg-[#1A1A1A]">
                    <img src={recVideo.thumbnailUrl} alt={recVideo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                      {Math.floor(recVideo.duration / 60)}:{(recVideo.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 py-0.5">
                    <h5 className="text-white text-[13px] font-semibold line-clamp-2 leading-tight group-hover:text-[#FF5722] transition-colors">{recVideo.title}</h5>
                    <span className="text-gray-400 text-xs mt-1">{recVideo.channelName}</span>
                    <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5 flex-wrap">
                      <span>{formatViews(recVideo.viewsCount)} lượt xem</span>
                      <span>•</span>
                      <span>{formatDate(recVideo.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        {recommendedVideos.filter(v => v.isShort).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Shorts</h3>
              <button className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                Xem tất cả
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {recommendedVideos.filter(v => v.isShort).slice(0, 3).map((short) => (
                <div key={short.id} onClick={() => navigate(`/shorts?id=${short.id}`)} className="cursor-pointer group flex flex-col gap-2">
                  <div className="relative w-full aspect-[4/6] rounded-xl overflow-hidden bg-[#1A1A1A]">
                    <img src={short.thumbnailUrl} alt={short.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* Top left Zap icon */}
                    <div className="absolute top-2 left-2 drop-shadow-md">
                      <Zap className="w-4 h-4 text-white fill-white" />
                    </div>

                    {/* Time badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
                      {Math.floor(short.duration / 60)}:{(short.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  
                  <div className="flex flex-col px-1 mt-1">
                    <h5 className="text-white text-[13px] font-medium line-clamp-2 leading-tight group-hover:text-[#FF5722] transition-colors">
                      {short.title}
                    </h5>
                    <span className="text-gray-400 text-xs mt-0.5">{formatViews(short.viewsCount)} lượt xem</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Long Videos */}
        <div className="flex flex-col gap-3">
          {recommendedVideos.filter(v => !v.isShort).map((recVideo) => (
            <Link to={recVideo.isShort ? `/shorts?id=${recVideo.id}` : `/watch/${recVideo.id}`} key={recVideo.id} className="flex gap-2 group">
              <div className="w-40 md:w-44 h-[90px] md:h-[100px] rounded-xl overflow-hidden shrink-0 relative bg-[#1A1A1A]">
                <img src={recVideo.thumbnailUrl} alt={recVideo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                  {Math.floor(recVideo.duration / 60)}:{(recVideo.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-col flex-1 py-0.5">
                <h5 className="text-white text-[13px] font-semibold line-clamp-2 leading-tight group-hover:text-[#FF5722] transition-colors">{recVideo.title}</h5>
                <span className="text-gray-400 text-xs mt-1">{recVideo.channelName}</span>
                <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5 flex-wrap">
                  <span>{formatViews(recVideo.viewsCount)} lượt xem</span>
                  <span>•</span>
                  <span>{formatDate(recVideo.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>{/* closes border-t wrapper */}
      </div>{/* closes right column */}
      </div>{/* closes flex container */}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div 
            className="bg-[#212121] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Báo vi phạm video này</h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-300 font-medium">Chọn một lý do chính xác nhất:</p>
                
                {[
                  "Nội dung tình dục hoặc bạo lực",
                  "Ngôn từ thù ghét, quấy rối",
                  "Spam hoặc lừa đảo",
                  "Xâm phạm quyền riêng tư",
                  "Vi phạm bản quyền",
                  "Lý do khác"
                ].map(reason => (
                  <label 
                    key={reason} 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setReportReason(reason)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${reportReason === reason ? 'border-[#FF5722]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {reportReason === reason && <div className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />}
                    </div>
                    <span className={`text-sm ${reportReason === reason ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{reason}</span>
                  </label>
                ))}
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-300 font-medium mb-2">Chi tiết thêm (Không bắt buộc):</p>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Cung cấp thêm thông tin giúp chúng tôi hiểu rõ hơn..."
                  className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF5722]/50 resize-none h-24"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-[#1A1A1A]">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 rounded-full transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleReportSubmit}
                disabled={isSubmittingReport}
                className="px-4 py-2 text-sm font-semibold bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

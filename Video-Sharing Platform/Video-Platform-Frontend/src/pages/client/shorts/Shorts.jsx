import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Heart, MessageCircle, Share2, Bookmark,
  Volume2, VolumeX, Play, Pause, Music2, ChevronDown, ChevronUp,
  X, ThumbsUp, ThumbsDown, ListFilter, MoreVertical
} from 'lucide-react';


// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCount = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const formatTime = (secs) => {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ─── Short Item ───────────────────────────────────────────────────────────────
function ShortItem({ short, isActive, isMuted, onMuteToggle, showComments, onToggleComments, onCloseComments }) {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const flashTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(short.isLiked || false);
  const [saved, setSaved] = useState(short.isSaved || false);
  const [followed, setFollowed] = useState(short.isSubscribed || false);
  const [likeCount, setLikeCount] = useState(short.likesCount || 0);
  const [showFlash, setShowFlash] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(short.commentsCount || 0);

  // Fetch comments when panel opens
  useEffect(() => {
    if (showComments && comments.length === 0) {
      setLoadingComments(true);
      axios.get(`/api/videos/${short.id}/comments`)
        .then(res => setComments(res.data))
        .catch(console.error)
        .finally(() => setLoadingComments(false));
    }
  }, [showComments, short.id, comments.length]);

  // Auto play/pause when active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [isActive]);

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    const onLoaded = () => setDuration(video.duration);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onLoaded);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
    setShowFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setShowFlash(false), 700);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập!');
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((c) => newLikedState ? c + 1 : c - 1);
    try {
      await axios.post(`/api/videos/${short.id}/like`, { isLike: newLikedState }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to like', err);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để lưu!');
    const newSavedState = !saved;
    setSaved(newSavedState);
    try {
      await axios.post(`/api/playlists/save`, { videoId: short.id }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập!');
    const newFollowedState = !followed;
    setFollowed(newFollowedState);
    try {
      await axios.post(`/api/channels/${short.channelId}/follow`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to follow', err);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return alert('Vui lòng đăng nhập để bình luận!');
    try {
      const res = await axios.post(`/api/videos/${short.id}/comments`, { content: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      setComments([res.data, ...comments]);
      setCommentCount(c => c + 1);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
  };

  return (
    <div className={`w-full h-full flex items-center justify-center select-none relative overflow-hidden transition-all duration-300 ease-in-out ${showComments ? 'pr-[340px]' : 'pr-0'}`}>
      <div className="flex items-end gap-5 w-full max-w-[1150px] justify-center px-2 sm:px-4">
        <div className="flex flex-col gap-3 flex-1 min-w-[150px] max-w-[360px] pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/c/${short.channelHandle}`} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <img src={short.channelAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${short.channelName}`} alt={short.channelName} className="w-full h-full object-cover" />
              </div>
              <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                {short.channelHandle}
              </span>
            </Link>
            {!followed ? (
              <button
                onClick={handleFollow}
                className="ml-2 px-3 py-1 bg-white text-black text-[13px] font-semibold rounded-full hover:bg-white/90 transition-colors cursor-pointer"
              >
                Đăng ký
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className="ml-2 px-3 py-1 bg-white/10 text-white/90 text-[13px] font-semibold rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                Đã đăng ký
              </button>
            )}
          </div>
          <h3 className="text-white text-sm font-bold leading-snug line-clamp-3">
            {short.title}
          </h3>
          {short.description && (
            <p className="text-white/55 text-xs leading-relaxed line-clamp-2">
              {short.description}
            </p>
          )}
          {/* Music */}
          <div className="flex items-center gap-1.5">
            <Music2 className="w-3 h-3 text-white/60 shrink-0" />
            <span className="text-white/60 text-[11px] truncate">{short.music}</span>
          </div>
        </div>

        {/* ── CENTER: Video frame (clean — no info overlay) ── */}
        <div
          className="relative rounded-xl overflow-hidden bg-[#111] shadow-[0_12px_60px_rgba(0,0,0,0.8)] flex-shrink-0 cursor-pointer"
          style={{ height: 'min(calc(100vh - 100px), 620px)', aspectRatio: '9/16' }}
          onClick={togglePlay}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            src={short.videoUrl}
            poster={short.thumbnailUrl}
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Subtle bottom gradient just for progress bar readability */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

          {/* ── Top-left controls: play/pause + mute ── */}
          <div
            className="absolute top-3 left-3 flex gap-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white fill-white" />
                : <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              }
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMuteToggle(); }}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-white" />
                : <Volume2 className="w-4 h-4 text-white" />
              }
            </button>
          </div>

          {/* ── Play/Pause flash animation ── */}
          {showFlash && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div
                className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center"
                style={{ animation: 'shortFlash 0.6s ease-out forwards' }}
              >
                {isPlaying
                  ? <Pause className="w-8 h-8 text-white fill-white" />
                  : <Play className="w-8 h-8 text-white fill-white ml-1" />
                }
              </div>
            </div>
          )}

          {/* Info removed from inside video — now in left column */}


          {/* ── Progress bar with time — very bottom of video ── */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Time display */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/70 text-[10px] font-mono tabular-nums">{formatTime(currentTime)}</span>
              {/* Seekable bar */}
              <div
                ref={progressBarRef}
                className="flex-1 h-[3px] bg-white/25 rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white/70 text-[10px] font-mono tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Buttons wrapper — same width as info panel → video stays centered ── */}
        <div className="flex-1 min-w-[150px] max-w-[360px] pb-8 flex flex-col items-start">
          <div className="flex flex-col gap-3 items-start">

            {/* Like */}
            <button onClick={handleLike} className="flex flex-col items-center gap-1 cursor-pointer group w-11">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                ${liked ? 'bg-red-500/20' : 'bg-white/[0.07] group-hover:bg-white/15'}`}>
                <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} />
              </div>
              <span className="text-white/80 text-[11px] font-semibold">{formatCount(likeCount)}</span>
            </button>

            {/* Comment */}
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleComments(); }} 
              className="flex flex-col items-center gap-1 cursor-pointer group w-11"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                ${showComments ? 'bg-white/20' : 'bg-white/[0.07] group-hover:bg-white/15'}`}>
                <MessageCircle className={`w-5 h-5 transition-all duration-200 ${showComments ? 'text-white fill-white' : 'text-white'}`} />
              </div>
              <span className="text-white/80 text-[11px] font-semibold">{formatCount(commentCount)}</span>
            </button>

            {/* Share */}
            <button className="flex flex-col items-center gap-1 cursor-pointer group w-11">
              <div className="w-11 h-11 rounded-full bg-white/[0.07] group-hover:bg-white/15 flex items-center justify-center transition-all duration-200">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 text-[11px] font-semibold">Chia sẻ</span>
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className="flex flex-col items-center gap-1 cursor-pointer group w-11"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                ${saved ? 'bg-yellow-500/20' : 'bg-white/[0.07] group-hover:bg-white/15'}`}>
                <Bookmark className={`w-5 h-5 transition-all duration-200 ${saved ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
              </div>
              <span className="text-white/80 text-[11px] font-semibold">{formatCount(short.saves)}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Comments Panel (Right Slide-out) ── */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-[340px] bg-[#212121] border-l border-white/10 flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${showComments ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            Bình luận <span className="text-white/50 text-sm font-normal">{formatCount(commentCount)}</span>
          </h3>
          <div className="flex items-center gap-3">
            <button className="text-white hover:text-white/70 transition-colors p-1"><ListFilter className="w-5 h-5" /></button>
            <button onClick={onCloseComments} className="text-white hover:text-white/70 transition-colors p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-6 shorts-scroll">
          {loadingComments ? (
            <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
          ) : comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img src={c.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`} className="w-full h-full object-cover bg-white/10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/90 text-[13px] font-semibold">{c.fullName || "User"}</span>
                  <span className="text-white/50 text-[12px]">{formatTime(Math.floor((Date.now() - new Date(c.createdAt))/1000))}</span>
                </div>
                <p className="text-white text-[14px] leading-relaxed mb-2 pr-4">{c.content}</p>
                
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 group">
                    <ThumbsUp className="w-[15px] h-[15px] text-white/70 group-hover:text-white transition-colors" />
                    <span className="text-white/60 text-[12px]">{c.likesCount > 0 ? c.likesCount : ''}</span>
                  </button>
                  <button className="flex items-center gap-1 group">
                    <ThumbsDown className="w-[15px] h-[15px] text-white/70 group-hover:text-white transition-colors" />
                  </button>
                  <button className="text-white/80 text-[12px] font-semibold hover:text-white ml-2 transition-colors">
                    Phản hồi
                  </button>
                </div>
                {c.replies?.length > 0 && (
                   <button className="flex items-center gap-2 mt-3 text-[#3ea6ff] hover:bg-[#3ea6ff]/10 px-3 py-1.5 rounded-full text-sm font-medium transition-colors w-fit -ml-3">
                     <ChevronDown className="w-4 h-4" />
                     {c.replies.length} phản hồi
                   </button>
                )}
              </div>
              <button className="text-white/60 hover:text-white h-fit mt-1"><MoreVertical className="w-[18px] h-[18px]" /></button>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/10 flex gap-3 items-center bg-[#212121]">
          <div className="w-8 h-8 rounded-full shrink-0 bg-green-700 flex items-center justify-center font-bold text-white text-sm">
            You
          </div>
          <div className="flex-1 border-b border-white/20 pb-1.5 flex items-center gap-2 group focus-within:border-white transition-colors">
            <input 
              type="text" 
              placeholder="Thêm bình luận..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/50" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Shorts Page ──────────────────────────────────────────────────────────
export default function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [globalShowComments, setGlobalShowComments] = useState(false);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/videos/shorts', { headers });
        setShorts(res.data);
      } catch (err) {
        console.error("Error fetching shorts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShorts();
  }, []);

  // Detect active video via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.indexOf(entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goNext = useCallback(() => {
    if (activeIndex < shorts.length - 1)
      itemRefs.current[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIndex, shorts.length]);
  const goPrev = useCallback(() => {
    if (activeIndex > 0)
      itemRefs.current[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
      if (e.key === 'm' || e.key === 'M') setIsMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  if (loading) return <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-[#0F0F0F]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  if (shorts.length === 0) return <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-[#0F0F0F] text-white">Chưa có video ngắn nào</div>;

  return (
    <>
      <style>{`
        .shorts-scroll::-webkit-scrollbar { display: none; }
        .shorts-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shortFlash {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Scroll feed fills space below header */}
      <div
        ref={containerRef}
        className="shorts-scroll w-full overflow-y-scroll snap-y snap-mandatory bg-[#0F0F0F]"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {shorts.map((short, i) => (
          <div
            key={short.id}
            ref={(el) => (itemRefs.current[i] = el)}
            className="w-full snap-start snap-always"
            style={{ height: 'calc(100vh - 64px)' }}
          >
            <ShortItem
              short={short}
              isActive={i === activeIndex}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted((m) => !m)}
              showComments={globalShowComments}
              onToggleComments={() => setGlobalShowComments(prev => !prev)}
              onCloseComments={() => setGlobalShowComments(false)}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows — fixed, right side */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-none">
        <button
          onClick={goPrev}
          disabled={activeIndex === 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto
            ${activeIndex === 0
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] hover:scale-110 cursor-pointer shadow-lg'
            }`}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          disabled={activeIndex === shorts.length - 1}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto
            ${activeIndex === shorts.length - 1
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] hover:scale-110 cursor-pointer shadow-lg'
            }`}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

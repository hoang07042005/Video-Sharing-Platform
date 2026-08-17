import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  History, Trash2, Search, Clock, Eye, CheckCircle,
  PlayCircle, Zap, ChevronRight, X, Loader2,
  BarChart2, Pause, ExternalLink, Filter, MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';

/* ── Helpers ──────────────────────────────────────────────────── */
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s >= 86400 * 30) return Math.floor(s / (86400 * 30)) + ' tháng trước';
  if (s >= 86400 * 7)  return Math.floor(s / (86400 * 7))  + ' tuần trước';
  if (s >= 86400)      return Math.floor(s / 86400)         + ' ngày trước';
  if (s >= 3600)       return Math.floor(s / 3600)          + ' giờ trước';
  if (s >= 60)         return Math.floor(s / 60)            + ' phút trước';
  return 'Vừa xong';
};
const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};
const formatDuration = (s) => {
  if (!s) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
};

// Group videos by date label
const groupByDate = (videos) => {
  const groups = {};
  videos.forEach(v => {
    const d = new Date(v.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    let label;
    if (diffDays === 0) label = 'Hôm nay';
    else if (diffDays === 1) label = 'Hôm qua';
    else if (diffDays < 7) label = 'Tuần này';
    else if (diffDays < 30) label = 'Tháng này';
    else label = 'Cũ hơn';
    if (!groups[label]) groups[label] = [];
    groups[label].push(v);
  });
  const order = ['Hôm nay', 'Hôm qua', 'Tuần này', 'Tháng này', 'Cũ hơn'];
  return order.filter(k => groups[k]).map(k => ({ label: k, videos: groups[k] }));
};

/* ── Video Row ──────────────────────────────────────────────────  */
function HistoryVideoRow({ video, onRemove }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group flex gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-xl px-2 -mx-2 transition-colors">
      {/* Thumbnail */}
      <div
        onClick={() => navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}${video.watchedDuration ? `?t=${video.watchedDuration}` : ''}`)}
        className="relative shrink-0 w-[200px] aspect-video rounded-xl overflow-hidden bg-[#1A1A1A] cursor-pointer"
      >
        {!imgErr && video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="w-8 h-8 text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/85 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
          {formatDuration(video.duration)}
        </div>
        {video.isShort && (
          <div className="absolute top-1 left-1 bg-[#FF5722]/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> Shorts
          </div>
        )}
        {/* Progress bar */}
        {video.watchedDuration > 0 && video.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
            <div className="h-full bg-[#FF5722]" style={{ width: `${Math.min(100, (video.watchedDuration / video.duration) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <Link to={video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`}>
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 hover:text-[#FF5722] transition-colors mb-1.5">
            {video.title}
          </h3>
        </Link>
        <Link to={`/c/${video.channelHandle}`}
          className="flex items-center gap-1 text-gray-400 text-xs hover:text-white transition-colors mb-1 w-fit">
          {video.channelAvatarUrl ? (
            <img src={video.channelAvatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
          ) : null}
          {video.channelName}
          <CheckCircle className="w-3 h-3 text-[#FF5722] fill-[#FF5722]" />
        </Link>
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Eye className="w-3 h-3" />
          <span>{formatViews(video.viewsCount)} lượt xem</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{timeAgo(video.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 pt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[180px] overflow-hidden">
              <button
                onClick={() => { onRemove(video.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Xoá khỏi lịch sử
              </button>
              <button
                onClick={() => { navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Xem lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shorts Row ─────────────────────────────────────────────────  */
function ShortThumb({ video }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      onClick={() => navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`)}
      className="shrink-0 w-[140px] md:w-[160px] cursor-pointer group"
    >
      <div className="relative w-full aspect-[4/6] rounded-xl overflow-hidden bg-[#1A1A1A]">
        {!imgErr && video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-gray-600" />
          </div>
        )}
        
        {/* Top left Zap icon */}
        <div className="absolute top-2 left-2 drop-shadow-md">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>

        {/* Time badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Bottom gradient progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-white/10">
          <div className="h-full w-[65%]" style={{ background: 'linear-gradient(to right, #FF5722, #9C27B0)' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────  */
export default function WatchHistory() {
  const navigate = useNavigate();
  const [allVideos, setAllVideos] = useState([]);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(Boolean(token));
  const [notLoggedIn, setNotLoggedIn] = useState(!token);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'long' | 'shorts'
  const [paused, setPaused] = useState(localStorage.getItem('pauseHistory') === 'true');
  const [showCount, setShowCount] = useState(10);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    axios.get('/api/videos/history', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => { if (!mounted) return; setAllVideos(r.data); setLoading(false); })
      .catch(err => {
        if (!mounted) return;
        if (err.response?.status === 401) setNotLoggedIn(true);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [token]);

  const removeVideo = (id) => setAllVideos(prev => prev.filter(v => v.id !== id));
  const clearAll = async () => {
    if (window.confirm('Xoá tất cả lịch sử xem?')) {
      try {
        await axios.delete('/api/videos/history', { headers: { Authorization: 'Bearer ' + token } });
        setAllVideos([]);
        toast.success('Đã xoá toàn bộ lịch sử xem');
      } catch {
        toast.error('Lỗi khi xoá lịch sử xem');
      }
    }
  };
  
  const togglePause = () => {
    const newState = !paused;
    setPaused(newState);
    localStorage.setItem('pauseHistory', newState);
    toast.success(newState ? 'Đã tạm dừng lưu lịch sử xem' : 'Đã tiếp tục lưu lịch sử xem');
  };

  const handleManageActivity = () => {
    toast.info('Tính năng Quản lý hoạt động đang được phát triển');
  };

  // Filter by tab
  const tabFiltered = useMemo(() => {
    if (activeTab === 'shorts') return allVideos.filter(v => v.isShort);
    if (activeTab === 'long') return allVideos.filter(v => !v.isShort);
    return allVideos;
  }, [allVideos, activeTab]);

  const shortVideos = useMemo(() => allVideos.filter(v => v.isShort), [allVideos]);
  const longVideos  = useMemo(() => allVideos.filter(v => !v.isShort), [allVideos]);

  // Search within tab
  const filtered = useMemo(() =>
    tabFiltered.filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.channelName || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [tabFiltered, searchQuery]
  );

  const grouped = useMemo(() => groupByDate(filtered.slice(0, showCount)), [filtered, showCount]);

  // Stats
  const totalHours = Math.floor(allVideos.reduce((s, v) => s + (v.duration || 0), 0) / 3600);
  const totalMins  = Math.floor((allVideos.reduce((s, v) => s + (v.duration || 0), 0) % 3600) / 60);

  // Bar chart mock data (last 7 days buckets from real data)
  const days = ['CN','T2','T3','T4','T5','T6','T7'];
  const barData = [...Array(7)].map((_, i) => {
    const targetDay = new Date();
    targetDay.setDate(targetDay.getDate() - (6 - i));
    const label = days[targetDay.getDay()];
    const count = allVideos.filter(v => {
      const d = new Date(v.createdAt);
      return d.toDateString() === targetDay.toDateString();
    }).length;
    return { label, count };
  });
  const maxBar = Math.max(...barData.map(b => b.count), 1);

  /* ── Not logged in ── */
  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center">
          <History className="w-9 h-9 text-gray-600" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">Lịch sử xem</p>
          <p className="text-gray-500 text-sm">Đăng nhập để xem lịch sử các video bạn đã xem</p>
        </div>
        <button onClick={() => navigate('/login')}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl cursor-pointer"
          style={{ background: 'linear-gradient(to right,#FF5722,#E91E63)' }}>
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-20">

      {/* ── HEADER ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#9C27B0,#FF5722)' }}>
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Lịch sử xem</h1>
            <p className="text-gray-400 text-sm mt-0.5">Những video bạn đã xem gần đây</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center bg-[#161616] border border-white/8 rounded-full px-4 py-2 gap-2 w-64">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm trong lịch sử xem"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder:text-gray-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#161616] border border-white/8 rounded-full text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mb-6">
        <div className="flex items-center gap-1 border-b border-white/8">
          {[
            { key: 'all',    label: 'Tất cả',    count: allVideos.length },
            { key: 'long',   label: 'Video dài', count: longVideos.length },
            { key: 'shorts', label: 'Shorts',    count: shortVideos.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowCount(10); }}
              className={`pb-3 px-4 text-sm font-medium transition-all cursor-pointer border-b-2 ${
                activeTab === tab.key
                  ? 'border-[#FF5722] text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex gap-8">

        {/* ── LEFT: Video list ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 text-[#FF5722] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <History className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'Không tìm thấy video nào' : 'Chưa có video nào trong lịch sử'}
              </p>
            </div>
          ) : (
            <>
              {grouped.map(group => (
                <div key={group.label} className="mb-8">
                  {/* Date group label */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[#FF5722]" />
                    <h2 className="text-white font-bold text-[15px]">{group.label}</h2>
                  </div>

                  {/* Videos */}
                  <div>
                    {group.videos.filter(v => !v.isShort).map(v => (
                      <HistoryVideoRow key={v.id} video={v} onRemove={removeVideo} />
                    ))}
                  </div>

                  {/* Shorts strip inside the group */}
                  {group.videos.some(v => v.isShort) && activeTab !== 'long' && (
                    <div className="mt-6 mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-[#FF5722] fill-[#FF5722]" />
                        <span className="text-white text-[15px] font-bold">Shorts đã xem</span>
                      </div>
                      <div className="flex items-center gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                        {group.videos.filter(v => v.isShort).map(v => (
                          <ShortThumb key={v.id} video={v} />
                        ))}
                        <button className="shrink-0 w-10 h-10 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] flex items-center justify-center text-white transition-colors cursor-pointer">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Load more */}
              {showCount < filtered.length && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowCount(c => c + 10)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] border border-white/8 rounded-full text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    Xem thêm <ChevronRight className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-6 space-y-5">

            {/* Stats card */}
            <div className="border-b border-white/8 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#FF5722]" /> Thống kê xem
                </h3>
                <span className="text-[11px] text-gray-500 bg-[#1A1A1A] px-2 py-1 rounded-full">7 ngày qua</span>
              </div>

              <div className="mb-1">
                <p className="text-2xl font-extrabold text-white">{totalHours} giờ {totalMins} phút</p>
                <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                  Tổng thời gian xem
                  <span className="text-emerald-400 font-semibold">↑ 18%</span>
                </p>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-[80px] mt-5 mb-2">
                {barData.map((b, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${(b.count / maxBar) * 60}px`,
                        minHeight: 4,
                        background: i >= 5
                          ? 'linear-gradient(to top,#FF5722,#E91E63)'
                          : 'linear-gradient(to top,#9C27B0,#673AB7)',
                      }}
                    />
                    <span className="text-[10px] text-gray-600">{b.label}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-white border border-white/8 rounded-xl transition-colors cursor-pointer">
                Xem thống kê chi tiết
              </button>
            </div>

            {/* Manage */}
            {/* Filter by type */}
            <div className="border-b border-white/8 p-5">
              <h3 className="text-sm font-bold text-white mb-4">Quản lý lịch sử</h3>
              <div className="space-y-1">
                <button
                  onClick={clearAll}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  Xoá tất cả lịch sử xem
                </button>
                <button
                  onClick={togglePause}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Pause className="w-4 h-4 shrink-0" />
                    Tạm dừng lịch sử xem
                  </span>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${paused ? 'bg-[#FF5722]' : 'bg-[#2A2A2A]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${paused ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </button>
                <button onClick={handleManageActivity} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Quản lý hoạt động
                </button>
              </div>
            </div>

            {/* Filter by type */}
            <div className="border-b border-white/8 p-5">
              <h3 className="text-sm font-bold text-white mb-4">Lọc theo loại</h3>
              <div className="space-y-1">
                {[
                  { key: 'all',    label: 'Tất cả',    count: allVideos.length,    icon: History },
                  { key: 'long',   label: 'Video dài', count: longVideos.length,   icon: PlayCircle },
                  { key: 'shorts', label: 'Shorts',    count: shortVideos.length,  icon: Zap },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveTab(item.key); setShowCount(10); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                      activeTab === item.key
                        ? 'bg-[#2A1610] text-white border border-[#FF5722]/50 shadow-sm'
                        : 'text-gray-400 border border-transparent hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${activeTab === item.key ? 'text-[#FF5722]' : ''}`} />
                      {item.label}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${activeTab === item.key ? 'bg-[#FF5722]/20 text-[#FF5722]' : 'bg-[#1A1A1A] text-gray-500'}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

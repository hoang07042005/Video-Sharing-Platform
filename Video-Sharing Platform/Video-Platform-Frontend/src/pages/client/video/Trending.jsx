import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, Flame, Eye, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatViews = (views) => {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)} Tr`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)} N`;
  return String(views);
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return `${Math.floor(diff / 2592000)} tháng trước`;
};

const FILTERS = [
  { key: 'all', label: 'Tất cả', icon: Flame },
  { key: 'music', label: 'Âm nhạc', icon: null },
  { key: 'gaming', label: 'Game', icon: null },
  { key: 'film', label: 'Phim & TV', icon: null },
];

// Rank badge colors
const getRankStyle = (rank) => {
  if (rank === 1) return { bg: 'bg-yellow-500', text: 'text-black', label: '#1' };
  if (rank === 2) return { bg: 'bg-gray-300', text: 'text-black', label: '#2' };
  if (rank === 3) return { bg: 'bg-amber-600', text: 'text-white', label: '#3' };
  return { bg: 'bg-[#2A2A2A]', text: 'text-gray-400', label: `#${rank}` };
};

export default function Trending() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/videos');
        // Already sorted by viewsCount desc from backend
        setVideos(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy video thịnh hành:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-[#1A0A00] via-[#0F0F0F]/80 to-[#0F0F0F] px-6 md:px-12 pt-10 pb-8 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#FF9800] flex items-center justify-center shadow-lg shadow-orange-900/40">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Thịnh hành</h1>
            <p className="text-gray-400 text-sm mt-1">Video được xem nhiều nhất trên nền tảng</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-[1400px] mx-auto mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.key
                  ? 'bg-white text-black'
                  : 'bg-[#272727] text-gray-300 hover:bg-[#3F3F3F]'
              }`}
            >
              {f.icon && <f.icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {videos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Chưa có video nào.</div>
        ) : (
          <>
            {/* Top 3 Featured */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-[#FF5722]" />
                <h2 className="text-lg font-bold text-white">Top thịnh hành</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {videos.slice(0, 3).map((video, idx) => {
                  const rank = getRankStyle(idx + 1);
                  return (
                    <div
                      key={video.id}
                      onClick={() => navigate(`/watch/${video.id}`)}
                      className="group cursor-pointer relative rounded-2xl overflow-hidden bg-[#161616] border border-white/5 hover:border-[#FF5722]/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/20"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnailUrl || 'https://via.placeholder.com/600x400?text=No+Thumbnail'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                          {formatDuration(video.duration || 0)}
                        </div>
                        {/* Rank badge */}
                        <div className={`absolute top-3 left-3 w-8 h-8 rounded-full ${rank.bg} ${rank.text} flex items-center justify-center text-xs font-extrabold shadow-md`}>
                          {idx + 1}
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-[#FF5722] transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Link
                            to={`/c/${video.channelHandle}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-white transition-colors"
                          >
                            {video.channelName}
                          </Link>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {formatViews(video.viewsCount)} lượt xem
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rest of trending list */}
            {videos.length > 3 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-bold text-white">Đang thịnh hành</h2>
                </div>
                <div className="space-y-2">
                  {videos.slice(3).map((video, idx) => {
                    const rank = getRankStyle(idx + 4);
                    return (
                      <div
                        key={video.id}
                        onClick={() => navigate(`/watch/${video.id}`)}
                        className="group flex gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        {/* Rank number */}
                        <div className={`w-8 text-center font-bold text-sm shrink-0 ${rank.text}`}>
                          {idx + 4}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-[120px] md:w-[180px] aspect-video rounded-xl overflow-hidden bg-[#212121]">
                          <img
                            src={video.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-xs text-white">
                            {formatDuration(video.duration || 0)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 mb-1 group-hover:text-[#FF5722] transition-colors">
                            {video.title}
                          </h3>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-gray-400 text-xs md:text-sm">
                            <Link
                              to={`/c/${video.channelHandle}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-white transition-colors"
                            >
                              {video.channelName}
                            </Link>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> {formatViews(video.viewsCount)} lượt xem
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span>{getTimeAgo(video.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

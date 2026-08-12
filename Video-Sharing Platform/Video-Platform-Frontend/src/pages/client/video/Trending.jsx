import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, Flame, Eye, Clock, MoreVertical, ChevronDown, LayoutList, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
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
  if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace('.', ',')} Tr`;
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace('.', ',')} N`;
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
  { key: 'all', label: 'Tất cả' },
  { key: 'music', label: 'Âm nhạc' },
  { key: 'gaming', label: 'Game' },
  { key: 'film', label: 'Phim & TV' },
  { key: 'tech', label: 'Công nghệ' },
  { key: 'edu', label: 'Giáo dục' },
  { key: 'life', label: 'Đời sống' },
];
// Rank badge colors
const getRankStyle = (rank) => {
  if (rank === 1) return { bg: 'bg-[#FFC107]', text: 'text-white' };
  if (rank === 2) return { bg: 'bg-white', text: 'text-[#1A1A1A]' };
  if (rank === 3) return { bg: 'bg-[#FF9800]', text: 'text-white' };
  return { bg: 'bg-transparent', text: 'text-gray-400' };
};

export default function Trending() {
  const [videos, setVideos] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const [videosRes, catsRes] = await Promise.all([
          axios.get('/api/videos'),
          axios.get('/api/videos/categories')
        ]);
        // Already sorted by viewsCount desc from backend
        setVideos(videosRes.data);
        setDbCategories(catsRes.data);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
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

  const FILTERS = [{ key: 'all', label: 'Tất cả' }, ...dbCategories.map(cat => ({ key: cat.name, label: cat.name }))];
  const displayedVideos = activeFilter === 'all' ? videos : videos.filter(v => {
    const cat = dbCategories.find(c => c.id === v.categoryId);
    return cat?.name === activeFilter;
  });

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
              className={`flex items-center gap-1.5 px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.key
                  ? 'bg-[#FF4E00] text-white'
                  : 'bg-[#272727] text-gray-300 hover:bg-[#3F3F3F]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {displayedVideos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Chưa có video nào.</div>
        ) : (
          <>
            {/* Top 3 Featured */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF5722]" />
                  <h2 className="text-lg font-bold text-white">Top thịnh hành</h2>
                </div>
                <button className="px-4 py-1.5 rounded-full bg-[#272727] hover:bg-[#3F3F3F] text-sm text-gray-300 font-medium transition-colors">
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedVideos.slice(0, 3).map((video, idx) => {
                  const rank = getRankStyle(idx + 1);
                  return (
                    <div
                      key={video.id}
                      onClick={() => navigate(`/watch/${video.id}`)}
                      className="group cursor-pointer relative rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden shrink-0">
                        <img
                          src={video.thumbnailUrl || 'https://via.placeholder.com/600x400?text=No+Thumbnail'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                          {formatDuration(video.duration || 0)}
                        </div>
                        {/* Rank badge */}
                        <div className={`absolute top-3 left-3 w-7 h-7 rounded-full ${rank.bg} ${rank.text} flex items-center justify-center text-xs font-bold shadow-md`}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="flex gap-2 justify-between items-start">
                          <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 group-hover:text-[#FF5722] transition-colors leading-snug">
                            {video.title}
                          </h3>
                          <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 shrink-0">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-gray-400 text-xs mt-2.5">
                          <Link
                            to={`/c/${video.channelHandle}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-white transition-colors"
                          >
                            {video.channelName}
                          </Link>
                          <span className="text-[10px]">•</span>
                          <span>{formatViews(video.viewsCount)} lượt xem</span>
                          <span className="text-[10px]">•</span>
                          <span>{getTimeAgo(video.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rest of trending list */}
            {displayedVideos.length > 3 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FF5722]" />
                    <h2 className="text-lg font-bold text-white">Đang thịnh hành</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#272727] hover:bg-[#3F3F3F] text-sm text-gray-300 font-medium transition-colors">
                      Hôm nay <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 text-gray-400">
                      <button className="p-1.5 hover:text-white transition-colors"><LayoutList className="w-5 h-5" /></button>
                      <button className="p-1.5 hover:text-white transition-colors"><LayoutGrid className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 border-t border-white/5 pt-4">
                  {displayedVideos.slice(3).map((video, idx) => {
                    return (
                      <div
                        key={video.id}
                        onClick={() => navigate(`/watch/${video.id}`)}
                        className="group flex gap-4 md:gap-6 items-center p-3 rounded-2xl hover:bg-[#1A1A1A] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                      >
                        {/* Rank number */}
                        <div className="w-6 md:w-10 text-center text-gray-400 font-medium md:text-lg shrink-0">
                          {idx + 4}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative shrink-0 w-[140px] md:w-[220px] aspect-video rounded-xl overflow-hidden bg-[#212121]">
                          <img
                            src={video.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] md:text-xs text-white font-medium">
                            {formatDuration(video.duration || 0)}
                          </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between min-w-0 py-1 gap-2 md:gap-4">
                          <div className="flex flex-col min-w-0 pr-4">
                            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 mb-1.5 group-hover:text-[#FF5722] transition-colors leading-snug">
                              {video.title}
                            </h3>
                            <h4 className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                             {video.description}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-gray-400 text-xs md:text-sm">
                              <Link
                                to={`/c/${video.channelHandle}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-white transition-colors"
                              >
                                {video.channelName}
                              </Link>
                              <span className="text-[10px]">•</span>
                              <span>{formatViews(video.viewsCount)} lượt xem</span>
                              <span className="text-[10px]">•</span>
                              <span>{getTimeAgo(video.createdAt)}</span>
                            </div>
                          </div>
                          
                          {/* Right Side Info (Desktop) */}
                          <div className="hidden md:flex items-center gap-6 shrink-0 text-gray-400 group-hover:text-gray-300">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Eye className="w-4 h-4" /> {formatViews(video.viewsCount)} lượt xem
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); }} className="hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF4E00] text-white font-medium shadow-lg shadow-orange-900/20 cursor-pointer">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-pointer">
                    2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-pointer">
                    3
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center text-gray-500">
                    ...
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors cursor-pointer">
                    10
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

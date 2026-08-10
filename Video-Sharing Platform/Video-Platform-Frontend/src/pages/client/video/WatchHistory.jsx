import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, History, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const WatchHistory = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/videos/history', { headers });
        setVideos(res.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi lấy lịch sử:', err);
        if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập để xem lịch sử');
        } else {
          setError('Không thể tải lịch sử đã xem');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)} Tr`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)} N`;
    return views;
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    video.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1200px] mx-auto p-6 flex flex-col md:flex-row gap-8">
        
        {/* Main Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-6">Lịch sử xem</h1>
          
          {error ? (
            <div className="text-gray-400 text-center py-10">{error}</div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-gray-400 py-10 flex flex-col items-center">
              <History className="w-16 h-16 mb-4 opacity-50" />
              <p>Danh sách này không có video nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <div key={video.id} className="flex gap-4 group">
                  <Link to={`/watch/${video.id}`} className="relative shrink-0 w-[160px] md:w-[246px] aspect-video rounded-xl overflow-hidden bg-[#212121]">
                    <img 
                      src={video.thumbnailUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60"} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                      {formatDuration(video.duration)}
                    </div>
                  </Link>

                  <div className="flex-1 py-1">
                    <Link to={`/watch/${video.id}`}>
                      <h3 className="text-white font-medium text-sm md:text-lg line-clamp-2 mb-1 group-hover:text-[#3EA6FF] transition-colors">
                        {video.title}
                      </h3>
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center text-gray-400 text-xs md:text-sm gap-1 md:gap-2 mb-2">
                      <Link to={`/c/${video.channelHandle}`} className="hover:text-white transition-colors">
                        {video.channelName}
                      </Link>
                      <span className="hidden md:inline">•</span>
                      <span>{formatViews(video.viewsCount)} lượt xem</span>
                      <span className="hidden md:inline">•</span>
                      <span>{formatTimeAgo(video.createdAt)}</span>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm line-clamp-2 hidden md:-webkit-box">
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Settings (Youtube style) */}
        <div className="w-full md:w-[320px] shrink-0">
          <div className="sticky top-6">
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Tìm kiếm trong lịch sử xem"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#212121] text-white pl-4 pr-10 py-2 border-b border-transparent focus:border-[#FF5722] focus:outline-none transition-colors"
              />
              <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-4 text-sm font-medium">
              <button className="flex items-center gap-3 text-white hover:bg-white/10 w-full p-3 rounded-xl transition-colors cursor-pointer">
                <Trash2 className="w-5 h-5" />
                Xóa tất cả lịch sử xem
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WatchHistory;

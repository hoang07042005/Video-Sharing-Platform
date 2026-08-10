import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Bookmark, Play, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SavedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavedVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/playlists/saved', { headers });
        setVideos(res.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi lấy video đã lưu:', err);
        if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập để xem video đã lưu');
        } else {
          setError('Không thể tải video đã lưu');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSavedVideos();
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

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1200px] mx-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Playlist Info Sidebar */}
        <div className="w-full lg:w-[360px] shrink-0 bg-gradient-to-b from-[#333333] to-[#0F0F0F] rounded-2xl p-6 h-fit">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6 bg-black">
            {videos.length > 0 ? (
              <img 
                src={videos[0].thumbnailUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500"} 
                alt="Thumbnail" 
                className="w-full h-full object-cover opacity-80 blur-sm scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-gray-500" />
              </div>
            )}
            {videos.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img 
                  src={videos[0].thumbnailUrl || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500"} 
                  alt="Thumbnail" 
                  className="h-full aspect-video object-cover rounded-xl shadow-2xl"
                />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Xem sau</h1>
          <div className="text-sm text-gray-300 font-medium mb-1">Video đã lưu</div>
          <div className="text-xs text-gray-400 mb-6">{videos.length} video</div>
          
          <div className="flex items-center gap-3">
            <button 
              disabled={videos.length === 0}
              className="flex-1 bg-white text-black py-2 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" /> Phát tất cả
            </button>
            <button 
              disabled={videos.length === 0}
              className="flex-1 bg-white/10 text-white py-2 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <Shuffle className="w-5 h-5" /> Trộn bài
            </button>
          </div>
        </div>

        {/* Video List */}
        <div className="flex-1 pt-4">
          {error ? (
            <div className="text-gray-400 text-center py-10">{error}</div>
          ) : videos.length === 0 ? (
            <div className="text-gray-400 py-10 flex flex-col items-center">
              <Bookmark className="w-16 h-16 mb-4 opacity-50" />
              <p>Chưa có video nào được lưu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div key={video.id} className="flex gap-4 group p-2 hover:bg-white/5 rounded-xl transition-colors items-center">
                  <div className="w-6 text-center text-gray-400 font-medium hidden md:block">
                    {index + 1}
                  </div>
                  <Link to={`/watch/${video.id}`} className="relative shrink-0 w-[120px] md:w-[160px] aspect-video rounded-xl overflow-hidden bg-[#212121]">
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
                      <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 mb-1 group-hover:text-[#3EA6FF] transition-colors">
                        {video.title}
                      </h3>
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center text-gray-400 text-xs md:text-sm gap-1 md:gap-2">
                      <Link to={`/c/${video.channelHandle}`} className="hover:text-white transition-colors">
                        {video.channelName}
                      </Link>
                      <span className="hidden md:inline">•</span>
                      <span>{formatViews(video.viewsCount)} lượt xem</span>
                      <span className="hidden md:inline">•</span>
                      <span>{formatTimeAgo(video.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SavedVideos;

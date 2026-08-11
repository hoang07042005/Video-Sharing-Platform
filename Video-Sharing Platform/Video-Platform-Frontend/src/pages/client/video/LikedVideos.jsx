import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ThumbsUp, Play, Shuffle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'videos' | 'shorts'

  useEffect(() => {
    const fetchLikedVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Vui lòng đăng nhập để xem video đã thích');
          setLoading(false);
          return;
        }
        const res = await axios.get('/api/videos/liked', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVideos(res.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi lấy video đã thích:', err);
        if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập để xem video đã thích');
        } else {
          setError('Không thể tải video đã thích');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLikedVideos();
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
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace('.', ',')} Tr`;
    if (views >= 1000) return `${(views / 1000).toFixed(1).replace('.', ',')} N`;
    return String(views);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredVideos =
    activeTab === 'videos' ? videos.filter(v => !v.isShort) :
    activeTab === 'shorts' ? videos.filter(v => v.isShort) :
    videos;

  const normalCount = videos.filter(v => !v.isShort).length;
  const shortsCount = videos.filter(v => v.isShort).length;
  const coverVideo = videos[0];

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1200px] mx-auto p-6 flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="sticky top-6 bg-gradient-to-b from-[#FF4E00]/15 via-[#1A1A1A] to-[#1A1A1A] rounded-2xl p-6 border border-white/5">
            {/* Cover Art */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6 bg-[#212121]">
              {coverVideo ? (
                <>
                  <img
                    src={coverVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500'}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-40 blur-sm scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={coverVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500'}
                      alt="Cover"
                      className="h-full aspect-video object-cover rounded-xl shadow-2xl"
                    />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ThumbsUp className="w-12 h-12 text-gray-500" />
                </div>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#FF4E00] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-lg">
                <ThumbsUp className="w-3 h-3 fill-white" /> Video đã thích
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-[#FF4E00] fill-[#FF4E00] shrink-0" />
              Video đã thích
            </h1>

            {/* Stats */}
            {videos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Tổng', value: videos.length, color: 'text-white' },
                  { label: 'Video', value: normalCount, color: 'text-white' },
                  { label: 'Shorts', value: shortsCount, color: 'text-[#FF4E00]' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                disabled={videos.length === 0}
                className="flex-1 bg-white text-black py-2.5 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Phát tất cả
              </button>
              <button
                disabled={videos.length === 0}
                className="flex-1 bg-white/10 text-white py-2.5 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" /> Trộn bài
              </button>
            </div>
          </div>
        </div>

        {/* Video List */}
        <div className="flex-1 min-w-0">
          {/* Filter Tabs */}
          {!error && videos.length > 0 && (
            <div className="flex gap-2 mb-5">
              {[
                { key: 'all', label: 'Tất cả', count: videos.length },
                { key: 'videos', label: 'Video', count: normalCount },
                { key: 'shorts', label: 'Shorts', count: shortsCount },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#FF4E00] text-white'
                      : 'bg-[#272727] text-gray-300 hover:bg-[#3F3F3F]'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div className="text-gray-400 text-center py-16 flex flex-col items-center gap-4">
              <ThumbsUp className="w-16 h-16 opacity-20" />
              <p className="text-base">{error}</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-gray-400 py-16 flex flex-col items-center gap-3">
              {activeTab === 'shorts'
                ? <Zap className="w-16 h-16 mb-1 opacity-20" />
                : <ThumbsUp className="w-16 h-16 mb-1 opacity-20" />
              }
              <p className="text-base">Chưa có video nào trong danh mục này.</p>
              <p className="text-sm text-gray-500">Hãy thích video để thêm vào đây!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredVideos.map((video, index) => {
                const isShort = video.isShort;
                return (
                  <div
                    key={video.id}
                    className="flex gap-4 group p-2.5 hover:bg-white/5 rounded-xl transition-all items-center border border-transparent hover:border-white/5"
                  >
                    {/* Index */}
                    <div className="w-6 text-center text-gray-500 text-sm font-medium hidden md:block shrink-0">
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <Link
                      to={isShort ? `/shorts` : `/watch/${video.id}`}
                      className={`relative shrink-0 ${
                        isShort ? 'w-[70px] md:w-[90px] aspect-[9/16]' : 'w-[130px] md:w-[170px] aspect-video'
                      } rounded-xl overflow-hidden bg-[#212121]`}
                    >
                      <img
                        src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                        {isShort
                          ? <span className="uppercase font-bold text-[#FF4E00]">Shorts</span>
                          : formatDuration(video.duration)
                        }
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Play className="w-7 h-7 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 py-1 min-w-0">
                      <Link to={isShort ? `/shorts` : `/watch/${video.id}`}>
                        <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 mb-1.5 group-hover:text-[#FF4E00] transition-colors leading-snug">
                          {video.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center text-gray-400 text-xs md:text-sm gap-1 md:gap-1.5">
                        <Link to={`/c/${video.channelHandle}`} className="hover:text-white transition-colors truncate max-w-[150px]">
                          {video.channelName}
                        </Link>
                        <span className="text-[10px] shrink-0">•</span>
                        <span className="shrink-0">{formatViews(video.viewsCount)} lượt xem</span>
                        <span className="hidden md:inline text-[10px] shrink-0">•</span>
                        <span className="hidden md:inline shrink-0">{formatTimeAgo(video.createdAt)}</span>
                      </div>
                    </div>

                    {/* Like icon right */}
                    <div className="hidden md:flex items-center shrink-0 pr-1">
                      <ThumbsUp className="w-4 h-4 text-[#FF4E00] fill-[#FF4E00]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LikedVideos;


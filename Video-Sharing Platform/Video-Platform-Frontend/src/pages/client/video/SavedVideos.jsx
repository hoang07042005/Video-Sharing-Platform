import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Loader2, Play, Shuffle, Clock, Lock,
  ChevronDown, LayoutList, LayoutGrid, Trash2, 
  MoreVertical, Zap, Calendar, Folder, SlidersHorizontal,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SavedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [removingId, setRemovingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/api/playlists/saved', { headers });
        setVideos(res.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập để xem video đã lưu');
        } else {
          setError('Không thể tải video đã lưu');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const handleRemove = async (e, videoId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    setRemovingId(videoId);
    try {
      await axios.delete(`/api/playlists/saved/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  const formatTimeAgo = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return `${Math.floor(diff / 2592000)} tháng trước`;
  };

  const formatViews = (v) => {
    if (!v) return '0';
    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace('.', ',')} Tr`;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')} N`;
    return String(v);
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const normalCount = videos.filter(v => !v.isShort).length;
  const shortsCount = videos.filter(v => v.isShort).length;
  const filteredVideos =
    activeTab === 'videos' ? videos.filter(v => !v.isShort) :
    activeTab === 'shorts' ? videos.filter(v => v.isShort) : videos;

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'videos', label: 'Video dài' },
    { id: 'shorts', label: 'Video ngắn' },
    { id: 'unwatched', label: 'Chưa xem' },
    { id: 'watched', label: 'Đã xem' },
  ];

  const extractTags = (description) => {
    if (!description) return [];
    const tags = description.match(/#[a-zA-Z0-9_]+/g);
    return tags ? tags.slice(0, 3) : [];
  };

  if (loading) return (
    <div className="flex-1 flex justify-center items-center bg-[#0F0F0F] min-h-screen">
      <Loader2 className="w-8 h-8 text-[#FF4E00] animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A] text-white font-sans min-h-screen">
      
      {/* ── PAGE HEADER ── */}
      <div className="px-8 pt-8 pb-3">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#FF4E00] to-[#FF2A2A] flex items-center justify-center shrink-0 shadow-lg shadow-[#FF4E00]/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold text-white mb-0.5 tracking-tight">Danh sách Xem sau</h1>
            <p className="text-gray-400 text-[13px]">Lưu lại những nội dung yêu thích để thưởng thức bất cứ khi nào bạn có thời gian rảnh. Hoàn toàn riêng tư và tiện lợi.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-[68px] text-gray-500 text-[11px]">
          <Lock className="w-3 h-3" />
          <span>Chỉ bạn mới thấy</span>
        </div>
      </div>

      {/* ── TABS + CONTROLS ── */}
      <div className="px-8 py-3 flex items-center justify-between border-b border-white/5 mb-6">
        {/* Left Tabs */}
        <div className="flex items-center gap-2.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-[#FF4E00] to-[#FF2A2A] text-white shadow-md' 
                  : 'bg-[#1A1A1A] text-gray-300 hover:bg-[#252525]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-[13px] font-medium text-gray-300 hover:bg-[#252525] cursor-pointer transition-colors">
            <Calendar className="w-4 h-4 text-gray-400" /> Tất cả thời gian <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-[13px] font-medium text-gray-300 hover:bg-[#252525] cursor-pointer transition-colors">
            <Folder className="w-4 h-4 text-gray-400" /> Tất cả thể loại <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-[13px] font-medium text-gray-300 hover:bg-[#252525] cursor-pointer transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" /> Sắp xếp: Mới nhất <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          
          <div className="flex items-center gap-1 ml-2 border border-[#333] rounded-full p-1 bg-[#121212]">
            <button className="p-1.5 rounded-full bg-gradient-to-r from-[#FF4E00] to-[#FF2A2A] text-white cursor-pointer shadow-sm">
              <LayoutList className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex px-8 pb-10 gap-6">

        {/* LEFT PANEL */}
        <div className="w-[300px] shrink-0">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 sticky top-6 shadow-xl shadow-black/40">
            
            {/* Illustration Graphic */}
            <div className="flex justify-center mb-6 relative py-4">
              <div className="relative">
                {/* Background subtle glow */}
                <div className="absolute inset-0 bg-[#FF4E00]/10 blur-2xl rounded-full"></div>
                {/* Folder icon */}
                <Folder className="w-24 h-24 text-[#2A2A2A] fill-[#1A1A1A] stroke-1" />
                {/* Inner lines for folder */}
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1.5 w-10">
                  <div className="h-1 w-full bg-[#333] rounded-full"></div>
                  <div className="h-1 w-2/3 bg-[#333] rounded-full"></div>
                </div>
                {/* Clock badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#FF4E00] to-[#FF2A2A] rounded-full border-[3px] border-[#121212] flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {/* Decorative dots */}
                <div className="absolute top-2 -left-4 w-1.5 h-1.5 bg-[#FF4E00] rounded-full opacity-60"></div>
                <div className="absolute top-10 -right-6 w-2 h-2 bg-[#FF4E00] rounded-full opacity-40"></div>
                <div className="absolute bottom-4 -left-6 w-1 h-1 bg-[#FF4E00] rounded-full opacity-80"></div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[17px] font-bold text-white mb-2">Tiếp tục khám phá</h2>
              <p className="text-gray-500 text-[13px] leading-relaxed">Các video bạn xem sau sẽ ở đây<br/>để xem bất cứ khi nào.</p>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-5 mb-8 px-2">
              <div className="flex items-start gap-4">
                <Play className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-xl leading-none">{normalCount}</span>
                  <span className="text-gray-500 text-[13px]">Video đã lưu</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Zap className="w-5 h-5 text-[#FF4E00] fill-[#FF4E00] shrink-0 mt-0.5" />
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-xl leading-none">{shortsCount}</span>
                  <span className="text-gray-500 text-[13px] mt-1.5">Video ngắn</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                disabled={filteredVideos.length === 0}
                onClick={() => filteredVideos[0] && navigate(filteredVideos[0].isShort ? '/shorts' : `/watch/${filteredVideos[0].id}`)}
                className="flex-1 bg-gradient-to-r from-[#FF4E00] to-[#FF1A1A] hover:opacity-90 text-white text-xs  py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md shadow-[#FF4E00]/20 transition-all whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-white shrink-0" /> Phát tất cả
              </button>
              <button
                disabled={videos.length === 0}
                className="flex-1 bg-[#1A1A1A] border border-white/5 hover:bg-[#252525] text-white text-xs py-2.5 px-3 rounded-full font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5 shrink-0" /> Trộn ngẫu nhiên
              </button>
            </div>
          </div>
        </div>

        {/* VIDEO LIST */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400 bg-[#121212] border border-white/5 rounded-2xl">
              <p className="font-medium text-lg text-red-400">{error}</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400 bg-[#121212] border border-white/5 rounded-2xl">
              <p className="font-medium text-lg">Chưa có video nào trong mục này</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredVideos.map((video, index) => {
                const isShort = video.isShort;
                const isRemoving = removingId === video.id;
                
                // Demo tags if no tags found in description
                const tags = extractTags(video.description);
                const displayTags = tags.length > 0 ? tags : ['#nhactre', '#top50', '#haynhat'];
                
                return (
                  <div
                    key={video.id}
                    className={`flex items-center gap-4 p-3 group hover:bg-[#121212] transition-colors ${isRemoving ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    {/* Index Number */}
                    <div className="w-8 text-center text-gray-400 font-semibold shrink-0 text-[13px]">
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <Link
                      to={isShort ? '/shorts' : `/watch/${video.id}`}
                      className="relative shrink-0 w-[200px] aspect-video rounded-xl overflow-hidden bg-[#0a0a0a] block"
                    >
                      {isShort ? (
                        <>
                          <img
                            src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop'}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 group-hover:scale-105 transition-transform duration-500"
                          />
                          <img
                            src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop'}
                            alt={video.title}
                            className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        </>
                      ) : (
                        <img
                          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      
                      {isShort && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          <Zap className="w-3 h-3 fill-white" /> SHORTS
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white font-medium px-1.5 py-0.5 rounded text-[11px]">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1 self-start mt-1">
                      <Link to={isShort ? '/shorts' : `/watch/${video.id}`}>
                        <h3 className="text-white font-bold text-[12px] line-clamp-1 mb-1.5 group-hover:text-[#FF4E00] transition-colors">
                          {video.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center text-gray-400 text-[13px] gap-2 mb-2">
                        <Link to={`/c/${video.channelHandle}`} className="hover:text-white transition-colors flex items-center gap-1.5">
                          {video.channelAvatarUrl ? (
                            <img src={video.channelAvatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[10px] text-white font-bold">
                              {video.channelName?.charAt(0)?.toUpperCase() || '@'}
                            </div>
                          )}
                          <span>{video.channelName}</span>
                        </Link>
                        <span>•</span>
                        <span>{formatViews(video.viewsCount)} lượt xem</span>
                        <span>•</span>
                        <span>{formatTimeAgo(video.createdAt)}</span>
                      </div>

                      {video.description && (
                        <p className="text-gray-500 text-[10px] line-clamp-2 mb-2 pr-4 leading-relaxed">
                          {video.description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex gap-2.5">
                        {displayTags.map((tag, i) => (
                          <span key={i} className="text-gray-500 text-[12px] hover:text-gray-300 cursor-pointer transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side Actions & Badge */}
                    <div className="flex flex-row items-center gap-2 shrink-0 pl-4 pr-2">
                      {/* Badge (VIDEO/SHORTS) */}
                      <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isShort ? 'text-[#FF8A00] bg-[#FF8A00]/10' : 'text-[#D946EF] bg-[#D946EF]/10'
                      }`}>
                        {isShort ? 'SHORTS' : 'VIDEO'}
                      </div>

                      {/* Action Buttons */}
                      <button
                        onClick={() => navigate(isShort ? '/shorts' : `/watch/${video.id}`)}
                        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => handleRemove(e, video.id)}
                        className="w-8 h-8 rounded-full  flex items-center justify-center text-gray-300 hover:text-[#FF4E00] hover:bg-[#FF4E00]/10 hover:border-[#FF4E00]/30 cursor-pointer transition-all"
                      >
                        {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <button
                        className="w-8 h-8 rounded-full  flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination
          {filteredVideos.length > 0 && !error && (
            <div className="flex items-center justify-center gap-1.5 mt-8 text-[13px] pb-8">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 cursor-pointer transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF4E00] to-[#FF2A2A] text-white font-bold shadow-md shadow-[#FF4E00]/20 cursor-pointer">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 font-medium cursor-pointer transition-colors">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 font-medium cursor-pointer transition-colors">
                3
              </button>
              <span className="text-gray-500 px-1 font-medium">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300 font-medium cursor-pointer transition-colors">
                10
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 cursor-pointer transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SavedVideos;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'videos' | 'shorts'
  const [visibleShorts, setVisibleShorts] = useState(5);

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

  const shortsCount = videos.filter(v => v.isShort).length;


  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0F0F0F] text-gray-400 p-6">
        <ThumbsUp className="w-16 h-16 opacity-20 mb-4" />
        <p className="text-base">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1500px] mx-auto p-6">

        {/* Header / Hero */}
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8 p-6 md:p-8 flex items-center">
          <img
            src="banner-trending.png"
            alt="Banner trending"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" 
                style={{ background: 'linear-gradient(135deg,#9C27B0,#FF4E00)' }}
              >
                <ThumbsUp className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold text-white">Video đã thích</h1>
                <p className="text-gray-300 w-[650px] text-[18px] mt-1">Nơi lưu giữ toàn bộ video dài và Shorts bạn từng yêu thích. Dễ dàng xem lại các nội dung tâm đắc, chia sẻ với bạn bè hoặc khám phá thêm các gợi ý tương tự dựa trên gu của bạn.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[16px] text-white font-semibold shadow-sm">
                {videos.length} Video
              </div>
              <div className="px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[16px] text-white font-semibold shadow-sm">
                {shortsCount} Shorts
              </div>
              <div className="px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[16px] text-gray-300 shadow-sm">
                Danh sách phát liên quan
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'Video (Like)', count: videos.length },
              { key: 'shorts', label: 'Video ngắn (Tim)', count: shortsCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.key ? 'bg-[#FF4E00] text-white' : 'bg-[#272727] text-gray-300 hover:bg-[#3F3F3F]'
                }`}
              >
                {tab.label} <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3 py-2 bg-[#161616] rounded-full text-sm text-gray-300">Mới nhất</button>
            <div className="px-3 py-2 bg-[#161616] rounded-full text-sm text-gray-300">Danh sách lưới</div>
          </div>
        </div>

        {/* Content: Videos grid and Shorts strip */}
        <div className="space-y-6">
          {/* Videos grid */}
          {(activeTab === 'all' || activeTab === 'all' || activeTab === 'videos' || activeTab === 'all') && videos.filter(v => !v.isShort).length > 0 && (activeTab !== 'shorts') && (
            <div>
              <h2 className="text-white font-bold mb-4">Video</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.filter(v => !v.isShort).map(video => (
                  <Link key={video.id} to={`/watch/${video.id}`} className="group block rounded-xl overflow-hidden">
                    <div className="relative aspect-video">
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded">{formatDuration(video.duration)}</div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{video.title}</h3>
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                         <div className="flex items-center gap-2 min-w-0">
                          {video.channelAvatarUrl ? (
                            <img src={video.channelAvatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white shrink-0">{(video.channelName || ' ')[0]}</div>
                          )}
                          <div className="truncate max-w-[100%]">{video.channelName}</div>
                        </div>
                        <div>{formatViews(video.viewsCount)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Shorts strip */}
          {(activeTab === 'all' || activeTab === 'shorts') && videos.filter(v => v.isShort).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold">Video ngắn</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos.filter(v => v.isShort).slice(0, visibleShorts).map(v => (
                  <Link key={v.id} to={`/shorts?id=${v.id}`} className="block w-full">
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-[#0b0b0b]">
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded">{formatDuration(v.duration)}</div>
                    </div>
                    <div className="text-xs text-gray-300 mt-2 line-clamp-2">{v.title}</div>
                    <div className="flex items-center justify-between text-gray-400 text-xs mt-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {v.channelAvatarUrl ? (
                          <img src={v.channelAvatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white shrink-0">{(v.channelName || ' ')[0]}</div>
                        )}
                        <div className="truncate max-w-[100%]">{v.channelName}</div>
                      </div>
                      <div className="text-xs shrink-0">{formatViews(v.viewsCount)}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {videos.filter(v => v.isShort).length > visibleShorts && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setVisibleShorts((prev) => prev + 5)}
                    className="px-6 py-2.5 rounded-full border border-gray-700 text-gray-300 font-bold hover:bg-white hover:text-black transition-colors"
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LikedVideos;


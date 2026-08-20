import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Loader2, CheckCircle, Filter, ListVideo, User, PlayCircle } from 'lucide-react';

const formatDuration = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' ngày trước';
  return Math.floor(diff / 2592000) + ' tháng trước';
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search_query') || '';
  const [channels, setChannels] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setChannels([]);
      setPlaylists([]);
      setVideos([]);
      setShorts([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setChannels(res.data.channels || []);
        setPlaylists(res.data.playlists || []);
        setVideos(res.data.videos || []);
        setShorts(res.data.shorts || []);
      } catch (error) {
        console.error("Lỗi khi tải kết quả tìm kiếm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const hasResults = channels.length > 0 || playlists.length > 0 || videos.length > 0 || shorts.length > 0;

  return (
    <div className="flex-1 min-h-screen bg-[#0F0F0F] text-white pt-4 pb-12">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">
        
        {/* Header Options */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Kết quả cho:</span>
            <h1 className="text-xl font-bold text-white">"{query}"</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full transition-colors text-sm font-medium cursor-pointer">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5722] mb-4" />
            <p>Đang tìm kiếm...</p>
          </div>
        ) : hasResults ? (
          <div className="flex flex-col gap-10">
            
            {/* Channels Section */}
            {channels.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" /> Kênh
                </h2>
                <div className="flex flex-col gap-4">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-6 group border-b border-white/5 pb-4">
                      <Link to={`/c/${channel.handle}`} className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ml-0 sm:ml-10">
                        <img src={channel.avatarUrl || "https://via.placeholder.com/150"} alt={channel.channelName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </Link>
                      <div className="flex flex-col items-center sm:items-start flex-1 mt-2 sm:mt-6">
                        <Link to={`/c/${channel.handle}`} className="text-lg sm:text-xl font-medium text-white group-hover:text-gray-300 transition-colors flex items-center gap-2">
                          {channel.channelName}
                          {channel.isVerified && <CheckCircle className="w-4 h-4 text-gray-400 fill-gray-400/20" />}
                        </Link>
                        <div className="text-gray-400 text-sm mt-1 flex gap-2">
                          <span>@{channel.handle}</span>
                          <span>•</span>
                          <span>{formatViews(channel.subscriberCount)} người đăng ký</span>
                        </div>
                        <button className="mt-3 bg-white text-black px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                          Đăng ký
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Playlists Section */}
            {playlists.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-gray-400" /> Danh sách phát
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="group cursor-pointer">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1A] mb-2">
                        <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded text-white text-sm">
                            <PlayCircle className="w-4 h-4" /> Xem tất cả
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-20 flex items-center gap-1">
                          <ListVideo className="w-3 h-3" />
                          {playlist.videoCount} video
                        </div>
                      </div>
                      <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug group-hover:text-gray-300">
                        {playlist.title}
                      </h3>
                      <div className="text-gray-400 text-xs mt-1">Danh sách phát công khai</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shorts Section */}
            {shorts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#FF1E1E]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.77,10.32l-1.2-.5L18,9.06a3.74,3.74,0,0,0-3.5-6.62L6,6.94a3.74,3.74,0,0,0,.23,6.74l1.2.49L6,14.93a3.75,3.75,0,0,0,3.5,6.63l8.5-4.5a3.74,3.74,0,0,0-.23-6.74ZM10,14.65v-5.3L15,12Z"/></svg>
                  Shorts
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
                  {shorts.map((short) => (
                    <div key={short.id} onClick={() => navigate(`/shorts?id=${short.id}`)} className="shrink-0 w-[160px] sm:w-[200px] cursor-pointer group snap-start">
                      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#1A1A1A] mb-2">
                        <img src={short.thumbnailUrl} alt={short.title} className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 transition-transform duration-300 group-hover:scale-110" />
                        <img src={short.thumbnailUrl} alt={short.title} className="relative w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 z-10" />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-20">
                          {formatViews(short.viewsCount)} lượt xem
                        </span>
                      </div>
                      <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug group-hover:text-gray-300">
                        {short.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Section */}
            {videos.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Video</h2>
                <div className="flex flex-col gap-5">
                  {videos.map((video) => (
                    <div 
                      key={video.id} 
                      onClick={() => navigate(`/watch/${video.id}`)}
                      className="flex flex-col sm:flex-row gap-4 group cursor-pointer"
                    >
                      <div className="relative shrink-0 overflow-hidden rounded-xl bg-[#1A1A1A] w-full sm:w-[360px] md:w-[400px] xl:w-[480px] aspect-video">
                        <img src={video.thumbnailUrl || 'https://via.placeholder.com/640x360'} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded z-20">
                          {formatDuration(video.duration)}
                        </span>
                      </div>

                      <div className="flex flex-col py-1 md:py-2 min-w-0 flex-1">
                        <h3 className="text-white text-base md:text-lg font-medium line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors mb-1 md:mb-1.5">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 md:mb-3">
                          <span>{formatViews(video.viewsCount)} lượt xem</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span>{timeAgo(video.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                          <Link to={`/c/${video.channelHandle}`} onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                            <img src={video.channelAvatarUrl || "https://via.placeholder.com/40"} alt="" className="w-full h-full object-cover" />
                          </Link>
                          <Link to={`/c/${video.channelHandle}`} onClick={(e) => e.stopPropagation()} className="text-gray-400 text-[13px] hover:text-white transition-colors flex items-center gap-1">
                            {video.channelName}
                            {video.channelIsVerified && <CheckCircle className="w-3.5 h-3.5 text-gray-400 fill-gray-400/20" />}
                          </Link>
                        </div>
                        {video.description && (
                          <p className="text-gray-500 text-xs md:text-[13px] line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <Search className="w-16 h-16 text-gray-700 mb-6" />
            <h2 className="text-xl font-medium text-white mb-2">Không tìm thấy kết quả nào</h2>
            <p className="text-gray-400">Hãy thử các từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
          </div>
        )}
        
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, Clock, PlayCircle, Film } from 'lucide-react';

const formatDuration = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + ':' + m.toString().padStart(2,'0') + ':' + sec.toString().padStart(2,'0');
  return m + ':' + sec.toString().padStart(2,'0');
};

const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.',',') + ' Tr';
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.',',') + ' N';
  return String(v);
};

const timeAgo = (d) => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'Vua xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phut truoc';
  if (diff < 86400) return Math.floor(diff / 3600) + ' gio truoc';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' ngay truoc';
  return Math.floor(diff / 2592000) + ' thang truoc';
};

function VideoCard({ video, featured }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  if (featured) {
    return (
      <div onClick={() => navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`)}
        className="group relative rounded-2xl overflow-hidden cursor-pointer bg-[#111] border border-white/5 hover:border-white/15 transition-all">
        <div className="relative aspect-video overflow-hidden">
          {!err && video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} onError={() => setErr(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A]">
              <PlayCircle className="w-12 h-12 text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            {formatDuration(video.duration || 0)}
          </span>
          <div className="absolute bottom-3 left-3 right-12">
            <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-[#FF7043] transition-colors">{video.title}</h3>
            <div className="flex items-center gap-2 text-gray-300 text-xs mt-1">
              <Link to={'/c/' + video.channelHandle} onClick={e => e.stopPropagation()}
                className="hover:text-white transition-colors">{video.channelName}</Link>
              <span>·</span>
              <Eye className="w-3 h-3" />
              <span>{formatViews(video.viewsCount)} luot xem</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div onClick={() => navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`)}
      className="group cursor-pointer flex gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
      <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#1A1A1A]">
        {!err && video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} onError={() => setErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-gray-600" />
          </div>
        )}
        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 py-0.5 rounded">
          {formatDuration(video.duration || 0)}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[#FF7043] transition-colors">{video.title}</h3>
        <Link to={'/c/' + video.channelHandle} onClick={e => e.stopPropagation()}
          className="block text-gray-400 text-xs mt-1 hover:text-white transition-colors truncate">{video.channelName}</Link>
        <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(video.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Latest() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios.get('/api/videos/explore?sort=newest')
      .then(r => { setVideos(r.data); setLoading(false); })
      .catch(() => { setError('Khong the tai video moi.'); setLoading(false); });
  }, []);

  const featured = videos.slice(0, 3);
  const rest = videos.slice(3);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#FF572220,#6200EA20)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#FF5722,#FF9800)' }}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Moi cap nhat</h1>
              <p className="text-gray-400 text-sm">Nhung video moi nhat vua duoc dang tai</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-16">
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="aspect-video rounded-2xl bg-[#1A1A1A] animate-pulse" />)}
            </div>
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-3 p-2.5 animate-pulse">
                  <div className="w-40 aspect-video rounded-lg bg-[#1A1A1A] shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 bg-[#1A1A1A] rounded w-full" />
                    <div className="h-3 bg-[#1A1A1A] rounded w-2/3" />
                    <div className="h-2.5 bg-[#1A1A1A] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Film className="w-12 h-12 text-gray-600" />
            <p className="text-gray-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Featured top 3 */}
            {featured.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-[#FF5722]" />
                  <h2 className="text-white font-bold">Noi bat hom nay</h2>
                  <span className="text-gray-500 text-sm ml-1">({videos.length} video)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featured.map(v => <VideoCard key={v.id} video={v} featured />)}
                </div>
              </div>
            )}

            {/* Rest as list */}
            {rest.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-white font-bold">Moi nhat</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {rest.map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
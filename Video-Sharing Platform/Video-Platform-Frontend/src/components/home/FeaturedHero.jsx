import { Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};

const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s >= 31536000) return Math.floor(s / 31536000) + ' năm trước';
  if (s >= 2592000)  return Math.floor(s / 2592000)  + ' tháng trước';
  if (s >= 86400)    return Math.floor(s / 86400)    + ' ngày trước';
  if (s >= 3600)     return Math.floor(s / 3600)     + ' giờ trước';
  if (s >= 60)       return Math.floor(s / 60)       + ' phút trước';
  return 'Vừa xong';
};

export default function FeaturedHero({ video }) {
  const navigate = useNavigate();
  if (!video) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target.closest('a')) return;
        navigate(`/watch/${video.id}`);
      }}
      className="relative w-full h-[450px] rounded-2xl overflow-hidden group cursor-pointer"
    >
      {/* Thumbnail */}
      <img
        src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80'}
        alt={video.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Slide nav dots (decorative) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0,1,2,3].map(i => (
          <span key={i} className={`block rounded-full transition-all ${i === 0 ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
        ))}
      </div>

      {/* Arrow right */}
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 p-4 md:p-6 max-w-xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#FF5722] text-white text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Đề xuất
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2 line-clamp-2">
          {video.title}
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-300 flex-wrap">
          <Link
            to={`/c/${video.channelHandle}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {video.channelAvatarUrl && (
              <img src={video.channelAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
            )}
            <span className="font-semibold text-white">{video.channelName}</span>
          </Link>
          <span className="text-gray-500">•</span>
          <span>{formatViews(video.viewsCount)} lượt xem</span>
          <span className="text-gray-500">•</span>
          <span>{timeAgo(video.createdAt)}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/watch/${video.id}`)}
          className="flex items-center gap-2 bg-[#FF5722] hover:bg-[#E64A19] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#FF5722]/30 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          Xem ngay
        </button>
      </div>
    </div>
  );
}

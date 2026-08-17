import { Play, Plus, CheckCircle, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SaveToPlaylistDropdown from '../video/SaveToPlaylistDropdown';

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

export default function FeaturedHero({ video, totalSlides = 4, currentSlide = 0, onNext, onPrev }) {
  const navigate = useNavigate();
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  if (!video) return null;

  // Split title to add gradient to middle parts
  const words = (video.title || '').split(' ');
  const third = Math.max(1, Math.floor(words.length / 3));
  const part1 = words.slice(0, third).join(' ');
  const part2 = words.slice(third, Math.max(third * 2, words.length - 1)).join(' ');
  const part3 = words.slice(Math.max(third * 2, words.length - 1)).join(' ');

  return (
    <div
      onClick={(e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`);
      }}
      className="relative w-full h-[480px] md:h-[520px] rounded-3xl group cursor-pointer select-none"
    >
      {/* Background container with overflow-hidden */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        {/* Thumbnail */}
        <img
          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=80'}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1a]/95 via-[#0f0f1a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent opacity-80" />
      </div>

      {/* Arrow right */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white/10"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Content — left side, vertically centered */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-8 md:p-12 max-w-[65%] z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#FF5722] text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider w-fit shadow-lg shadow-[#FF5722]/30">
          <Flame className="w-3.5 h-3.5" />
          Đề xuất
        </div>

        {/* Title — large with gradient highlight on middle part */}
        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.2] mb-5 drop-shadow-lg">
          {part1 && <span>{part1} </span>}
          {part2 && (
            <span className="bg-gradient-to-r from-pink-400 via-[#FF5722] to-orange-400 bg-clip-text text-transparent">
              {part2}{' '}
            </span>
          )}
          {part3 && <span>{part3}</span>}
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-[15px] leading-relaxed mb-6 line-clamp-2 max-w-lg">
          {video.description || 'Tuyển chọn những ca khúc nổi bật nhất đang làm mưa làm gió trên mọi bảng xếp hạng.'}
        </p>

        {/* Channel info */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Link
            to={`/c/${video.channelHandle}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {video.channelAvatarUrl ? (
              <img src={video.channelAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5722] to-[#9C27B0] flex items-center justify-center text-white text-[12px] font-bold">
                {(video.channelName || 'A')[0].toUpperCase()}
              </div>
            )}
            <span className="text-white font-semibold text-[15px] ml-1">{video.channelName}</span>
             <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />
          </Link>
          
          <span className="text-gray-600 text-xs mx-1.5">•</span>

          {/* Inline play icon and views */}
          <div className="w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center shadow-md shadow-[#FF5722]/30">
            <Play className="w-3 h-3 fill-white text-white ml-0.5" />
          </div>

          <span className="text-gray-300 text-[13px] ml-1">{formatViews(video.viewsCount)} lượt xem</span>
          <span className="text-gray-600 text-xs mx-1.5">•</span>
          <span className="text-gray-300 text-[13px]">{timeAgo(video.createdAt)}</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4 flex-wrap relative">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`); }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#FF5722] to-[#E91E63] hover:opacity-90 active:scale-95 text-white font-bold text-[15px] px-8 py-3 rounded-full transition-all shadow-lg shadow-[#FF5722]/30 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            Xem ngay
          </button>
          
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowPlaylistDropdown(!showPlaylistDropdown); }}
              className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md active:scale-95 text-gray-200 hover:text-white font-medium text-[15px] px-6 py-3 rounded-full transition-all border border-white/10 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Danh sách phát
            </button>
            
            {showPlaylistDropdown && (
              <div 
                className="absolute top-full left-0 mt-2 z-50 min-w-[250px]"
                onClick={e => e.stopPropagation()}
              >
                <SaveToPlaylistDropdown 
                  videoId={video.id} 
                  onClose={() => setShowPlaylistDropdown(false)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide dots — bottom right */}
      <div className="absolute bottom-6 right-8 flex gap-2 z-10">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-6 h-1.5 bg-[#FF5722]' : 'w-1.5 h-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

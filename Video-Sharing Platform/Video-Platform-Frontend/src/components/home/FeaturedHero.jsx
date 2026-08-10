import { Play, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function FeaturedHero({ video }) {
  const navigate = useNavigate();
  if (!video) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Large Featured Video */}
      <div 
        onClick={(e) => {
          if (e.target.closest('a')) return; // Ngăn chặn nếu bấm vào link Kênh bên trong
          navigate(`/watch/${video.id}`);
        }}
        className="lg:col-span-2 relative aspect-video rounded-2xl overflow-hidden group cursor-pointer block"
      >
        <img 
          src={video.thumbnailUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200&h=800"} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-[#0F0F0F] via-black/60 to-transparent">
          <div className="bg-[#FF3B30] text-white text-[11px] font-bold px-2.5 py-1 rounded-full w-max mb-4 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            ĐỀ XUẤT
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-[1.1] max-w-2xl line-clamp-2">
            {video.title}
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Link to={`/c/${video.channelHandle}`} className="font-medium text-white hover:text-[#FF5722] transition-colors">
              {video.channelName}
            </Link>
            <button className="hidden md:flex items-center justify-center w-12 h-12 bg-[#FF5722] hover:bg-[#E64A19] rounded-full text-white transition-colors cursor-pointer">
              <Play className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Smaller Featured */}
      <div className="flex flex-col gap-6">
        <div className="relative group rounded-2xl overflow-hidden cursor-pointer flex-1 bg-[#1A1A1A]">
          <img 
            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600&h=400" 
            alt="Studio Sessions" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-5">
            <h3 className="text-xl font-bold text-white">Khám phá nội dung mới</h3>
          </div>
        </div>

        <div className="relative group rounded-2xl overflow-hidden cursor-pointer flex-1 bg-[#1A1A1A] border border-white/5 flex flex-col items-center justify-center p-6 hover:bg-[#202020] transition-colors">
          <Rocket className="w-10 h-10 text-[#FF8A65] mb-4" />
          <h3 className="text-xl font-bold text-white mb-1">Xu hướng</h3>
          <p className="text-gray-400 text-sm">Cập nhật video nổi bật nhất</p>
        </div>
      </div>
    </div>
  );
}

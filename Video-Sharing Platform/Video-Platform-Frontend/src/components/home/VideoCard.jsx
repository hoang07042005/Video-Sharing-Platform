import { Link, useNavigate } from 'react-router-dom';

export default function VideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={(e) => {
        if (e.target.closest('a')) return;
        navigate(`/watch/${video.id}`);
      }}
      className="group cursor-pointer flex flex-col gap-3"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1A]">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3">
        <Link to={`/c/${video.handle}`} className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#2A2A2A] block">
          <img src={video.avatar} alt={video.channelName} className="w-full h-full object-cover" />
        </Link>
        <div>
          <h3 className="text-white font-medium line-clamp-2 leading-tight group-hover:text-[#FF5722] transition-colors">
            {video.title}
          </h3>
          <Link to={`/c/${video.handle}`} className="text-gray-400 text-sm mt-1 block hover:text-white transition-colors">
            {video.channelName}
          </Link>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <span>{video.views}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full mx-1"></span>
            <span>{video.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

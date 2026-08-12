import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';

export default function VideoCard({ video, isOwner, onEdit, onDelete }) {
  const navigate = useNavigate();
  return (
    <div 
      onClick={(e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
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
        
        {/* Owner Actions */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(video); }} className="bg-black/80 hover:bg-[#FF4E00] text-white p-1.5 rounded-full transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(video); }} className="bg-black/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-3">
        <Link to={`/c/${video.handle}`} className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#2A2A2A] block">
          <img src={video.avatar} alt={video.channelName} className="w-full h-full object-cover" />
        </Link>
        <div>
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#FF5722] transition-colors">
            {video.title}
          </h3>
          <Link to={`/c/${video.handle}`} className="text-gray-400 text-xs mt-1 block hover:text-white transition-colors">
            {video.channelName}
          </Link>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <span>{video.views}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full mx-1"></span>
            <span>{video.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

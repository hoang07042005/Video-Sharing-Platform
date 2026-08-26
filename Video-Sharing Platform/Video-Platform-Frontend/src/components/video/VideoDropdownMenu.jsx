import { useState, useRef, useEffect } from "react";
import { MoreVertical, ListPlus, Share2, Download, Flag } from "lucide-react";
import SaveToPlaylistDropdown from "./SaveToPlaylistDropdown";
import { toast } from "react-toastify";
import { addDownload } from "../../pages/client/video/Downloads";

export default function VideoDropdownMenu({ video }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const menuRef = useRef(null);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowPlaylist(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const requireAuth = () => {
    if (!localStorage.getItem("token")) {
      toast.error("Vui lòng đăng nhập!");
      return false;
    }
    return true;
  };

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          setShowPlaylist(false);
        }}
        className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-[#1A1A1A]/90 hover:bg-[#3F3F3F] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 w-52 bg-[#212121] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
          <button
            onClick={() => {
              if (!requireAuth()) return;
              setShowPlaylist(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-white text-sm transition-colors cursor-pointer"
          >
            <ListPlus className="w-4 h-4 shrink-0" />
            Thêm vào danh sách
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`);
              toast.success("Đã sao chép liên kết!");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-white text-sm transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            Chia sẻ
          </button>
          
          <button
            onClick={() => {
              setIsOpen(false);
              if (!requireAuth()) return;
              addDownload({
                id: video.id,
                title: video.title,
                thumbnailUrl: video.thumbnailUrl || video.thumbnail,
                duration: video.duration,
                viewsCount: video.viewsCount || video.views,
                channelName: video.channelName,
                channelHandle: video.channelHandle || video.handle,
              });
              toast.success("Đã thêm vào danh sách tải xuống!");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 text-white text-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            Tải video
          </button>
        </div>
      )}

      {showPlaylist && (
        <div className="absolute right-0 top-9 z-50">
          <SaveToPlaylistDropdown videoId={video.id} onClose={() => setShowPlaylist(false)} />
        </div>
      )}
    </div>
  );
}

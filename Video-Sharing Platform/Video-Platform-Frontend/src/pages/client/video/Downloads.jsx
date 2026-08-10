import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, Play, HardDrive, CheckCircle2, FolderOpen } from 'lucide-react';

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatViews = (views) => {
  if (!views) return '0';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)} Tr`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)} N`;
  return String(views);
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return `${Math.floor(diff / 2592000)} tháng trước`;
};

// localStorage key for downloads
const DOWNLOADS_KEY = 'video_platform_downloads';

export const getDownloads = () => {
  try {
    const data = localStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addDownload = (video) => {
  const downloads = getDownloads();
  const exists = downloads.find((d) => d.id === video.id);
  if (exists) return;
  const newEntry = { ...video, downloadedAt: new Date().toISOString() };
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify([newEntry, ...downloads]));
};

export const removeDownload = (videoId) => {
  const downloads = getDownloads().filter((d) => d.id !== videoId);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
};

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    setDownloads(getDownloads());
  }, []);

  const handleRemove = (videoId) => {
    setRemovingId(videoId);
    setTimeout(() => {
      removeDownload(videoId);
      setDownloads(getDownloads());
      setRemovingId(null);
    }, 300);
  };

  const handleClearAll = () => {
    localStorage.removeItem(DOWNLOADS_KEY);
    setDownloads([]);
  };

  const totalSizeMB = downloads.length * 45; // Estimate ~45MB per video average

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3EA6FF] to-[#1565C0] flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Nội dung tải xuống</h1>
              <p className="text-gray-400 text-sm">
                {downloads.length > 0
                  ? `${downloads.length} video • ~${totalSizeMB} MB`
                  : 'Chưa có video nào được lưu'}
              </p>
            </div>
          </div>

          {downloads.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Storage Info */}
        {downloads.length > 0 && (
          <div className="flex items-center gap-3 bg-[#161616] border border-white/10 rounded-xl p-4 mb-6">
            <HardDrive className="w-5 h-5 text-[#3EA6FF] shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Dung lượng đã dùng</span>
                <span className="text-white font-medium">~{totalSizeMB} MB</span>
              </div>
              <div className="w-full bg-[#2A2A2A] rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-[#3EA6FF] to-[#1565C0] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((totalSizeMB / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[#161616] flex items-center justify-center border border-white/10">
              <FolderOpen className="w-12 h-12 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Chưa có nội dung tải xuống</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Bấm nút <strong className="text-gray-300">Tải xuống</strong> khi xem bất kỳ video nào để lưu vào đây xem offline.
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-[#3EA6FF] text-white font-bold rounded-full hover:bg-[#1E88E5] transition-colors"
            >
              Khám phá video
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((video) => (
              <div
                key={video.id}
                className={`flex gap-4 items-center group p-3 rounded-xl hover:bg-white/5 transition-all duration-300 ${
                  removingId === video.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                {/* Thumbnail */}
                <Link
                  to={`/watch/${video.id}`}
                  className="relative shrink-0 w-[140px] md:w-[200px] aspect-video rounded-xl overflow-hidden bg-[#212121]"
                >
                  <img
                    src={video.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
                    {formatDuration(video.duration || 0)}
                  </div>
                  {/* Overlay with play icon on hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/watch/${video.id}`}>
                    <h3 className="text-white font-medium text-sm md:text-base line-clamp-2 mb-1 group-hover:text-[#3EA6FF] transition-colors">
                      {video.title}
                    </h3>
                  </Link>
                  <Link to={`/c/${video.channelHandle}`} className="text-gray-400 text-xs md:text-sm hover:text-white transition-colors block mb-1">
                    {video.channelName}
                  </Link>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>{formatViews(video.viewsCount)} lượt xem</span>
                    <span>•</span>
                    <span>Đã lưu {getTimeAgo(video.downloadedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3EA6FF]" />
                    <span className="text-[#3EA6FF] text-xs">Đã tải xuống • ~45 MB</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleRemove(video.id)}
                    title="Xóa khỏi danh sách tải xuống"
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

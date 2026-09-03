import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, Bell, Users, UserCheck, CheckCircle, ChevronDown, UserMinus, Zap, MoreVertical, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import VideoCard from "../../../components/home/VideoCard";
import VideoDropdownMenu from "../../../components/video/VideoDropdownMenu";

function SubscriptionShortCard({ short }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/shorts?id=${short.id}`)}
      className="group cursor-pointer flex flex-col gap-2 relative"
    >
      <div className="relative w-full aspect-[9/16] rounded-[8px] bg-[#1A1A1A]">
        <div className="absolute inset-0 overflow-hidden rounded-[8px]">
          <img
            src={short.thumbnail}
            alt={short.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {short.isMembersOnly && (
            <span className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] z-20 flex items-center gap-1 shadow-md">
              <Crown size={12} /> Dành cho hội viên
            </span>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Zap className="w-3 h-3 fill-white" /> SHORTS
          </div>
        </div>
        <div className="absolute top-1 right-1 z-30" onClick={(e) => e.stopPropagation()}>
          <VideoDropdownMenu video={short} />
        </div>
      </div>
      <div className="flex gap-2 justify-between px-1 mt-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-white text-[13px] font-semibold line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
            {short.title}
          </h3>
          <p className="text-gray-400 text-[12px] mt-1">
            {short.views}
          </p>
        </div>

      </div>
    </div>
  );
}

const formatSubscribers = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} Tr`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)} N`;
  return `${count}`;
};

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatViews = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} Tr`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)} N`;
  return `${count}`;
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

export default function Subscriptions() {
  const [viewMode, setViewMode] = useState("videos"); // "videos" | "channels"
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const handleToggleSubscribe = async (e, channelId) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.post(
        `/api/channels/${channelId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, isSubscribed: res.data.isSubscribed } : c
      ));
      setOpenDropdownId(null);
    } catch (err) {
      console.error("Failed to toggle subscription", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("auth");
          setLoading(false);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        
        if (viewMode === "channels" && channels.length === 0) {
          setLoading(true);
          const res = await axios.get("/api/channels/subscribed", { headers });
          setChannels(res.data.map(c => ({ ...c, isSubscribed: true })));
          setError(null);
        } else if (viewMode === "videos" && videos.length === 0) {
          setLoading(true);
          const res = await axios.get("/api/videos/subscriptions", { headers });
          const formattedVideos = res.data.map(v => ({
            id: v.id,
            isShort: v.isShort,
            thumbnail: v.thumbnailUrl || "/placeholder.jpg",
            title: v.title,
            duration: formatDuration(v.duration),
            handle: v.channelHandle,
            avatar: v.channelAvatarUrl || "/placeholder.jpg",
            channelName: v.channelName,
            isVerified: v.channelIsVerified,
            views: formatViews(v.viewsCount) + " lượt xem",
            time: formatTimeAgo(v.createdAt),
          }));
          setVideos(formattedVideos);
          setError(null);
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        if (err.response?.status === 401) {
          setError("auth");
        } else {
          setError("fetch");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewMode]);

  if (loading && (viewMode === "channels" ? channels.length === 0 : videos.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error === "auth") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#212121] flex items-center justify-center">
          <Bell className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Không thể hiển thị kênh đăng ký
          </h2>
          <p className="text-gray-400 mb-6">
            Đăng nhập để xem các kênh bạn đã theo dõi
          </p>
          <Link
            to="/login"
            className="px-6 py-3 bg-[#FF5722] text-white font-bold rounded-full hover:bg-[#E64A19] transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (viewMode === "channels" && channels.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#212121] flex items-center justify-center">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Bạn chưa đăng ký kênh nào
          </h2>
          <p className="text-gray-400 max-w-sm mb-6">
            Hãy tìm và đăng ký các kênh yêu thích để theo dõi nội dung mới nhất
            của họ.
          </p>
          <button
            onClick={() => setViewMode('videos')}
            className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className={`mx-auto p-4 md:p-8 ${viewMode === 'videos' ? 'max-w-[2000px]' : 'max-w-[1000px]'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5722] to-[#FF9800] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Kênh đăng ký</h1>
              <p className="text-gray-400 text-sm">
                {viewMode === 'videos' ? 'Mới nhất từ các kênh' : `${channels.length} kênh bạn đang theo dõi`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'videos' ? 'channels' : 'videos')}
            className="px-5 py-2 rounded-full font-semibold text-sm text-[#0F0F0F] bg-white hover:bg-gray-200 transition-colors shrink-0"
          >
            {viewMode === 'videos' ? 'Xem tất cả kênh' : 'Xem video mới nhất'}
          </button>
        </div>

        {/* Content */}
        {viewMode === "videos" ? (
          <div className="flex flex-col gap-10">
            {/* Lưới Video dài */}
            {videos.filter(v => !v.isShort).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Video mới nhất</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                  {videos.filter(v => !v.isShort).map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}

            {/* Kệ Video ngắn (Shorts Shelf) */}
            {videos.filter(v => v.isShort).length > 0 && (
              <div className="pt-6 border-t border-white/10 relative">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[#FF5722] fill-[#FF5722]" /> Video ngắn
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                  {videos.filter(v => v.isShort).map(short => (
                    <SubscriptionShortCard key={short.id} short={short} />
                  ))}
                </div>
              </div>
            )}

            {videos.length === 0 && (
              <div className="text-center text-gray-400 py-20 flex flex-col items-center justify-center">
                <Bell className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">Chưa có video nào từ các kênh bạn đăng ký.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                to={`/c/${channel.handle}`}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 rounded-[8px] hover:bg-white/5 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-[#212121] ring-2 ring-transparent group-hover:ring-[#FF5722] transition-all duration-200">
                    {channel.avatarUrl ? (
                      <img
                        src={channel.avatarUrl}
                        alt={channel.channelName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF5722] to-[#FF9800]">
                        <span className="text-white font-bold text-3xl">
                          {channel.channelName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center sm:pt-2">
                  <h3 className="text-white text-[18px] sm:text-[20px] font-medium flex items-center justify-center sm:justify-start gap-1.5 mb-1 group-hover:text-[#FF5722] transition-colors">
                    {channel.channelName}
                    {channel.isVerified && (
                     <CheckCircle className="w-4 h-4 text-white fill-green-500 shrink-0" />
                    )}
                  </h3>
                  <div className="text-[#AAAAAA] text-sm flex items-center justify-center sm:justify-start flex-wrap gap-x-1 mb-2">
                    <span>{channel.handle}</span>
                    <span>•</span>
                    <span>{formatSubscribers(channel.subscriberCount)} người đăng ký</span>
                    <span>•</span>
                    <span>{channel.videoCount || 0} video</span>
                  </div>
                  <p className="text-[#AAAAAA] text-sm line-clamp-2">
                    {channel.description || channel.bio || "Chưa có mô tả cho kênh này."}
                  </p>
                </div>

                {/* Subscribe Button */}
                <div className="flex-shrink-0 sm:pt-4 relative">
                  {channel.isSubscribed !== false ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === channel.id ? null : channel.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors text-sm font-medium"
                      >
                        <Bell className="w-5 h-5" />
                        <span>Đã đăng ký</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openDropdownId === channel.id ? "rotate-180" : ""}`} />
                      </button>

                      {openDropdownId === channel.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenDropdownId(null);
                            }}
                          />
                          <div className="absolute top-full mt-2 right-0 w-40 bg-[#1a1c23] border border-white/10 rounded-[8px] shadow-2xl py-2 z-50">
                            <button
                              onClick={(e) => handleToggleSubscribe(e, channel.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" /> Hủy đăng ký
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={(e) => handleToggleSubscribe(e, channel.id)}
                      className="px-5 py-2 rounded-full font-semibold text-sm text-[#0F0F0F] bg-white hover:bg-gray-200 transition-colors"
                    >
                      Đăng ký
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

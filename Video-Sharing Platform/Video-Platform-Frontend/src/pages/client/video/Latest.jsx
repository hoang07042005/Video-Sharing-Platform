import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Loader2,
  MoreVertical,
  Smartphone,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getIconColor } from "../../../utils/iconHelpers";

const formatDuration = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return (
      h +
      ":" +
      m.toString().padStart(2, "0") +
      ":" +
      sec.toString().padStart(2, "0")
    );
  return m + ":" + sec.toString().padStart(2, "0");
};

const formatViews = (v) => {
  if (!v) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(".", ",") + " Tr";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(".", ",") + " N";
  return String(v);
};

const timeAgo = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return Math.floor(diff / 60) + " phút trước";
  if (diff < 86400) return Math.floor(diff / 3600) + " giờ trước";
  if (diff < 2592000) return Math.floor(diff / 86400) + " ngày trước";
  return Math.floor(diff / 2592000) + " tháng trước";
};

const getCategoryBg = (name) => {
  const n = name?.toLowerCase() || "";
  if (n.includes("âm nhạc"))
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80";
  if (n.includes("game") || n.includes("trò chơi"))
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80";
  if (n.includes("công nghệ"))
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
  if (n.includes("du lịch"))
    return "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80";
  if (n.includes("ẩm thực") || n.includes("đời sống"))
    return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80";
  if (n.includes("phim"))
    return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=400&q=80";
};

function ShortVideoCard({ short }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/shorts?id=${short.id}`)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#1A1A1A]">
        <img
          src={
            short.thumbnailUrl ||
            "https://via.placeholder.com/320x568?text=Short"
          }
          alt={short.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex gap-2 justify-between px-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-white text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#E91E63] transition-colors">
            {short.title}
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {formatViews(short.viewsCount)} lượt xem
          </p>
        </div>
        <button className="text-white/60 hover:text-white h-fit mt-1 cursor-pointer">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FeaturedVideoCard({ video, categories }) {
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === video.categoryId);

  const getGradient = (name) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("âm nhạc")) return "from-[#9C27B0] to-[#E040FB]";
    if (n.includes("du lịch")) return "from-[#2E7D32] to-[#81C784]";
    if (n.includes("trò chơi") || n.includes("game"))
      return "from-[#0277BD] to-[#4FC3F7]";
    return "from-[#FF5722] to-[#FF9800]";
  };

  return (
    <div
      className="cursor-pointer group flex flex-col gap-3"
      onClick={() => navigate(`/watch/${video.id}`)}
    >
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1A1A1A]">
        <img
          src={video.thumbnailUrl || "https://via.placeholder.com/640x360"}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {category && (
          <div
            className={`absolute bottom-3 left-3 bg-gradient-to-r ${getGradient(category.name)} text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg`}
          >
            {category.name}
          </div>
        )}
        <span className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
      </div>

      <div className="px-1">
        <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-[#E91E63] transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1.5">
          {video.channelAvatarUrl ? (
            <img
              src={video.channelAvatarUrl}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
              alt=""
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E91E63] to-[#9C27B0] flex items-center justify-center text-[10px] text-white">
              {(video.channelName || "A")[0]}
            </div>
          )}
          <span className="hover:text-white transition-colors">
            {video.channelName}
          </span>
          {video.channelIsVerified && (
            <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />
          )}
        </div>
        <div className="text-gray-500 text-[11px]">
          {formatViews(video.viewsCount)} lượt xem • {timeAgo(video.createdAt)}
        </div>
      </div>
    </div>
  );
}

function NormalVideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div
      className="cursor-pointer group flex flex-col gap-2.5"
      onClick={() => navigate(`/watch/${video.id}`)}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1A]">
        <img
          src={video.thumbnailUrl || "https://via.placeholder.com/320x180"}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="px-1">
        <h3 className="text-white text-[14px] font-bold leading-snug line-clamp-2 mb-1 group-hover:text-[#E91E63] transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5 text-gray-400 text-[12px] mb-0.5">
          <span className="hover:text-white transition-colors">
            {video.channelName}
          </span>
          {video.channelIsVerified && (
            <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />
          )}
        </div>
        <div className="text-gray-500 text-[11px]">
          {formatViews(video.viewsCount)} lượt xem • {timeAgo(video.createdAt)}
        </div>
      </div>
    </div>
  );
}

function NewChannelCard({ channel, initialSubbed }) {
  const navigate = useNavigate();
  const [subbed, setSubbed] = useState(initialSubbed || false);

  // Initialize `subbed` from `initialSubbed` and keep local state thereafter.

  return (
    <div
      className="flex flex-col items-center gap-3 cursor-pointer group"
      onClick={() => navigate(`/c/${channel.handle}`)}
    >
      <div className="w-[96px] h-[96px] rounded-full p-[2px] bg-gradient-to-tr from-[#FF5722] via-[#E91E63] to-[#9C27B0] group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(233,30,99,0.2)]">
        <img
          src={
            channel.avatarUrl ||
            `https://ui-avatars.com/api/?name=${channel.channelName}&background=random`
          }
          alt={channel.channelName}
          className="w-full h-full rounded-full object-cover border-4 border-[#13111C]"
        />
      </div>
      <div className="text-center mt-1">
        <h3 className="text-white text-[15px] w-30 font-bold group-hover:text-purple-400 transition-colors">
          {channel.channelName}
        </h3>
        <p className="text-gray-500 text-[11px] mt-0.5">
          {formatViews(channel.subscriberCount)} người đăng ký
        </p>
      </div>
      <button
        className={`mt-1 px-5 py-2 w-30 rounded-full border text-[12px] font-bold transition-colors ${
          subbed
            ? "bg-[#2A2A2A] border-[#2A2A2A] text-gray-300 hover:bg-[#333]"
            : "border-white/20 text-gray-300 hover:bg-white hover:text-black hover:border-white"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setSubbed(!subbed);
        }}
      >
        {subbed ? "Đã đăng ký" : "Đăng ký"}
      </button>
    </div>
  );
}

export default function Latest() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(0);
  const [visibleVideos, setVisibleVideos] = useState(8);
  const [visibleShorts, setVisibleShorts] = useState(6);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const promises = [
      axios.get("/api/videos"),
      axios.get("/api/channels"),
      axios.get("/api/videos/categories"),
      axios.get("/api/videos/shorts"),
    ];

    let subPromiseIndex = -1;
    if (token) {
      subPromiseIndex = promises.length;
      promises.push(
        axios.get("/api/channels/subscribed", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    }

    Promise.allSettled(promises).then((results) => {
      const [videosRes, channelsRes, categoriesRes, shortsRes] = results;
      if (videosRes.status === "fulfilled") {
        const vids = videosRes.value.data
          .filter((v) => !v.isShort)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setVideos(vids);
      }
      if (channelsRes.status === "fulfilled")
        setChannels(channelsRes.value.data);
      if (categoriesRes.status === "fulfilled")
        setCategories(categoriesRes.value.data);
      if (shortsRes.status === "fulfilled") {
        setShorts(
          shortsRes.value.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        );
      }
      if (
        subPromiseIndex !== -1 &&
        results[subPromiseIndex].status === "fulfilled"
      ) {
        const subIds = results[subPromiseIndex].value.data.map((c) => c.id);
        setSubscribedChannelIds(subIds);
      }
      setLoading(false);
    });
  }, []);

  const filteredVideos =
    activeCategoryId === 0
      ? videos
      : videos.filter((v) => v.categoryId === activeCategoryId);
  const featured = filteredVideos.slice(0, 3);
  const rest = filteredVideos.slice(3, 3 + visibleVideos);

  let newChannelsRaw = channels;
  const currentUserHandle = localStorage.getItem("handle");
  if (currentUserHandle) {
    const handleCheck = currentUserHandle.startsWith("@")
      ? currentUserHandle
      : `@${currentUserHandle}`;
    newChannelsRaw = newChannelsRaw.filter(
      (c) => c.handle !== handleCheck && c.handle !== currentUserHandle,
    );
  }
  const newChannels = newChannelsRaw.slice(0, 5);
  const trendingCategories = categories.slice(0, 6);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#E91E63] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header section */}
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8 p-6 md:p-8 flex items-center gap-4">
        {/* Ảnh nền hiển thị toàn màn hình container */}
        <img
          src="banner-trending.png"
          alt="Banner trending"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 max-w-[1500px] w-full mx-auto px-6 md:px-10">
          {/* Nội dung nổi lên trên ảnh */}
          <div className="relative z-10  gap-4">
            <div className="flex item-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(124,77,255,0.3)]">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl w-[520px] font-extrabold text-white uppercase tracking-wider mb-1">
                Cập Nhật Nội Dung Mới Mỗi Ngày
              </h1>
            </div>
            <p className="text-gray-200 w-[620px] mt-2 text-[16px] ">
              Đón đầu những video mới nhất vừa lên sóng từ các kênh bạn theo
              dõi. Hệ thống tự động chọn lọc và gợi ý các nội dung thịnh hành
              theo đúng sở thích, giúp bạn không bỏ lỡ bất kỳ khoảnh khắc thú vị
              nào.
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-[1300px] mx-auto px-2 sm:px-4 md:px-6 pt-0 pb-16">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
            <button
              onClick={() => setActiveCategoryId(0)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all cursor-pointer shrink-0 border ${
                activeCategoryId === 0
                  ? "bg-[#FF5722]/15 border-[#FF5722]/40 text-white"
                  : "bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
              }`}
            >
              <LucideIcons.LayoutGrid
                className={`w-4 h-4 ${activeCategoryId === 0 ? "text-white" : "text-gray-400"}`}
              />
              Tất cả
            </button>
            {categories.map((cat) => {
              const Icon = LucideIcons[cat.icon] || LucideIcons.LayoutGrid;
              const isActive = activeCategoryId === cat.id;
              const iconColor = getIconColor(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-[#FF5722]/15 border-[#FF5722]/40 text-white"
                      : "bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-2 bg-[#1A1A1A] text-gray-300 hover:bg-[#252525] hover:text-white px-5 py-2 rounded-full text-[13px] font-bold shrink-0 transition-colors">
            Mới nhất <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Featured Grid */}
        <div className="relative mb-14">
          <button className="absolute -right-5 top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all hidden md:flex shadow-xl">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((v) => (
              <FeaturedVideoCard key={v.id} video={v} categories={categories} />
            ))}
          </div>
        </div>

        {/* Video mới nhất */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-extrabold text-white">
              Video mới nhất
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {rest.map((v) => (
              <NormalVideoCard key={v.id} video={v} />
            ))}
          </div>
          {filteredVideos.length > 3 + visibleVideos && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleVideos((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-full border border-gray-700 text-gray-300 font-bold hover:bg-white hover:text-black transition-colors"
              >
                Xem thêm
              </button>
            </div>
          )}
        </div>

        {/* Video ngắn */}
        {shorts.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-extrabold text-white flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-[#E91E63]" />
                Video ngắn
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8">
              {shorts.slice(0, visibleShorts).map((short) => (
                <ShortVideoCard key={short.id} short={short} />
              ))}
            </div>
            {shorts.length > visibleShorts && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleShorts((prev) => prev + 6)}
                  className="px-6 py-2.5 rounded-full border border-gray-700 text-gray-300 font-bold hover:bg-white hover:text-black transition-colors"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kênh mới nổi bật */}
        {newChannels.length > 0 && (
          <div className="bg-gradient-to-r from-[#171424] to-[#0F0E14] rounded-3xl p-8 mb-14 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-[20px] font-extrabold text-white">
                Kênh mới nổi bật
              </h2>
              <button className="text-xs font-bold text-gray-400 hover:text-white px-4 py-1.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors">
                Xem tất cả
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 relative z-10">
              {newChannels.map((channel) => (
                <NewChannelCard
                  key={channel.id}
                  channel={channel}
                  initialSubbed={subscribedChannelIds.includes(channel.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chủ đề thịnh hành */}
        {trendingCategories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-extrabold text-white">
                Chủ đề thịnh hành
              </h2>
              <button className="text-xs font-bold text-gray-400 hover:text-white px-4 py-1.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors">
                Xem tất cả
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {trendingCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="relative h-[130px] rounded-2xl overflow-hidden group cursor-pointer shadow-lg"
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  <img
                    src={getCategoryBg(cat.name)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={cat.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white font-extrabold text-[15px] tracking-wide mb-0.5">
                      # {cat.name}
                    </h3>
                    <p className="text-gray-400 text-[11px] font-medium">
                      {((cat.id * 137) % 900) + 100} N video
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  Flame,
  Eye,
  MoreVertical,
  CheckCircle,
  Play,
  Heart,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { getIconColor } from "../../../utils/iconHelpers";

// ─── UTILS ─────────────────────────────────────────────────────────
const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatViews = (views) => {
  if (!views) return "0";
  if (views >= 1000000)
    return `${(views / 1000000).toFixed(1).replace(".0", "").replace(".", ",")}M`;
  if (views >= 1000)
    return `${(views / 1000).toFixed(1).replace(".0", "").replace(".", ",")}K`;
  return String(views);
};

const getTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return `${Math.floor(diff / 2592000)} tháng trước`;
};

const getTrendStr = (idString) => {
  let hash = 0;
  if (idString) {
    for (let i = 0; i < idString.length; i++) {
      hash = idString.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const val = Math.abs(hash % 20); // 0 to 19
  const isUp = hash % 3 !== 0; // 66% chance up
  if (isUp) return { val: val + 2, type: "up" };
  return { val: (val % 5) + 1, type: "down" };
};

// ─── SIDEBAR CHANNEL CARD ──────────────────────────────────────────
function SidebarChannelCard({ channel, initialSubbed }) {
  const [subbed, setSubbed] = useState(initialSubbed || false);
  const navigate = useNavigate();

  // Initialize `subbed` from prop and keep local state thereafter.

  return (
    <div
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
      onClick={() => navigate(`/c/${channel.handle}`)}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
        <img
          src={
            channel.avatarUrl ||
            `https://ui-avatars.com/api/?name=${channel.channelName}&background=random`
          }
          alt={channel.channelName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white text-[13px] font-semibold truncate group-hover:text-[#FF4E00] transition-colors">
          {channel.channelName}
        </h4>
        <p className="text-gray-400 text-[11px] truncate">
          {formatViews(channel.subscriberCount)} người đăng ký
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSubbed(!subbed);
        }}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          subbed
            ? "bg-[#272727] text-gray-400 hover:bg-[#333]"
            : "bg-[#510E1A] text-[#FF4E00] hover:bg-[#781426] hover:text-white"
        }`}
      >
        {subbed ? "Đã đăng ký" : "Đăng ký"}
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function Trending() {
  const [videos, setVideos] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const promises = [
          axios.get("/api/videos"),
          axios.get("/api/videos/categories"),
          axios.get("/api/channels"),
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

        const results = await Promise.allSettled(promises);

        if (results[0].status === "fulfilled") {
          // Sort by views desc for trending
          const sorted = results[0].value.data.sort(
            (a, b) => b.viewsCount - a.viewsCount,
          );
          setVideos(sorted);
        }
        if (results[1].status === "fulfilled")
          setDbCategories(results[1].value.data);
        if (results[2].status === "fulfilled")
          setChannels(results[2].value.data);
        if (
          subPromiseIndex !== -1 &&
          results[subPromiseIndex].status === "fulfilled"
        ) {
          setSubscribedChannelIds(
            results[subPromiseIndex].value.data.map((c) => c.id),
          );
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-[#FF4E00] animate-spin" />
      </div>
    );
  }

  // Filters setup
  const FILTERS = [
    { key: "all", label: "Tất cả", iconName: null },
    ...dbCategories.map((cat) => ({
      key: cat.name,
      label: cat.name,
      iconName: cat.icon,
    })),
  ];
  const displayedVideos =
    activeFilter === "all"
      ? videos
      : videos.filter((v) => {
          const cat = dbCategories.find((c) => c.id === v.categoryId);
          return cat?.name === activeFilter;
        });

  const top3 = displayedVideos.slice(0, 3);
  let listVideos = displayedVideos.slice(3);

  // Apply time filter
  if (timeFilter !== "all") {
    const now = new Date();
    listVideos = listVideos.filter((v) => {
      const vDate = new Date(v.createdAt);
      const diffMs = now - vDate;
      const diffHours = diffMs / (1000 * 60 * 60);
      if (timeFilter === "24h") return diffHours <= 24;
      if (timeFilter === "7d") return diffHours <= 24 * 7;
      if (timeFilter === "30d") return diffHours <= 24 * 30;
      return true;
    });
  }

  const restVideos = listVideos.slice(0, visibleCount);
  const hasMore = listVideos.length > visibleCount;

  // Trending Channels
  let trendingChannelsRaw = [...channels].sort(
    (a, b) => b.subscriberCount - a.subscriberCount,
  );
  const currentUserHandle = localStorage.getItem("handle");
  if (currentUserHandle) {
    const handleCheck = currentUserHandle.startsWith("@")
      ? currentUserHandle
      : `@${currentUserHandle}`;
    trendingChannelsRaw = trendingChannelsRaw.filter(
      (c) => c.handle !== handleCheck && c.handle !== currentUserHandle,
    );
  }
  const topChannels = trendingChannelsRaw.slice(0, 5);

  const categoryStats = dbCategories
    .map((cat) => {
      const catVideos = videos.filter((v) => v.categoryId === cat.id);
      const totalVideos = catVideos.length;
      const totalViews = catVideos.reduce(
        (sum, v) => sum + (v.viewsCount || 0),
        0,
      );
      return {
        ...cat,
        totalVideos,
        totalViews,
      };
    })
    .filter((cat) => cat.totalVideos > 0)
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 10);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0B] min-h-screen pb-4">
      {/* ─── HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative px-4 md:px-8 pt-8 pb-6">
        <img
          src="/banner-trending.png"
          alt="Trending background"
          className="absolute inset-0 w-full h-[350px] object-cover"
        />
        <div className="flex relative w-full h-[320px]">
          {/* Nội dung chữ ở bên trái */}
          <div className="relative z-10 p-8 md:p-10 w-full md:w-2/3 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[56px] h-[56px] rounded-2xl bg-gradient-to-br from-[#FF9800] to-[#FF5722] flex items-center justify-center shadow-[0_0_20px_rgba(255,87,34,0.4)]">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">
                Thịnh hành
              </h1>
            </div>
            <p className="text-gray-200 text-[18px] mb-8 max-w-md drop-shadow-md font-medium">
              Khám phá những video đang được xem nhiều nhất cộng đồng VideoX
              ngày hôm nay
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-[13px]">Triệu+</div>
                  <div className="text-gray-400 text-[11px]">
                    Lượt xem mỗi ngày
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-[13px]">
                    Xu hướng
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Cập nhật liên tục
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-[13px]">
                    Đa dạng nội dung
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Từ Shorts đến Video dài
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FILTERS ────────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-4 mt-8 scrollbar-hide">
          {FILTERS.map((f) => {
            const Icon = f.iconName
              ? LucideIcons[f.iconName] || LucideIcons.LayoutGrid
              : null;
            const iconColor = f.iconName
              ? getIconColor(f.iconName)
              : "text-gray-400";
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-[#FF5722]/15 border-[#FF5722]/40 text-white"
                    : "bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
                {f.label}
              </button>
            );
          })}
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A] hover:text-white shrink-0">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-2">
        {displayedVideos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Chưa có video nào trong danh mục này.
          </div>
        ) : (
          <>
            {/* ─── TOP 3 FEATURED ───────────────────────────────────── */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF5722] fill-[#FF5722]" />
                  <h2 className="text-[17px] font-extrabold text-white">
                    Top thịnh hành
                  </h2>
                </div>
                <div className="text-xs text-gray-400">
                  Những video nổi bật nhất trong tuần
                </div>
                <button className="hidden md:flex items-center gap-1 text-[12px] font-bold text-gray-400 hover:text-white transition-colors ml-auto">
                  Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {top3.map((video, idx) => {
                  const badgeColors = [
                    "bg-[#FFC107] text-black",
                    "bg-[#29B6F6] text-black",
                    "bg-[#FF7043] text-black",
                  ];
                  const badgeColor = badgeColors[idx] || badgeColors[0];

                  return (
                    <div
                      key={video.id}
                      onClick={() =>
                        navigate(
                          video.isShort
                            ? `/shorts?id=${video.id}`
                            : `/watch/${video.id}`,
                        )
                      }
                      className="group cursor-pointer rounded-2xl overflow-hidden bg-[#121212] flex flex-col shadow-lg border border-transparent hover:border-white/10 transition-all duration-300"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#222]">
                        {video.isShort ? (
                          <>
                            <img
                              src={
                                video.thumbnailUrl ||
                                "https://via.placeholder.com/640x360"
                              }
                              alt={video.title}
                              className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-50 transition-transform duration-500 group-hover:scale-125"
                            />
                            <img
                              src={
                                video.thumbnailUrl ||
                                "https://via.placeholder.com/640x360"
                              }
                              alt={video.title}
                              className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                          </>
                        ) : (
                          <img
                            src={
                              video.thumbnailUrl ||
                              "https://via.placeholder.com/640x360"
                            }
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                        {/* Rank Badge */}
                        <div
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full ${badgeColor} font-black text-[13px] shadow-lg`}
                        >
                          #{idx + 1}
                        </div>

                        {/* Duration */}
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">
                          {formatDuration(video.duration)}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {video.isShort ? (
                            <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit">
                              <Flame className="w-3 h-3" /> Shorts
                            </span>
                          ) : (
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit">
                              <Play className="w-3 h-3" /> Video
                            </span>
                          )}
                        </div>
                        <h3 className="text-white text-[15px] font-bold leading-snug line-clamp-2 mb-3 group-hover:text-[#FF5722] transition-colors">
                          {video.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-2.5">
                          <img
                            src={
                              video.channelAvatarUrl ||
                              `https://ui-avatars.com/api/?name=${video.channelName}&background=random`
                            }
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                            alt=""
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1 text-gray-300 text-[12px] font-medium truncate group-hover:text-white transition-colors">
                              {video.channelName}
                              {video.channelIsVerified && <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                            </div>
                            <div className="text-gray-500 text-[10px]">
                              {formatViews(video.viewsCount)} lượt xem •{" "}
                              {getTimeAgo(video.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── TWO COLUMN LAYOUT ────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
              {/* LEFT COLUMN: Danh sách thịnh hành */}
              <div className="min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#E91E63]" />
                    <h2 className="text-[17px] font-extrabold text-white">
                      Danh sách thịnh hành
                    </h2>
                  </div>

                  {/* Time Filters */}
                  <div className="flex  w-fit">
                    <button
                      onClick={() => {
                        setTimeFilter("24h");
                        setVisibleCount(10);
                      }}
                      className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${timeFilter === "24h" ? "bg-[#FF4E00] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                    >
                      24 giờ
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("7d");
                        setVisibleCount(10);
                      }}
                      className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${timeFilter === "7d" ? "bg-[#FF4E00] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                    >
                      7 ngày
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("30d");
                        setVisibleCount(10);
                      }}
                      className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${timeFilter === "30d" ? "bg-[#FF4E00] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                    >
                      30 ngày
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("all");
                        setVisibleCount(10);
                      }}
                      className={`px-5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${timeFilter === "all" ? "bg-[#FF4E00] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                    >
                      Tất cả thời gian
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3 ">
                  {restVideos.map((video, idx) => {
                    const trend = getTrendStr(video.id);
                    return (
                      <div
                        key={video.id}
                        onClick={() =>
                          navigate(
                            video.isShort
                              ? `/shorts?id=${video.id}`
                              : `/watch/${video.id}`,
                          )
                        }
                        className="group flex items-center gap-4 p-2 rounded-2xl hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                      >
                        {/* Rank */}
                        <div className="w-8 text-center text-[18px] font-black text-gray-300 group-hover:text-white shrink-0 font-mono">
                          {idx + 4}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-[160px] aspect-video rounded-xl overflow-hidden shrink-0 bg-[#222]">
                          {video.isShort ? (
                            <>
                              <img
                                src={
                                  video.thumbnailUrl ||
                                  "https://via.placeholder.com/320x180"
                                }
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-50"
                              />
                              <img
                                src={
                                  video.thumbnailUrl ||
                                  "https://via.placeholder.com/320x180"
                                }
                                alt=""
                                className="relative w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </>
                          ) : (
                            <img
                              src={
                                video.thumbnailUrl ||
                                "https://via.placeholder.com/320x180"
                              }
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            {video.isShort ? (
                              <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit">
                                <Flame className="w-3 h-3" /> Shorts
                              </span>
                            ) : (
                              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit">
                                <Play className="w-3 h-3" /> Video
                              </span>
                            )}
                          </div>
                          <h3 className="text-white font-bold text-[14px] line-clamp-2 leading-snug group-hover:text-[#E91E63] transition-colors mb-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-400 text-[12px]">
                            <div className="flex items-center gap-1 hover:text-white">
                              <img
                                src={
                                  video.channelAvatarUrl ||
                                  `https://ui-avatars.com/api/?name=${video.channelName}&background=random`
                                }
                                alt=""
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="truncate max-w-[200px]">
                                {video.channelName}
                              </span>
                              {video.channelIsVerified && <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                            </div>
                            <span>•</span>
                            <span>
                              {formatViews(video.viewsCount)} lượt xem
                            </span>
                            <span>•</span>
                            <span>{getTimeAgo(video.createdAt)}</span>
                          </div>
                        </div>

                        {/* Trend Indicator */}
                        <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-16">
                          <div
                            className={`flex items-center gap-1 text-[12px] font-bold ${trend.type === "up" ? "text-[#00E676]" : "text-[#FF1744]"}`}
                          >
                            {trend.type === "up" ? (
                              <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                            {trend.type === "up" ? "+" : "-"}
                            {trend.val}%
                          </div>
                        </div>

                        {/* More action */}
                        <button
                          className="shrink-0 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="mt-2 mx-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 text-[13px] font-bold transition-colors w-fit border border-white/5"
                    >
                      Xem thêm video <ArrowDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar */}
              <div className="flex flex-col gap-6">
                {/* Chủ đề thịnh hành */}
                <div className="p-2 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <Flame className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-white font-extrabold text-[15px]">
                      Chủ đề thịnh hành
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    {categoryStats.map((topic, index) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => setActiveFilter(topic.name)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 text-center font-bold text-[12px] ${index < 3 ? "text-yellow-400" : "text-gray-500"}`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-white text-[13px] font-bold group-hover:text-red-400 transition-colors">
                            #{topic.name.replace(/\s+/g, "").toLowerCase()}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-300 text-[11px] font-medium">
                            {formatViews(topic.totalViews)} lượt xem
                          </span>
                          <span className="text-gray-500 text-[10px]">
                            {topic.totalVideos} video
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kênh thịnh hành */}
                <div className="p-2 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-5">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-white font-extrabold text-[15px]">
                      Kênh thịnh hành
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {topChannels.map((channel) => (
                      <SidebarChannelCard
                        key={channel.id}
                        channel={channel}
                        initialSubbed={subscribedChannelIds.includes(
                          channel.id,
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Promo Block */}
                <div className="rounded-3xl p-6 bg-gradient-to-br from-[#FF3366] via-[#FF5722] to-[#FF9800] relative overflow-hidden group cursor-pointer shadow-lg shadow-orange-900/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-extrabold text-[17px] mb-1">
                        Bắt kịp xu hướng mới nhất
                      </h3>
                    </div>
                    <p className="text-white/80 text-[13px] text-center leading-relaxed">
                      Đừng bỏ lỡ hàng ngàn video thịnh hành được cập nhật liên tục mỗi giờ. Khám phá kho nội dung đa dạng từ âm nhạc, giải trí, đời sống đến công nghệ cùng cộng đồng sáng tạo tại VideoX.
                    </p>
                    <button
                      onClick={() => navigate("/explore")}
                      className="mt-2 bg-white text-[#FF3366] px-5 py-2.5 rounded-full text-[12px] font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      Khám phá ngay{" "}
                      <ArrowRight className="w-3 h-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StarIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

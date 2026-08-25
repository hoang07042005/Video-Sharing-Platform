import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import LivestreamPlayer from "../../../components/video/LivestreamPlayer";
import LivestreamChat from "../../../components/video/LivestreamChat";
import {
  Heart,
  Share2,
  MoreHorizontal,
  Gift,
  Star,
  ThumbsUp,
  CheckCircle2,
  Medal,
  Bell,
  ChevronDown,
  Trophy,
  Target,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Coins,
} from "lucide-react";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const formatViews = (v) => {
  if (!v) return "0";
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")} N`;
  return String(v);
};

const normalizeId = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export default function LiveWatch() {
  const { id } = useParams();
  const [stream, setStream] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

  const handleLike = async () => {
    if (!stream) return;
    try {
      const res = await axios.post(
        `/api/livestreams/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setIsLiked(res.data.isLiked);
      setStream((prev) => ({ ...prev, likes: res.data.likesCount }));
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
      } else {
        console.error("Failed to like livestream", err);
      }
    }
  };

  const handleSubscribe = async () => {
    const channelId = stream?.channelId || channel?.id;
    if (!channelId) return;
    try {
      const res = await axios.post(
        `/api/channels/${channelId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setIsSubscribed(res.data.isSubscribed);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
      } else {
        console.error("Failed to subscribe", err);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Đã sao chép liên kết livestream!");
  };

  const handleGift = () => {
    setShowGiftModal(true);
  };

  const handleSendGift = async (gift) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tặng quà!");
      throw new Error("Not logged in");
    }

    try {
      const res = await axios.post(
        "/api/donations/send-gift",
        {
          livestreamId: id,
          donorName:
            localStorage.getItem("handle") ||
            localStorage.getItem("email") ||
            "Ẩn danh",
          message: `Đã tặng ${gift.name} ${gift.icon}`,
          amount: gift.price,
          currency: "Xu",
          isSuperChat: false,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success(`Bạn đã gửi tặng ${gift.name} thành công!`);
      const senderName = localStorage.getItem("handle") || "Bạn";

      // Update donations instantly
      setDonations((prev) => [
        {
          id: res.data.donation?.id || Date.now(),
          donorName: senderName,
          message: `Đã tặng ${gift.name} ${gift.icon}`,
          amount: gift.price,
          currency: "Xu",
          createdAt: new Date().toISOString(),
          avatarUrl: localStorage.getItem("avatarUrl") || null,
        },
        ...prev,
      ]);

      setShowGiftModal(false);
    } catch (err) {
      const msg = err.response?.data || "Có lỗi xảy ra khi tặng quà";
      toast.error(
        typeof msg === "string" ? msg : msg.message || "Lỗi tặng quà",
      );
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchStream = async () => {
      try {
        const streamRes = await axios.get(`/api/livestreams/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!mounted) return;
        const currentStream = streamRes.data;
        setStream(currentStream);
        if (currentStream.isLiked !== undefined) {
          setIsLiked(currentStream.isLiked);
        }

        const streamChannelId =
          currentStream?.channelId || currentStream?.channel?.id;
        if (streamChannelId) {
          try {
            const channelRes = await axios.get(
              `/api/channels/by-id/${streamChannelId}`,
            );
            if (mounted) setChannel(channelRes.data || null);

            // Check subscribe status
            try {
              const followRes = await axios.get(
                `/api/channels/by-id/${streamChannelId}/check-follow`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              );
              if (mounted) setIsSubscribed(followRes.data.isSubscribed);
            } catch {
              // Ignore if not logged in
            }
          } catch {
            try {
              const channelsRes = await axios.get("/api/channels");
              if (!mounted) return;
              const match = (channelsRes.data || []).find(
                (item) => normalizeId(item.id) === normalizeId(streamChannelId),
              );
              setChannel(match || null);
            } catch {
              if (mounted) setChannel(null);
            }
          }
        }
        return currentStream;
      } catch (err) {
        console.error("Failed to fetch livestream", err);
        return null;
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchDonations = async () => {
      if (!id) return;
      try {
        const [donationsRes, statsRes] = await Promise.all([
          axios.get(`/api/donations/livestream/${id}`),
          axios.get(`/api/donations/livestream/${id}/stats`),
        ]);
        if (mounted) {
          setDonations(donationsRes.data);
          setDonationStats(statsRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch donations", err);
      }
    };

    let pollInterval;
    const init = async () => {
      await fetchStream();
      await fetchDonations();

      pollInterval = setInterval(async () => {
        if (!mounted || !id) return;
        try {
          const res = await axios.get(`/api/livestreams/${id}`);
          if (mounted) {
            setStream((prev) => {
              if (!prev) return res.data;
              return {
                ...prev,
                currentViewers: res.data.currentViewers,
                likes: res.data.likes,
                totalViews: res.data.totalViews,
                hlsUrl: res.data.hlsUrl,
                status: res.data.status,
              };
            });
          }
          await fetchDonations();
        } catch {
          // ignore polling errors
        }
      }, 5000);
    };

    if (id) {
      init();
    }

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  const hlsSource = useMemo(() => {
    if (!stream) return "";
    const candidate =
      [stream.hlsUrl, stream.streamUrl, stream.playbackUrl, stream.vodUrl].find(
        (value) => typeof value === "string" && value.trim().length > 0,
      ) || "";
    return candidate.trim();
  }, [stream]);

  const topGifters = useMemo(() => {
    const map = {};
    donations.forEach((d) => {
      if (d.currency === "Xu") return;
      if (!map[d.donorName])
        map[d.donorName] = { amount: 0, avatarUrl: d.avatarUrl };
      map[d.donorName].amount += d.amount;
      if (d.avatarUrl) map[d.donorName].avatarUrl = d.avatarUrl;
    });
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        avatarUrl: data.avatarUrl,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [donations]);

  const computedStats = useMemo(() => {
    return {
      totalAmount: donations
        .filter((d) => d.currency !== "Xu")
        .reduce((acc, d) => acc + d.amount, 0),
      totalCoins: donations
        .filter((d) => d.currency === "Xu")
        .reduce((acc, d) => acc + d.amount, 0),
    };
  }, [donations]);

  const recentGiftsList = useMemo(() => {
    const xuDonations = donations.filter(
      (d) =>
        d.currency === "Xu" && d.message && d.message.startsWith("Đã tặng"),
    );
    const aggregated = [];

    xuDonations.forEach((d) => {
      let name = "Quà";
      let icon = "🎁";
      const parts = d.message.replace("Đã tặng ", "").trim().split(" ");
      if (parts.length > 1) {
        icon = parts.pop();
        name = parts.join(" ");
      } else {
        name = parts[0];
      }

      const existing = aggregated.find(
        (a) => a.senderName === d.donorName && a.gift.name === name,
      );
      if (existing) {
        existing.quantity += 1;
        if (new Date(d.createdAt) > existing.timestamp) {
          existing.timestamp = new Date(d.createdAt);
        }
      } else {
        aggregated.push({
          senderName: d.donorName,
          gift: { name, icon },
          timestamp: new Date(d.createdAt),
          avatarUrl: d.avatarUrl,
          quantity: 1,
        });
      }
    });

    return aggregated.sort((a, b) => b.timestamp - a.timestamp);
  }, [donations]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen  text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen  text-white">
        Livestream không tồn tại hoặc đã kết thúc.
      </div>
    );
  }

  return (
    <div className="flex-1  min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto p-2 md:p-2">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Main Content (Left) */}
          <div className="space-y-6">
            {/* Video Player Section */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-white/5">
              <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                {stream.status === "paused" ? (
                  <div className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <LucideIcons.Pause className="w-3 h-3" />
                    ĐÃ TẠM DỪNG
                  </div>
                ) : (
                  <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
                <div className="bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 pointer-events-auto">
                  <div className="w-4 h-3 flex justify-center items-end gap-[1px]">
                    <div className="w-[2px] h-2 bg-white rounded-full"></div>
                    <div className="w-[2px] h-3 bg-white rounded-full"></div>
                    <div className="w-[2px] h-1.5 bg-white rounded-full"></div>
                  </div>
                  {formatViews(stream.currentViewers ?? stream.totalViews ?? 0)}
                </div>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur hover:bg-white/20 flex items-center justify-center text-white transition">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur hover:bg-white/20 flex items-center justify-center text-white transition">
                  <Star className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur hover:bg-white/20 flex items-center justify-center text-white transition">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {hlsSource ? (
                <>
                  <LivestreamPlayer
                    key={hlsSource}
                    hlsUrl={hlsSource}
                    poster={stream.thumbnailUrl}
                    className="relative z-0"
                  />
                  {stream.status === "paused" && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                      <LucideIcons.PauseCircle className="w-16 h-16 text-amber-500 mb-4 animate-pulse" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Luồng phát đang tạm dừng
                      </h3>
                      <p className="text-gray-300 text-sm max-w-md text-center">
                        Người phát đã tạm dừng luồng trực tiếp này. Video sẽ tự
                        động tiếp tục khi họ quay lại.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center text-white bg-[#111] px-6 text-center">
                  Livestream đang được khởi tạo hoặc chưa có luồng phát hợp lệ.
                </div>
              )}
            </div>

            {/* Channel Info & Actions */}
            <div className="flex flex-col gap-4 pt-2">
              {/* Top Row: Channel Info */}
              <div className="flex gap-4 items-start">
                <Link
                  to={`/c/${channel?.handle || "live"}`}
                  className="shrink-0"
                >
                  <img
                    src={
                      channel?.avatarUrl ||
                      channel?.user?.profile?.avatarUrl ||
                      "https://ui-avatars.com/api/?name=C&background=random"
                    }
                    alt={channel?.channelName || "Kênh"}
                    className="w-[60px] h-[60px] rounded-full object-cover border border-white/10"
                  />
                </Link>
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg font-bold text-white hover:text-gray-200 transition-colors leading-none">
                      {channel?.channelName || "Kênh trực tiếp"}
                    </h1>
                    <CheckCircle2
                      className="w-4 h-4 text-[#7B1FA2]"
                      fill="currentColor"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {stream.status === "paused" ? (
                      <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 leading-none h-[18px]">
                        <LucideIcons.Pause className="w-2.5 h-2.5" />
                        ĐÃ TẠM DỪNG
                      </span>
                    ) : (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 leading-none h-[18px]">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </span>
                    )}
                    <h2 className="text-[15px] font-semibold text-white leading-none">
                      {stream.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {stream.category && (
                      <span className="text-[11px] font-medium text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                        {stream.category.name}
                      </span>
                    )}
                    {stream.tags
                      ? stream.tags
                          .split(",")
                          .filter(Boolean)
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium text-gray-300 bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition cursor-pointer"
                            >
                              {tag.trim()}
                            </span>
                          ))
                      : null}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                {/* Left Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubscribe}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                      isSubscribed
                        ? "bg-white/10 hover:bg-white/20 text-gray-300"
                        : "bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white"
                    }`}
                  >
                    <Bell
                      className={`w-4 h-4 ${isSubscribed ? "fill-gray-300 text-gray-300" : ""}`}
                    />{" "}
                    {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0 ${
                      isLiked
                        ? "bg-white/20 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <ThumbsUp
                      className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`}
                    />{" "}
                    {formatViews(stream.likes || 0)}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0"
                  >
                    <Share2 className="w-4 h-4" /> Chia sẻ
                  </button>
                  <button
                    onClick={handleGift}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0"
                  >
                    <Gift className="w-4 h-4" /> Quà tặng
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Cards */}
            <div className="flex flex-col gap-4">
              {/* Intro Card (Full Width) */}
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 hover:bg-[#161616] transition-colors">
                <h3 className="text-white font-semibold mb-3">Giới thiệu</h3>
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {stream.description || "Chưa có mô tả cho livestream này."}
                </p>
              </div>

              {/* 3 Columns: Top Donate, Recent Gifts & Goal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Top Donate Card */}
                <div className="bg-[#0B0A0F] border border-white/5 rounded-2xl p-2 flex flex-col">
                  <div className="flex items-center gap-3 mb-2 p-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#7B1FA2]/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-[#9C27B0]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        Top donate
                      </h3>
                      <p className="text-xs text-gray-400">
                        Top 10 tài khoản ủng hộ nhiều nhất
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-white/5 mb-3 px-2">
                      <div className="flex items-center gap-6">
                        <span className="w-4 text-center">#</span>
                        <span>Tài khoản</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Số tiền ủng hộ</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      {topGifters.length > 0 ? (
                        topGifters.map((g, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-2 py-1 relative"
                          >
                            {i === 0 && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#9C27B0] rounded-l"></div>
                            )}
                            <div className="flex items-center gap-6">
                              <span
                                className={`w-4 text-center font-bold text-sm ${
                                  i === 0
                                    ? "text-yellow-400"
                                    : i === 1
                                      ? "text-gray-300"
                                      : i === 2
                                        ? "text-amber-600"
                                        : i === 3
                                          ? "text-blue-400"
                                          : i === 4
                                            ? "text-purple-400"
                                            : "text-white"
                                }`}
                              >
                                {i < 5 ? (
                                  <span className="flex items-center gap-1">
                                    <Medal className="w-3.5 h-3.5" /> {i + 1}
                                  </span>
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    g.avatarUrl ||
                                    `https://ui-avatars.com/api/?name=${g.name.replace("@", "")}&background=random`
                                  }
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-xs text-gray-200">
                                  {g.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-[#FF5252]">
                              {g.amount.toLocaleString("vi-VN")} đ
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Gifts Card */}
                <div className="bg-[#0B0A0F] border border-white/5 rounded-2xl p-2 flex flex-col">
                  <div className="flex items-center justify-between mb-6 p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#7B1FA2]/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-[#9C27B0]" />
                      </div>
                      <h3 className="text-white font-bold text-lg">
                        Danh sách tặng quà
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[450px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {recentGiftsList.length > 0 ? (
                      recentGiftsList.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between pt-2 px-2"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                item.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${item.senderName.replace("@", "")}&background=random`
                              }
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-xs text-white font-medium">
                                {item.senderName}
                              </div>
                              <div className="text-[8px] text-gray-500">
                                {timeAgo(item.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400 text-[12px]">
                              tặng
                            </span>
                            <span className="text-xl">{item.gift.icon}</span>
                            <span className="font-bold text-[10px] text-yellow-400">
                              {item.gift.name}
                            </span>
                            <span className="text-[#9C27B0] text-xs font-bold ml-2">
                              x {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Chưa có người tặng quà
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal Card */}
                <div className="bg-[#0B0A0F] border border-white/5 rounded-2xl p-2 flex flex-col relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10 border-b border-white/5 p-4">
                    <div className="w-10 h-10 rounded-full bg-[#7B1FA2]/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#9C27B0]" />
                    </div>
                    <h3 className="text-white font-bold text-lg">
                      Mục tiêu quyên góp
                    </h3>
                  </div>

                  <div className="relative z-10 p-4">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-sm text-gray-300">
                        Mục tiêu phiên Live
                      </div>
                      <span className="text-white font-bold text-xl">
                        {Math.min(
                          Math.round(
                            (computedStats.totalAmount / 10000000) * 100,
                          ),
                          100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full"
                        style={{
                          width: `${Math.min((computedStats.totalAmount / 10000000) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mb-6">
                      Đã nhận:{" "}
                      {computedStats.totalAmount.toLocaleString("vi-VN")} /
                      10.000.000 đ
                    </div>

                    <div className="bg-[#1A1128] border border-[#2D1B46] rounded-xl p-4 flex flex-row items-center gap-3 text-left mb-6">
                      <div className="w-10 h-10 rounded-full bg-[#9C27B0]/20 flex items-center justify-center shrink-0">
                        <Heart
                          className="w-5 h-5 text-[#9C27B0]"
                          fill="currentColor"
                        />
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed flex-1">
                        Cảm ơn bạn đã luôn ủng hộ và đồng hành cùng kênh!
                      </p>
                    </div>

                    <button
                      onClick={() => setShowDonateModal(true)}
                      className="w-full bg-gradient-to-r from-[#FF4D4D] to-[#9C27B0] hover:opacity-90 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(156,39,176,0.3)] mb-6"
                    >
                      Ủng hộ ngay{" "}
                      <Heart className="w-4 h-4" fill="currentColor" />
                    </button>
                  </div>

                  <div className="mt-auto border-t border-white/5 p-8 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-300">
                        Số xu đã nhận từ quà tặng
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-black text-yellow-400 mb-1 tracking-tight">
                          {computedStats.totalCoins.toLocaleString("vi-VN")} xu
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Tổng số xu đã nhận từ tất cả quà tặng
                        </div>
                      </div>
                      {/* Decorative Coins Graphic placeholder */}
                      <div className="text-5xl drop-shadow-xl translate-x-2">
                        💰
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Chat */}
          <aside className="bg-[#121212] border border-white/5 rounded-2xl flex flex-col h-[600px] sticky top-6 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">
                  Chat trực tiếp
                </h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowGiftModal(true);
                  }}
                  className="text-[#7B1FA2] hover:text-white transition-colors flex items-center gap-1 bg-[#7B1FA2]/20 px-2 py-1 rounded"
                >
                  <Gift className="w-4 h-4" />{" "}
                  <span className="text-xs font-semibold">Tặng quà</span>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-[#0F0F0F]">
              <LivestreamChat
                livestreamId={id}
                apiBaseUrl=""
                userId={localStorage.getItem("userId")}
              />
            </div>
          </aside>
        </div>
      </div>

      {showGiftModal && (
        <GiftModal
          onClose={() => setShowGiftModal(false)}
          onSendGift={handleSendGift}
        />
      )}

      {showDonateModal && (
        <DonateModal
          livestreamId={id}
          onClose={() => setShowDonateModal(false)}
        />
      )}
    </div>
  );
}

const DonateModal = ({ livestreamId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    donorName:
      localStorage.getItem("handle") || localStorage.getItem("email") || "",
    message: "",
    amount: 50000,
    isSuperChat: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "amount"
            ? parseFloat(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return toast.error("Vui lòng đăng nhập để thực hiện quyên góp qua VNPay");
    }
    if (!formData.donorName.trim())
      return toast.error("Vui lòng nhập tên của bạn");
    if (formData.amount < 10000)
      return toast.error("Số tiền tối thiểu là 10,000 VND");

    setLoading(true);
    try {
      // 1. Create Pending Donation
      const res = await axios.post("/api/donations/create", {
        livestreamId,
        donorName: formData.donorName,
        message: formData.message,
        amount: formData.amount,
        currency: "VND",
        isSuperChat: formData.isSuperChat,
        userId: userId,
      });

      const donationId = res.data.id;

      // 2. Get VNPay URL
      const payRes = await axios.post(
        "/api/payment/create-payment-url",
        {
          plan: "Donation",
          amount: formData.amount,
          donationId: donationId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // 3. Redirect to VNPay
      toast.info("Đang chuyển hướng đến VNPay...");
      window.open(payRes.data.url, "_blank");
      onClose();
    } catch (err) {
      toast.error(
        "Lỗi tạo yêu cầu thanh toán: " + (err.response?.data || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1F1F1F] rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" fill="currentColor" /> Quyên
          góp cho streamer
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Tên của bạn
            </label>
            <input
              type="text"
              name="donorName"
              value={formData.donorName}
              onChange={handleInputChange}
              placeholder="Nhập tên"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B1FA2]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Lời nhắn (tùy chọn)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Gửi lời chúc..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B1FA2] resize-none h-20"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Số tiền (VND)
            </label>
            <select
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#7B1FA2]"
            >
              <option value={10000} className="bg-[#1F1F1F]">
                10,000 VND
              </option>
              <option value={20000} className="bg-[#1F1F1F]">
                20,000 VND
              </option>
              <option value={50000} className="bg-[#1F1F1F]">
                50,000 VND
              </option>
              <option value={100000} className="bg-[#1F1F1F]">
                100,000 VND
              </option>
              <option value={200000} className="bg-[#1F1F1F]">
                200,000 VND
              </option>
              <option value={500000} className="bg-[#1F1F1F]">
                500,000 VND
              </option>
              <option value={1000000} className="bg-[#1F1F1F]">
                1,000,000 VND
              </option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              name="isSuperChat"
              checked={formData.isSuperChat}
              onChange={handleInputChange}
              className="w-4 h-4 accent-[#7B1FA2] rounded"
            />
            <span className="text-sm text-gray-300">
              Super Chat ⭐ (hiển thị nổi bật)
            </span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#7B1FA2] hover:bg-[#6A1B9A] rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
            >
              {loading ? "Đang xử lý..." : "Quyên góp ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GiftModal = ({ onClose, onSendGift }) => {
  const [coins, setCoins] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("/api/payment/current-plan", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data && res.data.coins !== undefined) {
            setCoins(res.data.coins);
          }
        })
        .catch((err) => console.error("Error fetching coins:", err));
    }
  }, []);

  const gifts = [
    { id: 1, name: "Hoa hồng", price: 10, icon: "🌹" },
    { id: 2, name: "Trái tim", price: 20, icon: "❤️" },
    { id: 3, name: "Cà phê", price: 50, icon: "☕" },
    { id: 4, name: "Kem", price: 100, icon: "🍦" },
    { id: 5, name: "Gấu bông", price: 200, icon: "🧸" },
    { id: 6, name: "Vương miện", price: 500, icon: "👑" },
    { id: 7, name: "Kim cương", price: 1000, icon: "💎" },
    { id: 8, name: "Tên lửa", price: 2000, icon: "🚀" },
    { id: 9, name: "Siêu xe", price: 5000, icon: "🏎️" },
    { id: 10, name: "Lâu đài", price: 10000, icon: "🏰" },
    { id: 11, name: "Phi thuyền", price: 20000, icon: "🛸" },
    { id: 12, name: "Hành tinh", price: 50000, icon: "🌍" },
  ];

  const handleRecharge = () => {
    onClose();
    navigate(`/buy-coins?returnTo=${location.pathname}`);
  };

  const handleSend = async (gift) => {
    if (coins < gift.price) {
      toast.error("Bạn không đủ xu, vui lòng nạp thêm!");
      return;
    }

    // Attempt to send the gift
    try {
      await onSendGift(gift);
      // Deduct coins only if successful
      const newBalance = coins - gift.price;
      setCoins(newBalance);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-[420px] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">🎁 Gửi Quà Tặng</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg transition"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold">💰 Số xu của bạn:</span>
            <span className="text-white font-bold">
              {coins.toLocaleString("vi-VN")}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleRecharge();
            }}
            className="bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-lg"
          >
            Nạp xu
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {gifts.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSend(g);
              }}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform mb-1">
                {g.icon}
              </span>
              <span className="text-xs text-white/80 font-medium whitespace-nowrap mb-0.5">
                {g.name}
              </span>
              <span className="text-[10px] text-yellow-500 font-bold">
                {g.price} xu
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

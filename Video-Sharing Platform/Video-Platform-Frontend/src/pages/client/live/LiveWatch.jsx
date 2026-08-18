import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import LivestreamPlayer from "../../../components/video/LivestreamPlayer";
import LivestreamChat from "../../../components/video/LivestreamChat";
import { Heart, Share2, MoreHorizontal, Gift, Star, ThumbsUp, CheckCircle2, Medal, UserPlus, Bell } from 'lucide-react';

const formatViews = (v) => {
  if (!v) return "0";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} Tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")} N`;
  return String(v);
};

const normalizeId = (value) => String(value ?? "").trim().toLowerCase();

export default function LiveWatch() {
  const { id } = useParams();
  const [stream, setStream] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchStream = async () => {
      try {
        const streamRes = await axios.get(`/api/livestreams/${id}`);
        if (!mounted) return;
        const currentStream = streamRes.data;
        setStream(currentStream);

        const streamChannelId = currentStream?.channelId || currentStream?.channel?.id;
        if (streamChannelId) {
          try {
            const channelRes = await axios.get(`/api/channels/by-id/${streamChannelId}`);
            if (mounted) setChannel(channelRes.data || null);
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
          axios.get(`/api/donations/livestream/${id}/stats`)
        ]);
        if (mounted) {
          setDonations(donationsRes.data);
          setDonationStats(statsRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch donations", err);
      }
    };

    if (!id) return;
    fetchStream();
    fetchDonations();

    const pollInterval = setInterval(async () => {
      if (!mounted) return;
      const updated = await fetchStream();
      fetchDonations();
      if (updated && (updated.hlsUrl || updated.status === "ended")) {
        clearInterval(pollInterval);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [id]);

  const hlsSource = useMemo(() => {
    if (!stream) return "";
    const candidate = [stream.hlsUrl, stream.streamUrl, stream.playbackUrl, stream.vodUrl].find(
      (value) => typeof value === "string" && value.trim().length > 0,
    ) || "";
    return candidate.trim();
  }, [stream]);

  const topGifters = useMemo(() => {
    const map = {};
    donations.forEach(d => {
      map[d.donorName] = (map[d.donorName] || 0) + d.amount;
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [donations]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
        Livestream không tồn tại hoặc đã kết thúc.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0A0A0A] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          
          {/* Main Content (Left) */}
          <div className="space-y-6">
            
            {/* Video Player Section */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-white/5">
              <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
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
                <LivestreamPlayer key={hlsSource} hlsUrl={hlsSource} poster={stream.thumbnailUrl} className="relative z-0" />
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
                <Link to={`/c/${channel?.handle || 'live'}`} className="shrink-0">
                  <img
                    src={channel?.avatarUrl || channel?.user?.profile?.avatarUrl || "https://ui-avatars.com/api/?name=C&background=random"}
                    alt={channel?.channelName || "Kênh"}
                    className="w-[60px] h-[60px] rounded-full object-cover border border-white/10"
                  />
                </Link>
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-lg font-bold text-white hover:text-gray-200 transition-colors leading-none">
                      {channel?.channelName || "Kênh trực tiếp"}
                    </h1>
                    <CheckCircle2 className="w-4 h-4 text-[#7B1FA2]" fill="currentColor" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 leading-none h-[18px]">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </span>
                    <h2 className="text-[15px] font-semibold text-white leading-none">
                      {stream.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {stream.tags ? stream.tags.split(',').filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-[11px] font-medium text-gray-300 bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition cursor-pointer">
                        {tag.trim()}
                      </span>
                    )) : null}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                {/* Left Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors">
                    <Heart className="w-4 h-4" /> Theo dõi
                  </button>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors">
                    <Bell className="w-4 h-4" /> Đăng ký
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0">
                    <ThumbsUp className="w-4 h-4" /> {formatViews(stream.totalViews || 0)}
                  </button>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0">
                    <Share2 className="w-4 h-4" /> Chia sẻ
                  </button>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0">
                    <Gift className="w-4 h-4" /> Quà tặng
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Intro Card */}
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 hover:bg-[#161616] transition-colors">
                <h3 className="text-white font-semibold mb-3">Giới thiệu</h3>
                <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed whitespace-pre-line">
                  {stream.description || "Chưa có mô tả cho livestream này."}
                </p>
              </div>

              {/* Top Gifters Card */}
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">Top tặng quà</h3>
                <div className="space-y-3">
                  {topGifters.length > 0 ? topGifters.map((g, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold w-4 text-center ${i===0 ? 'text-yellow-400' : i===1 ? 'text-gray-300' : 'text-amber-600'}`}>{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                          <img src={`https://ui-avatars.com/api/?name=${g.name}&background=random`} alt="" className="w-full h-full rounded-full" />
                        </div>
                        <span className="text-sm text-gray-300">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-yellow-500 font-medium">
                        <Medal className="w-3.5 h-3.5" /> {(g.amount >= 1000 ? (g.amount/1000).toFixed(1).replace(/\.0$/, '') + 'K' : g.amount)}
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">Chưa có dữ liệu</div>}
                </div>
              </div>

              {/* Goal Card */}
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3">Mục tiêu quyên góp</h3>
                <div className="text-sm text-gray-300 mb-2">Hỗ trợ phiên Live</div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full" 
                         style={{width: `${Math.min(((donationStats?.totalAmount || 0) / 10000000) * 100, 100)}%`}}></div>
                  </div>
                  <span className="text-white font-bold text-sm">{Math.min(Math.round(((donationStats?.totalAmount || 0) / 10000000) * 100), 100)}%</span>
                </div>
                <div className="text-xs text-gray-500 mb-4">Đã nhận: {(donationStats?.totalAmount || 0).toLocaleString('vi-VN')} / 10.000.000 đ</div>
                <button className="w-full bg-white/5 hover:bg-[#7B1FA2] text-white border border-[#7B1FA2]/50 hover:border-[#7B1FA2] py-2 rounded-xl text-sm font-semibold transition-all">
                  Ủng hộ ngay
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar - Chat */}
          <aside className="bg-[#121212] border border-white/5 rounded-2xl flex flex-col h-[calc(100vh-48px)] sticky top-6 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold">Trò chuyện trực tiếp</h2>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <div className="w-3 h-3 flex justify-center items-end gap-[1px]">
                    <div className="w-[1px] h-2 bg-gray-400"></div>
                    <div className="w-[1px] h-3 bg-gray-400"></div>
                    <div className="w-[1px] h-1.5 bg-gray-400"></div>
                  </div>
                  {formatViews(stream.currentViewers ?? stream.totalViews ?? 0)}
                </div>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Top Gifters Strip in Chat */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 shrink-0 overflow-x-auto scrollbar-hide">
              {topGifters.map((g, i) => (
                <div key={i} className={`flex items-center gap-2 ${i===0 ? 'bg-[#7B1FA2]/20 border border-[#7B1FA2]/30' : 'bg-white/5'} rounded-full px-2 py-1 pr-3`}>
                  <div className="relative">
                    {i===0 && <div className="absolute -top-1.5 -left-1 text-yellow-400 text-xs">👑</div>}
                    <img src={`https://ui-avatars.com/api/?name=${g.name}&background=random`} className={`w-6 h-6 rounded-full ${i===0?'border border-[#7B1FA2]':''}`} alt="" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white leading-none">{g.name}</div>
                    <div className={`text-[9px] ${i===0 ? 'text-[#7B1FA2]' : i===1 ? 'text-pink-500' : 'text-red-500'} font-semibold flex items-center gap-0.5 mt-0.5`}>
                      {i===0 ? <Gift className="w-2.5 h-2.5"/> : <Heart className="w-2.5 h-2.5"/>} {(g.amount >= 1000 ? (g.amount/1000).toFixed(1).replace(/\.0$/, '') + 'K' : g.amount)}
                    </div>
                  </div>
                </div>
              ))}
              {topGifters.length === 0 && <span className="text-xs text-gray-500">Chưa có dữ liệu tặng quà</span>}
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
    </div>
  );
}

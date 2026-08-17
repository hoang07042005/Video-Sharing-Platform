import { useState, useEffect } from "react";
import axios from "axios";
import {
  Flame,
  Loader2,
  Crown,
  TrendingUp,
  Play,
  ChevronRight,
  Music,
  Monitor,
  Gamepad2,
  Tv,
  BookOpen,
  Dumbbell,
  Bell,
  Star,
  MoreVertical,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CategoryFilter from "../../../components/home/CategoryFilter";
import FeaturedHero from "../../../components/home/FeaturedHero";
import VideoCard from "../../../components/home/VideoCard";
import { getIconColor } from '../../../utils/iconHelpers';

// ─── Helpers ───────────────────────────────────────────────────
const formatDuration = (s) => {
  if (!s) return "0:00";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
};
const formatViews = (v) => {
  if (!v) return "0";
  if (v >= 1_000_000)
    return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + " Tr";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + " N";
  return String(v);
};
const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s >= 31536000) return Math.floor(s / 31536000) + " năm trước";
  if (s >= 2592000) return Math.floor(s / 2592000) + " tháng trước";
  if (s >= 86400) return Math.floor(s / 86400) + " ngày trước";
  if (s >= 3600) return Math.floor(s / 3600) + " giờ trước";
  if (s >= 60) return Math.floor(s / 60) + " phút trước";
  return "Vừa xong";
};

// ─── Video Card nhỏ (dùng trong Trending / Đề xuất) ────────────
function SmallVideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() =>
        navigate(
          video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`,
        )
      }
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#1A1A1A]">
        {video.isShort ? (
          <>
            <img
              src={
                video.thumbnailUrl ||
                "https://via.placeholder.com/320x180?text=Video"
              }
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src={
                video.thumbnailUrl ||
                "https://via.placeholder.com/320x180?text=Video"
              }
              alt={video.title}
              className="relative w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 z-10"
            />
          </>
        ) : (
          <img
            src={
              video.thumbnailUrl ||
              "https://via.placeholder.com/320x180?text=Video"
            }
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium z-20">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/c/${video.channelHandle}`}
          onClick={(e) => e.stopPropagation()}
          className="w-7 h-7 rounded-full overflow-hidden bg-[#2A2A2A] shrink-0 mt-0.5"
        >
          <img
            src={video.channelAvatarUrl || "https://via.placeholder.com/40"}
            alt=""
            className="w-full h-full object-cover"
          />
        </Link>
        <div className="min-w-0">
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
            {video.title}
          </h3>
          <Link
            to={`/c/${video.channelHandle}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 text-[11px] mt-0.5 block hover:text-white transition-colors"
          >
            {video.channelName}
          </Link>
          <p className="text-gray-500 text-[11px]">
            {formatViews(video.viewsCount)} lượt xem •{" "}
            {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Video Card ngang (dùng trong Video mới nhất) ───────────────
function HorizontalVideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() =>
        navigate(
          video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`,
        )
      }
      className="group cursor-pointer flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
    >
      <div className="relative w-50 h-30 aspect-video rounded-lg overflow-hidden bg-[#1A1A1A] shrink-0">
        {video.isShort ? (
          <>
            <img
              src={
                video.thumbnailUrl ||
                "https://via.placeholder.com/320x180?text=Video"
              }
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-60 transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src={
                video.thumbnailUrl ||
                "https://via.placeholder.com/320x180?text=Video"
              }
              alt={video.title}
              className="relative w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 z-10"
            />
          </>
        ) : (
          <img
            src={
              video.thumbnailUrl ||
              "https://via.placeholder.com/320x180?text=Video"
            }
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium z-20">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-white text-xs font-medium line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
          {video.title}
        </h3>
        <Link
          to={`/c/${video.channelHandle}`}
          onClick={(e) => e.stopPropagation()}
          className="text-gray-500 text-xs mt-1 block hover:text-white transition-colors"
        >
          {video.channelName}
        </Link>
        <p className="text-gray-500 text-xs mt-0.5">
          {formatViews(video.viewsCount)} lượt xem • {timeAgo(video.createdAt)}
        </p>
        {video.description && (
          <p className="text-gray-600 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Short Video Card (dùng trong Video ngắn) ────────────────────
function ShortVideoCard({ short }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/shorts?id=${short.id}`)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-[#1A1A1A]">
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
          <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
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

// ─── Featured Channel Card (Kênh nổi bật) ────────────────────
function FeaturedChannelCard({ channel, initialSubbed }) {
  const [subbed, setSubbed] = useState(initialSubbed || false);

  useEffect(() => {
    setSubbed(initialSubbed || false);
  }, [initialSubbed]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 hover:bg-[#1A1A1A] transition-all group">
      {/* Top: Avatar + Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Link to={`/c/${channel.handle}`}>
            <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#2A2A2A]">
              <img
                src={channel.avatarUrl || "https://via.placeholder.com/80"}
                alt={channel.channelName}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 flex flex-col items-start text-left justify-center">
          <Link
            to={`/c/${channel.handle}`}
            className="text-white text-[13px] font-bold line-clamp-1 hover:text-white/80 transition-colors block"
          >
            {channel.channelName}
          </Link>
          <p className="text-gray-400 text-[11px] mt-0.5">{channel.handle}</p>
          <p className="text-gray-400 text-[11px] mt-0.5">
            {formatViews(channel.subscriberCount)} người đăng ký
          </p>
        </div>
      </div>

      {/* Subscribe button */}
      <button
        onClick={() => setSubbed(!subbed)}
        className={`w-full text-xs font-bold py-2 rounded-xl transition-all cursor-pointer mt-1 ${
          subbed
            ? "bg-[#2A2A2A] text-gray-300 hover:bg-[#333]"
            : "bg-gradient-to-r from-[#F05123] to-[#FF7043] text-white hover:brightness-110 shadow-lg shadow-[#FF5722]/10"
        }`}
      >
        {subbed ? "Đã đăng ký" : "Đăng ký"}
      </button>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#FF5722]" />
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Right Sidebar ──────────────────────────────────────────────
import * as LucideIcons from "lucide-react";
import { DEFAULT_CATEGORY_ICON } from "../../../components/home/CategoryFilter";

function RightSidebar() {
  const [quickCategories, setQuickCategories] = useState([]);

  useEffect(() => {
    axios
      .get("/api/videos/categories")
      .then((res) => {
        const mapped = res.data.slice(0, 6).map((cat) => {
          const colorClass = getIconColor(cat.icon);
          return {
            label: cat.name,
            iconName: cat.icon || "LayoutGrid",
            color: colorClass,
            bg: "bg-white/10",
          };
        });
        setQuickCategories(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <aside className="w-72 shrink-0 flex flex-col gap-4">
      <div className="relative min-h-[160px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#E26627] via-[#912A57] to-[#250F49] p-5">
        <div className="pointer-events-none absolute -right-1 bottom-0 z-10 h-[145px] w-[150px] scale-[0.8] origin-bottom-right">
          <div className="absolute left-1/2 top-[42px] h-[75px] w-[95px] -translate-x-1/2 rounded-full bg-orange-400/30 blur-[35px]" />
          <div className="absolute left-1/2 top-[15px] h-[85px] w-[108px] -translate-x-1/2 border border-white/[0.14] bg-white/[0.06] shadow-[inset_0_1px_15px_rgba(255,255,255,0.08)] backdrop-blur-[2px]"style={{
              clipPath:"polygon(50% 0%, 95% 24%, 95% 73%, 50% 100%, 5% 73%, 5% 24%)",}}/>
          <div className="absolute left-1/2 top-[23px] h-[68px] w-[87px] -translate-x-1/2 bg-gradient-to-br from-orange-300/[0.12] via-transparent to-pink-400/[0.08] blur-[2px]"style={{
              clipPath:"polygon(50% 0%, 95% 24%, 95% 73%, 50% 100%, 5% 73%, 5% 24%)",}}/>
          <div className="absolute bottom-[8px] left-1/2 h-[15px] w-[90px] -translate-x-1/2 rounded-full bg-[#3D0628]/50 blur-[8px]" />
          <div className="absolute bottom-[18px] left-1/2 h-[43px] w-[108px] -translate-x-1/2 bg-gradient-to-br from-[#E33B70] via-[#B71956] to-[#72103E] shadow-[0_12px_25px_rgba(55,0,35,0.45)]"style={{
              clipPath: "polygon(0% 32%, 50% 0%, 100% 32%, 50% 100%)",}}/>
          <div className="absolute bottom-[4px] left-1/2 h-[30px] w-[108px] -translate-x-1/2 bg-gradient-to-b from-[#C7215A] to-[#78103F]"style={{
              clipPath: "polygon(0% 0%, 50% 36%, 100% 0%, 100% 58%, 50% 100%, 0% 58%)",}}/>
          <div className="absolute bottom-[27px] left-1/2 h-[18px] w-[92px] -translate-x-1/2 bg-gradient-to-r from-[#F96A8B]/30 via-[#F14472]/70 to-[#A91851]/30"style={{
              clipPath: "polygon(0% 38%, 50% 0%, 100% 38%, 50% 100%)",}}/>
          <div className="absolute bottom-[40px] left-1/2 h-[11px] w-[70px] -translate-x-1/2 rounded-full bg-[#671037]/60 blur-[7px]" />
          <div className="absolute bottom-[43px] left-1/2 h-[58px] w-[76px] -translate-x-1/2 bg-gradient-to-br from-[#FFE16A] via-[#FFC027] to-[#E48608] drop-shadow-[0_5px_12px_rgba(255,174,25,0.5)]"style={{
              clipPath:"polygon(3% 19%, 22% 38%, 35% 0%, 50% 40%, 65% 0%, 78% 38%, 97% 19%, 87% 84%, 13% 84%)",}}/>
          <div className="absolute bottom-[48px] left-1/2 h-[47px] w-[20px] -translate-x-1/2 bg-gradient-to-b from-white/35 via-white/10 to-transparent blur-[1px]"style={{
              clipPath: "polygon(50% 0%, 100% 25%, 80% 100%, 20% 100%, 0% 25%)",}}/>
          <div className="absolute bottom-[39px] left-1/2 h-[15px] w-[76px] -translate-x-1/2 rounded-[5px] bg-gradient-to-b from-[#FFE16A] via-[#FFB91E] to-[#DF8207] shadow-[0_3px_8px_rgba(255,175,20,0.45)]"/>
          <div className="absolute bottom-[49px] left-1/2 h-[3px] w-[63px] -translate-x-1/2 rounded-full bg-[#FFF0A1]/75 blur-[1px]"/>
          <div className="absolute left-[30px] top-[43px] h-[15px] w-[15px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD45D] via-[#FF9227] to-[#E95715] shadow-[0_0_13px_rgba(255,145,40,0.7)]"/>
            <div className="absolute left-[3px] top-[2px] h-[5px] w-[6px] rounded-full bg-white/55 blur-[1px]"/>
          </div>
          <div className="absolute right-[30px] top-[43px] h-[15px] w-[15px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD45D] via-[#FF9227] to-[#E95715] shadow-[0_0_13px_rgba(255,145,40,0.7)]"/>
            <div className="absolute left-[3px] top-[2px] h-[5px] w-[6px] rounded-full bg-white/55 blur-[1px]"/>
          </div>

          <div className="absolute left-1/2 top-[22px] h-[17px] w-[17px] -translate-x-1/2">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFE477] via-[#FF9E2D] to-[#F05A17] shadow-[0_0_17px_rgba(255,126,28,0.85)]" />
            <div className="absolute left-[4px] top-[3px] h-[5px] w-[6px] rounded-full bg-white/60 blur-[1px] " />
          </div>
          <div className="absolute bottom-[48px] left-1/2 h-[42px] w-[65px] -translate-x-1/2 rounded-full bg-orange-300/15 blur-[17px]"/>
        </div>
        <div className="relative z-20 flex h-full w-[66%] flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-5 w-5 fill-[#FFCA28] text-[#FFCA28] drop-shadow-[0_2px_5px_rgba(255,202,40,0.35)]" />

              <span className="text-[15px] font-bold tracking-wide text-white">
                Premium
              </span>
            </div>

            {/* Description */}
            <p className="mb-4 text-[11px] font-medium leading-[1.55] text-white/90">
              Trải nghiệm xem video
              <br />
              không quảng cáo, chất lượng
              <br />
              cao và nhiều đặc quyền hấp dẫn.
            </p>
          </div>

          {/* Upgrade button */}
          <div>
            <Link
              to="/premium"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/[0.02] px-4 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/60 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)]  ">
              Nâng cấp ngay
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-24 h-[100px] w-[100px] rounded-full bg-white/[0.04] blur-[45px]" />
        <div className=" pointer-events-none absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Xu hướng */}
      <div className="bg-[#161616] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-[#FF5722]" />
          <span className="text-white font-bold text-sm">Xu hướng</span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-4">
          Cập nhật những video được quan tâm nhiều nhất hiện nay.
        </p>
        <Link
          to="/trending"
          className="inline-flex w-fit items-center justify-center gap-2 bg-[#272727] hover:bg-[#333] text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> Xem ngay
        </Link>
      </div>

      {/* Khám phá nhanh */}
      <div className="bg-[#161616] border border-white/8 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm mb-3">Khám phá nhanh</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickCategories.map(({ label, iconName, color, bg }) => {
            const Icon = LucideIcons[iconName] || LucideIcons.LayoutGrid;
            return (
              <button
                key={label}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-500/50 ${bg} hover:brightness-125 transition-all cursor-pointer text-left`}
              >
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <span className="text-white text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ─── Main Home Component ────────────────────────────────────────
export default function Home() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [subscribedChannelIds, setSubscribedChannelIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(0);
  const [featuredSlide, setFeaturedSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const promises = [
          axios.get("/api/videos"),
          axios.get("/api/channels"),
          axios.get("/api/videos/shorts"),
        ];
        
        let subPromiseIndex = -1;
        if (token) {
          subPromiseIndex = promises.length;
          promises.push(axios.get("/api/channels/subscribed", { headers: { Authorization: `Bearer ${token}` } }));
        }

        const results = await Promise.allSettled(promises);
        
        if (results[0].status === "fulfilled") setVideos(results[0].value.data);
        if (results[1].status === "fulfilled") setChannels(results[1].value.data);
        if (results[2].status === "fulfilled") setShorts(results[2].value.data);
        
        if (subPromiseIndex !== -1 && results[subPromiseIndex].status === "fulfilled") {
          const subIds = results[subPromiseIndex].value.data.map(c => c.id);
          setSubscribedChannelIds(subIds);
        }
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVideos = (
    activeCategoryId === 0
      ? videos
      : videos.filter((v) => v.categoryId === activeCategoryId)
  ).filter((v) => !v.isShort);

  const featuredVideos = filteredVideos.slice(0, 4);

  // Auto-slide cho FeaturedHero
  useEffect(() => {
    if (featuredVideos.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedSlide((prev) => (prev + 1) % featuredVideos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredVideos.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }


  const filteredShorts =
    activeCategoryId === 0
      ? shorts
      : shorts.filter((s) => s.categoryId === activeCategoryId);

  // Chia video ngắn làm 2 mục khác nhau
  const shortsSection1 = filteredShorts.slice(0, 6);
  const shortsSection2 = filteredShorts.slice(6, 12);

  // Thịnh hành: Dùng video thường
  const trending = filteredVideos.slice(4, 14);

  // Đề xuất: Dùng video thường
  const suggested = filteredVideos.slice(14, 26);

  // Mới nhất: Dùng video thường
  const latest = filteredVideos.slice(26, 35);

  // Fallback channels nếu API chưa có
  const mockChannels = [
    {
      id: 1,
      channelName: "FB Official",
      handle: "@fbofficial",
      subscriberCount: 1200000,
      avatarUrl:
        "https://api.dicebear.com/7.x/initials/svg?seed=FB&backgroundColor=3b5998",
    },
    {
      id: 2,
      channelName: "Tony TV",
      handle: "@tonytv",
      subscriberCount: 947000,
      avatarUrl:
        "https://api.dicebear.com/7.x/initials/svg?seed=Tony&backgroundColor=e91e63",
    },
    {
      id: 3,
      channelName: "Vanh Leg",
      handle: "@vanhleg",
      subscriberCount: 912000,
      avatarUrl:
        "https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=9c27b0",
    },
    {
      id: 4,
      channelName: "Schannel",
      handle: "@schannel",
      subscriberCount: 1500000,
      avatarUrl:
        "https://api.dicebear.com/7.x/initials/svg?seed=SC&backgroundColor=f44336",
    },
    {
      id: 5,
      channelName: "Hóng Hứt Công Nghệ",
      handle: "@honghut",
      subscriberCount: 1700000,
      avatarUrl:
        "https://api.dicebear.com/7.x/initials/svg?seed=HH&backgroundColor=2196f3",
    },
  ];
  
  let featuredChannelsRaw = channels.length > 0 ? channels : mockChannels;
  const currentUserHandle = localStorage.getItem('handle');
  if (currentUserHandle) {
    const handleCheck = currentUserHandle.startsWith('@') ? currentUserHandle : `@${currentUserHandle}`;
    featuredChannelsRaw = featuredChannelsRaw.filter(c => c.handle !== handleCheck && c.handle !== currentUserHandle);
  }
  const featuredChannels = featuredChannelsRaw.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen">
      <div className="max-w-[1600px] mx-auto px-2 md:px-2 py-2">
        {/* ── 2-column layout ── */}
        <div className="flex gap-6 items-start">
          {/* ── Left: Main Content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Featured Hero */}
            {featuredVideos.length > 0 && (
              <FeaturedHero 
                video={featuredVideos[featuredSlide]} 
                totalSlides={featuredVideos.length}
                currentSlide={featuredSlide}
                onNext={() => setFeaturedSlide((prev) => (prev + 1) % featuredVideos.length)}
                onPrev={() => setFeaturedSlide((prev) => (prev - 1 + featuredVideos.length) % featuredVideos.length)}
              />
            )}

          </div>
          {/* end left col */}

          {/* ── Right Sidebar ── */}
          <div className="hidden xl:block sticky top-0">
            <RightSidebar />
          </div>
        </div>
        {/* end 2-col */}

        {/* Category Filter */}
        <div>
          <CategoryFilter onSelect={(id) => setActiveCategoryId(id)} />
        </div>
        
        {/* ── Full-width sections bên dưới ── */}
        <div className="flex flex-col gap-8 mt-10">
          {/* Thịnh hành */}
          <section>
            <SectionHeader icon={Flame} title="Thịnh hành" linkTo="/trending" />
            {trending.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {trending.slice(0, 10).map((v) => (
                  <SmallVideoCard key={v.id} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Video ngắn */}
          <section>
            <SectionHeader
              icon={Smartphone}
              title="Video ngắn"
              linkTo="/shorts"
            />
            {shortsSection1.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video ngắn nào.</p>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {shortsSection1.map((s) => (
                  <ShortVideoCard key={`short-1-${s.id}`} short={s} />
                ))}
              </div>
            )}
          </section>

          {/* Đề xuất cho bạn */}
          <section>
            <SectionHeader
              icon={Star}
              title="Đề xuất cho bạn"
              linkTo="/explore"
            />
            {suggested.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {suggested.map((v) => (
                  <SmallVideoCard key={`sug-${v.id}`} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Video ngắn 2 */}
          <section>
            <SectionHeader
              icon={Smartphone}
              title="Shorts xu hướng"
              linkTo="/shorts"
            />
            {shortsSection2.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video ngắn nào.</p>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {shortsSection2.map((s) => (
                  <ShortVideoCard key={`short-2-${s.id}`} short={s} />
                ))}
              </div>
            )}
          </section>

          {/* Video mới nhất */}
          <section>
            <SectionHeader
              icon={TrendingUp}
              title="Video mới nhất"
              linkTo="/latest"
            />
            {latest.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {latest.map((v) => (
                  <HorizontalVideoCard key={`new-${v.id}`} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Kênh nổi bật */}
          <section>
            <SectionHeader
              icon={Bell}
              title="Kênh nổi bật"
              linkTo="/subscriptions"
            />
            <div className="grid grid-cols-5 gap-4">
              {featuredChannels.map((ch) => (
                <FeaturedChannelCard 
                  key={ch.id} 
                  channel={ch} 
                  initialSubbed={subscribedChannelIds.includes(ch.id)}
                />
              ))}
            </div>
          </section>
        </div>
        {/* end full-width sections */}
      </div>
    </div>
  );
}

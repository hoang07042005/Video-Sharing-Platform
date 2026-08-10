import { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, Loader2, Crown, TrendingUp, Play, ChevronRight, Music, Monitor, Gamepad2, Tv, BookOpen, Dumbbell, Bell, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CategoryFilter from '../../../components/home/CategoryFilter';
import FeaturedHero from '../../../components/home/FeaturedHero';
import VideoCard from '../../../components/home/VideoCard';

// ─── Helpers ───────────────────────────────────────────────────
const formatDuration = (s) => {
  if (!s) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
};
const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s >= 31536000) return Math.floor(s/31536000) + ' năm trước';
  if (s >= 2592000)  return Math.floor(s/2592000)  + ' tháng trước';
  if (s >= 86400)    return Math.floor(s/86400)    + ' ngày trước';
  if (s >= 3600)     return Math.floor(s/3600)     + ' giờ trước';
  if (s >= 60)       return Math.floor(s/60)       + ' phút trước';
  return 'Vừa xong';
};

// ─── Video Card nhỏ (dùng trong Trending / Đề xuất) ────────────
function SmallVideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/watch/${video.id}`)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className="relative w-58 h-38 aspect-video rounded-xl overflow-hidden bg-[#1A1A1A]">
        <img
          src={video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video'}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/c/${video.channelHandle}`}
          onClick={e => e.stopPropagation()}
          className="w-7 h-7 rounded-full overflow-hidden bg-[#2A2A2A] shrink-0 mt-0.5"
        >
          <img src={video.channelAvatarUrl || 'https://via.placeholder.com/40'} alt="" className="w-full h-full object-cover" />
        </Link>
        <div className="min-w-0">
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
            {video.title}
          </h3>
          <Link
            to={`/c/${video.channelHandle}`}
            onClick={e => e.stopPropagation()}
            className="text-gray-500 text-[11px] mt-0.5 block hover:text-white transition-colors"
          >
            {video.channelName}
          </Link>
          <p className="text-gray-500 text-[11px]">
            {formatViews(video.viewsCount)} lượt xem • {timeAgo(video.createdAt)}
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
      onClick={() => navigate(`/watch/${video.id}`)}
      className="group cursor-pointer flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
    >
      <div className="relative w-66 h-40 aspect-video rounded-xl overflow-hidden bg-[#1A1A1A] shrink-0">
        <img
          src={video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video'}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1.5 py-0.5 rounded font-medium">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug group-hover:text-[#FF5722] transition-colors">
          {video.title}
        </h3>
        <Link
          to={`/c/${video.channelHandle}`}
          onClick={e => e.stopPropagation()}
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

// ─── Featured Channel Card (Kênh nổi bật) ────────────────────
function FeaturedChannelCard({ channel }) {
  const [subbed, setSubbed] = useState(false);
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#161616] border border-white/5 hover:border-white/10 hover:bg-[#1A1A1A] transition-all group">
      {/* Top: Avatar + Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Link to={`/c/${channel.handle}`}>
            <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#2A2A2A]">
              <img
                src={channel.avatarUrl || 'https://via.placeholder.com/80'}
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
            ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333]'
            : 'bg-gradient-to-r from-[#F05123] to-[#FF7043] text-white hover:brightness-110 shadow-lg shadow-[#FF5722]/10'
        }`}
      >
        {subbed ? 'Đã đăng ký' : 'Đăng ký'}
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
        <Link to={linkTo} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─── Right Sidebar ──────────────────────────────────────────────
const quickCategories = [
  { label: 'Âm nhạc', icon: Music, color: 'text-pink-400' },
  { label: 'Công nghệ', icon: Monitor, color: 'text-blue-400' },
  { label: 'Giải trí', icon: Tv, color: 'text-yellow-400' },
  { label: 'Trò chơi', icon: Gamepad2, color: 'text-green-400' },
  { label: 'Giáo dục', icon: BookOpen, color: 'text-purple-400' },
  { label: 'Thể thao', icon: Dumbbell, color: 'text-orange-400' },
];

function RightSidebar() {
  return (
    <aside className="w-72 shrink-0 flex flex-col gap-4">
      {/* Premium Card */}
      <div className="bg-gradient-to-br from-[#E26627] via-[#912A57] to-[#250F49] rounded-2xl p-5 relative overflow-hidden flex min-h-[160px]">
        {/* Right side 3D Crown Illustration (CSS Simulation) */}
        <div className="absolute -bottom-1 -right-1 w-32 h-32 flex items-center justify-center">
          {/* Background Glow */}
          <div className="absolute w-20 h-20 bg-[#FF9800] blur-[40px] opacity-30"></div>
          
          {/* Glass background */}
          <div className="absolute w-16 h-16 bg-white/5 backdrop-blur-sm border border-white/10 rotate-45 rounded-lg -translate-y-2"></div>
          
          {/* Pedestal */}
          <div className="absolute bottom-6 w-16 h-5 bg-[#A81845] rounded-sm transform skew-x-[-20deg] rotate-[10deg] shadow-2xl"></div>
          
          {/* Crown */}
          <Crown className="relative z-10 w-12 h-12 text-[#FFCA28] drop-shadow-[0_4px_12px_rgba(255,202,40,0.4)] fill-[#FFCA28]" />
        </div>

        {/* Content */}
        <div className="relative z-20 w-[65%] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#FFCA28] fill-[#FFCA28]" />
              <span className="text-white font-bold text-[15px] tracking-wide">Premium</span>
            </div>
            <p className="text-white/90 text-[11px] leading-relaxed font-medium mb-4">
              Trải nghiệm xem video <br />
              không quảng cáo, chất lượng <br />
              cao và nhiều đặc quyền hấp dẫn.
            </p>
          </div>
          <div>
            <Link
              to="/premium"
              className="inline-flex items-center justify-center px-4 py-1.5 border border-white/40 bg-transparent hover:bg-white/10 text-white text-[11px] font-bold rounded-full transition-all"
            >
              Nâng cấp ngay
            </Link>
          </div>
        </div>
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
          {quickCategories.map(({ label, icon: Icon, color, bg }) => (
            <button
              key={label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-500/50 ${bg} hover:brightness-125 transition-all cursor-pointer text-left`}
            >
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <span className="text-white text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Main Home Component ────────────────────────────────────────
export default function Home() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, channelsRes] = await Promise.allSettled([
          axios.get('/api/videos'),
          axios.get('/api/channels'),
        ]);
        if (videosRes.status === 'fulfilled') setVideos(videosRes.value.data);
        if (channelsRes.status === 'fulfilled') setChannels(channelsRes.value.data);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  const featuredVideo = videos[0] ?? null;
  const trending = videos.slice(0, 5);
  const suggested = videos.slice(0, 5);
  const latest = videos.slice(0, 6);

  // Fallback channels nếu API chưa có
  const mockChannels = [
    { id: 1, channelName: 'FB Official', handle: '@fbofficial', subscriberCount: 1200000, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FB&backgroundColor=3b5998' },
    { id: 2, channelName: 'Tony TV', handle: '@tonytv', subscriberCount: 947000, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Tony&backgroundColor=e91e63' },
    { id: 3, channelName: 'Vanh Leg', handle: '@vanhleg', subscriberCount: 912000, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=9c27b0' },
    { id: 4, channelName: 'Schannel', handle: '@schannel', subscriberCount: 1500000, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SC&backgroundColor=f44336' },
    { id: 5, channelName: 'Hóng Hứt Công Nghệ', handle: '@honghut', subscriberCount: 1700000, avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=HH&backgroundColor=2196f3' },
  ];
  const featuredChannels = channels.length > 0 ? channels.slice(0, 5) : mockChannels;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">

        {/* ── 2-column layout ── */}
        <div className="flex gap-6 items-start">

          {/* ── Left: Main Content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Featured Hero */}
            {featuredVideo && <FeaturedHero video={featuredVideo} />}

            {/* Category Filter */}
            <div>
              <CategoryFilter />
            </div>



          </div>{/* end left col */}

          {/* ── Right Sidebar ── */}
          <div className="hidden xl:block sticky top-6">
            <RightSidebar />
          </div>

        </div>{/* end 2-col */}

        {/* ── Full-width sections bên dưới ── */}
        <div className="flex flex-col gap-8 mt-6">

          {/* Thịnh hành */}
          <section>
            <SectionHeader icon={Flame} title="Thịnh hành" linkTo="/trending" />
            {trending.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {trending.map(v => (
                  <SmallVideoCard key={v.id} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Đề xuất cho bạn */}
          <section>
            <SectionHeader icon={Star} title="Đề xuất cho bạn" linkTo="/explore" />
            {suggested.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {suggested.map(v => (
                  <SmallVideoCard key={`sug-${v.id}`} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Video mới nhất */}
          <section>
            <SectionHeader icon={TrendingUp} title="Video mới nhất" linkTo="/latest" />
            {latest.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có video nào.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {latest.map(v => (
                  <HorizontalVideoCard key={`new-${v.id}`} video={v} />
                ))}
              </div>
            )}
          </section>

          {/* Kênh nổi bật */}
          <section>
            <SectionHeader icon={Bell} title="Kênh nổi bật" linkTo="/subscriptions" />
            <div className="grid grid-cols-5 gap-4">
              {featuredChannels.map(ch => (
                <FeaturedChannelCard key={ch.id} channel={ch} />
              ))}
            </div>
          </section>

        </div>{/* end full-width sections */}

      </div>
    </div>
  );
}

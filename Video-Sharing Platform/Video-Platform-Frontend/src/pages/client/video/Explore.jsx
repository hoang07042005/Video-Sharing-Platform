import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import { DEFAULT_CATEGORY_ICON } from '../../../components/home/CategoryFilter';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Compass, Zap, Music, Gamepad2, Film, BookOpen,
  Utensils, Dumbbell, Plane, Laugh, Palette, Code,
  Eye, ChevronLeft, ChevronRight, TrendingUp, Sparkles, PlayCircle,
  ArrowUpRight, Users, Tv, CheckCircle, Sparkle, Target, Coffee, Flame,
  Loader2, X, Monitor, LayoutGrid
} from 'lucide-react';

const formatDuration = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
  return m + ':' + sec.toString().padStart(2, '0');
};

const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' ngày trước';
  return Math.floor(diff / 2592000) + ' tháng trước';
};

const CATEGORIES = [
  { key: 'all',     label: 'Tất cả',      icon: 'Flame',    color: 'text-white' },
];

const INSPIRATIONS = [
  { label: 'Thư giãn', sub: 'Nhạc chill, thiên nhiên', icon: Coffee, bg: 'from-red-900/40 to-[#0A0A0A]', color: 'text-red-400' },
  { label: 'Tập trung', sub: 'Music, lo-fi, study', icon: Target, bg: 'from-indigo-900/40 to-[#0A0A0A]', color: 'text-indigo-400' },
  { label: 'Năng lượng', sub: 'EDM, Workout, Sport', icon: Zap, bg: 'from-pink-900/40 to-[#0A0A0A]', color: 'text-pink-400' },
  { label: 'Công nghệ', sub: 'Review, Hướng dẫn', icon: Tv, bg: 'from-blue-900/40 to-[#0A0A0A]', color: 'text-blue-400' },
  { label: 'Sáng tạo', sub: 'Thiết kế, DIY, Vlog', icon: Palette, bg: 'from-orange-900/40 to-[#0A0A0A]', color: 'text-orange-400' },
  { label: 'Giải trí', sub: 'Hài hước, Meme, Fun', icon: Laugh, bg: 'from-purple-900/40 to-[#0A0A0A]', color: 'text-purple-400' },
];

const SEARCH_TRENDS = [
  { keyword: 'iPhone 16 Pro Max', change: '+ 120%' },
  { keyword: 'Build PC Gaming', change: '+ 87%' },
  { keyword: 'Nhạc Chill', change: '+ 65%' },
  { keyword: 'Du lịch Đà Lạt', change: '+ 58%' },
  { keyword: 'ReactJS cơ bản', change: '+ 42%' },
];

const TOPICS = ['# Nhạc Remix', '# Công nghệ', '# Học Lập Trình', '# Đà Lạt', '# Nấu Ăn', '# Bóng Đá'];

function CatIcon({ cat, active, onClick }) {
  const IconComponent = LucideIcons[cat.icon] || LucideIcons.LayoutGrid;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap shrink-0 transition-all ${
        active
          ? 'bg-[#2A1610] text-white border border-[#FF5722]/50 shadow-sm'
          : 'bg-transparent text-gray-200 hover:bg-white/5 border border-gray-600/50'
      }`}
    >
      <IconComponent className={`w-4 h-4 ${active ? 'text-white' : cat.color}`} />
      {cat.label}
    </button>
  );
}

function VideoCard({ video }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(video.isShort ? `/shorts?id=${video.id}` : `/watch/${video.id}`)} className="group cursor-pointer flex flex-col gap-3">
      <div className={`relative ${video.isShort ? 'aspect-[9/16] w-[160px]' : 'aspect-video w-full'} rounded-xl overflow-hidden bg-[#1A1A1A] shadow-md`}>
        <img src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500'} alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <PlayCircle className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Duration / Shorts Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow z-10">
          {video.isShort ? (
            <span className="text-[#FF5722] uppercase">Shorts</span>
          ) : (
            formatDuration(video.duration)
          )}
        </div>
      </div>

      <div className="flex gap-3 px-1">
        <Link to={'/c/' + video.channelHandle} onClick={e => e.stopPropagation()} className="shrink-0 pt-0.5">
          {video.channelAvatarUrl ? (
            <img src={video.channelAvatarUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent hover:ring-[#FF5722] transition-all" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF5722] to-[#E91E63] flex items-center justify-center text-white text-[12px] font-bold">
              {(video.channelName || 'C')[0].toUpperCase()}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="text-white text-[12px] font-bold leading-snug line-clamp-2 group-hover:text-[#FF5722] transition-colors mb-1">
            {video.title}
          </h3>
          <Link to={'/c/' + video.channelHandle} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-gray-400 text-[12px] hover:text-white transition-colors truncate mb-1">
            {video.channelName}
            <CheckCircle className="w-3 h-3 text-[#FF5722] fill-[#FF5722] shrink-0" />
          </Link>
          <div className="flex items-center gap-1.5 text-gray-500 text-[9px]">
            <span>{formatViews(video.viewsCount)} lượt xem</span>
            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [featuredChannels, setFeaturedChannels] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(searchQuery);
  
  const catScrollRef = useRef(null);

  // Fetch trending + latest + categories on mount
  useEffect(() => {
    axios.get('/api/videos/explore?sort=views&limit=8')
      .then(res => setTrending(res.data.slice(0, 4)))
      .catch(console.error);
    axios.get('/api/videos/explore?sort=newest&limit=8')
      .then(res => setLatest(res.data.slice(0, 4)))
      .catch(console.error);
    axios.get('/api/channels?limit=5')
      .then(res => setFeaturedChannels(res.data))
      .catch(console.error);
    axios.get('/api/videos/categories')
      .then(res => setDbCategories(res.data))
      .catch(console.error);
  }, []);

  // Re-fetch when search query or category changes
  useEffect(() => {
    if (!searchQuery && activeCategory === 'all') {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (activeCategory && activeCategory !== 'all') params.append('category', activeCategory);
    axios.get(`/api/videos/explore?${params.toString()}`)
      .then(res => setSearchResults(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) {
      setSearchParams({ q });
    } else {
      setSearchParams({});
    }
  };

  const handleCatClick = (key) => {
    if (key === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: key });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-20">
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[280px] md:h-[340px] bg-[#111] overflow-hidden flex items-center mb-10">
        {/* Background Image */}
        <img 
          src="./banner.jpg" 
          alt="Explore background"
          className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[#FF5722]/10 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-[1500px] w-full mx-auto px-6 md:px-10">
          {/* Tagline */}
          <div className="flex items-center gap-2 text-[#FF5722] text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkle className="w-4 h-4 fill-[#FF5722]" /> Khám phá không giới hạn
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] mb-4">
            Khám phá thế giới <br/>
            <span className="bg-gradient-to-r from-[#FF5722] to-[#E91E63] bg-clip-text text-transparent drop-shadow-sm">
              video
            </span> theo cách của bạn
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-400 text-sm max-w-[400px] mb-8 leading-relaxed">
            Tìm kiếm nội dung yêu thích và khám phá những điều mới mẻ mỗi ngày.
          </p>
          
          {/* Search Bar and Slide Dots inline */}
          <div className="flex items-center gap-6">
            <form onSubmit={handleSearch} className="flex items-center bg-[#1A1A1A]/90 backdrop-blur-md rounded-full p-1.5 w-full max-w-xl border border-white/10 shadow-2xl">
              <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
              <input 
                type="text"
                placeholder="Tìm kiếm video, kênh, chủ đề..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-[15px] px-4 py-2 focus:outline-none placeholder:text-gray-500"
              />
              {inputValue && (
                <button type="button" onClick={() => setInputValue('')} className="p-2 text-gray-400 hover:text-white mr-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
              <button 
                type="submit"
                className="bg-gradient-to-r from-[#FF5722] to-[#E91E63] hover:opacity-90 active:scale-95 text-white font-bold text-[14px] px-8 py-3 rounded-full transition-all shrink-0 shadow-lg shadow-[#FF5722]/30 cursor-pointer"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Decorative Dots */}
            <div className="flex gap-2 shrink-0">
               <span className="block w-6 h-1.5 bg-[#FF5722] rounded-full" />
               <span className="block w-1.5 h-1.5 bg-white/40 rounded-full" />
               <span className="block w-1.5 h-1.5 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 md:px-10 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-10">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="min-w-0 flex flex-col gap-12">
          
          {/* CATEGORIES */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[17px] font-bold text-white tracking-wide">Khám phá theo danh mục</h2>
            </div>
            
            <div className="relative group flex items-center">
              <div 
                ref={catScrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {[{ key: 'all', label: 'Tất cả', icon: 'Flame', color: 'text-white' }, ...dbCategories.map(cat => {
                  const getIconColor = (iconName) => {
                    switch (iconName) {
                      case 'Music': return 'text-pink-300';
                      case 'Monitor': return 'text-blue-300';
                      case 'Tv': return 'text-yellow-300';
                      case 'Gamepad2': return 'text-green-300';
                      case 'BookOpen': return 'text-purple-300';
                      case 'Dumbbell': return 'text-orange-300';
                      case 'Clapperboard': return 'text-yellow-300';
                      case 'Flame': return 'text-[#FF5722]';
                      default: return 'text-gray-400';
                    }
                  };
                  return { key: cat.name, label: cat.name, icon: cat.icon || 'LayoutGrid', color: getIconColor(cat.icon) };
                })].map(cat => (
                  <CatIcon 
                    key={cat.key} 
                    cat={cat} 
                    active={activeCategory === cat.key} 
                    onClick={() => handleCatClick(cat.key)} 
                  />
                ))}
              </div>
              <button 
                onClick={() => catScrollRef.current?.scrollBy({ left: 400 })}
                className="absolute right-0 w-9 h-9 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-white/10 flex items-center justify-center text-white transition-all shadow-xl z-10 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* SEARCH RESULTS or DEFAULT SECTIONS */}
          {(searchQuery || activeCategory !== 'all') ? (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#FF5722]" />
                  {searchQuery
                    ? <>Kết quả tìm kiếm cho "<span className="text-[#FF5722]">{searchQuery}</span>"</>
                    : <>Danh mục: <span className="text-[#FF5722]">{activeCategory}</span></>
                  }
                </h2>
                <button onClick={() => { setSearchParams({}); setInputValue(''); }} className="text-[13px] font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
                  Xoá bộ lọc <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF5722]" /> Đang tìm kiếm...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
                  {searchResults.map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-400 text-lg font-medium">Không tìm thấy kết quả</p>
                  <p className="text-gray-500 text-sm mt-1">Thử tìm với từ khoá khác</p>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* THỊNH HÀNH */}
              <section>
                 <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FF5722] fill-[#FF5722]" /> Thịnh hành
                  </h2>
                   <button onClick={() => navigate('/trending')} className="text-[13px] font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors group cursor-pointer">
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
                {trending.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
                    {trending.map(v => <VideoCard key={v.id} video={v} />)}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Đang tải video thịnh hành...</div>
                )}
              </section>

              {/* MỚI CẬP NHẬT */}
              <section>
                 <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF5722]" /> Video mới cập nhật
                  </h2>
              <button onClick={() => navigate('/latest')} className="text-[13px] font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors group cursor-pointer">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            {latest.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
                {latest.map(v => <VideoCard key={v.id} video={v} />)}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Đang tải video mới...</div>
            )}
          </section>

            </>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="space-y-6">
          
          {/* Xu Hướng Tìm Kiếm */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[15px] font-bold text-white flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-[#E91E63]" /> Xu hướng tìm kiếm
            </h3>
            <div className="space-y-4">
              {SEARCH_TRENDS.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold w-4 text-center">{idx + 1}</span>
                    <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors">{item.keyword}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 text-[11px] font-bold">
                    <ArrowUpRight className="w-3 h-3" /> {item.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kênh Nổi Bật */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" /> Kênh nổi bật
              </h3>
              <button className="text-[12px] font-medium text-gray-400 hover:text-white flex items-center gap-0.5 group">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            <div className="space-y-5">
              {featuredChannels.length > 0 ? featuredChannels.map(channel => (
                <div key={channel.id} className="flex items-center gap-3 group">
                  <Link to={`/c/${channel.handle}`} className="shrink-0">
                    {channel.avatarUrl ? (
                      <img src={channel.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover group-hover:ring-2 ring-transparent ring-[#FF5722] transition-all" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5722] to-[#E91E63] flex items-center justify-center text-white text-sm font-bold group-hover:ring-2 ring-transparent ring-[#FF5722] transition-all">
                        {(channel.channelName || 'C')[0].toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/c/${channel.handle}`}>
                      <h4 className="text-[13px] font-bold text-white hover:text-[#FF5722] truncate transition-colors">
                        {channel.channelName}
                      </h4>
                    </Link>
                    <p className="text-[11px] text-gray-500 truncate">
                      {formatViews(channel.subscriberCount)} người đăng ký
                    </p>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 rounded-lg border border-[#FF5722]/30 text-[#FF5722] text-[11px] font-bold hover:bg-[#FF5722]/10 transition-colors cursor-pointer">
                    Đăng ký
                  </button>
                </div>
              )) : (
                <div className="text-gray-500 text-xs">Đang tải...</div>
              )}
            </div>
          </div>

          {/* Chủ Đề Thịnh Hành */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-[15px] font-bold text-white flex items-center gap-2 mb-5">
              <Compass className="w-4 h-4 text-green-400" /> Chủ đề thịnh hành
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {TOPICS.map((topic, idx) => (
                <button key={idx} className="bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-white/5 text-[12px] font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm">
                  {topic}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* CẢM HỨNG (Moved outside the 2-col grid to span full width) */}
      <section className="max-w-[1500px] mx-auto px-6 md:px-10 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-bold text-white tracking-wide">Khám phá theo cảm hứng</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {dbCategories.slice(0, 6).map((cat, idx) => {
            const IconComponent = LucideIcons[cat.icon] || LucideIcons.LayoutGrid;
            const item = { 
              label: cat.name, 
              sub: cat.description || 'Khám phá video mới', 
              icon: IconComponent, 
              bg: 'from-gray-900/40', 
              color: 'text-gray-400' 
            };
            return (
            <div key={idx} onClick={() => { setSearchParams({ category: cat.name }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`shrink-0 w-[220px] p-5 rounded-2xl bg-gradient-to-br ${item.bg} to-[#0A0A0A] border border-white/5 flex items-center gap-4 hover:border-white/20 hover:-translate-y-1 transition-all cursor-pointer group shadow-lg`}>
              <div className={`w-12 h-12 shrink-0 rounded-full bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white mb-1">{item.label}</h3>
                <p className="text-[11px] text-gray-400 line-clamp-1">{item.sub}</p>
              </div>
            </div>
            );
          })}
          <div className="shrink-0 w-12 flex items-center justify-center">
            <button className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#2A2A2A] text-gray-400 transition-colors border border-white/10 shadow-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
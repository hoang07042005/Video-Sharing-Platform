import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import { Radio, ChevronRight, Calendar } from 'lucide-react';
import { getIconColor } from '../../../utils/iconHelpers';

const formatViews = (views) => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views;
};

// Fallback Mock Data for UI aesthetics if DB is empty
const MOCK_LIVE_NOW = [
  {
    id: 'mock-1',
    title: 'Cuộc chiến sinh tồn trong rừng sâu',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    currentViewers: 9200,
    channel: { channelName: 'Nam Blue', handle: 'namblue', isVerified: true },
    category: { name: 'Game' }
  },
  {
    id: 'mock-2',
    title: 'Đêm nhạc acoustic nhẹ nhàng',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516280440502-6902b93ff513?auto=format&fit=crop&q=80&w=800',
    currentViewers: 6300,
    channel: { channelName: 'Hà My', handle: 'hamy', isVerified: true },
    category: { name: 'Âm nhạc' }
  },
  {
    id: 'mock-3',
    title: 'Talkshow: Gen Z và những câu chuyện',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
    currentViewers: 4700,
    channel: { channelName: 'Vinh & Mai', handle: 'vinhmai', isVerified: true },
    category: { name: 'Giải trí' }
  },
  {
    id: 'mock-4',
    title: 'Vào bếp cùng Thư - Món ngon mỗi ngày',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&q=80&w=800',
    currentViewers: 3100,
    channel: { channelName: 'Minh Thư', handle: 'minhthu', isVerified: true },
    category: { name: 'Ẩm thực' }
  }
];

const MOCK_UPCOMING = [
  {
    id: 'mock-u1',
    title: 'Đánh giá iPhone 15 Pro Max chi tiết',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&q=80&w=300',
    scheduledStartTime: '2026-05-16T14:00:00Z',
    channel: { channelName: 'Thế Anh', handle: 'theanh', isVerified: true },
    category: { name: 'Công nghệ' }
  },
  {
    id: 'mock-u2',
    title: 'Bình luận trận đấu đỉnh cao',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518605368461-1ee711128c73?auto=format&fit=crop&q=80&w=300',
    scheduledStartTime: '2026-05-17T11:00:00Z',
    channel: { channelName: 'Minh Sports', handle: 'minhsports', isVerified: true },
    category: { name: 'Thể thao' }
  }
];

const POPULAR_TOPICS = [
  '# PUBG Mobile', '# Liên Minh Huyền Thoại', '# Valorant', '# Acoustic',
  '# ASMR', '# Nấu Ăn', '# Công Nghệ', '# Bóng Đá', '# Minecraft', '# Tâm Sự'
];

const LivePage = () => {
  const [livestreams, setLivestreams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamsRes, catsRes] = await Promise.all([
          axios.get('/api/livestreams'),
          axios.get('/api/videos/categories')
        ]);
        setLivestreams(streamsRes.data || []);
        setCategories(catsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch live page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter streams
  const liveStreams = livestreams.filter(s => s.status === 'live');
  const scheduledStreams = livestreams.filter(s => s.status === 'scheduled');

  // Use real data if available, else mock data for demonstration aesthetics
  const displayLive = liveStreams.length >= 4 ? liveStreams : MOCK_LIVE_NOW;
  const displayScheduled = scheduledStreams.length > 0 ? scheduledStreams : MOCK_UPCOMING;

  const featuredMain = displayLive[0];
  const featuredSide = displayLive.slice(1, 4);
  const liveGrid = displayLive.slice(4).length > 0 ? displayLive.slice(4) : displayLive; 

  return (
    <div className="min-h-screen bg-[#0F0F13] font-sans pb-12">
      <div className="max-w-[1600px] mx-auto p-2 md:p-2 lg:p-2">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Radio className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Livestreams</h1>
              <p className="text-sm text-gray-400">Khám phá các buổi livestream hấp dẫn đang diễn ra và sắp diễn ra</p>
            </div>
          </div>
          <Link to="/studio/live" className="flex items-center gap-2 bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors w-fit shrink-0">
            <Radio className="w-4 h-4" /> Tạo livestream
          </Link>
        </div>

        {/* CATEGORY BAR */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mb-8 pb-2">
          <button 
            onClick={() => setActiveCategory('Tất cả')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              activeCategory === 'Tất cả' 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border border-transparent' 
                : 'bg-[#18181C] text-gray-400 border border-white/5 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              <LucideIcons.Flame className={`w-5 h-5 text-orange-500`} />
            </span>
            Tất cả
          </button>
          
          {categories.map((cat, idx) => {
            const IconComponent = LucideIcons[cat.icon] || LucideIcons.LayoutGrid;
            const iconColor = getIconColor(cat.icon);
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id || idx}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border border-transparent' 
                    : 'bg-[#18181C] text-gray-400 border border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  <IconComponent className={`w-5 h-5 ${iconColor}`} />
                </span>
                {cat.name}
              </button>
            );
          })}
          
          <button className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#18181C] border border-white/5 text-gray-400 hover:text-white transition-colors ml-auto">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            
            {/* FEATURED HERO SECTION */}
            {featuredMain && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.2fr] gap-4 h-auto lg:h-[400px]">
                {/* Main Hero Card */}
                <Link to={`/live/${featuredMain.id}`} className="relative rounded-2xl overflow-hidden group border border-white/5 h-[300px] lg:h-full block">
                  <img src={featuredMain.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} alt={featuredMain.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-[#0F0F13]/60 to-transparent"></div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> LIVE
                    </span>
                    <span className="bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <LucideIcons.Eye className="w-3.5 h-3.5" /> {formatViews(featuredMain.currentViewers || 0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block bg-[#7B1FA2] text-white text-xs font-bold px-2.5 py-1 rounded mb-3 uppercase shadow-lg shadow-purple-900/50">
                      {featuredMain.category?.name || 'GAME'}
                    </span>
                    <h2 className="text-[26px] font-bold text-white mb-3 line-clamp-2 leading-tight">{featuredMain.title}</h2>
                    <div className="flex items-center gap-2 mb-4">
                      <img src={featuredMain.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${featuredMain.channel?.channelName}`} className="w-8 h-8 rounded-full border border-white/20" alt="avatar" />
                      <span className="text-gray-300 font-medium text-sm flex items-center gap-1">
                        {featuredMain.channel?.channelName || 'Hoàng Nam'}
                        {(featuredMain.channel?.isVerified === true) && <LucideIcons.CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                      </span>
                    </div>
                    <p className="text-gray-400 w-90 text-sm mb-5 line-clamp-2 max-w-lg hidden sm:block">
                      {featuredMain.description || 'Cùng đồng đội chinh phục top 1 và những pha xử lý đỉnh cao! Tham gia ngay để trò chuyện cùng mình nhé.'}
                    </p>
                    <button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
                      Xem ngay
                    </button>
                  </div>
                  
                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <div className="w-2 h-2 rounded-full bg-white/30"></div>
                    <div className="w-2 h-2 rounded-full bg-white/30"></div>
                  </div>
                </Link>

                {/* Side Featured Cards */}
                <div className="flex flex-col gap-4 h-full">
                  {featuredSide.map((stream, idx) => (
                    <Link to={`/live/${stream.id}`} key={idx} className="flex-1 bg-[#18181C] rounded-2xl border border-white/5 overflow-hidden flex group hover:bg-white/5 transition-colors">
                      <div className="w-[40%] h-full relative overflow-hidden shrink-0">
                        <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> LIVE
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors">{stream.title}</h3>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-gray-400 text-xs truncate">{stream.channel?.channelName}</span>
                          {(stream.channel?.isVerified === true) && <LucideIcons.CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-gray-500 text-[11px]">{formatViews(stream.currentViewers)} người xem</span>
                          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium px-2 py-0.5 rounded">
                            {stream.category?.name || 'Giải trí'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE NOW SECTION */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse"></div>
                <h2 className="text-xl font-bold text-white">Đang live ngay</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-5">
                {liveGrid.map((stream, idx) => (
                  <Link to={`/live/${stream.id}`} key={idx} className="group flex flex-col gap-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-[#18181C] border border-white/5">
                      <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> LIVE
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <LucideIcons.Eye className="w-3 h-3" /> {formatViews(stream.currentViewers)}
                      </div>
                    </div>
                    <div className="flex gap-3 px-1">
                      <img src={stream.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${stream.channel?.channelName}`} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" alt="avatar" />
                      <div className="flex flex-col overflow-hidden">
                        <h3 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors">{stream.title}</h3>
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className="text-gray-400 text-xs truncate">{stream.channel?.channelName}</span>
                          {(stream.channel?.isVerified === true) && <LucideIcons.CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                        </div>
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium px-2 py-0.5 rounded w-fit">
                          {stream.category?.name || 'Khác'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
                  Xem tất cả livestream đang diễn ra <LucideIcons.ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* UPCOMING SECTION */}
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-white">Sắp diễn ra</h2>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">Xem tất cả</button>
              </div>
              
              <div className="flex flex-col gap-4">
                {displayScheduled.map((stream, idx) => {
                  const date = new Date(stream.scheduledStartTime);
                  const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const dateString = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                  
                  return (
                    <div key={idx} className="flex gap-3 group cursor-pointer">
                      <div className="w-[120px] aspect-video rounded-lg overflow-hidden relative shrink-0">
                        <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute top-1 left-1 bg-black/80 backdrop-blur text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/20">
                          {timeString}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 py-0.5">
                        <h3 className="text-[13px] font-bold text-white leading-tight mb-1.5 line-clamp-2 group-hover:text-purple-400 transition-colors">{stream.title}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-gray-400 text-[11px] truncate">{stream.channel?.channelName}</span>
                          {(stream.channel?.isVerified === true) && <LucideIcons.CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="bg-blue-500/10 text-blue-400 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-500/20">
                            {stream.category?.name || 'Khác'}
                          </span>
                          <span className="text-gray-500 text-[10px] font-medium">{dateString}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full mt-5 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-colors">
                <Calendar className="w-4 h-4" /> Xem lịch đầy đủ
              </button>
            </div>

            {/* POPULAR TOPICS */}
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-lg leading-none animate-pulse">🔥</span>
                  <h2 className="text-base font-bold text-white">Chủ đề phổ biến</h2>
                </div>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">Xem tất cả</button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {POPULAR_TOPICS.map((topic, idx) => (
                  <button key={idx} className="bg-[#1F1F25] hover:bg-[#2A2A32] text-gray-300 hover:text-white border border-white/5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm">
                    {topic}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;

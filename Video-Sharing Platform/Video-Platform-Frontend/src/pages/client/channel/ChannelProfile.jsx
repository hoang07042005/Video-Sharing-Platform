import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Bell, CheckCircle2, Share2, Search, Star, Users, Link as LinkIcon, X, Mail, MonitorPlay, Globe, Info, PlaySquare, TrendingUp, Flag, Pencil } from 'lucide-react';
import VideoCard from '../../../components/home/VideoCard';
import CustomizeChannelModal from '../../../components/channel/CustomizeChannelModal';

export default function ChannelProfile() {
  const { handle } = useParams();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescContent, setEditDescContent] = useState('');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameContent, setEditNameContent] = useState('');
  
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [editHandleContent, setEditHandleContent] = useState('');
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailContent, setEditEmailContent] = useState('');
  
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [editCountryContent, setEditCountryContent] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const isOwner = channel && localStorage.getItem('handle') === channel.handle;

    const fetchChannelData = async (targetHandle) => {
      setLoading(true);
      setError('');
      try {
        // Fetch profile
        const profileRes = await axios.get(`/api/channels/${targetHandle}`);
        setChannel(profileRes.data);
        
        // Fetch videos
        if (profileRes.data && profileRes.data.id) {
          const videosRes = await axios.get(`/api/channels/${profileRes.data.id}/videos`);
          setVideos(videosRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải thông tin kênh.');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (handle) {
      fetchChannelData(handle);
    }
  }, [handle]);

  const handleSaveSuccess = (newHandle) => {
    if (newHandle !== handle) {
      // If handle changed, redirect to new handle URL
      window.location.href = `/c/${newHandle}`;
    } else {
      // Otherwise just refetch data
      fetchChannelData(handle);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' Tr';
    if (views >= 1000) return (views / 1000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' N';
    return views.toString();
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " năm trước";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " tháng trước";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " ngày trước";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " giờ trước";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " phút trước";
    return "Vừa xong";
  };

  const handleSaveProfile = async (field, value, setIsEditing) => {
    try {
      setIsSavingProfile(true);
      const updatedData = {
        channelName: field === 'channelName' ? value : channel.channelName,
        handle: field === 'handle' ? value : channel.handle,
        description: field === 'description' ? value : channel.description,
        contactEmail: field === 'contactEmail' ? value : channel.contactEmail,
        country: field === 'country' ? value : channel.country,
        bannerUrl: channel.bannerUrl,
        avatarUrl: channel.avatarUrl
      };
      await axios.put(`/api/channels/${channel.id}`, updatedData);
      setChannel({ ...channel, [field]: value });
      setIsEditing(false);
      
      if (field === 'handle' && value !== handle) {
        localStorage.setItem('handle', value);
        window.location.href = `/c/${value}`;
      }
    } catch (err) {
      console.error(`Lỗi khi lưu ${field}`, err);
      alert(err.response?.data?.message || 'Không thể lưu, vui lòng thử lại');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Lỗi 404</h2>
          <p className="text-gray-400">{error || 'Kênh không tồn tại'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] pb-20">
      {/* Banner */}
      <div className="w-full h-[200px] md:h-[250px] lg:h-[300px] bg-[#1A1A1A] relative">
        <img 
          src={channel.bannerUrl} 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Channel Info Header */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 -mt-16 md:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-8">
          <div className="w-32 h-32 md:w-[160px] md:h-[160px] rounded-full overflow-hidden bg-[#1A1A1A] shrink-0 shadow-xl border-4 border-[#0F0F0F]">
            <img 
              src={channel.avatarUrl} 
              alt={channel.channelName} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 mt-2 md:mt-4 flex flex-col items-start w-full gap-2">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{channel.channelName}</h1>
              {channel.subscriberCount > 10000 && (
                <CheckCircle2 className="w-5 h-5 text-gray-400 fill-gray-400/20" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center text-gray-400 text-sm md:text-base mb-1">
              <span className="font-medium mr-1">{channel.handle}</span>
              <span className="mx-1.5">•</span>
              <span>{formatViews(channel.subscriberCount)} người đăng ký</span>
              <span className="mx-1.5">•</span>
              <span>{videos.length} video</span>
            </div>
            
            <div 
              onClick={() => setIsAboutModalOpen(true)}
              className="text-gray-400 text-xs md:text-sm mb-1 max-w-3xl flex items-center group cursor-pointer"
            >
              <p className="line-clamp-1 break-all">
                {channel.description || "Chào các bạn !!!"} 
              </p>
              <span className="text-gray-300 font-medium ml-1 whitespace-nowrap group-hover:text-white transition-colors">...xem thêm</span>
            </div>
            
            <a href="#" className="text-[#3EA6FF] text-xs md:text-sm font-medium hover:underline mb-4 flex items-center gap-1.5">
               <LinkIcon className="w-4 h-4" />
               YouTube
            </a>

            <div className="flex items-center flex-wrap gap-2 md:gap-3 shrink-0">
              {isOwner ? (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-full font-medium text-xs text-white bg-[#2A2A2A] hover:bg-[#333333] transition-colors cursor-pointer"
                >
                  Tùy chỉnh kênh
                </button>
              ) : (
                <button 
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`px-3 py-1.5 rounded-full font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSubscribed 
                      ? 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Bell className="w-3.5 h-3.5" /> Đã đăng ký
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </button>
              )}
              
              {!isOwner && (
                <>
                  <button className="px-3 py-1.5 rounded-full font-medium text-xs text-white border border-white/20 hover:bg-[#2A2A2A] transition-colors cursor-pointer flex items-center gap-1.5 bg-transparent">
                    <Star className="w-3.5 h-3.5" /> Tham gia
                  </button>
                  <button className="px-3 py-1.5 rounded-full font-medium text-xs text-white border border-white/20 hover:bg-[#2A2A2A] transition-colors cursor-pointer flex items-center gap-1.5 bg-[#2A2A2A] border-none">
                    <Users className="w-3.5 h-3.5" /> Cộng đồng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 mb-8 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-medium pb-3 px-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'overview' ? 'text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Tổng quan
            </button>
            <button 
              onClick={() => setActiveTab('videos')}
              className={`text-sm font-medium pb-3 px-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'videos' ? 'text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Video của tôi
            </button>
            <button 
              onClick={() => setActiveTab('playlists')}
              className={`text-sm font-medium pb-3 px-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'playlists' ? 'text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Danh sách phát
            </button>
            {isOwner && (
              <button 
                onClick={() => setActiveTab('liked')}
                className={`text-sm font-medium pb-3 px-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'liked' ? 'text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Video đã thích
              </button>
            )}
            <button 
              onClick={() => setActiveTab('about')}
              className={`text-sm font-medium pb-3 px-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'about' ? 'text-[#FF5722] border-b-2 border-[#FF5722]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Giới thiệu
            </button>
          </div>
          
          <div className="relative w-full md:w-64 pb-3">
            <input 
              type="text" 
              placeholder="Tìm kiếm video..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-sm rounded-full pl-10 pr-4 py-2 border border-white/10 focus:outline-none focus:border-[#FF5722] transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-[18px] -translate-y-1/2" />
          </div>
        </div>

        {/* Tab Content */}
        {(() => {
          if (activeTab === 'overview' || activeTab === 'videos') {
            const filteredVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
            return (
              <>
                <h3 className="text-xl font-bold text-white mb-6">
                  {activeTab === 'overview' ? 'Video mới nhất' : 'Tất cả video'}
                </h3>
                {filteredVideos.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                    {searchQuery ? 'Không tìm thấy video nào phù hợp với tìm kiếm.' : 'Kênh này chưa có video nào.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {filteredVideos.map((video) => (
                      <VideoCard 
                        key={video.id} 
                        video={{
                          id: video.id,
                          title: video.title,
                          thumbnail: video.thumbnailUrl || 'https://via.placeholder.com/600x400?text=No+Thumbnail',
                          duration: formatDuration(video.duration),
                          avatar: video.channelAvatarUrl || 'https://via.placeholder.com/150?text=Avt',
                          channelName: video.channelName,
                          handle: video.channelHandle,
                          views: `${formatViews(video.viewsCount)} lượt xem`,
                          time: getTimeAgo(video.createdAt)
                        }} 
                      />
                    ))}
                  </div>
                )}
              </>
            );
          }

          if (activeTab === 'playlists') {
            return (
              <div className="text-center py-20 text-gray-400 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                Kênh này chưa có danh sách phát nào.
              </div>
            );
          }

          if (activeTab === 'liked') {
            return (
              <div className="text-center py-20 text-gray-400 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                Bạn chưa thích video nào trên kênh này.
              </div>
            );
          }

          if (activeTab === 'about') {
            return (
              <div className="bg-[#1A1A1A]/50 rounded-2xl border border-white/5 p-8 max-w-4xl">
                <h3 className="text-xl font-bold text-white mb-6">Giới thiệu về kênh</h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-8 text-lg">
                  {channel.description || "Kênh này chưa có mô tả nào."}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/10 pt-8 mt-4">
                  <div>
                    <h4 className="text-white font-medium mb-4 text-lg">Chi tiết kênh</h4>
                    <ul className="space-y-4 text-gray-400">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#4FC3F7]" />
                        <span>{formatViews(channel.subscriberCount)} người đăng ký</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[#4FC3F7]" />
                        <span>{formatViews(channel.followingCount || 0)} đang theo dõi</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-4 text-lg">Thống kê chung</h4>
                    <ul className="space-y-4 text-gray-400">
                      <li className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-xs">i</span>
                        <span>Đã tham gia {new Date(channel.createdAt).toLocaleDateString('vi-VN')}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-xs">👁</span>
                        <span>{formatViews(channel.totalViews || 0)} lượt xem</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* Customize Modal */}
      <CustomizeChannelModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        channelData={channel}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* About Channel Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#212121] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              {isEditingName ? (
                <div className="flex-1 mr-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameContent}
                    onChange={e => setEditNameContent(e.target.value)}
                    className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-lg font-bold"
                    autoFocus
                  />
                  <button onClick={() => setIsEditingName(false)} className="text-gray-400 hover:text-white px-2">Hủy</button>
                  <button 
                    onClick={() => handleSaveProfile('channelName', editNameContent, setIsEditingName)}
                    className="text-[#3EA6FF] font-medium px-2 flex items-center"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{channel.channelName}</h2>
                  {isOwner && (
                    <button onClick={() => { setEditNameContent(channel.channelName); setIsEditingName(true); }} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <button 
                onClick={() => setIsAboutModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {/* Mô tả */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Mô tả</h3>
                  {isOwner && !isEditingDesc && (
                    <button 
                      onClick={() => {
                        setEditDescContent(channel.description || '');
                        setIsEditingDesc(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Chỉnh sửa mô tả"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isEditingDesc ? (
                  <div className="space-y-3">
                    <textarea 
                      value={editDescContent}
                      onChange={(e) => setEditDescContent(e.target.value)}
                      rows="4"
                      className="w-full bg-[#2A2A2A] text-white p-3 rounded-xl border border-transparent focus:border-[#FF5722] focus:outline-none resize-none text-sm"
                      placeholder="Thêm mô tả về kênh của bạn..."
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsEditingDesc(false)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                        disabled={isSavingProfile}
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => handleSaveProfile('description', editDescContent, setIsEditingDesc)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#3EA6FF] text-black hover:bg-[#65B8FF] transition-colors flex items-center gap-2 cursor-pointer"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {channel.description || "Kênh này chưa có mô tả nào."}
                  </p>
                )}
              </div>

              {/* Đường liên kết */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-white">Đường liên kết</h3>
                  {isOwner && !isEditingHandle && (
                    <button onClick={() => { setEditHandleContent(channel.handle); setIsEditingHandle(true); }} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isEditingHandle ? (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-gray-400">@</span>
                    <input
                      type="text"
                      value={editHandleContent}
                      onChange={e => setEditHandleContent(e.target.value)}
                      className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                      placeholder="Tên định danh (vd: username)"
                    />
                    <button onClick={() => setIsEditingHandle(false)} className="text-gray-400 hover:text-white px-2 text-sm">Hủy</button>
                    <button 
                      onClick={() => handleSaveProfile('handle', editHandleContent, setIsEditingHandle)}
                      className="text-[#3EA6FF] font-medium px-2 flex items-center text-sm"
                    >
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                    </button>
                  </div>
                ) : (
                  <a href="#" className="flex items-start gap-4 text-gray-300 hover:bg-white/5 p-3 rounded-xl transition-colors">
                    <MonitorPlay className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                      <div className="font-medium text-white text-sm mb-1">Kênh chính thức</div>
                      <div className="text-[#3EA6FF] text-sm">youtube.com/@{channel.handle}</div>
                    </div>
                  </a>
                )}
              </div>

              {/* Thông tin khác */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Thông tin khác</h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center gap-4 text-gray-300 group">
                    <Mail className="w-5 h-5 shrink-0" />
                    {isEditingEmail ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="email"
                          value={editEmailContent}
                          onChange={e => setEditEmailContent(e.target.value)}
                          className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="Email liên hệ..."
                        />
                        <button onClick={() => setIsEditingEmail(false)} className="text-gray-400 hover:text-white px-2 text-sm">Hủy</button>
                        <button 
                          onClick={() => handleSaveProfile('contactEmail', editEmailContent, setIsEditingEmail)}
                          className="text-[#3EA6FF] font-medium px-2 flex items-center text-sm"
                        >
                          {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{channel.contactEmail || 'Chưa cập nhật email'}</span>
                        {isOwner && (
                          <button onClick={() => { setEditEmailContent(channel.contactEmail || ''); setIsEditingEmail(true); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Handle Link */}
                  <div className="flex items-center gap-4 text-gray-300">
                    <MonitorPlay className="w-5 h-5 shrink-0" />
                    <span className="text-sm">www.youtube.com/@{channel.handle}</span>
                  </div>
                  
                  {/* Country */}
                  <div className="flex items-center gap-4 text-gray-300 group">
                    <Globe className="w-5 h-5 shrink-0" />
                    {isEditingCountry ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editCountryContent}
                          onChange={e => setEditCountryContent(e.target.value)}
                          className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="Quốc gia..."
                        />
                        <button onClick={() => setIsEditingCountry(false)} className="text-gray-400 hover:text-white px-2 text-sm">Hủy</button>
                        <button 
                          onClick={() => handleSaveProfile('country', editCountryContent, setIsEditingCountry)}
                          className="text-[#3EA6FF] font-medium px-2 flex items-center text-sm"
                        >
                          {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{channel.country || 'Chưa cập nhật quốc gia'}</span>
                        {isOwner && (
                          <button onClick={() => { setEditCountryContent(channel.country || ''); setIsEditingCountry(true); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-300">
                    <Info className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Đã tham gia {new Date(channel.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-300">
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{formatViews(channel.subscriberCount)} người đăng ký</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-300">
                    <PlaySquare className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{videos.length} video</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-300">
                    <TrendingUp className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{formatViews(channel.totalViews || 0)} lượt xem</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-wrap gap-3 mt-8 pt-8 border-t border-white/10">
                <button className="px-4 py-2 rounded-full font-medium text-sm text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Chia sẻ kênh
                </button>
                {!isOwner && (
                  <button className="px-4 py-2 rounded-full font-medium text-sm text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Flag className="w-4 h-4" /> Báo cáo người dùng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

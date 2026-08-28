import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, Tv, Video, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminGlobalSearch({ className }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ users: [], channels: [], videos: [], local: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Define local nav routes for search
  const localNavItems = [
    { name: "Tổng quan", path: "/admin" },
    { name: "Báo cáo nhanh", path: "/admin/reports" },
    { name: "Quản lý Video", path: "/admin/videos" },
    { name: "Danh mục", path: "/admin/categories" },
    { name: "Bình luận", path: "/admin/comments" },
    { name: "Quản lý người dùng", path: "/admin/users" },
    { name: "Quản lý Kênh", path: "/admin/channels" },
    { name: "Vai trò & Quyền", path: "/admin/roles" },
    { name: "Báo cáo & Khiếu nại", path: "/admin/complaints" },
    { name: "Vi phạm", path: "/admin/violations" },
    { name: "Lịch sử đánh gậy", path: "/admin/strikes" },
    { name: "Phản hồi & Góp ý", path: "/admin/feedbacks" },
    { name: "Quản lý FAQs", path: "/admin/faqs" },
    { name: "Giao dịch", path: "/admin/transactions" },
    { name: "Doanh thu", path: "/admin/revenue" },
    { name: "Rút tiền", path: "/admin/withdrawals" },
    { name: "Chính sách kiếm tiền", path: "/admin/monetization" },
    { name: "Thông báo", path: "/admin/notifications" },
    { name: "Lịch sử hoạt động", path: "/admin/activities" },
    { name: "Cài đặt chung", path: "/admin/settings" },
  ];

  useEffect(() => {
    // Click outside handler
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        searchApi(searchTerm);
      } else {
        setResults({ users: [], channels: [], videos: [], local: [] });
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchApi = async (query) => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      // Local search first
      const localMatches = localNavItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3); // top 3 local

      // API search
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResults({
        local: localMatches,
        users: res.data.users || [],
        channels: res.data.channels || [],
        videos: res.data.videos || []
      });
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocal = (path) => {
    navigate(path);
    setIsOpen(false);
    setSearchTerm('');
  };

  // For users, channels, videos, we navigate to their respective listing pages
  const handleSelectUser = (email) => {
    navigate(`/admin/users?search=${encodeURIComponent(email)}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectChannel = (channelName) => {
    navigate(`/admin/channels?search=${encodeURIComponent(channelName)}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectVideo = (title) => {
    navigate(`/admin/videos?search=${encodeURIComponent(title)}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  const hasResults = results.local.length > 0 || results.users.length > 0 || results.channels.length > 0 || results.videos.length > 0;

  return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="Tìm kiếm menu, người dùng..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => { if(searchTerm.trim()) setIsOpen(true); }}
        className="bg-[#1a1c23] border border-white/10 text-white text-sm rounded-full pl-9 pr-4 py-2 w-[500px] focus:outline-none focus:border-purple-500 transition-colors"
      />
      {isLoading && (
        <Loader2 className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
      )}

      {isOpen && searchTerm.trim() && (
        <div className="absolute top-full mt-2 right-0 w-[600px] bg-[#0F0F0F] border border-white/10 rounded-1xl shadow-2xl overflow-hidden z-50">
          {!isLoading && !hasResults && (
            <div className="p-4 text-center text-sm text-gray-400">
              Không tìm thấy kết quả nào cho "{searchTerm}"
            </div>
          )}

          <div className="max-h-[70vh] overflow-y-auto  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0F0F0F] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#0F0F0F]">
            {/* LOCAL NAVIGATION RESULTS */}
            {results.local.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 mb-1">
                  Menu Quản Trị
                </div>
                {results.local.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLocal(item.path)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-200 group-hover:text-purple-400 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
            )}

            {/* USERS RESULTS */}
            {results.users.length > 0 && (
              <div className="py-2 border-t border-white/5">
                <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 mb-1">
                  Người dùng
                </div>
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user.email)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full object-cover bg-black/20"
                      />
                      <div>
                        <div className="text-sm text-gray-200 font-medium group-hover:text-purple-400 transition-colors line-clamp-1">
                          {user.fullName || user.email}
                        </div>
                        {user.fullName && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHANNELS RESULTS */}
            {results.channels.length > 0 && (
              <div className="py-2 border-t border-white/5">
                <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 mb-1">
                  Kênh
                </div>
                {results.channels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel.channelName)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={channel.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.channelName}`} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full object-cover bg-black/20"
                      />
                      <div>
                        <div className="text-sm text-gray-200 font-medium group-hover:text-purple-400 transition-colors line-clamp-1">
                          {channel.channelName}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {channel.handle}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIDEOS RESULTS */}
            {results.videos.length > 0 && (
              <div className="py-2 border-t border-white/5">
                <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 mb-1">
                  Video
                </div>
                {results.videos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video.title)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-8 rounded overflow-hidden bg-black/20 shrink-0">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 font-medium group-hover:text-purple-400 transition-colors line-clamp-1">
                          {video.title}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          Kênh: {video.channelName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

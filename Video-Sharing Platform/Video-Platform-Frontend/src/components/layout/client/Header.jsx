import { useState, useRef, useEffect } from 'react';
import { Search, Video, Bell, LogIn, LogOut, LayoutDashboard, Menu, User, UserPlus, Upload, Smartphone, Radio, Crown, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handle = localStorage.getItem('handle');
  const avatar = localStorage.getItem('avatar') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isAdmin = roles.includes('Admin');

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [logoUrl, setLogoUrl] = useState("/logotrang.png");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [premiumUntil, setPremiumUntil] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data) {
          if (res.data.logoUrl) {
            setLogoUrl(res.data.logoUrl);
          }
          if (res.data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = res.data.faviconUrl;
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu hình public:", err);
      }
    };
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    if (token) {
      const fetchPlan = async () => {
        try {
          const res = await axios.get('/api/payment/current-plan', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.plan) {
            setCurrentPlan(res.data.plan);
            if (res.data.premiumUntil) {
              setPremiumUntil(new Date(res.data.premiumUntil));
            }
          }
        } catch (err) {
          console.error("Lỗi khi tải gói:", err);
        }
      };
      fetchPlan();
    }
  }, [token]);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Handle outside click for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        const { channels, playlists, videos, shorts } = res.data;
        
        const allTitles = [
          ...(channels || []).map(c => c.channelName),
          ...(playlists || []).map(p => p.title),
          ...(videos || []).map(v => v.title),
          ...(shorts || []).map(s => s.title)
        ];
        
        // Remove duplicate titles for suggestions
        const uniqueTitles = Array.from(new Set(allTitles)).slice(0, 8);
        const formattedSuggestions = uniqueTitles.map(title => ({ title }));
        setSuggestions(formattedSuggestions);
      } catch (err) {
        console.error("Lỗi khi tìm kiếm gợi ý:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowSuggestions(false);
    navigate(`/results?search_query=${encodeURIComponent(title)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('handle');
    localStorage.removeItem('avatar');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#0F0F0F]  border-white/5 flex items-center justify-between px-3 z-50">
      {/* Left Area: Menu & Logo */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center h-18 w-28 ml-2">
          <img src={logoUrl} alt="VividStream" className="w-full h-full object-contain" />
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="relative w-full flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none">
              <Search className="w-full h-full" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-full py-2.5 pl-12 pr-16 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#202020] transition-colors text-sm"
            />
            {/* Action button inside input (optional look like youtube) */}
            <button type="submit" className="absolute right-0 top-0 bottom-0 px-5 bg-white/5 hover:bg-white/10 border-l border-white/5 rounded-r-full text-gray-400 hover:text-white transition-colors cursor-pointer">
               <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#202020] border border-white/10 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(item.title)}
                  className="w-full flex items-center gap-4 px-5 py-2 hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[15px] font-medium text-gray-200 truncate">{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-1 ml-4">
        {token ? (
          <>
            <div className="relative" ref={activeDropdown === 'create' ? headerRef : null}>
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'create' ? null : 'create')}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-[52px] h-[48px] rounded-[18px] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5">
                  <Video className="w-[22px] h-[22px] text-[#FF8A65]" />
                </div>
              </div>

              {activeDropdown === 'create' && (
                <div className="absolute right-0 top-full mt-4 w-56 border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                  <Link to="/studio/upload" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Upload className="w-5 h-5" /> Tải video lên
                  </Link>
                  <Link to="/studio/upload-short" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Smartphone className="w-5 h-5" /> Tải video ngắn lên
                  </Link>
                  <Link to="/studio/live" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Radio className="w-5 h-5" /> Phát trực tiếp
                  </Link>
                </div>
              )}
            </div>

            {/* Direct Live Button */}
            <Link to="/studio/live" className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer ml-2 hidden md:inline-flex items-center" onClick={() => setActiveDropdown(null)}>
              <Radio className="w-5 h-5 text-[#FF8A65]" />
            </Link>

            <div className="flex flex-col items-center gap-1.5 group cursor-pointer relative">
              <div className="w-[52px] h-[48px] rounded-[18px] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5 relative">
                <Bell className="w-[22px] h-[22px] text-[#FF8A65]" />
                <span className="absolute top-1 right-2 w-[18px] h-[18px] bg-[#FF1E46] rounded-full flex items-center justify-center text-[10px] font-bold text-white translate-x-1/2 -translate-y-1/2 border-2 border-[#1A1A1A]">3</span>
              </div>
            </div>
            
            <div className="w-[1px] h-10 bg-white/10 mx-1"></div>

            {currentPlan && (
              <Link to="/premium" className={`hidden md:flex items-center justify-between gap-3 px-4 py-1 rounded-full border ${currentPlan === 'Premium' ? 'border-[#9C27B0]/60 bg-[#140b1c] shadow-[0_0_15px_rgba(156,39,176,0.3)]' : currentPlan === 'Family' ? 'border-[#5E35B1]/60 bg-[#0c0a17] shadow-[0_0_15px_rgba(94,53,177,0.3)]' : 'border-white/10 bg-[#1A1A1A] hover:bg-[#222]'} transition-colors cursor-pointer mx-1`}>
                <div className="flex items-center justify-center">
                  {currentPlan === 'Premium' ? (
                     <Crown className="w-[20px] h-[20px] text-[#9C27B0]" fill="currentColor" />
                  ) : currentPlan === 'Family' ? (
                     <Users className="w-[20px] h-[20px] text-[#7E57C2]" fill="currentColor" />
                  ) : (
                     <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col pt-0.5">
                   <span className="text-[12px] font-bold text-white leading-none">
                     {currentPlan === 'Premium' ? 'Premium' : currentPlan === 'Family' ? 'Gia đình' : 'Miễn phí'}
                   </span>
                   {currentPlan !== 'Free' && premiumUntil ? (
                     <span className="text-[8px] text-gray-400 mt-[5px] leading-none">
                       HSD: {premiumUntil.toLocaleDateString('vi-VN')}
                     </span>
                   ) : (
                     <span className="text-[8px] text-gray-400 mt-[5px] leading-none">{currentPlan === 'Free' ? 'HSD: Không giới hạn' : 'Gói bạn đang dùng'}</span>
                   )}
                </div>
                {currentPlan !== 'Free' && (
                  <svg className="w-[16px] h-[16px] text-[#8b5cf6] ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" />
                    <path d="M10 16.5l-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5-7 7z" fill="#fff" />
                  </svg>
                )}
              </Link>
            )}

            <div className="w-[1px] h-10 bg-white/10 mx-1"></div> 

            <div className="relative flex items-center" ref={activeDropdown === 'user' ? headerRef : null}>
              <button onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')} className="flex items-center gap-3 cursor-pointer text-left group">
                <div className="w-11 h-11 rounded-full overflow-hidden border-[3px] border-[#272727] group-hover:border-gray-500 transition-colors">
                  <img src={avatar} alt="Ảnh đại diện" className="w-full h-full object-cover" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-[15px] font-bold text-white leading-tight">{handle || 'Người dùng'}</span>
                  <span className="text-[12px] text-gray-400 mt-0.5 group-hover:text-gray-300 transition-colors">Xem kênh của bạn</span>
                </div>
              </button>
              
              {activeDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-4 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                  <Link to={handle ? `/c/${handle}` : '#'} onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <User className="w-4 h-4" /> Kênh của bạn
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setActiveDropdown(null)} 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Trang quản trị
                    </Link>
                  )}
                  <button onClick={() => { setActiveDropdown(null); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors text-left">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative flex items-center" ref={activeDropdown === 'user' ? headerRef : null}>
            <button onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')} className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1A1A1A] border-[3px] border-[#272727] hover:border-gray-500 transition-colors cursor-pointer group">
              <User className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
            </button>
            
            {activeDropdown === 'user' && (
              <div className="absolute right-0 top-full mt-4 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                <Link to="/login" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                  <UserPlus className="w-4 h-4" /> Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

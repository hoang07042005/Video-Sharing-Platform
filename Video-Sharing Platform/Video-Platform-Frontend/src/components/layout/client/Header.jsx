import { useState, useRef, useEffect } from 'react';
import { Search, Video, Bell, LogIn, LogOut, Menu, User, UserPlus, Upload, Smartphone, Radio } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handle = localStorage.getItem('handle');
  const avatar = localStorage.getItem('avatar') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

  const [activeDropdown, setActiveDropdown] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <img src="/logotrang.png" alt="VividStream" className="w-full h-full object-contain" />
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Tìm kiếm" 
            className="w-full bg-[#1A1A1A] border border-white/5 rounded-full py-2.5 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#202020] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-7 ml-8">
        {token ? (
          <>
            <div className="relative" ref={activeDropdown === 'create' ? headerRef : null}>
              <div 
                onClick={() => setActiveDropdown(activeDropdown === 'create' ? null : 'create')}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-[52px] h-[48px] rounded-[18px] bg-[#1A1A1A] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5">
                  <Video className="w-[22px] h-[22px] text-[#FF8A65]" />
                </div>
              </div>

              {activeDropdown === 'create' && (
                <div className="absolute right-0 top-full mt-4 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                  <Link to="/studio/upload" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Upload className="w-5 h-5" /> Tạo video
                  </Link>
                  <Link to="/studio/upload-short" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Smartphone className="w-5 h-5" /> Tạo video ngắn
                  </Link>
                  <Link to="/studio/live" onClick={() => setActiveDropdown(null)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors">
                    <Radio className="w-5 h-5" /> Live
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1.5 group cursor-pointer relative">
              <div className="w-[52px] h-[48px] rounded-[18px] bg-[#1A1A1A] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5 relative">
                <Bell className="w-[22px] h-[22px] text-[#FF8A65]" />
                <span className="absolute top-1 right-2 w-[18px] h-[18px] bg-[#FF1E46] rounded-full flex items-center justify-center text-[10px] font-bold text-white translate-x-1/2 -translate-y-1/2 border-2 border-[#1A1A1A]">3</span>
              </div>
            </div>
            
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

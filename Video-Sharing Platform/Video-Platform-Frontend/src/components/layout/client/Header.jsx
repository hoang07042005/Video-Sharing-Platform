import { Search, Video, Bell, LogIn, LogOut, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const handle = localStorage.getItem('handle');
  const avatar = localStorage.getItem('avatar') || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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
      <div className="flex items-center gap-6 ml-8">
        <button className="text-[#FF8A65] hover:text-[#FFCC80] transition-colors">
          <Video className="w-6 h-6" />
        </button>
        <button className="text-[#FF8A65] hover:text-[#FFCC80] transition-colors relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0F0F0F]"></span>
        </button>
        
        {token ? (
          <div className="flex items-center gap-4 ml-2">
            <Link to={handle ? `/c/${handle}` : '#'} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer hover:border-white/30 transition-colors block">
              <img 
                src={avatar} 
                alt="Ảnh đại diện" 
                className="w-full h-full object-cover"
              />
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors cursor-pointer" title="Đăng xuất">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-colors text-sm">
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

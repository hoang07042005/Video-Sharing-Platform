import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Video, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 text-center">
          <h1 className="text-2xl font-bold text-red-500 tracking-wider">ADMIN PANEL</h1>
        </div>
        <nav className="flex-1 py-6 space-y-2 px-4">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 bg-red-600/20 text-red-400 rounded-lg transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Tổng quan</span>
          </Link>
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium">Người dùng</span>
          </Link>
          <Link to="/admin/videos" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Video className="w-5 h-5" />
            <span className="font-medium">Quản lý Video</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

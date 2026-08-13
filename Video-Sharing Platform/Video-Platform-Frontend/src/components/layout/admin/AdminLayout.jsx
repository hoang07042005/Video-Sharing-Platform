import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Video, LogOut, List, MessageSquare, DollarSign, CreditCard, FileText, AlertTriangle, ShieldAlert, Settings as SettingsIcon, Shield, Search, Bell, ShieldBan, BarChart2, PlaySquare } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'TỔNG QUAN',
      items: [
        { name: 'Tổng quan', path: '/admin', icon: LayoutDashboard },
        { name: 'Báo cáo nhanh', path: '/admin/reports', icon: BarChart2 },
      ]
    },
    
    {
      label: 'QUẢN LÝ NỘI DUNG',
      items: [
        { name: 'Quản lý Video', path: '/admin/videos', icon: Video },
        { name: 'Danh mục', path: '/admin/categories', icon: List },
        { name: 'Bình luận', path: '/admin/comments', icon: MessageSquare },
      ]
    },
    {
      label: 'QUẢN LÝ NGƯỜI DÙNG',
      items: [
        { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
        { name: 'Vai trò & Phân quyền', path: '/admin/roles', icon: Shield },
      ]
    },
    {
      label: 'KIỂM DUYỆT & TÀI CHÍNH',
      items: [
        { name: 'Báo cáo & Khiếu nại', path: '/admin/complaints', icon: AlertTriangle },
        { name: 'Vi phạm', path: '/admin/violations', icon: ShieldAlert },
        { name: 'Doanh thu', path: '/admin/revenue', icon: DollarSign },
        { name: 'Giao dịch', path: '/admin/transactions', icon: CreditCard },
      ]
    },
    {
      label: 'HỆ THỐNG',
      items: [
        { name: 'Cài đặt', path: '/admin/profile-settings', icon: SettingsIcon },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f111a] text-white flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-[220px] h-screen bg-[#0b0c13] border-r border-white/5 flex flex-col shrink-0 sticky top-0">
        {/* Logo */}
        <div className="py-1 px-4 flex items-center justify-center w-full shrink-0">
          <Link to="/admin" className="flex items-center justify-center">
            <div className="h-16 w-28">
              <img src="/logotrang.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
          </Link>
        </div>
        
        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          <nav className="px-3 py-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                 <p className="px-5 pt-5 border-t border-white/8 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-2 px-2 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white font-semibold shadow-lg shadow-[#FF5722]/20'
                            : 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout — always visible at bottom */}
        <div className="px-4 py-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0b0c13] h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-[80px] px-8 flex items-center justify-between shrink-0">
          <div>
            {/* <h2 className="text-1xl font-bold text-white flex items-center gap-2">
              Chào mừng trở lại, Admin! <span className="text-yellow-400 animate-wave">👋</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Đây là tổng quan hoạt động của hệ thống hôm nay.</p> */}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-[#1a1c23] border border-white/10 text-white text-sm rounded-full pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <button className="relative text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0f111a]"></span>
              </button>
              <div className="flex items-center gap-3 cursor-pointer">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-9 h-9 rounded-full bg-white/10 object-cover" />
                <div className="hidden md:block text-sm">
                  <p className="font-semibold text-white leading-tight">Admin</p>
                  <p className="text-[11px] text-gray-400">Quản trị viên</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

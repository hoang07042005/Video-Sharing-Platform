import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, FolderOpen, Library, DownloadIcon, Settings, HelpCircle, MessageSquare, History } from 'lucide-react';

export default function Sidebar({ isOpen }) {
  const location = useLocation();

  const mainLinks = [
    { name: 'Trang chủ', icon: Home, path: '/' },
    { name: 'Thịnh hành', icon: TrendingUp, path: '/trending' },
    { name: 'Lịch sử', icon: History, path: '/history' },
    { name: 'Đã lưu', icon: FolderOpen, path: '/saved'},
    { name: 'Kênh Đăng ký', icon: FolderOpen, path: '/subscriptions' },
    { name: 'Nội dung tải xuống', icon: DownloadIcon, path:'/download'},
  ];

  const bottomLinks = [
    { name: 'Cài đặt', icon: Settings, path: '/settings' },
    { name: 'Trợ giúp', icon: HelpCircle, path: '/help' },
    { name: 'Phản hồi', icon: MessageSquare, path: '/feedback' },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link 
        to={item.path}
        className={`flex items-center gap-4 px-3 py-2.5 mx-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-[#272727] text-white font-medium' 
            : 'text-gray-300 hover:text-white hover:bg-[#272727]/50'
        }`}
      >
        <item.icon className="w-4 h-4" />
        <span className="font-medium text-sm">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className={`fixed left-0 top-20 w-55 h-[calc(100vh-5rem)] bg-[#0F0F0F] border-white/5 flex flex-col z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <div className="space-y-1">
          {mainLinks.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>

      <div className="px-3 py-4">
        <button className="w-full bg-gradient-to-r from-[#FFA07A] to-[#FA5A5A] hover:from-[#FF8A65] hover:to-[#F44336] text-white font-medium rounded-lg py-3 px-4 transition-all text-sm">
          Nâng cấp Premium
        </button>
      </div>

      <nav className="pb-6">
        <div className="space-y-1">
          {bottomLinks.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

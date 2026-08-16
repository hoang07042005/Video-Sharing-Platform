import { Link, useLocation } from 'react-router-dom';
import {
  Home, TrendingUp, Library, Settings, HelpCircle,
  MessageSquare, History, Bell, Compass, Zap, Film, ListVideo,
  ThumbsUp, Clock, User, Crown,
} from 'lucide-react';

// Social icons (SVG inline vì lucide-react không có)
const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0F0F0F" />
  </svg>
);

export default function Sidebar({ isOpen }) {
  const location = useLocation();

  const navGroups = [
    {
      label: null,
      items: [
        { name: 'Trang chủ', icon: Home, path: '/' },
        { name: 'Khám phá', icon: Compass, path: '/explore' },
        { name: 'Thịnh hành', icon: TrendingUp, path: '/trending' },
        { name: 'Mới cập nhật', icon: Zap, path: '/latest' },
        { name: 'Video ngắn', icon: Film, path: '/shorts' },
        { name: 'Danh sách phát', icon: ListVideo, path: '/playlists' },
      ],
    },
    {
      label: 'Thư viện',
      items: [
        { name: 'Video đã xem', icon: Clock, path: '/history' },
        { name: 'Video đã thích', icon: ThumbsUp, path: '/liked' },
        { name: 'Xem sau', icon: Library, path: '/saved' },
      ],
    },
  ];

  const userHandle = localStorage.getItem('handle');

  const subscriptionLinks = [
    { name: 'Kênh của bạn', icon: User, path: userHandle ? `/c/${userHandle}` : '/login' },
    { name: 'Kênh đăng ký', icon: Bell, path: '/subscriptions' },
  ];

  const bottomLinks = [
    { name: 'Cài đặt', icon: Settings, path: '/settings' },
    { name: 'Trợ giúp', icon: HelpCircle, path: '/help' },
    { name: 'Phản hồi', icon: MessageSquare, path: '/feedback' },
  ];

  const socialLinks = [
    { icon: FacebookIcon, href: '#', label: 'Facebook' },
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: TikTokIcon, href: '#', label: 'TikTok' },
    { icon: YoutubeIcon, href: '#', label: 'YouTube' },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-gradient-to-r from-[#FF5722] to-[#9C27B0] text-white font-semibold shadow-lg shadow-[#FF5722]/20'
            : 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
        <span className="text-sm">{item.name}</span>
      </Link>
    );
  };

  const SectionLabel = ({ label }) => (
    <p className="px-5 pt-5 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
      {label}
    </p>
  );

  return (
    <aside
      className={`fixed left-0 top-16 w-60 h-[calc(100vh-4rem)] bg-[#0F0F0F] flex flex-col z-40 transition-transform duration-300 border-r border-white/5 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto pt-4 pb-2 sidebar-scroll">
        {/* Main groups */}
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {idx > 0 && <div className="mx-4 my-2 border-t border-white/8" />}
            {group.label && <SectionLabel label={group.label} />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Premium Card */}
        <div className="mx-3 my-3">
          <div className="bg-gradient-to-br from-[#ff2980] via-[#ff2222] to-[#db7622] rounded-xl p-4 relative overflow-hidden">
            {/* decorative blob */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-white/10 rounded-full" />
            <div className="flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-300 mb-2 drop-shadow " />
            </div>
            <h3 className='text-white text-lg text-center font-bold mb-2'>Nâng cấp ngay</h3>
            <p className="text-white text-[11px] text-center font-semibold leading-snug mb-3">
              Trải nghiệm không giới hạn với VideoX Premium
            </p>
            <Link
              to="/premium"
              className="block text-center bg-white text-[#FF5722] text-xs font-bold py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Nâng cấp ngay
            </Link>
          </div>
        </div>

        {/* Kênh đăng ký */}
        <div className="mx-4 my-2 border-t border-white/8" />
        <SectionLabel label="Kênh đăng ký" />
        <div className="space-y-0.5">
          {subscriptionLinks.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        {/* Bottom links */}
        <div className="mx-4 my-2 border-t border-white/8" />
        <div className="space-y-0.5 pb-2">
          {bottomLinks.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer: social + copyright */}
      <div className="flex flex-col items-center px-4 py-3 border-t border-white/8 shrink-0">
        {/* Các icon */}
        <div className="flex items-center gap-3 mb-2">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Icon />
            </a>
          ))}
        </div>
        {/* Chữ bản quyền thêm text-center */}
        <p className="text-center text-[10px] text-gray-600 leading-relaxed">
          © 2024 VideoSharing.<br />
          Mọi quyền được bảo lưu.
        </p>
      </div>
    </aside>
  );
}

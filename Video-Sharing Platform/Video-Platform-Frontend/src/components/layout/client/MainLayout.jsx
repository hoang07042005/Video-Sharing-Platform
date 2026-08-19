import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const isShorts = location.pathname.startsWith('/shorts');

  useEffect(() => {
    if (location.pathname.startsWith('/watch') || location.pathname.startsWith('/live') || location.pathname.startsWith('/studio/live')) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'pl-56' : 'pl-0'}`}>
        {/* Shorts dùng layout riêng, không cần p-4 wrapper */}
        {isShorts ? (
          <Outlet />
        ) : (
          <div className="p-2">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Tự động đóng sidebar nếu đang ở trang xem video, mở lại nếu ở trang khác
    if (location.pathname.startsWith('/watch')) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`pt-10 transition-all duration-300 ${isSidebarOpen ? 'pl-50' : 'pl-0'}`}>
        {/* The Outlet renders the matched child route */}
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

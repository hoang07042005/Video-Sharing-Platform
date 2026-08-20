import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const isShorts = location.pathname.startsWith('/shorts');

  useEffect(() => {
    if (location.pathname.startsWith('/watch') || location.pathname.startsWith('/live') || location.pathname.startsWith('/studio/live') || location.pathname.startsWith('/settings')) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [location.pathname]);

  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('showUpdateProfilePopup') === 'true') {
      setShowPopup(true);
    }
  }, []);

  const handleUpdateNow = () => {
    localStorage.removeItem('showUpdateProfilePopup');
    setShowPopup(false);
    navigate('/settings');
  };

  const handleClosePopup = () => {
    localStorage.removeItem('showUpdateProfilePopup');
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1F1F1F] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/10 animate-fade-in relative">
            <button onClick={handleClosePopup} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-16 h-16 bg-[#FF5722]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#FF5722]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Chào mừng bạn mới!</h2>
            <p className="text-gray-400 text-center mb-8">Vui lòng cập nhật thông tin tài khoản của bạn để có trải nghiệm tốt nhất trên nền tảng của chúng tôi.</p>
            <button
              onClick={handleUpdateNow}
              className="w-full bg-[#FF5722] hover:bg-[#F4511E] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
            >
              Cập nhật ngay
            </button>
          </div>
        </div>
      )}
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

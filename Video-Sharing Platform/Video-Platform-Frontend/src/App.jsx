import { useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/client/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChannelProfile from './pages/client/channel/ChannelProfile';
import VideoDetail from './pages/client/video/VideoDetail';
import WatchHistory from './pages/client/video/WatchHistory';
import SavedVideos from './pages/client/video/SavedVideos';
import Subscriptions from './pages/client/video/Subscriptions';
import Downloads from './pages/client/video/Downloads';
import Trending from './pages/client/video/Trending';
import Settings from './pages/client/settings/Settings';
import Help from './pages/client/help/Help';
import Shorts from './pages/client/shorts/Shorts';
import LikedVideos from './pages/client/video/LikedVideos';
import Explore from './pages/client/video/Explore';
import Latest from './pages/client/video/Latest';
import Playlists from './pages/client/video/Playlists';
import Premium from './pages/client/premium/Premium';
import PaymentResult from './pages/client/premium/PaymentResult';
import StudioUpload from './pages/client/studio/StudioUpload';
import StudioLive from './pages/client/studio/StudioLive';
import StudioRevenue from './pages/client/studio/StudioRevenue';
import StudioMonetization from './pages/client/studio/StudioMonetization';
import CreatorDashboard from './pages/client/studio/CreatorDashboard';
import SearchResults from './pages/client/search/SearchResults';
import LiveWatch from './pages/client/live/LiveWatch';
import VideoManagement from './pages/admin/video/VideoManagement';
import MembershipPage from './pages/client/channel/MembershipPage';
import CommunityPage from './pages/client/channel/CommunityPage';
import BuyCoins from './pages/client/Coins/BuyCoins';
import LivePages from './pages/client/live/LivePage';
import NotificationsPage from './pages/client/notifications/NotificationsPage';
import Policies from './pages/client/help/Policies';

import MainLayout from './components/layout/client/MainLayout';
import MaintenanceGuard from './components/layout/client/MaintenanceGuard';
import AdminRoute from './components/layout/admin/AdminRoute';
import AdminLayout from './components/layout/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/user/AdminUsers';
import AdminChannels from './pages/admin/channel/AdminChannels';
import AdminVideoCategory from './pages/admin/category/AdminVideoCategory';
import AdminComments from './pages/admin/comment/AdminComments';
import AdminRoles from './pages/admin/roles/AdminRoles';
import AdminReports from './pages/admin/reports/AdminReports';
import AdminComplaints from './pages/admin/reports/AdminComplaints';
import AdminViolations from './pages/admin/reports/AdminViolations';
import AdminSettings from './pages/admin/settings/AdminSettings';
import AdminTransactions from './pages/admin/transactions/AdminTransactions';
import AdminFeedbacks from './pages/admin/feedback/AdminFeedbacks';
import AdminActivities from './pages/admin/activities/AdminActivities';
import AdminWithdrawals from './pages/admin/transactions/AdminWithdrawals';
import AdminRevenue from './pages/admin/revenue/AdminRevenue';
import AdminMonetization from './pages/admin/monetization/AdminMonetization';
import AdminFaqs from './pages/admin/faq/AdminFaqs';
import AdminNotifications from './pages/admin/notifications/AdminNotifications';
import NotFound from './pages/error/NotFound';

import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Configure global interceptor to handle token expiration from API responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('roles');
      localStorage.removeItem('userId');
      localStorage.removeItem('handle');
      localStorage.removeItem('avatar');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expTime = payload.exp * 1000;
          const currentTime = Date.now();
          
          if (currentTime >= expTime) {
            // Token is already expired on load
            localStorage.removeItem('token');
            localStorage.removeItem('roles');
            localStorage.removeItem('userId');
            localStorage.removeItem('handle');
            localStorage.removeItem('avatar');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          } else {
            // Set a timeout to log out automatically when exactly 1 week passes
            const timeout = expTime - currentTime;
            if (timeout < 2147483647) {
              const timer = setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('roles');
                localStorage.removeItem('userId');
                localStorage.removeItem('handle');
                localStorage.removeItem('avatar');
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }, timeout);
              return () => clearTimeout(timer);
            }
          }
        } catch (e) {
          console.error("Invalid token format", e);
        }
      }
    };
    
    return checkTokenExpiration();
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer position="bottom-right" theme="dark" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<MaintenanceGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
          <Route path="/c/:handle" element={<ChannelProfile />} />
          <Route path="/c/:handle/membership" element={<MembershipPage />} />
          <Route path="/c/:handle/community" element={<CommunityPage />} />
          <Route path="/watch/:id" element={<VideoDetail />} />
          <Route path="/live/:id" element={<LiveWatch />} />
          <Route path="/history" element={<WatchHistory />} />
          <Route path="/saved" element={<SavedVideos />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/download" element={<Downloads />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help-feedback" element={<Help />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/liked" element={<LikedVideos />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/buy-coins" element={<BuyCoins />} />
          <Route path="/studio/upload" element={<StudioUpload />} />
          <Route path="/studio/upload-short" element={<StudioUpload isShortType={true} />} />
          <Route path="/studio/live" element={<StudioLive />} />
          <Route path="/studio/revenue" element={<StudioRevenue />} />
          <Route path="/video/livestreams" element={<LivePages />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="/studio/monetization" element={<StudioMonetization />} />
          <Route path="/studio/dashboard" element={<CreatorDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/policies" element={<Policies />} />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="channels" element={<AdminChannels />} />
            <Route path="videos" element={<VideoManagement />} />
            <Route path="categories" element={<AdminVideoCategory />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="violations" element={<AdminViolations />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="feedbacks" element={<AdminFeedbacks />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="monetization" element={<AdminMonetization />} />
            <Route path="faqs" element={<AdminFaqs />} />
            <Route path="notifications" element={<AdminNotifications />} />
            {/* Catch-all for Admin */}
            <Route path="*" element={<NotFound isAdmin={true} />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

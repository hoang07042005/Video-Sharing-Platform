import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import Shorts from './pages/client/shorts/Shorts';
import LikedVideos from './pages/client/video/LikedVideos';
import Explore from './pages/client/video/Explore';
import Latest from './pages/client/video/Latest';
import Playlists from './pages/client/video/Playlists';
import StudioUpload from './pages/client/studio/StudioUpload';
import SearchResults from './pages/client/search/SearchResults';
import VideoManagement from './pages/admin/video/VideoManagement';

import MainLayout from './components/layout/client/MainLayout';
import AdminRoute from './components/layout/admin/AdminRoute';
import AdminLayout from './components/layout/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/user/AdminUsers';
import AdminVideoCategory from './pages/admin/category/AdminVideoCategory';
import AdminComments from './pages/admin/comment/AdminComments';
import AdminRoles from './pages/admin/roles/AdminRoles';
import AdminReports from './pages/admin/reports/AdminReports';
import AdminComplaints from './pages/admin/reports/AdminComplaints';
import AdminViolations from './pages/admin/reports/AdminViolations';
import AdminSettings from './pages/admin/settings/AdminSettings';
import NotFound from './pages/error/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/c/:handle" element={<ChannelProfile />} />
          <Route path="/watch/:id" element={<VideoDetail />} />
          <Route path="/history" element={<WatchHistory />} />
          <Route path="/saved" element={<SavedVideos />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/download" element={<Downloads />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/liked" element={<LikedVideos />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/studio/upload" element={<StudioUpload />} />
          <Route path="/studio/upload-short" element={<StudioUpload isShortType={true} />} />
          <Route path="/results" element={<SearchResults />} />
          
          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="videos" element={<VideoManagement />} />
            <Route path="categories" element={<AdminVideoCategory />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="violations" element={<AdminViolations />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* Catch-all for Admin */}
            <Route path="*" element={<NotFound isAdmin={true} />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

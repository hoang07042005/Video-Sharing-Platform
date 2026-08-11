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

import MainLayout from './components/layout/client/MainLayout';
import AdminRoute from './components/layout/admin/AdminRoute';
import AdminLayout from './components/layout/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

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
        </Route>

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, Loader2 } from 'lucide-react';
import CategoryFilter from '../../../components/home/CategoryFilter';
import FeaturedHero from '../../../components/home/FeaturedHero';
import VideoCard from '../../../components/home/VideoCard';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('/api/videos');
        setVideos(response.data);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    return views.toLocaleString('vi-VN');
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " năm trước";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " tháng trước";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " ngày trước";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " giờ trước";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " phút trước";
    return "Vừa xong";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  const featuredVideo = videos.length > 0 ? videos[0] : null;
  const regularVideos = videos.length > 0 ? videos.slice(1) : [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <CategoryFilter />
        
        {featuredVideo && <FeaturedHero video={featuredVideo} />}
        
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-[#FF5722]" />
          <h2 className="text-xl font-bold text-white">Thịnh hành</h2>
        </div>

        {regularVideos.length === 0 ? (
          <p className="text-gray-400">Chưa có video nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {regularVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={{
                  id: video.id,
                  title: video.title,
                  thumbnail: video.thumbnailUrl || 'https://via.placeholder.com/600x400?text=No+Thumbnail',
                  duration: formatDuration(video.duration),
                  avatar: video.channelAvatarUrl || 'https://via.placeholder.com/150?text=Avt',
                  channelName: video.channelName,
                  views: `${formatViews(video.viewsCount)} lượt xem`,
                  time: getTimeAgo(video.createdAt)
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

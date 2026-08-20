import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Bell, Users, UserCheck, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatSubscribers = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} Tr người đăng ký`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)} N người đăng ký`;
  return `${count} người đăng ký`;
};

export default function Subscriptions() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('auth');
          setLoading(false);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get('/api/channels/subscribed', { headers });
        setChannels(res.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi lấy kênh đăng ký:', err);
        if (err.response?.status === 401) {
          setError('auth');
        } else {
          setError('fetch');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error === 'auth') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#212121] flex items-center justify-center">
          <Bell className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Không thể hiển thị kênh đăng ký</h2>
          <p className="text-gray-400 mb-6">Đăng nhập để xem các kênh bạn đã theo dõi</p>
          <Link
            to="/login"
            className="px-6 py-3 bg-[#FF5722] text-white font-bold rounded-full hover:bg-[#E64A19] transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[#212121] flex items-center justify-center">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Bạn chưa đăng ký kênh nào</h2>
          <p className="text-gray-400 max-w-sm">
            Hãy tìm và đăng ký các kênh yêu thích để theo dõi nội dung mới nhất của họ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5722] to-[#FF9800] flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kênh đăng ký</h1>
            <p className="text-gray-400 text-sm">{channels.length} kênh bạn đang theo dõi</p>
          </div>
        </div>

        {/* Channel Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              to={`/c/${channel.handle}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all duration-200"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-[#212121] ring-2 ring-transparent group-hover:ring-[#FF5722] transition-all duration-200">
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={channel.channelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF5722] to-[#FF9800]">
                      <span className="text-white font-bold text-2xl">
                        {channel.channelName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Online indicator dot */}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#FF5722] rounded-full border-2 border-[#0F0F0F] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info */}
              <div className="text-center">
                <p className="text-white font-medium text-sm md:text-base line-clamp-1 group-hover:text-[#FF5722] transition-colors flex items-center justify-center gap-1">
                  {channel.channelName}
                  {channel.isVerified && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {formatSubscribers(channel.subscriberCount)}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

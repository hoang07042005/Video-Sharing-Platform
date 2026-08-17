import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LivestreamPlayer from '../../../components/video/LivestreamPlayer';
import LivestreamChat from '../../../components/video/LivestreamChat';

const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')} Tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')} N`;
  return String(v);
};

const normalizeId = (value) => String(value ?? '').trim().toLowerCase();

export default function LiveWatch() {
  const { id } = useParams();
  const [stream, setStream] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStream = async () => {
      try {
        const streamRes = await axios.get(`/api/livestreams/${id}`);
        if (!mounted) return;
        const currentStream = streamRes.data;
        setStream(currentStream);

        const streamChannelId = currentStream?.channelId || currentStream?.channel?.id;
        if (streamChannelId && !channel) {
          try {
            const channelRes = await axios.get(`/api/channels/by-id/${streamChannelId}`);
            if (mounted) setChannel(channelRes.data || null);
          } catch (channelErr) {
            try {
              const channelsRes = await axios.get('/api/channels');
              if (!mounted) return;
              const match = (channelsRes.data || []).find((item) => normalizeId(item.id) === normalizeId(streamChannelId));
              setChannel(match || null);
            } catch {
              if (mounted) setChannel(null);
            }
          }
        }
        return currentStream;
      } catch (err) {
        console.error('Failed to fetch livestream', err);
        return null;
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!id) return;

    // Initial load
    fetchStream();

    // Poll every 5 seconds to pick up hlsUrl once media server sets it
    const pollInterval = setInterval(async () => {
      if (!mounted) return;
      const updated = await fetchStream();
      // Stop polling once we have an hlsUrl or stream ended
      if (updated && (updated.hlsUrl || updated.status === 'ended')) {
        clearInterval(pollInterval);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [id]);


  const hlsSource = useMemo(() => {
    if (!stream) return '';
    const candidate = [stream.hlsUrl, stream.streamUrl, stream.playbackUrl, stream.vodUrl].find((value) => typeof value === 'string' && value.trim().length > 0) || '';
    return candidate.trim();
  }, [stream]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F] text-white">
        Đang tải livestream...
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F] text-white">
        Livestream không tồn tại hoặc đã kết thúc.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0F0F0F] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_0.8fr] gap-6">
          <div className="space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              {hlsSource ? (
                <LivestreamPlayer hlsUrl={hlsSource} poster={stream.thumbnailUrl} className="" />
              ) : (
                <div className="aspect-video flex items-center justify-center text-white bg-black px-6 text-center">
                  Livestream đang được khởi tạo hoặc chưa có luồng phát hợp lệ.
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[#141414] border border-white/10 p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2A2A2A]">
                  <img
                    src={channel?.avatarUrl || channel?.user?.profile?.avatarUrl || 'https://via.placeholder.com/80'}
                    alt={channel?.channelName || 'Kênh'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                      LIVE
                    </span>
                    <h1 className="text-2xl font-bold text-white line-clamp-2">{stream.title}</h1>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span>{channel?.channelName || 'Kênh trực tiếp'}</span>
                    <span>•</span>
                    <span>{formatViews(stream.currentViewers ?? stream.totalViews ?? 0)} đang xem</span>
                    <span>•</span>
                    <span>{stream.tags || 'Livestream'}</span>
                  </div>
                  <p className="mt-3 text-gray-300 whitespace-pre-line">{stream.description || 'Không có mô tả.'}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl bg-[#141414] border border-white/10 p-4 flex flex-col h-[calc(100vh-100px)] sticky top-20">
            <h2 className="text-lg font-semibold text-white mb-3 shrink-0">Thông tin kênh</h2>
            <div className="space-y-3 shrink-0 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={channel?.avatarUrl || 'https://via.placeholder.com/80'}
                  alt={channel?.channelName || 'Kênh'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-white font-medium">{channel?.channelName || 'Kênh trực tiếp'}</div>
                  <div className="text-sm text-gray-400">{channel?.handle || 'live-channel'}</div>
                </div>
              </div>
              <Link to={channel?.handle ? `/c/${channel.handle}` : '/'} className="inline-block text-sm text-blue-400 hover:text-blue-300">
                Xem trang kênh
              </Link>
            </div>
            
            <div className="flex-1 min-h-0">
              <LivestreamChat livestreamId={id} apiBaseUrl="" userId={localStorage.getItem('userId')} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

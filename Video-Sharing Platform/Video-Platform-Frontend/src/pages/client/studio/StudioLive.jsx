import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import LivestreamPlayer from '../../../components/video/LivestreamPlayer';
import LivestreamChat from '../../../components/video/LivestreamChat';
import LivestreamReactions from '../../../components/video/LivestreamReactions';
import DonationPanel from '../../../components/DonationPanel';
import { useSignalRConnection } from '../../../hooks/useSignalRConnection';

const StudioLive = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const idParam = params.get('id');
  const [livestream, setLivestream] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [tags, setTags] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [streamTime, setStreamTime] = useState(0);
  const screenStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const apiBase = '';

  // SignalR connection for reactions and chat
  const connRef = useSignalRConnection(livestream?.id, apiBase);

  const resolveCurrentChannel = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const meRes = await axios.get('/api/channels/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const resolvedChannelId = meRes?.data?.id;
      const resolvedHandle = meRes?.data?.handle;

      if (resolvedChannelId) {
        localStorage.setItem('channelId', resolvedChannelId);
      }
      if (resolvedHandle) {
        localStorage.setItem('handle', resolvedHandle);
      }

      return resolvedChannelId || null;
    } catch (err) {
      console.warn('Unable to resolve current channel via /api/channels/me:', err);
      return localStorage.getItem('channelId') || null;
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScreenShare = async () => {
    if (!livestream || !livestream.id) return;

    try {
      let stream = null;
      const hasDisplayMedia = navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function';

      if (hasDisplayMedia) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
          });
        } catch (shareErr) {
          console.warn('User declined or browser blocked display sharing:', shareErr);
          const shouldContinue = window.confirm('Bạn chưa chia sẻ màn hình. Bạn vẫn muốn bắt đầu livestream bằng camera hoặc tiếp tục mà không chia sẻ màn hình?');
          if (!shouldContinue) return;
        }
      } else {
        console.warn('getDisplayMedia is not supported in this browser. Falling back to camera or continue without capture.');
        const shouldContinue = window.confirm('Trình duyệt của bạn không hỗ trợ chia sẻ màn hình. Bạn vẫn muốn bắt đầu livestream?');
        if (!shouldContinue) return;
      }

      if (!stream && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        } catch (camErr) {
          console.warn('Camera fallback failed:', camErr);
        }
      }

      if (stream) {
        screenStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopScreenShare();
          };
        }

        // Initialize WebSocket connection to our Media Server Bridge
        const wsUrl = `ws://localhost:8001/stream?key=${livestream.streamKey}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          console.log('WebSocket connected. Starting MediaRecorder...');
          const options = { mimeType: 'video/webm;codecs=vp8,opus' };
          let recorder;
          try {
             recorder = new MediaRecorder(stream, options);
          } catch(e) {
             console.warn('vp8 not supported, falling back to default webm');
             recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          }
          
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          recorder.start(1000); // Send chunks every 1 second

          setIsLive(true);
          setStreamTime(0);
          timerIntervalRef.current = setInterval(() => {
            setStreamTime((prev) => prev + 1);
          }, 1000);

          setLivestream({ ...livestream, status: 'live' });
        };
        
        ws.onerror = (e) => {
           console.error('WebSocket error:', e);
           alert('Không thể kết nối tới Media Server.');
        };
      }
    } catch (err) {
      console.error('Screen share error:', err);
      alert('Không thể bắt đầu livestream. Vui lòng thử lại hoặc bắt đầu bằng camera khác.');
    }
  };

  const stopScreenShare = async () => {
    if (!livestream || !livestream.id) return;
    try {
      // Dừng tất cả tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Dừng timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // We still call /end manually just in case webhook fails
      await axios.post(`${apiBase}/api/livestreams/${livestream.id}/end`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setIsLive(false);
      alert('Đã kết thúc phát trực tiếp');
      navigate('/studio');
    } catch (err) {
      console.error('Stop screen share error:', err);
      alert('Lỗi khi kết thúc phát trực tiếp');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (videoRef.current && screenStreamRef.current) {
      videoRef.current.srcObject = screenStreamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isLive, livestream?.id]);

  useEffect(() => {
    if (idParam) {
      (async () => {
        try {
          const res = await axios.get(`${apiBase}/api/livestreams/${idParam}`);
          setLivestream(res.data);
        } catch (_err) {
          console.error(_err);
        }
      })();
    }

    // Cleanup: dừng stream khi component unmount
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [idParam]);

  const createStream = async () => {
    try {
      let channelId = await resolveCurrentChannel();

      if (!channelId) {
        const handle = localStorage.getItem('handle');
        if (handle) {
          try {
            const chRes = await axios.get(`/api/channels/${handle}`);
            channelId = chRes.data?.id;
            if (channelId) localStorage.setItem('channelId', channelId);
          } catch {
            // ignore and fall through
          }
        }
      }

      if (!channelId) {
        alert('Bạn chưa có kênh. Vui lòng tạo kênh trước.');
        return;
      }

      const streamKey = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `sk_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const payload = {
        title: title || 'Live Stream',
        channelId,
        streamKey,
        description: description || '',
        thumbnailUrl: thumbnailPreview || '',
        hlsUrl: '',
        vodUrl: '',
        tags: tags || '',
        totalViews: 0,
        status: 'scheduled',
        scheduledStartTime: new Date().toISOString()
      };
      console.log('Creating livestream with payload:', payload);
      const res = await axios.post(`${apiBase}/api/livestreams`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const created = res.data;
      navigate(`/studio/live?id=${created.id}`);
    } catch (err) {
      console.error(err);
      if (err?.response) {
        console.error('Server response:', err.response.status, err.response.data);
        alert(`Tạo livestream thất bại: ${JSON.stringify(err.response.data)}`);
      } else {
        alert('Tạo livestream thất bại');
      }
    }
  };

  const hasPlayableSource = Boolean(livestream?.hlsUrl || livestream?.vodUrl || livestream?.streamUrl || livestream?.playbackUrl);

  if (!idParam && !livestream) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Bắt đầu phát trực tiếp</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tiêu đề</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề livestream" className="w-full p-2 rounded bg-[#111] border border-white/10 text-white placeholder-gray-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Mô tả</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả livestream (không bắt buộc)" className="w-full p-2 rounded bg-[#111] border border-white/10 text-white placeholder-gray-500 h-20 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tags (phân cách bằng dấu phẩy)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" className="w-full p-2 rounded bg-[#111] border border-white/10 text-white placeholder-gray-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={createStream} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold">Tạo và bắt đầu</button>
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-white">Hủy</button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#0F0F0F] p-4 rounded">
              <label className="block text-sm text-gray-300 mb-2">Hình thumbnail</label>
              <div className="mb-3">
                <label className="block w-full p-4 border-2 border-dashed border-white/20 rounded cursor-pointer hover:border-white/40 transition text-center">
                  <div className="text-gray-400 text-sm">Chọn hình ảnh từ máy</div>
                  <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                </label>
              </div>
              {thumbnailPreview && (
                <div className="w-full h-40 rounded overflow-hidden bg-black/50 flex items-center justify-center">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {!thumbnailPreview && (
                <div className="w-full h-40 rounded bg-white/5 flex items-center justify-center text-gray-500 text-sm">
                  Chưa có hình preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {livestream && (
        <div className="mb-6 flex justify-between items-center bg-white/5 p-4 rounded">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{livestream.title}</h2>
            <p className="text-sm text-gray-400">Trạng thái: {livestream.status}</p>
            {isLive && <p className="text-lg font-bold text-red-500 mt-2">🔴 LIVE {formatTime(streamTime)}</p>}
          </div>
          {!isLive && (
            <button
              onClick={startScreenShare}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
            >
              Bắt đầu chia sẻ màn hình
            </button>
          )}
          {isLive && (
            <button
              onClick={stopScreenShare}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-white font-semibold animate-pulse"
            >
              Kết thúc phát trực tiếp
            </button>
          )}
        </div>
      )}

      {livestream && !isLive && (
        <div className="mb-6 bg-[#141414] p-4 rounded border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Thông tin kết nối (Dùng cho OBS Studio)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Máy chủ tĩnh (RTMP URL)</label>
              <input readOnly value="rtmp://localhost:1935/live" className="w-full p-2 rounded bg-black border border-white/10 text-white font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Khóa luồng (Stream Key)</label>
              <div className="flex gap-2">
                <input readOnly type="password" value={livestream.streamKey || ''} className="flex-1 p-2 rounded bg-black border border-white/10 text-white font-mono text-sm" />
                <button onClick={() => navigator.clipboard.writeText(livestream.streamKey)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm">Copy</button>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            Bạn có thể dùng OBS Studio để phát trực tiếp thay vì trình duyệt. Nhập URL và Khóa luồng vào OBS, sau đó bấm "Start Streaming".
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLive && livestream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-80 bg-black rounded object-contain"
            />
          ) : livestream && hasPlayableSource ? (
            <LivestreamPlayer hlsUrl={livestream.hlsUrl || livestream.vodUrl || livestream.streamUrl || livestream.playbackUrl || ''} poster={livestream.thumbnailUrl} />
          ) : (
            <div className="w-full h-80 bg-black/60 rounded flex items-center justify-center text-center text-white px-6">
              {livestream ? 'Livestream chưa có luồng phát, đang chờ nguồn phát từ máy chủ.' : 'Đang tải...'}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#0F0F0F] p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-3">Chat trực tiếp</h3>
            {livestream && livestream.id ? (
              <div className="space-y-4">
                <LivestreamChat livestreamId={livestream.id} apiBaseUrl={apiBase} userId={localStorage.getItem('userId')} />
                <LivestreamReactions livestreamId={livestream.id} connRef={connRef} />
                <DonationPanel livestreamId={livestream.id} connRef={connRef} />
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">Tạo livestream để bắt đầu chat</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioLive;

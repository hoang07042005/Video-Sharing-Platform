import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import QualitySelector from '../QualitySelector';

const LivestreamPlayer = ({ hlsUrl, poster, className = '', livestreamId = null }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!hlsUrl || !String(hlsUrl).trim()) {
      video.removeAttribute('src');
      video.load();
      return;
    }

    setError(null);
    console.log('[LivestreamPlayer] Loading HLS URL:', hlsUrl);

    // Safari native HLS support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      // autoPlay attribute handles playback start
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Tắt chế độ độ trễ cực thấp để tránh bị dừng/khựng video
        liveSyncDurationCount: 3, // Giữ khoảng cách an toàn 3 segments so với live edge
        liveMaxLatencyDurationCount: 10,
        maxLiveSyncPlaybackRate: 1.2, // Tăng tốc nhẹ nếu bị trễ thay vì 1.5x có thể gây khựng
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      setHlsInstance(hls);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[LivestreamPlayer] Manifest parsed, levels:', hls.levels.length);
        // Dùng setTimeout để tránh race condition với React Strict Mode double-invoke
        setTimeout(() => {
          if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => console.warn('[LivestreamPlayer] Play deferred:', e.message));
            }
          }
        }, 100);
      });

      let retryCount = 0;
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('[LivestreamPlayer] HLS Error:', data.type, data.details, data.fatal);
        if (data.fatal) {
          setError(`Lỗi phát video: ${data.details}`);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('[LivestreamPlayer] Retrying after network error...');
              retryCount++;
              setTimeout(() => {
                if (hlsRef.current) hlsRef.current.startLoad();
              }, Math.min(1000 * retryCount, 5000));
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('[LivestreamPlayer] Recovering from media error...');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      console.warn('[LivestreamPlayer] HLS not supported, falling back to native src');
      video.src = hlsUrl;
    }
  }, [hlsUrl]);

  const handleQualityChange = (quality) => {
    if (!hlsInstance) return;
    if (quality === 'auto') {
      hlsInstance.autoLevelCapping = -1;
    } else {
      const level = hlsInstance.levels.findIndex((l) => {
        return l.height.toString().includes(quality.replace('p', ''));
      });
      if (level !== -1) hlsInstance.nextLevel = level;
    }
  };

  return (
    <div className={`w-full relative group ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        autoPlay
        muted
        className="w-full h-auto bg-black rounded-lg"
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center px-4 rounded-lg">
          <div>
            <div className="text-red-400 text-lg mb-2">⚠ {error}</div>
            <div className="text-gray-400 text-sm">Đang thử kết nối lại...</div>
          </div>
        </div>
      )}

      {livestreamId && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <QualitySelector
            livestreamId={livestreamId}
            playerRef={hlsRef}
            onQualityChange={handleQualityChange}
          />
        </div>
      )}
    </div>
  );
};

export default LivestreamPlayer;

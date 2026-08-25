import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import QualitySelector from "../QualitySelector";

const LivestreamPlayer = ({
  hlsUrl,
  poster,
  className = "",
  livestreamId = null,
}) => {
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
      video.removeAttribute("src");
      video.load();
      return;
    }

    setError(null);
    console.log("[LivestreamPlayer] Loading HLS URL:", hlsUrl);

    // Safari native HLS support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
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
        console.log(
          "[LivestreamPlayer] Manifest parsed, levels:",
          hls.levels.length,
        );
        setTimeout(() => {
          if (video.paused) {
            console.log(
              "[LivestreamPlayer] Video is paused, attempting play()...",
            );
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log("[LivestreamPlayer] Play successful"))
                .catch((e) =>
                  console.warn("[LivestreamPlayer] Play deferred:", e.message),
                );
            }
          }
        }, 100);
      });

      // Cố gắng phát ngay khi có thể
      video.addEventListener("loadeddata", () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      });

      // Lắng nghe lỗi HLS
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn(
          "[LivestreamPlayer] HLS Error:",
          data.type,
          data.details,
          data.fatal,
        );

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                // Manifest chưa có (FFmpeg chưa tạo xong) -> Thử tải lại toàn bộ
                console.log(
                  "[LivestreamPlayer] Manifest not found, retrying in 3s...",
                );
                setError("Đang đợi luồng phát bắt đầu...");
                setTimeout(() => {
                  if (hlsRef.current) {
                    setError(null);
                    hlsRef.current.loadSource(hlsUrl);
                  }
                }, 3000);
              } else {
                console.log("[LivestreamPlayer] Network error, retrying...");
                setError("Đang khôi phục kết nối mạng...");
                setTimeout(() => {
                  if (hlsRef.current) {
                    setError(null);
                    hlsRef.current.startLoad();
                  }
                }, 2000);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("[LivestreamPlayer] Recovering from media error...");
              hls.recoverMediaError();
              break;
            default:
              setError("Không thể phát video này.");
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
      console.warn(
        "[LivestreamPlayer] HLS not supported, falling back to native src",
      );
      video.src = hlsUrl;
      video.addEventListener("loadeddata", () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      });
    }
  }, [hlsUrl]);

  const handleQualityChange = (quality) => {
    if (!hlsInstance) return;
    if (quality === "auto") {
      hlsInstance.autoLevelCapping = -1;
    } else {
      const level = hlsInstance.levels.findIndex((l) => {
        return l.height.toString().includes(quality.replace("p", ""));
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center px-4 rounded-lg z-10 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            {error.includes("đợi") || error.includes("khôi phục") ? (
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            ) : (
              <div className="text-red-400 text-3xl mb-2">⚠</div>
            )}
            <div className="text-gray-200 text-lg font-medium">{error}</div>
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

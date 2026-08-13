import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const CustomVideoPlayer = ({ options, onReady, resolutions, currentResolutionUrl, onResolutionChange, ...props }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [showResMenu, setShowResMenu] = useState(false);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        if (onReady) {
          onReady(player);
        }
      });
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      player.src(options.sources);
    }
  }, [options, videoRef]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  useEffect(() => {
    if (playerRef.current && currentResolutionUrl) {
      const currentTime = playerRef.current.currentTime();
      const isPaused = playerRef.current.paused();
      
      playerRef.current.src({ src: currentResolutionUrl, type: 'video/mp4' });
      
      playerRef.current.ready(() => {
        playerRef.current.currentTime(currentTime);
        if (!isPaused) {
          playerRef.current.play();
        }
      });
    }
  }, [currentResolutionUrl]);

  return (
    <div data-vjs-player className="relative w-full h-full group">
      <div ref={videoRef} className="w-full h-full bg-black" />
      
      {/* Custom Resolution Menu Overlay */}
      {resolutions && resolutions.length > 0 && (
        <div className="absolute bottom-12 right-4 z-50 flex items-end justify-end">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowResMenu(!showResMenu); }}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-all vjs-button opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Cài đặt độ phân giải"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>

            {showResMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#282828] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-2 border-b border-white/10 text-xs font-semibold text-gray-400">Độ phân giải</div>
                {resolutions.map((res) => (
                  <button
                    key={res.id}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${currentResolutionUrl === res.fileUrl ? 'text-[#FF5722]' : 'text-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolutionChange(res.fileUrl);
                      setShowResMenu(false);
                    }}
                  >
                    {res.resolution}
                    {currentResolutionUrl === res.fileUrl && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, Maximize, PictureInPicture, Settings, Check, ChevronRight, Lock } from 'lucide-react';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const CustomVideoPlayer = ({ options, onReady, resolutions, currentResolutionUrl, onResolutionChange, tier = 0, ...props }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  // UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('main'); // 'main', 'speed', 'resolution'

  // YouTube-style double-click seek
  const [seekFlash, setSeekFlash] = useState(null); // null | 'left' | 'right'
  const [seekAmount, setSeekAmount] = useState(10);
  const clickTimerRef = useRef(null);
  const seekFlashTimerRef = useRef(null);
  
  const controlsTimeoutRef = useRef(null);
  const progressRef = useRef(null);
  const isDraggingProgress = useRef(false);

  // Initialize video.js
  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      // Add necessary classes and hide default controls
      videoElement.classList.add('vjs-custom-skin');
      videoElement.classList.add('w-full', 'h-full', 'object-contain');
      videoRef.current.appendChild(videoElement);

      const finalOptions = { ...options, controls: false };

      const player = playerRef.current = videojs(videoElement, finalOptions, () => {
        videojs.log('player is ready');
        
        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => setIsPlaying(false));
        player.on('timeupdate', () => {
          if (!isDraggingProgress.current) {
            setCurrentTime(player.currentTime());
          }
        });
        player.on('loadedmetadata', () => {
          setDuration(player.duration());
          setVolume(player.volume());
          setIsMuted(player.muted());
        });
        player.on('durationchange', () => {
          setDuration(player.duration());
        });
        player.on('volumechange', () => {
          setVolume(player.volume());
          setIsMuted(player.muted());
        });
        player.on('ratechange', () => {
          setPlaybackRate(player.playbackRate());
        });
        player.on('fullscreenchange', () => {
          setIsFullscreen(player.isFullscreen());
        });
        player.on('enterpictureinpicture', () => setIsPiP(true));
        player.on('leavepictureinpicture', () => setIsPiP(false));
        player.on('ended', () => setIsPlaying(false));

        if (onReady) {
          onReady(player);
        }
      });
    }
  }, []);

  // Cleanup
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  const isFirstMount = useRef(true);

  // Handle resolution change without resetting time/play state
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (playerRef.current && currentResolutionUrl) {
      const currentVideoTime = playerRef.current.currentTime();
      const isVideoPaused = playerRef.current.paused();
      
      playerRef.current.src({ src: currentResolutionUrl, type: 'video/mp4' });
      
      playerRef.current.ready(() => {
        playerRef.current.currentTime(currentVideoTime);
        if (!isVideoPaused) {
          const playPromise = playerRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => { console.log('Autoplay was prevented.', error); });
          }
        }
      });
    }
  }, [currentResolutionUrl]);

  // Controls Visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showSettingsMenu) setShowControls(false);
      }, 2500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !showSettingsMenu) {
      setShowControls(false);
    }
  };

  // Playback Controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.paused()) {
      playerRef.current.play().catch(() => {});
    } else {
      playerRef.current.pause();
    }
  };

  const skipTime = (amount) => {
    if (!playerRef.current) return;
    const currentVidTime = playerRef.current.currentTime();
    const vidDuration = playerRef.current.duration() || duration;
    const newTime = Math.max(0, Math.min(currentVidTime + amount, vidDuration));
    playerRef.current.currentTime(newTime);
  };

  // YouTube-style click handler: single click = play/pause, double click = seek
  const handleContainerClick = useCallback((e) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isLeft = e.clientX - rect.left < rect.width / 2;

    if (clickTimerRef.current) {
      // Double click detected
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;

      const amount = isLeft ? -10 : 10;
      skipTime(amount);

      // Show ripple flash
      if (seekFlashTimerRef.current) clearTimeout(seekFlashTimerRef.current);
      setSeekAmount(Math.abs(amount));
      setSeekFlash(isLeft ? 'left' : 'right');
      seekFlashTimerRef.current = setTimeout(() => setSeekFlash(null), 700);
    } else {
      // First click — wait to see if double click follows
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        togglePlay();
      }, 220);
    }
  }, [duration, isPlaying]);

  const handleDoubleClick = useCallback((e) => {
    // Prevent default fullscreen from double-click; handled in handleContainerClick
    e.stopPropagation();
  }, []);

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    const currentMuted = playerRef.current.muted();
    playerRef.current.muted(!currentMuted);
    if (currentMuted && playerRef.current.volume() === 0) {
      playerRef.current.volume(1);
    }
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.volume(newVol);
      playerRef.current.muted(newVol === 0);
    }
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    
    // Use containerRef for fullscreen so the custom controls are included
    if (isFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      }
    }
  };

  // Listen to document fullscreenchange for accurate state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const togglePiP = async (e) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const videoHtml = videoRef.current.querySelector('video');
        if (videoHtml) await videoHtml.requestPictureInPicture();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpeedChange = (speed) => {
    if (playerRef.current) {
      playerRef.current.playbackRate(speed);
    }
    setActiveSettingsTab('main');
    setShowSettingsMenu(false);
  };

  // Progress Bar
  const calculateProgressTime = (e) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handleProgressDown = (e) => {
    e.stopPropagation();
    isDraggingProgress.current = true;
    const newTime = calculateProgressTime(e);
    setCurrentTime(newTime);
  };

  const handleProgressMove = useCallback((e) => {
    if (isDraggingProgress.current) {
      const newTime = calculateProgressTime(e);
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleProgressUp = useCallback((e) => {
    if (isDraggingProgress.current) {
      isDraggingProgress.current = false;
      const newTime = calculateProgressTime(e);
      if (playerRef.current) {
        playerRef.current.currentTime(newTime);
      }
    }
  }, [duration]);

  useEffect(() => {
    document.addEventListener('mousemove', handleProgressMove);
    document.addEventListener('mouseup', handleProgressUp);
    return () => {
      document.removeEventListener('mousemove', handleProgressMove);
      document.removeEventListener('mouseup', handleProgressUp);
    };
  }, [handleProgressMove, handleProgressUp]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black flex overflow-hidden group select-none ${!showControls && isPlaying ? 'cursor-none' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      onDoubleClick={handleDoubleClick}
    >
      <div ref={videoRef} className="w-full h-full pointer-events-none" />

      {/* Center Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity">
          <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl">
            <Play className="w-10 h-10 text-white ml-2" fill="white" />
          </div>
        </div>
      )}

      {/* YouTube-style Seek Flash — Left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${seekFlash === 'left' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="relative flex flex-col items-center gap-1">
          {/* Ripple circle */}
          <div
            className="absolute w-32 h-32 rounded-full bg-white/10"
            style={{
              animation: seekFlash === 'left' ? 'yt-ripple 0.6s ease-out forwards' : 'none',
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <div className="flex">
              {[0,1,2].map(i => (
                <Rewind key={i} className="w-5 h-5 text-white" style={{ opacity: 1 - i * 0.25 }} />
              ))}
            </div>
            <span className="text-white text-xs font-semibold">{seekAmount} giây</span>
          </div>
        </div>
      </div>

      {/* YouTube-style Seek Flash — Right */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${seekFlash === 'right' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="relative flex flex-col items-center gap-1">
          {/* Ripple circle */}
          <div
            className="absolute w-32 h-32 rounded-full bg-white/10"
            style={{
              animation: seekFlash === 'right' ? 'yt-ripple 0.6s ease-out forwards' : 'none',
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <div className="flex">
              {[2,1,0].map(i => (
                <FastForward key={i} className="w-5 h-5 text-white" style={{ opacity: 1 - i * 0.25 }} />
              ))}
            </div>
            <span className="text-white text-xs font-semibold">{seekAmount} giây</span>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 px-4 pt-16 pb-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="relative h-1 w-full bg-white/20 mb-3 cursor-pointer group/progress transition-all hover:h-1.5"
          onMouseDown={handleProgressDown}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-[#FF0000]"
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FF0000] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4 text-white">
            <button type="button" onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="hover:text-white/80 transition-colors focus:outline-none">
              {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume relative">
              <button onClick={toggleMute} className="hover:text-white/80 transition-colors focus:outline-none">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-out flex items-center">
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 accent-white bg-white/30 appearance-none cursor-pointer rounded-full"
                />
              </div>
            </div>

            {/* Time */}
            <div className="text-sm font-medium tracking-wide">
              {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4 text-white relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsMenu(!showSettingsMenu);
                setActiveSettingsTab('main');
              }} 
              className="hover:text-white/80 transition-all duration-300 focus:outline-none"
              style={{ transform: showSettingsMenu ? 'rotate(90deg)' : 'none' }}
              title="Cài đặt"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Settings Dropdown */}
            {showSettingsMenu && (
              <div className="absolute bottom-full right-10 mb-4 w-64 bg-black/95 backdrop-blur-md rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden text-sm z-50">
                {activeSettingsTab === 'main' && (
                  <div className="py-2">
                    {resolutions && resolutions.length > 0 && (
                      <button type="button" onClick={() => setActiveSettingsTab('resolution')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors">
                        <span className="flex items-center gap-3 font-medium"><Settings className="w-4 h-4 text-white/70" /> Chất lượng</span>
                        <span className="text-white/70 flex items-center gap-1">{resolutions.find(r => r.fileUrl === currentResolutionUrl)?.resolution || 'Auto'} <ChevronRight className="w-4 h-4"/></span>
                      </button>
                    )}
                    <button type="button" onClick={() => setActiveSettingsTab('speed')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-colors">
                      <span className="flex items-center gap-3 font-medium"><Play className="w-4 h-4 text-white/70" /> Tốc độ phát</span>
                      <span className="text-white/70 flex items-center gap-1">{playbackRate === 1 ? 'Chuẩn' : `${playbackRate}x`} <ChevronRight className="w-4 h-4"/></span>
                    </button>
                  </div>
                )}
                
                {activeSettingsTab === 'resolution' && (
                  <div className="py-2">
                    <button onClick={() => setActiveSettingsTab('main')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/10 transition-colors font-medium">
                      <ChevronRight className="w-4 h-4 rotate-180 text-white/70" /> Trở lại
                    </button>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {resolutions && resolutions.length > 0 ? resolutions.map((res) => {
                        const isLocked = (() => {
                          const name = res.resolution.toLowerCase();
                          if ((name.includes('1080')) && tier < 1) return true;
                          if ((name.includes('4k') || name.includes('1440') || name.includes('2160') || name.includes('2k')) && tier < 2) return true;
                          return false;
                        })();
                        
                        return (
                          <button
                            type="button"
                            key={res.id}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isLocked ? 'text-gray-500 hover:bg-transparent cursor-not-allowed' : 'hover:bg-white/10'}`}
                            onClick={() => {
                              if (isLocked) {
                                alert(`Chất lượng ${res.resolution} yêu cầu gói ${tier < 1 ? 'PLUS' : 'PREMIUM'} trở lên!`);
                                return;
                              }
                              onResolutionChange(res.fileUrl);
                              setActiveSettingsTab('main');
                              setShowSettingsMenu(false);
                            }}
                          >
                            <div className="w-4 flex justify-center">
                              {currentResolutionUrl === res.fileUrl && !isLocked && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="flex-1">{res.resolution}</span>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-gray-500" />}
                          </button>
                        );
                      }) : (
                        <div className="px-4 py-3 text-white/50 text-center">Chưa có dữ liệu</div>
                      )}
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'speed' && (
                  <div className="py-2">
                    <button onClick={() => setActiveSettingsTab('main')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/10 hover:bg-white/10 transition-colors font-medium">
                      <ChevronRight className="w-4 h-4 rotate-180 text-white/70" /> Trở lại
                    </button>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {speeds.map((s) => (
                        <button
                          key={s}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                          onClick={() => handleSpeedChange(s)}
                        >
                          <div className="w-4 flex justify-center">
                            {playbackRate === s && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span>{s === 1 ? 'Chuẩn' : s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={(e) => { e.stopPropagation(); togglePiP(e); }} className="hover:text-white/80 transition-colors focus:outline-none" title="Trình phát thu nhỏ">
              <PictureInPicture className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(e); }} className="hover:text-white/80 transition-colors focus:outline-none" title="Toàn màn hình">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ripple keyframe */}
      <style>{`
        @keyframes yt-ripple {
          0%   { transform: scale(0.5); opacity: 0.5; }
          100% { transform: scale(2);   opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CustomVideoPlayer;

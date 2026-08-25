import React, { useEffect, useState } from "react";
import axios from "axios";

const QualitySelector = ({ livestreamId, playerRef, onQualityChange }) => {
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [isOpen, setIsOpen] = useState(false);
  const apiBase = "";

  useEffect(() => {
    if (!livestreamId) return;
    fetchQualities();
  }, [livestreamId]);

  // Load saved quality preference
  useEffect(() => {
    const saved = localStorage.getItem("preferredQuality");
    if (saved) setSelectedQuality(saved);
  }, []);

  const fetchQualities = async () => {
    try {
      const res = await axios.get(
        `${apiBase}/api/videoQualities/livestream/${livestreamId}`,
      );
      setQualities(res.data);
    } catch (err) {
      console.error("Failed to fetch qualities:", err);
    }
  };

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    localStorage.setItem("preferredQuality", quality);
    setIsOpen(false);

    // Update player quality if available
    if (playerRef?.current) {
      // Notify parent component to change quality
      if (onQualityChange) {
        onQualityChange(quality);
      }

      // For HLS players, switch quality variant
      if (playerRef.current.hls) {
        if (quality === "auto") {
          playerRef.current.hls.autoLevelCapping = -1;
        } else {
          const qualityObj = qualities.find((q) => q.qualityLabel === quality);
          if (qualityObj) {
            const level = playerRef.current.hls.levels.findIndex(
              (l) => l.url === qualityObj.hlsUrl,
            );
            if (level !== -1) {
              playerRef.current.hls.nextLevel = level;
            }
          }
        }
      }
    }
  };

  const getQualityLabel = () => {
    if (selectedQuality === "auto") return "Auto";
    const quality = qualities.find((q) => q.qualityLabel === selectedQuality);
    return quality ? quality.qualityLabel : "Auto";
  };

  if (qualities.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm font-semibold transition flex items-center gap-1"
      >
        <span>⚙️</span>
        {getQualityLabel()}
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-[#1F1F1F] border border-white/10 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            {/* Auto Option */}
            <button
              onClick={() => handleQualityChange("auto")}
              className={`w-full px-3 py-2 rounded text-left text-sm transition ${
                selectedQuality === "auto"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/10 text-gray-300"
              }`}
            >
              🔄 Auto (Recommended)
            </button>

            {/* Quality Options */}
            {qualities.map((quality) => (
              <button
                key={quality.id}
                onClick={() => handleQualityChange(quality.qualityLabel)}
                className={`w-full px-3 py-2 rounded text-left text-sm transition flex justify-between items-center ${
                  selectedQuality === quality.qualityLabel
                    ? "bg-blue-600 text-white"
                    : "hover:bg-white/10 text-gray-300"
                }`}
              >
                <span>{quality.qualityLabel}</span>
                <span className="text-xs opacity-70">
                  {quality.bitrate} kbps
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QualitySelector;

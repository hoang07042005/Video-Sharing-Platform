import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import LivestreamPlayer from "../../../components/video/LivestreamPlayer";
import LivestreamChat from "../../../components/video/LivestreamChat";
import { AlertTriangle } from "lucide-react";
import * as LucideIcons from "lucide-react";

const StudioLive = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const idParam = params.get("id");
  const [livestream, setLivestream] = useState(null);
  const [livestreamError, setLivestreamError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamTime, setStreamTime] = useState(0);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bannedError, setBannedError] = useState(null);
  const screenStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const apiBase = "";

  const resolveCurrentChannel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const meRes = await axios.get("/api/channels/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resolvedChannelId = meRes?.data?.id;
      const resolvedHandle = meRes?.data?.handle;

      if (resolvedChannelId) {
        localStorage.setItem("channelId", resolvedChannelId);
      }
      if (resolvedHandle) {
        localStorage.setItem("handle", resolvedHandle);
      }

      return resolvedChannelId || null;
    } catch (err) {
      console.warn(
        "Unable to resolve current channel via /api/channels/me:",
        err,
      );
      return localStorage.getItem("channelId") || null;
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startScreenShare = async () => {
    if (!livestream || !livestream.id) return;

    try {
      let stream = null;
      const hasDisplayMedia =
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === "function";

      if (hasDisplayMedia) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: false,
          });
        } catch (shareErr) {
          console.warn(
            "User declined or browser blocked display sharing:",
            shareErr,
          );
          const shouldContinue = window.confirm(
            "Bạn chưa chia sẻ màn hình. Bạn vẫn muốn bắt đầu livestream bằng camera hoặc tiếp tục mà không chia sẻ màn hình?",
          );
          if (!shouldContinue) return;
        }
      } else {
        console.warn(
          "getDisplayMedia is not supported in this browser. Falling back to camera or continue without capture.",
        );
        const shouldContinue = window.confirm(
          "Trình duyệt của bạn không hỗ trợ chia sẻ màn hình. Bạn vẫn muốn bắt đầu livestream?",
        );
        if (!shouldContinue) return;
      }

      if (
        !stream &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function"
      ) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        } catch (camErr) {
          console.warn("Camera fallback failed:", camErr);
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
          console.log("WebSocket connected. Starting MediaRecorder...");
          const options = { mimeType: "video/webm;codecs=vp8,opus" };
          let recorder;
          try {
            recorder = new MediaRecorder(stream, options);
          } catch {
            console.warn("vp8 not supported, falling back to default webm");
            recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
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

          setLivestream({ ...livestream, status: "live" });
        };

        ws.onerror = (e) => {
          console.error("WebSocket error:", e);
          alert("Không thể kết nối tới Media Server.");
        };
      }
    } catch (err) {
      console.error("Screen share error:", err);
      alert(
        "Không thể bắt đầu livestream. Vui lòng thử lại hoặc bắt đầu bằng camera khác.",
      );
    }
  };

  const stopScreenShare = async () => {
    if (!livestream || !livestream.id) return;
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      await axios.post(
        `${apiBase}/api/livestreams/${livestream.id}/end`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      setIsLive(false);
      alert("Đã kết thúc phát trực tiếp");
      navigate("/studio");
    } catch (err) {
      console.error("Stop screen share error:", err);
      alert("Lỗi khi kết thúc phát trực tiếp");
    }
  };

  const togglePauseScreenShare = async () => {
    if (!mediaRecorderRef.current || !livestream?.id) return;
    try {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        await axios.post(
          `${apiBase}/api/livestreams/${livestream.id}/pause`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      } else if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        await axios.post(
          `${apiBase}/api/livestreams/${livestream.id}/resume`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      }
    } catch (err) {
      console.error("Error toggling pause:", err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (videoRef.current && screenStreamRef.current) {
      videoRef.current.srcObject = screenStreamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isLive, livestream?.id]);

  useEffect(() => {
    axios
      .get("/api/videos/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    let pollInterval;
    if (idParam) {
      const fetchLivestreamData = async () => {
        try {
          const res = await axios.get(`${apiBase}/api/livestreams/${idParam}`);
          setLivestream((prev) => {
            if (!prev) return res.data;
            return {
              ...prev,
              currentViewers: res.data.currentViewers,
              likes: res.data.likes,
              totalViews: res.data.totalViews,
            };
          });
        } catch (_err) {
          console.error(_err);
          setLivestreamError(
            "Không thể tải thông tin livestream. Vui lòng thử lại.",
          );
        }
      };

      fetchLivestreamData();
      pollInterval = setInterval(fetchLivestreamData, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
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
        const handle = localStorage.getItem("handle");
        if (handle) {
          try {
            const chRes = await axios.get(`/api/channels/${handle}`);
            channelId = chRes.data?.id;
            if (channelId) localStorage.setItem("channelId", channelId);
          } catch {
            // ignore and fall through
          }
        }
      }

      if (!channelId) {
        alert("Bạn chưa có kênh. Vui lòng tạo kênh trước.");
        return;
      }

      const streamKey =
        window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : `sk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        title: title || "Live Stream",
        channelId,
        streamKey,
        description: description || "",
        thumbnailUrl: thumbnailPreview || "",
        hlsUrl: "",
        vodUrl: "",
        tags: tags || "",
        categoryId: categoryId ? Number(categoryId) : null,
        totalViews: 0,
        status: "scheduled",
        scheduledStartTime: new Date().toISOString(),
      };
      console.log("Creating livestream with payload:", payload);
      const res = await axios.post(`${apiBase}/api/livestreams`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const created = res.data;
      navigate(`/studio/live?id=${created.id}`);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setBannedError(
          err.response.data.message || "Kênh của bạn đã bị cấm phát trực tiếp.",
        );
      } else {
        alert(
          "Tạo livestream thất bại: " +
            (err.response?.data?.message || "Có lỗi xảy ra"),
        );
      }
    }
  };

  const hasPlayableSource = Boolean(
    livestream?.hlsUrl ||
    livestream?.vodUrl ||
    livestream?.streamUrl ||
    livestream?.playbackUrl,
  );

  if (idParam && !livestream && !livestreamError) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#0F0F13] text-gray-400">
        Đang tải thông tin livestream...
      </div>
    );
  }

  if (idParam && livestreamError) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 bg-[#0F0F13] text-center px-4">
        <p className="text-red-400">{livestreamError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ── CREATION FORM ──
  if (!idParam && !livestream) {
    return (
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-full relative">
        {/* Modal Cấm */}
        {bannedError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-red-500/30 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Hành động bị chặn
              </h3>
              <p className="text-gray-400 mb-8">{bannedError}</p>
              <button
                onClick={() => setBannedError(null)}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
            <LucideIcons.Radio className="w-7 h-7 md:w-8 md:h-8 text-pink-400 relative z-10" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              Bắt đầu phát trực tiếp
            </h2>
            <p className="text-gray-400 text-xs md:text-sm">
              Tạo livestream mới để kết nối với khán giả của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Left Column — Form */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5 md:p-6 flex flex-col gap-5">
              <div className="flex gap-4">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                  <LucideIcons.Type className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tiêu đề livestream
                  </label>
                  <div className="relative">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tiêu đề livestream hấp dẫn..."
                      className="w-full bg-[#0F0F0F] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:border-pink-500 focus:outline-none transition-colors pr-16"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-gray-500">
                      {title.length}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                  <LucideIcons.FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Mô tả (không bắt buộc)
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Nhập mô tả chi tiết về nội dung livestream..."
                      className="w-full bg-[#0F0F0F] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:border-pink-500 focus:outline-none transition-colors h-28 resize-none pr-4 pb-8"
                    />
                    <span className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {description.length}/500
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                  <LucideIcons.LayoutGrid className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Danh mục
                  </label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#0F0F0F] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:border-pink-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Chọn danh mục phù hợp</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <LucideIcons.ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="hidden md:flex w-10 h-10 rounded-xl bg-purple-500/10 items-center justify-center shrink-0 border border-purple-500/20 mt-1">
                  <LucideIcons.Tag className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <div className="relative">
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Ví dụ: game, giải trí, hướng dẫn"
                      className="w-full bg-[#0F0F0F] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:border-pink-500 focus:outline-none transition-colors pr-16"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-gray-500">
                      {tags.length}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={createStream}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414] hover:shadow-lg hover:shadow-[#FF5722]/20 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  <LucideIcons.Radio className="w-4 h-4" /> Tạo và bắt đầu
                  livestream
                </button>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#141418] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <LucideIcons.Video className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">
                    Chất lượng
                  </h4>
                  <p className="text-[10px] text-gray-400">Tối đa 1080p</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Khuyến nghị 720p
                  </p>
                </div>
              </div>
              <div className="bg-[#141418] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                  <LucideIcons.Wifi className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">
                    Kết nối
                  </h4>
                  <p className="text-[10px] text-gray-400">Tối thiểu 5 Mbps</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Khuyến nghị 10 Mbps
                  </p>
                </div>
              </div>
              <div className="bg-[#141418] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                  <LucideIcons.Clock className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">
                    Thời lượng
                  </h4>
                  <p className="text-[10px] text-gray-400">Không giới hạn</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Livestream thoải mái
                  </p>
                </div>
              </div>
              <div className="bg-[#141418] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <LucideIcons.Users className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold mb-1">
                    Khán giả
                  </h4>
                  <p className="text-[10px] text-gray-400">Không giới hạn</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Tiếp cận mọi người
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Thumbnail upload */}
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LucideIcons.Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  Hình thu nhỏ livestream
                </h3>
              </div>
              <div className="relative group rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-[#0F0F0F] transition-all overflow-hidden h-[200px] flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <LucideIcons.UploadCloud className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-300 mb-1">
                      Tải lên hình thu nhỏ
                    </p>
                    <p className="text-[10px] text-gray-500">
                      JPG, PNG • Tối đa 5MB • 1280x720px
                    </p>
                  </div>
                )}
                {thumbnailPreview && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                    <p className="text-white text-sm font-medium flex items-center gap-2">
                      <LucideIcons.RefreshCw className="w-4 h-4" /> Đổi hình
                      khác
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LucideIcons.Eye className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Xem trước</h3>
              </div>
              <div className="w-full aspect-video bg-[#0A0A0A] rounded-xl border border-white/5 relative overflow-hidden mb-4">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Live Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LucideIcons.Image className="w-8 h-8 text-white/10" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-lg z-10">
                  LIVE
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 shrink-0 flex items-center justify-center border border-purple-500/30">
                  <LucideIcons.User className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 flex flex-col">
                  {title ? (
                    <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                      {title}
                    </h4>
                  ) : (
                    <div className="h-3 bg-white/10 rounded w-3/4 mb-1.5 mt-1"></div>
                  )}
                  <span className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    Kênh của bạn{" "}
                    <LucideIcons.CheckCircle2 className="w-3 h-3 text-gray-500" />
                  </span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LucideIcons.Lightbulb className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">
                  Mẹo để có livestream thành công
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Tiêu đề hấp dẫn và mô tả rõ ràng",
                  "Chọn hình thu nhỏ chất lượng cao",
                  "Kiểm tra kết nối internet ổn định",
                  "Tương tác với khán giả thường xuyên",
                ].map((tip, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                      <LucideIcons.Check className="w-2.5 h-2.5 text-pink-400" />
                    </div>
                    <span className="text-[11px] text-gray-400">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE LIVESTREAM DASHBOARD ──
  return (
    <div className="p-4 md:p-6">
      {/* Stats Bar */}
      <div className="px-5 py-4 mb-5 flex items-center gap-0 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[120px]">
          <LucideIcons.Signal className="w-5 h-5 text-gray-500 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Trạng thái</p>
            <p
              className={`text-base font-bold leading-tight ${isLive ? "text-red-400" : "text-white"}`}
            >
              {isLive ? "Đang LIVE" : "Offline"}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {isLive ? "Đang phát trực tiếp" : "Chưa phát trực tiếp"}
            </p>
          </div>
        </div>
        <div className="w-px h-10 bg-white/5 mx-4 hidden md:block"></div>
        <div className="flex items-center gap-3 flex-1 min-w-[130px]">
          <LucideIcons.Clock className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Thời lượng</p>
            <p className="text-base font-bold text-white leading-tight font-mono">
              {formatTime(streamTime)}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Sẽ bắt đầu khi bạn phát
            </p>
          </div>
        </div>
        <div className="w-px h-10 bg-white/5 mx-4 hidden md:block"></div>
        <div className="flex items-center gap-3 flex-1 min-w-[130px]">
          <LucideIcons.Users className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">
              Người xem đồng thời
            </p>
            <p className="text-base font-bold text-white leading-tight">
              {livestream?.currentViewers || 0}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">Tối đa hiện tại</p>
          </div>
        </div>
        <div className="w-px h-10 bg-white/5 mx-4 hidden md:block"></div>
        <div className="flex items-center gap-3 flex-1 min-w-[100px]">
          <LucideIcons.Heart className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Lượt thích</p>
            <p className="text-base font-bold text-white leading-tight">
              {livestream?.likes || 0}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">Tổng lượt thích</p>
          </div>
        </div>
        <div className="w-px h-10 bg-white/5 mx-4 hidden md:block"></div>
        <div className="flex items-center gap-3 flex-1 min-w-[100px]">
          <LucideIcons.MessageSquare className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Tỷ lệ chat</p>
            <p className="text-base font-bold text-white leading-tight">0</p>
            <p className="text-[10px] text-gray-600 mt-0.5">tin nhắn/phút</p>
          </div>
        </div>
        <div className="w-px h-10 bg-white/5 mx-4 hidden lg:block"></div>
        <div className="ml-auto shrink-0">
          {!isLive ? (
            <button
              onClick={startScreenShare}
              className="flex flex-col items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white transition-all cursor-pointer min-w-[180px] shadow-lg shadow-red-600/20"
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <LucideIcons.Radio className="w-4 h-4" /> Bắt đầu phát trực tiếp
              </div>
              <span className="text-[10px] text-red-200 mt-0.5">
                Khi đã sẵn sàng
              </span>
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={togglePauseScreenShare}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border ${isPaused ? "bg-amber-600 border-amber-500 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20" : "bg-[#1a1a20] border-white/10 hover:bg-[#252530] text-gray-300"}`}
              >
                {isPaused ? (
                  <>
                    <LucideIcons.Play className="w-4 h-4" /> Tiếp tục phát
                  </>
                ) : (
                  <>
                    <LucideIcons.Pause className="w-4 h-4" /> Tạm dừng
                  </>
                )}
              </button>
              <button
                onClick={stopScreenShare}
                className="flex items-center gap-2 px-6 py-3 bg-red-900/40 border border-red-500/40 hover:bg-red-900/60 rounded-xl text-red-400 text-sm font-bold transition-all animate-pulse cursor-pointer"
              >
                <LucideIcons.Square className="w-4 h-4" /> Kết thúc livestream
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Video preview */}
          <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">
                Xem trước livestream
              </h3>
              <button className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer">
                <LucideIcons.RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>
            <div className="relative bg-[#080808]">
              {isLive && livestream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-contain"
                />
              ) : livestream && hasPlayableSource ? (
                <LivestreamPlayer
                  hlsUrl={
                    livestream.hlsUrl ||
                    livestream.vodUrl ||
                    livestream.streamUrl ||
                    livestream.playbackUrl ||
                    ""
                  }
                  poster={livestream.thumbnailUrl}
                />
              ) : (
                <div className="relative w-full aspect-video flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                    <LucideIcons.Radio className="w-8 h-8 text-white/15" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">
                    Chưa có tín hiệu
                  </p>
                  <p className="text-gray-600 text-xs text-center max-w-xs">
                    Vui lòng bắt đầu phát từ phần mềm OBS Studio.
                  </p>
                  <div className="absolute bottom-3 left-3 text-[10px] text-gray-600 bg-black/40 border border-white/5 px-2 py-0.5 rounded">
                    16:9
                  </div>
                </div>
              )}
              {isLive && (
                <div
                  className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg ${isPaused ? "bg-amber-600" : "bg-red-600"}`}
                >
                  {isPaused ? (
                    <LucideIcons.Pause className="w-3 h-3" />
                  ) : (
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block"></span>
                  )}
                  {isPaused ? "ĐÃ TẠM DỪNG" : "LIVE"} · {formatTime(streamTime)}
                </div>
              )}
            </div>
          </div>

          {/* OBS Connection Info */}
          <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Thông tin kết nối (Dùng cho OBS Studio)
              </h3>
              <a
                href="#"
                className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Hướng dẫn kết nối{" "}
                <LucideIcons.ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] text-gray-500 mb-2">
                  Máy chủ (RTMP URL)
                </label>
                <div className="flex items-center gap-2 bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-white text-xs font-mono truncate">
                    rtmp://localhost:1935/live
                  </span>
                  <button
                    onClick={() => handleCopy("rtmp://localhost:1935/live")}
                    className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0 p-1 rounded hover:bg-white/5"
                  >
                    <LucideIcons.Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-2">
                  Khóa luồng (Stream Key)
                </label>
                <div className="flex items-center gap-2 bg-[#0F0F0F] border border-white/10 rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-white text-xs font-mono truncate">
                    {showStreamKey
                      ? livestream?.streamKey || "—"
                      : "•".repeat(16)}
                  </span>
                  <button
                    onClick={() => setShowStreamKey((v) => !v)}
                    className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0 p-1 rounded hover:bg-white/5"
                  >
                    {showStreamKey ? (
                      <LucideIcons.EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <LucideIcons.Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy(livestream?.streamKey)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${copied ? "bg-green-500/20 text-green-400" : "bg-white/5 hover:bg-white/10 text-gray-300"}`}
                  >
                    {copied ? "Đã sao!" : "Sao chép"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-2.5">
              <LucideIcons.AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-300/70 leading-relaxed">
                Giữ bí mật khóa luồng của bạn. Bất kỳ ai có khóa này đều có thể
                phát trực tiếp lên kênh của bạn.
              </p>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-[#141418] rounded-2xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">
              Hình thu nhỏ (Thumbnail)
            </h3>
            <div className="flex gap-4">
              <div className="relative group flex-1 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-[#0F0F0F] transition-all overflow-hidden h-[120px] flex flex-col items-center justify-center cursor-pointer gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                <LucideIcons.UploadCloud className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors" />
                <p className="text-xs text-gray-500 text-center px-3">
                  Tải lên hình thu nhỏ tùy chỉnh
                </p>
                <p className="text-[9px] text-gray-600 text-center px-3">
                  Định dạng: JPG, PNG — Kích thước đề xuất: 1280x720px (16:9) —
                  Dưới 2MB
                </p>
              </div>
              <div className="flex gap-3">
                {thumbnailPreview ? (
                  <div className="h-[120px] aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0 relative">
                    <img
                      src={thumbnailPreview}
                      alt="Custom thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded">
                      Tùy chỉnh
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-[120px] aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0 bg-gradient-to-br from-blue-900/60 to-indigo-900/60 flex items-center justify-center relative">
                      <LucideIcons.Image className="w-6 h-6 text-white/20" />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded">
                        Ví dụ
                      </div>
                    </div>
                    <div className="h-[120px] aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0 bg-gradient-to-br from-purple-900/60 to-pink-900/60 flex items-center justify-center relative">
                      <LucideIcons.Image className="w-6 h-6 text-white/20" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Chat */}
        <div className="flex flex-col h-full">
          <div className="flex flex-col overflow-hidden bg-[#141418] border border-white/5 rounded-2xl h-[600px]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Chat trực tiếp
                </h3>
                <LucideIcons.ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <button className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                <LucideIcons.MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#0F0F0F]">
              {livestream && livestream.id ? (
                <LivestreamChat
                  livestreamId={livestream.id}
                  apiBaseUrl={apiBase}
                  userId={localStorage.getItem("userId")}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <LucideIcons.MessageSquare className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-gray-500 text-sm">Chưa có tin nhắn nào</p>
                  <p className="text-gray-600 text-xs text-center px-8">
                    Bắt đầu phát trực tiếp để nhận tin nhắn từ khán giả
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioLive;

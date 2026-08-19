import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  Bell,
  CheckCircle2,
  Share2,
  Search,
  Users,
  Link as LinkIcon,
  X,
  Mail,
  MonitorPlay,
  Globe,
  Info,
  PlaySquare,
  TrendingUp,
  Flag,
  Pencil,
  Home,
  Upload,
  Check,
  UploadCloud,
  ChevronDown,
  Settings,
  Clock,
  FileVideo,
  HardDrive,
  FileCode,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Smartphone,
  Gift,
  Wallet,
  Star,
  Activity,
  Heart,
  Coffee,
  Crown
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import VideoCard from "../../../components/home/VideoCard";
import CustomizeChannelModal from "../../../components/channel/CustomizeChannelModal";

const formatStreamDuration = (start, end) => {
  if (!start || !end) return "";
  const s = Math.floor((new Date(end) - new Date(start)) / 1000);
  if (s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

function UploadVideoForm({
  onUploadSuccess,
  channel,
  editingVideo,
  onCancelEdit,
  isShortType,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isShortVideo, setIsShortVideo] = useState(isShortType || false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    axios
      .get("/api/videos/categories")
      .then((res) => setCategories(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editingVideo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingVideo]);

  const formatDurationStr = (s) => {
    if (!s) return "00:00";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Vui lòng chọn file video hợp lệ.");
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      const videoElement = document.createElement("video");
      videoElement.src = url;
      videoElement.onloadedmetadata = () => {
        setDuration(Math.round(videoElement.duration));
      };
      setError("");
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh hợp lệ.");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!title) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!editingVideo && (!videoFile || !thumbnailFile)) {
      setError("Vui lòng chọn video và ảnh bìa.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMsg("");

    try {
      let uploadedThumbUrl = "";
      if (thumbnailFile) {
        const thumbFormData = new FormData();
        thumbFormData.append("file", thumbnailFile);
        const thumbRes = await axios.post("/api/upload/image", thumbFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedThumbUrl = thumbRes.data.url;
      }

      let uploadedVideoUrl = "";
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append("file", videoFile);
        const videoRes = await axios.post("/api/upload/video", videoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedVideoUrl = videoRes.data.url;
      }

      const token = localStorage.getItem("token");
      if (editingVideo) {
        await axios.put(
          `/api/videos/${editingVideo.id}`,
          {
            title,
            description,
            visibility,
            thumbnailUrl: uploadedThumbUrl,
            videoUrl: uploadedVideoUrl,
            duration: duration,
            categoryId: categoryId ? parseInt(categoryId) : null,
            isShort: isShortVideo,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSuccessMsg("Đã cập nhật video thành công!");
        if (onCancelEdit) onCancelEdit();
      } else {
        await axios.post(
          "/api/videos",
          {
            title,
            description,
            visibility,
            thumbnailUrl: uploadedThumbUrl,
            videoUrl: uploadedVideoUrl,
            duration: duration,
            categoryId: categoryId ? parseInt(categoryId) : null,
            isShort: isShortVideo,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSuccessMsg("Đã tải video lên thành công!");
        setTitle("");
        setDescription("");
        setVisibility("Public");
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setVideoFile(null);
        setVideoPreview(null);
        setDuration(0);
        setCategoryId("");
      }

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tải video lên.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col xl:flex-row gap-8 relative">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/60 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-[#FF4E00] animate-spin mb-4" />
          <p className="text-white font-medium text-lg">
            Đang xử lý tải lên...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Vui lòng không đóng trang này
          </p>
        </div>
      )}

      {/* Left side: Form */}
      <div className="flex-1 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white mb-2">
          {editingVideo ? "Cập nhật video" : "Tải video lên"}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-2 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {/* Tiêu đề */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Tiêu đề *
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 100))}
              placeholder="Nhập tiêu đề video của bạn"
              className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4E00]"
            />
            <span className="absolute right-3 top-3 text-gray-500 text-xs">
              {title.length}/100
            </span>
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Mô tả
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.substring(0, 5000))
              }
              placeholder="Giới thiệu nội dung video của bạn với người xem..."
              rows="4"
              className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4E00] resize-none"
            ></textarea>
            <span className="absolute right-3 bottom-3 text-gray-500 text-xs">
              {description.length}/5000
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Danh mục */}
          <div className="flex-1">
            <label className="block text-white text-sm font-medium mb-2">
              Danh mục
            </label>
            <div className="relative">
              <div
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {categoryId
                        ? categories.find((c) => c.id === categoryId)?.name ||
                          "Chọn danh mục"
                        : "Chọn danh mục"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#212121] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setCategoryId("");
                      setShowCategoryDropdown(false);
                    }}
                    className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"
                  >
                    <p className="text-gray-400 text-sm font-medium">
                      Không chọn danh mục
                    </p>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setCategoryId(cat.id);
                        setShowCategoryDropdown(false);
                      }}
                      className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          {cat.name}
                        </p>
                      </div>
                      {categoryId === cat.id && (
                        <Check className="w-4 h-4 text-[#FF4E00] ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ảnh thu nhỏ */}
          <div className="flex-1">
            <label className="block text-white text-sm font-medium mb-1">
              Ảnh thu nhỏ {editingVideo ? "" : "*"}
            </label>
            <p
              className="text-gray-400 text-xs mb-3 line-clamp-1"
              title={
                editingVideo
                  ? "Chọn ảnh mới nếu bạn muốn thay thế ảnh hiện tại."
                  : "Chọn hoặc tải lên ảnh đại diện cho video của bạn."
              }
            >
              {editingVideo
                ? "Chọn ảnh mới để thay thế ảnh hiện tại."
                : "Tải lên ảnh đại diện cho video của bạn."}
            </p>
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className="hidden"
              onChange={handleImageSelect}
            />
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-32 h-20 border border-dashed border-white/20 rounded-lg bg-[#121212] hover:bg-white/5 shrink-0 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-white text-xs font-medium">
                  Tải ảnh lên
                </span>
                <span className="text-gray-500 text-[9px]">JPG, PNG</span>
              </button>

              {thumbnailPreview && (
                <div className="relative w-32 h-20 rounded-lg border-2 border-[#FF4E00] overflow-hidden shrink-0">
                  <img
                    src={thumbnailPreview}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-[#FF4E00] rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Video {editingVideo ? "" : "*"}
          </label>
          <p className="text-gray-400 text-xs mb-3">
            Tải lên video của bạn.{" "}
            {editingVideo
              ? "Chỉ chọn nếu bạn muốn thay thế video hiện tại."
              : "Định dạng hỗ trợ: MP4, MOV, AVI, WMV, FLV, WebM. Kích thước tối đa: 10GB."}
          </p>
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleVideoSelect}
          />

          <div
            onClick={() => !videoFile && fileInputRef.current?.click()}
            className={`border border-dashed ${videoFile ? "border-[#FF4E00] bg-[#FF4E00]/5" : "border-white/20 bg-[#121212] hover:bg-white/5"} rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer transition-colors`}
          >
            {videoFile ? (
              <>
                <FileVideo className="w-10 h-10 text-[#FF4E00] mb-3" />
                <p className="text-white text-sm font-medium mb-1">
                  {videoFile.name}
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Chọn file khác
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-white text-sm font-medium mb-1">
                  Kéo và thả video vào đây
                </p>
                <p className="text-gray-500 text-xs mb-4">hoặc</p>
                <button className="bg-[#FF4E00] hover:bg-[#ff6a2b] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  Chọn file để tải lên
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">
            Trạng thái hiển thị *
          </label>
          <p className="text-gray-400 text-xs mb-3">
            Chọn ai có thể xem video này
          </p>
          <div className="relative">
            <div
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className="w-full md:w-[60%] bg-[#121212] border border-white/10 rounded-lg p-3 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm font-medium">
                    {visibility === "Public"
                      ? "Công khai"
                      : "Dành cho hội viên"}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {visibility === "Public"
                      ? "Mọi người đều có thể xem video này"
                      : "Chỉ hội viên kênh mới có thể xem"}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>

            {showVisibilityDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[60%] bg-[#212121] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                <div
                  onClick={() => {
                    setVisibility("Public");
                    setShowVisibilityDropdown(false);
                  }}
                  className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"
                >
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Công khai</p>
                    <p className="text-gray-500 text-[10px]">
                      Mọi người đều có thể xem
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setVisibility("Private");
                    setShowVisibilityDropdown(false);
                  }}
                  className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      Dành cho hội viên
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      Chỉ hội viên mới có thể xem
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loại Video */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isShortVideoCheck"
            checked={isShortVideo}
            onChange={(e) => setIsShortVideo(e.target.checked)}
            className="w-4 h-4 accent-[#FF4E00] cursor-pointer"
          />
          <label
            htmlFor="isShortVideoCheck"
            className="text-gray-300 text-sm font-medium cursor-pointer select-none"
          >
            Đánh dấu là Video ngắn (Shorts)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              setTitle("");
              setDescription("");
              setVisibility("Public");
              setThumbnailFile(null);
              setThumbnailPreview(null);
              setVideoFile(null);
              setVideoPreview(null);
              setDuration(0);
              setError("");
              setSuccessMsg("");
              if (onCancelEdit) onCancelEdit();
            }}
            className="px-8 py-2 rounded-lg bg-[#2A2A2A] text-white text-sm font-medium hover:bg-[#333] cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`px-8 py-2 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer ${isUploading ? "bg-[#FF4E00]/50" : "bg-[#FF4E00] hover:bg-[#ff6a2b]"}`}
          >
            {editingVideo ? "Lưu thay đổi" : "Tiếp tục"}
          </button>
        </div>
      </div>

      {/* Right side: Preview */}
      <div className="w-full xl:w-[400px] shrink-0">
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5 sticky top-24">
          <h3 className="text-white text-sm font-bold mb-4">Xem trước video</h3>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 group border border-white/5">
            {videoPreview ? (
              <video
                src={videoPreview}
                className="w-full h-full object-cover"
                controls
              />
            ) : thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                <PlaySquare className="w-12 h-12 text-gray-600 mb-2" />
                <p className="text-gray-500 text-xs">Chưa có video/ảnh</p>
              </div>
            )}
          </div>

          <h4 className="text-white font-bold text-base mb-2 break-words">
            {title || "Tiêu đề video"}
          </h4>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <img
              src={channel?.avatarUrl || "https://via.placeholder.com/24"}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-white font-medium">
              {channel?.channelName || "Bạn"}
            </span>
            <span>•</span>
            <span>
              {visibility === "Public" ? "Công khai" : "Dành cho hội viên"}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            0 lượt xem • Vừa xong
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 border-b border-white/10 pb-6 break-words line-clamp-3">
            {description || "Chưa có mô tả nào."}
          </p>

          <div className="space-y-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Trạng thái
              </span>
              <span className="text-green-500">
                {visibility === "Public" ? "Công khai" : "Dành cho hội viên"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Độ dài
              </span>
              <span className="text-white">{formatDurationStr(duration)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <FileVideo className="w-4 h-4" /> Định dạng
              </span>
              <span className="text-white">
                {videoFile ? videoFile.type.split("/")[1]?.toUpperCase() : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Kích thước
              </span>
              <span className="text-white">
                {videoFile
                  ? (videoFile.size / (1024 * 1024)).toFixed(2) + " MB"
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <FileCode className="w-4 h-4" /> Tệp video
              </span>
              <span className="text-white truncate max-w-[150px]">
                {videoFile ? videoFile.name : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Tệp ảnh thu nhỏ
              </span>
              <span className="text-white truncate max-w-[150px]">
                {thumbnailFile ? thumbnailFile.name : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteVideoModal({ video, onClose, onSuccess }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/videos/${video.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa video.");
      setIsDeleting(false);
    }
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#212121] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Xóa video này?
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              Bạn đang chuẩn bị xóa video:
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-2 rounded-lg">
          <div className="w-24 h-14 rounded overflow-hidden shrink-0 bg-black/50">
            <img
              src={
                video.thumbnailUrl ||
                "https://via.placeholder.com/600x400?text=No+Thumbnail"
              }
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
          <strong className="text-white text-sm line-clamp-2 mt-1">
            {video.title}
          </strong>
        </div>
        <br />

        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-400">
                <li>Video sẽ bị xóa vĩnh viễn khỏi nền tảng.</li>
                <li>Toàn bộ lượt xem, lượt thích và bình luận sẽ bị mất.</li>
                <li>Hành động này không thể hoàn tác!</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="confirmDelete"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-red-600 cursor-pointer shrink-0"
          />
          <label
            htmlFor="confirmDelete"
            className="text-gray-300 text-sm cursor-pointer select-none"
          >
            Tôi đã hiểu rằng hành động này không thể hoàn tác và xác nhận xóa
            video.
          </label>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LivestreamsTab Component
// ─────────────────────────────────────────────────────────────────────────────
function LivestreamsTab({ channelId }) {
  const [livestreams, setLivestreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    (async () => {
      try {
        const res = await axios.get(`/api/livestreams/channel/${channelId}`);
        const all = Array.isArray(res.data) ? res.data : res.data?.items || [];
        // Sort: live first, then ended by date
        const sorted = [...all].sort((a, b) => {
          if (a.status === "live" && b.status !== "live") return -1;
          if (a.status !== "live" && b.status === "live") return 1;
          return (
            new Date(b.actualStartTime || b.scheduledStartTime || 0) -
            new Date(a.actualStartTime || a.scheduledStartTime || 0)
          );
        });
        setLivestreams(sorted);
      } catch (err) {
        console.error("Failed to fetch livestreams", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#FF4E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (livestreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <MonitorPlay className="w-16 h-16 text-white/10" />
        <p className="text-white/40 text-lg">
          Kênh chưa có buổi phát trực tiếp nào.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {livestreams.map((ls) => (
        <Link
          key={ls.id}
          to={`/live/${ls.id}`}
          className="group bg-[#141414] border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-black overflow-hidden">
            {ls.thumbnailUrl ? (
              <img
                src={ls.thumbnailUrl}
                alt={ls.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-black">
                <MonitorPlay className="w-12 h-12 text-white/20" />
              </div>
            )}
            {/* Status badge */}
            <div className="absolute top-2 left-2">
              {ls.status === "live" ? (
                <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              ) : ls.vodUrl ? (
                <span className="bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                  📼 VOD
                </span>
              ) : (
                <span className="bg-black/70 text-white/60 text-[10px] font-semibold px-2 py-1 rounded-full">
                  Đã kết thúc
                </span>
              )}
            </div>
            {/* Viewer count */}
            {ls.status === "live" && ls.currentViewers > 0 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">
                👁 {ls.currentViewers.toLocaleString()}
              </div>
            )}
            {/* Duration for VOD */}
            {ls.status !== "live" &&
              ls.vodUrl &&
              ls.actualStartTime &&
              ls.endTime && (
                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-white text-[10px] font-medium">
                  {formatStreamDuration(ls.actualStartTime, ls.endTime)}
                </div>
              )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1 group-hover:text-[#FF4E00] transition-colors">
              {ls.title || "Livestream không có tiêu đề"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {ls.totalViews > 0 && (
                <span>{ls.totalViews.toLocaleString()} lượt xem</span>
              )}
              {ls.actualStartTime && (
                <>
                  {ls.totalViews > 0 && <span>•</span>}
                  <span>
                    {new Date(ls.actualStartTime).toLocaleDateString("vi-VN")}
                  </span>
                </>
              )}
            </div>
            {ls.tags && (
              <p className="text-xs text-gray-500 mt-1 truncate">{ls.tags}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function ChannelProfile() {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const { handle } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescContent, setEditDescContent] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameContent, setEditNameContent] = useState("");

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailContent, setEditEmailContent] = useState("");

  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [editCountryContent, setEditCountryContent] = useState("");

  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [editLinksContent, setEditLinksContent] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueStats, setRevenueStats] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [coinReceivedDateFilter, setCoinReceivedDateFilter] = useState("");
  const [coinSpentDateFilter, setCoinSpentDateFilter] = useState("");

  const [membershipStatus, setMembershipStatus] = useState({ isMember: false });

  // Đọc settings bật/tắt button từ localStorage
  const [channelBtnSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("userSettings");
      return saved
        ? JSON.parse(saved)
        : { showJoinButton: true, showCommunityButton: true };
    } catch {
      return { showJoinButton: true, showCommunityButton: true };
    }
  });

  const isOwner = channel && localStorage.getItem("handle") === channel.handle;

  const checkSubscription = useCallback(async (channelId, token) => {
    try {
      const res = await axios.get("/api/channels/subscribed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSubscribed(res.data.some((c) => c.id === channelId));
    } catch (err) {
      console.error("Lỗi kiểm tra đăng ký:", err);
    }
  }, []);

  const checkMembership = useCallback(async (channelId, token) => {
    try {
      const res = await axios.get(`/api/channels/${channelId}/membership`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setMembershipStatus(res.data);
      }
    } catch (err) {
      console.error("Lỗi kiểm tra hội viên:", err);
    }
  }, []);

  const fetchChannelData = useCallback(
    async (targetHandle) => {
      setLoading(true);
      setError("");
      try {
        const profileRes = await axios.get(`/api/channels/${targetHandle}`);
        const channelData = profileRes.data;
        if (channelData && channelData.id) {
          if (channelData.socialLinks) {
            try {
              channelData.links = JSON.parse(channelData.socialLinks);
            } catch {
              channelData.links = [];
            }
          } else {
            channelData.links = [];
          }
        }
        setChannel(channelData);

        const token = localStorage.getItem("token");
        if (token && channelData && channelData.id) {
          checkSubscription(channelData.id, token);
          checkMembership(channelData.id, token);
        }

        if (channelData && channelData.id) {
          const [videosRes, playlistsRes] = await Promise.all([
            axios.get(`/api/channels/${channelData.id}/videos`),
            axios.get(`/api/playlists/channel/${channelData.id}`),
          ]).catch((err) => {
            console.error("Lỗi khi tải videos/playlists", err);
            return [{ data: [] }, { data: [] }];
          });

          setVideos(videosRes.data || []);
          setPlaylists(playlistsRes.data || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Không thể tải thông tin kênh.",
        );
      } finally {
        setLoading(false);
      }
    },
    [checkMembership, checkSubscription],
  );

  useEffect(() => {
    if (!handle) return;

    const loadChannel = async () => {
      await fetchChannelData(handle);
    };

    void loadChannel();
  }, [handle, fetchChannelData]);

  useEffect(() => {
    if (activeTab === "revenue" && isOwner && !revenueStats) {
      const fetchRevenue = async () => {
        try {
          setLoadingRevenue(true);
          const token = localStorage.getItem("token");
          if (token && channel && channel.id) {
            const res = await axios.get(`/api/channels/${channel.id}/revenue-stats`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setRevenueStats(res.data);
          }
        } catch (err) {
          console.error("Lỗi khi tải doanh thu", err.response?.data || err.message);
        } finally {
          setLoadingRevenue(false);
        }
      };
      fetchRevenue();
    }
  }, [activeTab, isOwner, revenueStats, channel]);

  const handleSaveSuccess = (newHandle) => {
    if (newHandle !== handle) {
      // If handle changed, redirect to new handle URL
      window.location.href = `/c/${newHandle}`;
    } else {
      // Otherwise just refetch data
      fetchChannelData(handle);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000)
      return (
        (views / 1000000)
          .toFixed(2)
          .replace(/\.?0+$/, "")
          .replace(".", ",") + " Tr"
      );
    if (views >= 1000)
      return (
        (views / 1000)
          .toFixed(2)
          .replace(/\.?0+$/, "")
          .replace(".", ",") + " N"
      );
    return views.toString();
  };

  const groupHistoryByDate = (historyArray) => {
    if (!historyArray || !Array.isArray(historyArray)) return {};
    return historyArray.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateString = date.toLocaleDateString('vi-VN');
      if (date.toDateString() === today.toDateString()) {
        dateString = 'Hôm nay';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateString = 'Hôm qua';
      }
      
      if (!acc[dateString]) acc[dateString] = [];
      acc[dateString].push(item);
      return acc;
    }, {});
  };

  const filterByDate = (historyArray, dateString) => {
    if (!dateString || !historyArray) return historyArray;
    return historyArray.filter(item => {
      const itemDate = new Date(item.createdAt);
      const year = itemDate.getFullYear();
      const month = String(itemDate.getMonth() + 1).padStart(2, '0');
      const day = String(itemDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}` === dateString;
    });
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

  const handleSaveProfile = async (field, value, setIsEditing) => {
    try {
      setIsSavingProfile(true);
      const updatedData = {
        channelName: field === "channelName" ? value : channel.channelName,
        handle: field === "handle" ? value : channel.handle,
        description: field === "description" ? value : channel.description,
        contactEmail: field === "contactEmail" ? value : channel.contactEmail,
        country: field === "country" ? value : channel.country,
        bannerUrl: channel.bannerUrl,
        avatarUrl: channel.avatarUrl,
        socialLinks:
          field === "links"
            ? JSON.stringify(value)
            : channel.socialLinks || null,
      };

      await axios.put(`/api/channels/${channel.id}`, updatedData);

      setChannel({
        ...channel,
        [field]: value,
        socialLinks: updatedData.socialLinks,
      });
      setIsEditing(false);

      if (field === "handle" && value !== handle) {
        localStorage.setItem("handle", value);
        window.location.href = `/c/${value}`;
      }
    } catch (err) {
      console.error(`Lỗi khi lưu ${field}`, err);
      alert(err.response?.data?.message || "Không thể lưu, vui lòng thử lại");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Lỗi 404</h2>
          <p className="text-gray-400">{error || "Kênh không tồn tại"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] pb-20">
      {/* Banner Area (Contains Avatar, Info, Stats, and Tabs) */}
      <div className="w-full relative min-h-[400px] md:min-h-[450px] flex flex-col justify-end overflow-hidden border-b border-white/10">
        {/* Background Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={channel.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-0 flex flex-col">
          {/* Top Section: Info + Stats */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 w-full">
            {/* Left: Avatar & Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full lg:w-auto">
              {/* Avatar */}
              <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden border-2 border-[#FF4E00] shadow-[0_0_15px_rgba(255,78,0,0.5)] shrink-0 bg-[#1A1A1A]">
                <img
                  src={channel.avatarUrl}
                  alt={channel.channelName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col items-start gap-1">
                {/* Name */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight flex items-center gap-2">
                  {channel.channelName}
                  {channel.subscriberCount > 10000 && (
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white fill-white/20" />
                  )}
                </h1>

                {/* Handle & stats */}
                <div className="flex flex-wrap items-center text-gray-300 text-sm mb-1 mt-1">
                  <span className="font-medium mr-1">{channel.handle}</span>
                  <span className="mx-1.5">•</span>
                  <span>
                    {formatViews(channel.subscriberCount)} người đăng ký
                  </span>
                  <span className="mx-1.5">•</span>
                  <span>{videos.length} video</span>
                </div>

                {/* Description */}
                <div
                  onClick={() => setIsAboutModalOpen(true)}
                  className="text-gray-400 text-xs md:text-sm mb-1 max-w-[500px] flex flex-wrap items-end group cursor-pointer"
                >
                  <p className="line-clamp-2 leading-relaxed">
                    {channel.description || "Chào các bạn !!!"}
                  </p>
                  <span className="text-white font-medium ml-1 whitespace-nowrap">
                    ...xem thêm
                  </span>
                </div>

                {/* Links */}
                {channel.links && channel.links.length > 0 && (
                  <div className="flex items-center flex-wrap gap-4 mt-2 mb-3">
                    {channel.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={
                          link.url.startsWith("http")
                            ? link.url
                            : `https://${link.url}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3EA6FF] text-xs md:text-sm font-medium hover:underline flex items-center gap-1.5 bg-[#1A1A1A]/40 px-3 py-1.5 rounded-full border border-white/5"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        {link.title ||
                          link.url
                            .replace(/^https?:\/\//, "")
                            .replace(/^www\./, "")
                            .split("/")[0]}
                      </a>
                    ))}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center flex-wrap gap-3">
                  {isOwner ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-5 py-2 rounded-full font-semibold text-sm text-white bg-[#FF4E00] hover:bg-[#FF4E00]/90 transition-colors"
                    >
                      Tùy chỉnh kênh
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`px-5 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 ${
                        isSubscribed
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-[#FF4E00] text-white hover:bg-[#FF4E00]/90"
                      }`}
                    >
                      {isSubscribed && <Bell className="w-4 h-4" />}
                      {isSubscribed ? "Đã đăng ký" : "Đăng ký"}
                    </button>
                  )}

                  {channelBtnSettings.showJoinButton && (
                    <button
                      onClick={() =>
                        navigate(`/c/${channel.handle}/membership`)
                      }
                      className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${isOwner || membershipStatus.isMember ? "bg-gradient-to-r from-[#9C27B0] to-[#E91E63] text-white shadow-[0_0_10px_rgba(156,39,176,0.5)]" : "text-white bg-white/10 hover:bg-white/20"}`}
                    >
                      {isOwner
                        ? "Danh sách hội viên"
                        : membershipStatus.isMember
                          ? "Quyền lợi hội viên"
                          : "Hội viên"}
                    </button>
                  )}
                  {channelBtnSettings.showCommunityButton && (
                    <button className="px-5 py-2 rounded-full font-semibold text-sm text-white bg-white/10 hover:bg-white/20 transition-colors">
                      Cộng đồng
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stats Card */}
            <div className="bg-[#1a1a1a]/10 backdrop-blur-md border border-white/8 rounded-2xl p-5 lg:p-4 flex items-center justify-between gap-4 md:gap-8 shadow-2xl shrink-0 lg:ml-4 w-full lg:w-auto overflow-x-auto mt-4 lg:mt-0">
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[75px]">
                <span className="text-white font-bold text-xl md:text-2xl">
                  {videos.length}
                </span>
                <span className="text-gray-400 text-xs mt-1">Video</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[75px]">
                <span className="text-white font-bold text-xl md:text-2xl">
                  {formatViews(channel.subscriberCount)}
                </span>
                <span className="text-gray-400 text-xs text-center mt-1">
                  Người đăng ký
                </span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[75px]">
                <span className="text-white font-bold text-xl md:text-2xl">
                  {formatViews(
                    videos.reduce((sum, v) => sum + (v.viewsCount || 0), 0),
                  )}
                </span>
                <span className="text-gray-400 text-xs mt-1">Lượt xem</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] md:min-w-[75px]">
                <span className="text-white font-bold text-xl md:text-2xl">
                  {playlists.length}
                </span>
                <span className="text-gray-400 text-xs text-center mt-1">
                  Danh sách phát
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide w-full md:w-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "overview" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" /> Trang chủ
              </button>
              <button
                onClick={() => setActiveTab("videos")}
                className={`pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "videos" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                Video
              </button>
              <button
                onClick={() => setActiveTab("shorts")}
                className={`pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "shorts" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                Video ngắn
              </button>
              <button
                onClick={() => setActiveTab("livestreams")}
                className={`flex items-center gap-1.5 pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "livestreams" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                <MonitorPlay className="w-4 h-4" />
                Phát trực tiếp
              </button>
              <button
                onClick={() => setActiveTab("playlists")}
                className={`pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "playlists" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                Danh sách phát
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "about" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
              >
                Giới thiệu
              </button>
              {isOwner && (
                <button
                  onClick={() => setActiveTab("revenue")}
                  className={`flex items-center gap-1.5 pb-3 whitespace-nowrap transition-colors text-sm md:text-base font-semibold ${activeTab === "revenue" ? "text-[#FF4E00] border-b-[3px] border-[#FF4E00]" : "text-gray-400 hover:text-white"}`}
                >
                  <TrendingUp className="w-4 h-4" /> Doanh thu
                </button>
              )}
            </div>
            <div className="hidden md:flex ml-auto relative w-48 lg:w-64 pb-3">
              <input
                type="text"
                placeholder="Tìm kiếm video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-white text-sm px-4 py-2 pl-10 border-b border-white/10 focus:outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-2 md:px-2 mt-2">
        {/* Tab Content */}
        {(() => {
          if (activeTab === "overview") {
            const normalVideos = videos.filter((v) => !v.isShort);
            const shortVideos = videos.filter((v) => v.isShort);

            const featuredVideo =
              normalVideos.length > 0 ? normalVideos[0] : null;
            const featuredList = normalVideos.slice(1, 4);
            const latestVideos = normalVideos.slice(4, 12);

            return (
              <div className="space-y-12">
                {/* 1. Nổi bật */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                  {/* Left side: Featured Video */}
                  {featuredVideo ? (
                    <Link
                      to={
                        featuredVideo.isShort
                          ? `/shorts?id=${featuredVideo.id}`
                          : `/watch/${featuredVideo.id}`
                      }
                      className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-4 group cursor-pointer flex flex-col md:flex-row gap-5 h-full"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative w-full md:w-[45%] lg:w-[50%] aspect-video bg-black rounded-xl overflow-hidden shrink-0">
                        <img
                          src={
                            featuredVideo.thumbnailUrl ||
                            "https://via.placeholder.com/1280x720"
                          }
                          alt={featuredVideo.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Play Button */}
                        <div className="absolute bottom-2 left-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
                          <div className="w-0 h-0 border-t-[4.5px] border-t-transparent border-l-[7px] border-l-white border-b-[4.5px] border-b-transparent ml-0.5"></div>
                        </div>

                        {/* Duration */}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white rounded">
                          {formatDuration(featuredVideo.duration)}
                        </div>
                      </div>

                      {/* Content Container - Đã sửa lỗi: Xếp liền mạch và căn giữa toàn bộ khối */}
                      <div className="flex flex-col flex-1 py-2 justify-center">
                        <h3 className="text-[18px] font-bold text-white mb-2 line-clamp-2 leading-snug">
                          {featuredVideo.title}
                        </h3>

                        <div className="flex items-center text-[13px] text-gray-400 mb-3 gap-1.5">
                          <span>{featuredVideo.channelName}</span>
                          <span>•</span>
                          <span>
                            {formatViews(featuredVideo.viewsCount)} lượt xem
                          </span>
                          <span>•</span>
                          <span>{getTimeAgo(featuredVideo.createdAt)}</span>
                        </div>

                        <p className="text-[14px] text-gray-400 line-clamp-2 mb-5 leading-relaxed">
                          {featuredVideo.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#FF4E00] px-3 py-1 text-[12px] font-medium rounded-full">
                            #NodeJS
                          </span>
                          <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 px-3 py-1 text-[12px] font-medium rounded-full">
                            #JavaScript
                          </span>
                          <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 px-3 py-1 text-[12px] font-medium rounded-full">
                            #Setup
                          </span>
                        </div>

                        {/* Carousel Dots */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-1.5 rounded-full bg-[#FF4E00]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#333333]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#333333]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#333333]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#333333]"></div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl flex items-center justify-center p-12 text-gray-500 h-full">
                      Chưa có video nổi bật
                    </div>
                  )}

                  {/* Right side: Featured List */}
                  <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2 text-white font-bold mb-5 text-[16px]">
                      <span className="text-[#FF4E00] font-black text-lg">
                        {"<"}
                      </span>{" "}
                      Nổi bật
                    </div>

                    <div className="space-y-4 flex-1">
                      {featuredList.map((v) => (
                        <Link
                          to={
                            v.isShort ? `/shorts?id=${v.id}` : `/watch/${v.id}`
                          }
                          key={v.id}
                          className="flex gap-3 group cursor-pointer items-center"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0">
                            <img
                              src={
                                v.thumbnailUrl ||
                                "https://via.placeholder.com/600x400"
                              }
                              alt={v.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white rounded">
                              {formatDuration(v.duration)}
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-[13px] font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                            {v.title}
                          </h4>
                        </Link>
                      ))}
                      {featuredList.length === 0 && (
                        <div className="text-sm text-gray-500">
                          Chưa có video
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Video mới nhất */}
                {latestVideos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-white font-bold text-xl">
                        <span className="text-xl">🔥</span> Video mới nhất
                      </div>
                      <button
                        onClick={() => setActiveTab("videos")}
                        className="text-sm text-gray-400 hover:text-white flex items-center transition-colors"
                      >
                        Xem tất cả {">"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {latestVideos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={{
                            id: video.id,
                            title: video.title,
                            thumbnail:
                              video.thumbnailUrl ||
                              "https://via.placeholder.com/600x400?text=No+Thumbnail",
                            duration: formatDuration(video.duration),
                            avatar:
                              video.channelAvatarUrl ||
                              "https://via.placeholder.com/150?text=Avt",
                            channelName: video.channelName,
                            handle: video.channelHandle,
                            views: `${formatViews(video.viewsCount)} lượt xem`,
                            time: getTimeAgo(video.createdAt),
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Danh sách phát nổi bật */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-xl">
                      <span className="text-[#FF4E00]">❤</span> Danh sách phát
                      nổi bật
                    </div>
                    <button className="text-sm text-gray-400 hover:text-white flex items-center transition-colors">
                      Xem tất cả {">"}
                    </button>
                  </div>
                  {playlists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {playlists.map((playlist) => (
                        <div key={playlist.id} className="group cursor-pointer">
                          <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-lg">
                            <img
                              src={playlist.thumbnailUrl}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute right-0 bottom-0 bg-black/80 px-2 py-1 text-xs text-white rounded-tl-lg font-medium">
                              {playlist.videoCount} video
                            </div>
                          </div>
                          <h4 className="text-white font-semibold text-xs line-clamp-2 leading-snug">
                            {playlist.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1.5">
                            {playlist.videoCount} video
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Chưa có danh sách phát nào.
                    </div>
                  )}
                </div>

                {/* 4. Shorts, Community, Channels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Shorts */}
                  <div className="bg-[#1A1A1A]/40 border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <span className="text-[#FF4E00]">⚡</span> Shorts mới
                        nhất
                      </div>
                      <button className="text-xs text-gray-400 hover:text-white flex items-center transition-colors">
                        Xem tất cả {">"}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 relative flex-1">
                      {shortVideos.slice(0, 3).map((short) => (
                        <Link
                          to={`/shorts?id=${short.id}`}
                          key={short.id}
                          className="relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer shadow-md block bg-[#0a0a0a]"
                        >
                          {/* Blurred background */}
                          <img
                            src={
                              short.thumbnailUrl ||
                              "https://via.placeholder.com/300x500"
                            }
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Centered portrait image */}
                          <img
                            src={
                              short.thumbnailUrl ||
                              "https://via.placeholder.com/300x500"
                            }
                            alt={short.title}
                            className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <h4 className="text-white text-[11px] font-medium line-clamp-2 leading-snug">
                              {short.title}
                            </h4>
                          </div>
                          <div className="absolute bottom-[2.5rem] right-1.5 bg-[#FF4E00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Shorts
                          </div>
                        </Link>
                      ))}
                      {shortVideos.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center text-sm text-gray-500">
                          Chưa có video ngắn
                        </div>
                      )}

                      {shortVideos.length > 0 && (
                        <button className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#2A2A2A] rounded-full flex items-center justify-center text-white shadow-xl z-10 hover:bg-[#3A3A3A] transition-colors">
                          {">"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Community Mock */}
                  <div className="bg-[#1A1A1A]/40 border border-white/5 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 text-white font-bold mb-5 text-lg">
                      <span className="text-[#FF4E00]">{"<"}</span> Cộng đồng
                    </div>
                    <div className="space-y-4">
                      <div className="bg-[#2A2A2A]/50 border border-white/5 rounded-xl p-4">
                        <div className="flex gap-3 mb-3">
                          <img
                            src={
                              channel?.avatarUrl ||
                              "https://via.placeholder.com/40"
                            }
                            className="w-9 h-9 rounded-full shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-medium">
                                {channel?.channelName}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                2 ngày trước
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm text-gray-300 mb-4 leading-relaxed">
                          Bạn đang gặp vấn đề gì trong lập trình?
                          <br />
                          Hãy để lại bình luận, mình sẽ giải đáp nhé! 👇
                        </p>
                        <div className="flex items-center gap-5 text-gray-400 text-xs">
                          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                            👍 512
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                            💬 128
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Channels Mock */}
                  <div className="bg-[#1A1A1A]/40 border border-white/5 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 text-white font-bold mb-5 text-lg">
                      <span className="text-[#FF4E00]">{"<"}</span> Kênh bạn nên
                      xem
                    </div>
                    <div className="space-y-5">
                      {[
                        {
                          name: "F8 Official",
                          subs: "1,2 Tr",
                          avt: "https://ui-avatars.com/api/?name=F8&background=random",
                        },
                        {
                          name: "Vinh Xô",
                          subs: "892 N",
                          avt: "https://ui-avatars.com/api/?name=VX&background=random",
                        },
                        {
                          name: "Code With Harry",
                          subs: "3,1 Tr",
                          avt: "https://ui-avatars.com/api/?name=CH&background=random",
                        },
                      ].map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={c.avt}
                              className="w-10 h-10 rounded-full shrink-0"
                            />
                            <div>
                              <h4 className="text-white text-sm font-medium">
                                {c.name}
                              </h4>
                              <p className="text-gray-500 text-xs">
                                {c.subs} đăng ký
                              </p>
                            </div>
                          </div>
                          <button className="px-4 py-1.5 bg-white/10 hover:bg-[#FF4E00] text-white text-xs font-medium rounded-full transition-colors">
                            Đăng ký
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Footer Features */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#1A1A1A]/30 border border-white/5 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00] shrink-0 text-lg">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold mb-0.5">
                        Cập nhật liên tục
                      </h4>
                      <p className="text-gray-500 text-[10px]">
                        Nội dung mới mỗi tuần
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00] shrink-0 font-bold">
                      HD
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold mb-0.5">
                        Chất lượng cao
                      </h4>
                      <p className="text-gray-500 text-[10px]">
                        Hình ảnh & âm thanh tốt nhất
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4FC3F7]/10 flex items-center justify-center text-[#4FC3F7] shrink-0 text-lg">
                      📖
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold mb-0.5">
                        Kiến thức thực tế
                      </h4>
                      <p className="text-gray-500 text-[10px]">
                        Dễ hiểu & dễ áp dụng
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF5252]/10 flex items-center justify-center text-[#FF5252] shrink-0 text-lg">
                      👥
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold mb-0.5">
                        Cộng đồng thân thiện
                      </h4>
                      <p className="text-gray-500 text-[10px]">
                        Học hỏi & chia sẻ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

                    if (activeTab === "revenue" && isOwner) {
            
            // --- DATA PROCESSING FOR DASHBOARD ---
            const giftsDef = [
              { id: 1, name: "Hoa hồng", price: 10, icon: "🌹" },
              { id: 2, name: "Trái tim", price: 20, icon: "❤️" },
              { id: 3, name: "Cà phê", price: 50, icon: "☕" },
              { id: 4, name: "Kem", price: 100, icon: "🍦" },
              { id: 5, name: "Gấu bông", price: 200, icon: "🧸" },
              { id: 6, name: "Vương miện", price: 500, icon: "👑" },
              { id: 7, name: "Kim cương", price: 1000, icon: "💎" },
              { id: 8, name: "Tên lửa", price: 2000, icon: "🚀" },
              { id: 9, name: "Siêu xe", price: 5000, icon: "🏎️" },
              { id: 10, name: "Lâu đài", price: 10000, icon: "🏰" },
              { id: 11, name: "Phi thuyền", price: 20000, icon: "🛸" },
              { id: 12, name: "Hành tinh", price: 50000, icon: "🌍" },
            ];
            const giftCounts = giftsDef.map(g => {
               const count = revenueStats?.coinReceivedHistory?.filter(h => h.message && h.message.includes(`Đã tặng ${g.name}`)).length || 0;
               return { ...g, count };
            }).sort((a, b) => b.count - a.count);

            const totalDeposit = revenueStats?.depositHistory?.reduce((acc, curr) => acc + curr.coinsAdded, 0) || 0;
            const totalSpent = revenueStats?.coinSpentHistory?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
            const totalDonate = revenueStats?.donateHistory?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
            const totalDonors = new Set(revenueStats?.donateHistory?.map(d => d.donorName)).size;
            
            // Timeline processing
            const allActivities = [
              ...(revenueStats?.donateHistory?.map(d => ({...d, type: 'donate', date: new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")), title: `${d.donorName} đã donate`, desc: d.message, amountStr: `+${d.amount.toLocaleString('vi-VN')} đ`, amountColor: 'text-green-500', icon: <img src={d.avatarUrl || `https://ui-avatars.com/api/?name=${d.donorName}`} className="w-8 h-8 rounded-full" /> })) || []),
              ...(revenueStats?.coinReceivedHistory?.map(d => ({...d, type: 'receive_coin', date: new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")), title: `${d.donorName} đã tặng quà`, desc: d.message, amountStr: `+${d.amount.toLocaleString('vi-VN')} Xu`, amountColor: 'text-yellow-500', icon: <img src={d.avatarUrl || `https://ui-avatars.com/api/?name=${d.donorName}`} className="w-8 h-8 rounded-full" /> })) || []),
              ...(revenueStats?.depositHistory?.map(d => ({...d, type: 'deposit', date: new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")), title: `Nạp xu qua hệ thống`, desc: `Thanh toán: ${d.amount.toLocaleString('vi-VN')} đ`, amountStr: `+${d.coinsAdded.toLocaleString('vi-VN')} Xu`, amountColor: 'text-blue-500', icon: <Wallet className="w-4 h-4 text-blue-400" />, iconBg: 'bg-blue-500/10' })) || []),
              ...(revenueStats?.coinSpentHistory?.map(d => ({...d, type: 'spend_coin', date: new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")), title: `Tặng cho ${d.channelName}`, desc: d.message || 'Đã tặng quà', amountStr: `-${d.amount.toLocaleString('vi-VN')} Xu`, amountColor: 'text-red-500', icon: <Gift className="w-4 h-4 text-red-400" />, iconBg: 'bg-red-500/10' })) || [])
            ].sort((a, b) => b.date - a.date).slice(0, 50);
            
            // Chart Data (Last 7 days)
            const last7Days = Array.from({length: 7}, (_, i) => { 
              const d = new Date(); d.setDate(d.getDate() - 6 + i); 
              return d; 
            });
            const chartData = last7Days.map(date => {
              const dateStr = date.toLocaleDateString('vi-VN'); // dd/MM/yyyy
              const shortDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}`;
              const donateVND = revenueStats?.donateHistory?.filter(d => new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")).toLocaleDateString('vi-VN') === dateStr).reduce((sum, item) => sum + item.amount, 0) || 0;
              const coinsReceived = revenueStats?.coinReceivedHistory?.filter(d => new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")).toLocaleDateString('vi-VN') === dateStr).reduce((sum, item) => sum + item.amount, 0) || 0;
              const coinsSpent = revenueStats?.coinSpentHistory?.filter(d => new Date(d.createdAt + (d.createdAt.endsWith("Z") ? "" : "Z")).toLocaleDateString('vi-VN') === dateStr).reduce((sum, item) => sum + item.amount, 0) || 0;
              return { name: shortDate, donate: donateVND, received: coinsReceived, spent: coinsSpent };
            });

            // Top Donate
            const topDonatorsMap = new Map();
            revenueStats?.donateHistory?.forEach(d => {
              const existing = topDonatorsMap.get(d.donorName) || { amount: 0, avatar: d.avatarUrl };
              topDonatorsMap.set(d.donorName, { amount: existing.amount + d.amount, avatar: d.avatarUrl || `https://ui-avatars.com/api/?name=${d.donorName}` });
            });
            const topDonators = Array.from(topDonatorsMap.entries()).map(([name, data]) => ({name, ...data})).sort((a, b) => b.amount - a.amount).slice(0, 8);

            return (
              <div className="space-y-6 animate-fade-in text-white pb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Tổng quan</h3>
                  <div className="flex items-center gap-3">
                     <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-gray-300">
                        12/08/2026 - 18/08/2026 <ChevronDown className="w-4 h-4" />
                     </button>
                     <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-gray-300">
                        <MonitorPlay className="w-4 h-4" /> Bộ lọc
                     </button>
                  </div>
                </div>

                {loadingRevenue ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#FF4E00] animate-spin" />
                  </div>
                ) : !revenueStats ? (
                  <div className="text-gray-400 text-center py-20">Không có dữ liệu doanh thu.</div>
                ) : (
                  <>
                    {/* Top Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                       <DashboardCard title="TỔNG DOANH THU (VNĐ)" value={`${revenueStats.totalDonateVND?.toLocaleString('vi-VN') || '0'} đ`} icon={<Wallet className="w-5 h-5"/>} gradient="from-purple-600/80 to-purple-900/80" color="text-purple-400" trend="+12.5%" />
                       <DashboardCard title="TỔNG XU NHẬN" value={`${revenueStats.totalCoinReceived?.toLocaleString('vi-VN') || '0'} Xu`} icon={<Star className="w-5 h-5"/>} gradient="from-orange-500/80 to-orange-800/80" color="text-orange-400" trend="+8.3%" />
                       <DashboardCard title="XU ĐÃ NẠP" value={`${totalDeposit.toLocaleString('vi-VN')} Xu`} icon={<Wallet className="w-5 h-5"/>} gradient="from-blue-600/80 to-blue-900/80" color="text-blue-400" trend="+10.2%" />
                       <DashboardCard title="XU ĐÃ TIÊU (QUÀ TẶNG)" value={`${totalSpent.toLocaleString('vi-VN')} Xu`} icon={<Gift className="w-5 h-5"/>} gradient="from-red-600/80 to-red-900/80" color="text-red-400" trend="-5.1%" trendDown />
                       <DashboardCard title="TỔNG DONATE (VNĐ)" value={`${totalDonate.toLocaleString('vi-VN')} đ`} icon={<Activity className="w-5 h-5"/>} gradient="from-fuchsia-600/80 to-purple-900/80" color="text-purple-400" trend="+12.5%" />
                       <DashboardCard title="NGƯỜI DONATE" value={totalDonors} icon={<Users className="w-5 h-5"/>} gradient="from-teal-500/80 to-teal-800/80" color="text-teal-400" trend="+7.4%" />
                    </div>

                    
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
                      
                      {/* Left: Recent Activity */}
                      <div className={`bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col transition-all duration-300 ${showAllActivities ? 'lg:col-span-12 order-3' : 'lg:col-span-4 order-1'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                             <Activity className="w-4 h-4 text-purple-400" /> HOẠT ĐỘNG GẦN ĐÂY
                           </h4>
                           {/* <span onClick={() => setShowAllActivities(!showAllActivities)} className="text-xs text-gray-500 cursor-pointer hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md">
                             {showAllActivities ? "Ẩn bớt" : "Xem tất cả"}
                           </span> */}
                        </div>
                        <div className={`flex-1 overflow-y-auto custom-scrollbar pr-2 transition-all duration-300 ${showAllActivities ? 'h-[600px] lg:h-[700px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start' : 'h-[320px] space-y-6 relative'}`}>
                          {!showAllActivities && <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10" />}
                          {(showAllActivities ? allActivities : allActivities.slice(0, 8)).length > 0 ? (showAllActivities ? allActivities : allActivities.slice(0, 8)).map((act, i) => (
                            <div key={i} className={`flex items-start gap-4 relative z-10 ${showAllActivities ? "bg-[#1A1A1A] border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-colors" : ""}`}>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[3px] border-[#111111] ${act.iconBg || 'bg-[#1A1A1A]'}`}>
                                 {act.icon}
                               </div>
                               <div className="flex-1 min-w-0 pt-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-white truncate">{act.title}</p>
                                      <p className="text-xs text-gray-500 mt-1 truncate">{act.desc || 'Không có tin nhắn'}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-sm font-bold ${act.amountColor} whitespace-nowrap`}>{act.amountStr}</p>
                                      <p className="text-[10px] text-gray-500 mt-1">{act.date.toLocaleTimeString('vi-VN')}<br/>{act.date.toLocaleDateString('vi-VN')}</p>
                                    </div>
                                  </div>
                               </div>
                            </div>
                          )) : (
                            <div className="text-center text-gray-500 py-10">Không có hoạt động nào.</div>
                          )}
                        </div>
                        {!showAllActivities ? (
                           <button onClick={() => setShowAllActivities(true)} className="w-full mt-4 py-3 bg-[#1A1A1A] hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-400 transition-colors flex items-center justify-center gap-2">
                             Xem tất cả hoạt động <ChevronDown className="w-4 h-4" />
                           </button>
                        ) : (
                           <button onClick={() => setShowAllActivities(false)} className="w-full mt-4 py-3 bg-[#1A1A1A] hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-400 transition-colors flex items-center justify-center gap-2">
                             Ẩn bớt <ChevronDown className="w-4 h-4 rotate-180" />
                           </button>
                        )}
                      </div>

                      {/* Middle: Charts */}
                      <div className={`flex flex-col gap-4 transition-all duration-300 ${showAllActivities ? 'lg:col-span-8 order-1' : 'lg:col-span-5 order-2'}`}>
                        {/* Line Chart */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 min-h-[300px] flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                               <Wallet className="w-4 h-4 text-blue-400" /> DOANH THU (VNĐ)
                             </h4>
                             <select className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-400 outline-none">
                               <option>7 ngày qua</option>
                             </select>
                          </div>
                          <div className="mb-6">
                             <div className="text-3xl font-bold text-white mb-1">{revenueStats.totalDonateVND?.toLocaleString('vi-VN') || '0'} đ</div>
                             <div className="text-xs text-green-400 font-medium">↑ 12.5% <span className="text-gray-500">so với 7 ngày trước</span></div>
                          </div>
                          <div className="flex-1 w-full min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorDonate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7E22CE" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#7E22CE" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} tickFormatter={(value) => value >= 1000000 ? (value / 1000000) + 'M' : value >= 1000 ? (value / 1000) + 'k' : value} dx={-10} />
                                <RechartsTooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#fff'}} cursor={{stroke: '#7E22CE', strokeWidth: 1, strokeOpacity: 0.5}} />
                                <Area type="monotone" dataKey="donate" name="Doanh thu" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorDonate)" dot={{r: 4, fill: '#fff', stroke: '#A855F7', strokeWidth: 2}} activeDot={{r: 6, fill: '#fff', stroke: '#A855F7', strokeWidth: 3}} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 min-h-[300px] flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                             <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                               <Star className="w-4 h-4 text-yellow-400" /> XU NHẬN / XU TIÊU
                             </h4>
                             <select className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-400 outline-none">
                               <option>7 ngày qua</option>
                             </select>
                          </div>
                          <div className="flex items-center gap-6 mb-4">
                             <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 rounded bg-[#10B981]"/> Xu nhận</div>
                             <div className="flex items-center gap-2 text-xs text-gray-400"><div className="w-3 h-3 rounded bg-[#EF4444]"/> Xu tiêu</div>
                          </div>
                          <div className="flex-1 w-full min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} barGap={4}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} dy={10} />
                                <YAxis hide />
                                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1A1A1A', border: 'none', borderRadius: '8px'}} />
                                <Bar dataKey="received" name="Xu nhận" fill="#10B981" radius={[2, 2, 0, 0]} maxBarSize={15} />
                                <Bar dataKey="spent" name="Xu tiêu" fill="#EF4444" radius={[2, 2, 0, 0]} maxBarSize={15} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Right: Top Donators & Gifts */}
                      <div className={`flex flex-col gap-4 transition-all duration-300 ${showAllActivities ? 'lg:col-span-4 order-2' : 'lg:col-span-3 order-3'}`}>
                        {/* Top Donate */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 max-h-[400px] flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                             <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                               <Crown className="w-4 h-4 text-yellow-500" /> TOP DONATE
                             </h4>
                             <span className="text-xs text-gray-500 cursor-pointer hover:text-white transition-colors">Tháng này</span>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                            {topDonators.length > 0 ? topDonators.map((donor, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx===0?'bg-yellow-500 text-black':idx===1?'bg-gray-300 text-black':idx===2?'bg-amber-600 text-white':'bg-[#222] text-gray-400'}`}>
                                  {idx + 1}
                                </div>
                                <img src={donor.avatar} className="w-8 h-8 rounded-full border border-white/10" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-200 truncate">{donor.name}</p>
                                </div>
                                <div className="text-purple-400 text-sm font-bold whitespace-nowrap">
                                  {donor.amount.toLocaleString('vi-VN')} đ
                                </div>
                              </div>
                            )) : (
                              <div className="text-center text-gray-500 py-4 text-sm">Chưa có dữ liệu</div>
                            )}
                          </div>
                        </div>

                        {/* Popular Gifts */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-2 shadow-xl flex-1">
                          <div className="flex items-center justify-between mb-6 p-2">
                             <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                               <Gift className="w-4 h-4 text-pink-500" /> QUÀ TẶNG PHỔ BIẾN
                             </h4>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-1 lg:gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            {giftCounts.map(g => (
                              <GiftCard key={g.id} icon={g.icon} name={g.name} count={g.count} />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                    </div>

                  </>
                )}
              </div>
            );
          }

if (activeTab === "videos") {
            const normalVideos = videos.filter((v) => !v.isShort);
            const filteredVideos = normalVideos.filter((v) =>
              v.title.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            return (
              <>
                {isOwner && editingVideo && (
                  <UploadVideoForm
                    key={`${editingVideo.id ?? "new"}-${editingVideo.isShort ? "short" : "video"}`}
                    onUploadSuccess={() => fetchChannelData(handle)}
                    channel={channel}
                    editingVideo={editingVideo}
                    onCancelEdit={() => setEditingVideo(null)}
                  />
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">
                      Tất cả video
                    </h3>
                    {isOwner && (
                      <Link
                        to="/studio/upload"
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF4E00]/10 hover:bg-[#FF4E00]/20 text-[#FF4E00] text-sm font-medium rounded-full transition-colors border border-[#FF4E00]/30"
                      >
                        <Upload className="w-4 h-4" />
                        Tạo video
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-full">
                      Mới nhất
                    </button>
                    <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full transition-colors">
                      Phổ biến
                    </button>
                  </div>
                </div>
                {filteredVideos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                    <p className="text-gray-400 mb-4">
                      {searchQuery
                        ? "Không tìm thấy video nào phù hợp với tìm kiếm."
                        : "Kênh này chưa có video nào."}
                    </p>
                    {isOwner && !searchQuery && (
                      <Link
                        to="/studio/upload"
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF4E00] hover:bg-[#FF6A00] text-white font-medium rounded-full transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        Tạo video
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {filteredVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        isOwner={isOwner}
                        onEdit={() => {
                          setEditingVideo(video);
                          setActiveTab("videos");
                        }}
                        onDelete={() => setVideoToDelete(video)}
                        video={{
                          id: video.id,
                          title: video.title,
                          thumbnail:
                            video.thumbnailUrl ||
                            "https://via.placeholder.com/600x400?text=No+Thumbnail",
                          duration: formatDuration(video.duration),
                          avatar:
                            video.channelAvatarUrl ||
                            "https://via.placeholder.com/150?text=Avt",
                          channelName: video.channelName,
                          handle: video.channelHandle,
                          views: `${formatViews(video.viewsCount)} lượt xem`,
                          time: getTimeAgo(video.createdAt),
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          }

          if (activeTab === "shorts") {
            const shortVideos = videos.filter((v) => v.isShort);
            const filteredShorts = shortVideos.filter((v) =>
              v.title.toLowerCase().includes(searchQuery.toLowerCase()),
            );
            return (
              <>
                {isOwner && editingVideo && (
                  <UploadVideoForm
                    key={`${editingVideo.id ?? "new"}-short`}
                    onUploadSuccess={() => fetchChannelData(handle)}
                    channel={channel}
                    editingVideo={editingVideo}
                    onCancelEdit={() => setEditingVideo(null)}
                    isShortType={true}
                  />
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white">
                      Tất cả video ngắn
                    </h3>
                    {isOwner && (
                      <Link
                        to="/studio/upload-short"
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF4E00]/10 hover:bg-[#FF4E00]/20 text-[#FF4E00] text-sm font-medium rounded-full transition-colors border border-[#FF4E00]/30"
                      >
                        <Smartphone className="w-4 h-4" />
                        Tạo video ngắn
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-black text-sm font-medium rounded-full">
                      Mới nhất
                    </button>
                    <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full transition-colors">
                      Phổ biến
                    </button>
                  </div>
                </div>
                {filteredShorts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                    <p className="text-gray-400 mb-4">
                      {searchQuery
                        ? "Không tìm thấy video ngắn nào phù hợp với tìm kiếm."
                        : "Kênh này chưa có video ngắn nào."}
                    </p>
                    {isOwner && !searchQuery && (
                      <Link
                        to="/studio/upload-short"
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#FF4E00] hover:bg-[#FF6A00] text-white font-medium rounded-full transition-colors"
                      >
                        <Smartphone className="w-5 h-5" />
                        Tạo video ngắn
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredShorts.map((short) => (
                      <div
                        key={short.id}
                        className="relative group cursor-pointer"
                      >
                        <Link
                          to={`/shorts?id=${short.id}`}
                          className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-md block bg-[#0a0a0a]"
                        >
                          <img
                            src={
                              short.thumbnailUrl ||
                              "https://via.placeholder.com/300x500?text=No+Thumbnail"
                            }
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 group-hover:scale-105 transition-transform duration-500"
                          />
                          <img
                            src={
                              short.thumbnailUrl ||
                              "https://via.placeholder.com/300x500?text=No+Thumbnail"
                            }
                            alt={short.title}
                            className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <h4 className="text-white text-sm font-medium line-clamp-2 leading-snug">
                              {short.title}
                            </h4>
                            <p className="text-gray-400 text-xs mt-1">
                              {formatViews(short.viewsCount || 0)} lượt xem
                            </p>
                          </div>
                        </Link>
                        {isOwner && (
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingVideo(short);
                                setActiveTab("shorts");
                              }}
                              className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVideoToDelete(short);
                              }}
                              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          }

          if (activeTab === "playlists") {
            return (
              <div className="w-full">
                {playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
                    {playlists.map((playlist) => (
                      <Link
                        to={`/playlist?list=${playlist.id}`}
                        key={playlist.id}
                        className="group block"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-lg">
                          <img
                            src={
                              playlist.thumbnailUrl ||
                              "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=640&h=360"
                            }
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={playlist.title}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-medium text-sm bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-2">
                              <PlaySquare className="w-4 h-4" /> Phát tất cả
                            </span>
                          </div>
                          <div className="absolute right-0 bottom-0 bg-black/80 px-2 py-1 text-xs text-white rounded-tl-lg font-medium">
                            {playlist.videoCount} video
                          </div>
                        </div>
                        <h4 className="text-white font-semibold text-sm line-clamp-2 leading-snug group-hover:text-[#FF4E00] transition-colors">
                          {playlist.title}
                        </h4>
                        <p className="text-gray-400 text-xs mt-1.5 group-hover:text-gray-300 transition-colors">
                          Xem toàn bộ danh sách phát
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                    Kênh này chưa có danh sách phát nào.
                  </div>
                )}
              </div>
            );
          }

          if (activeTab === "liked") {
            return (
              <div className="text-center py-20 text-gray-400 bg-[#1A1A1A]/50 rounded-2xl border border-white/5">
                Bạn chưa thích video nào trên kênh này.
              </div>
            );
          }

          if (activeTab === "about") {
            return (
              <div className="bg-[#1A1A1A]/50 rounded-2xl border border-white/5 p-8 max-w-4xl">
                <h3 className="text-xl font-bold text-white mb-6">
                  Giới thiệu về kênh
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-8 text-lg">
                  {channel.description || "Kênh này chưa có mô tả nào."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/10 pt-8 mt-4">
                  <div>
                    <h4 className="text-white font-medium mb-4 text-lg">
                      Chi tiết kênh
                    </h4>
                    <ul className="space-y-4 text-gray-400">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#4FC3F7]" />
                        <span>
                          {formatViews(channel.subscriberCount)} người đăng ký
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[#4FC3F7]" />
                        <span>
                          {formatViews(channel.followingCount || 0)} đang theo
                          dõi
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-4 text-lg">
                      Thống kê chung
                    </h4>
                    <ul className="space-y-4 text-gray-400">
                      <li className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-xs">
                          i
                        </span>
                        <span>
                          Đã tham gia{" "}
                          {new Date(channel.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded-full text-xs">
                          👁
                        </span>
                        <span>
                          {formatViews(channel.totalViews || 0)} lượt xem
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* Customize Modal */}
      <CustomizeChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        channelData={channel}
        onSaveSuccess={handleSaveSuccess}
      />

      <DeleteVideoModal
        video={videoToDelete}
        onClose={() => setVideoToDelete(null)}
        onSuccess={() => {
          setVideoToDelete(null);
          fetchChannelData(handle);
        }}
      />

      {/* About Channel Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#212121] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              {isEditingName ? (
                <div className="flex-1 mr-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameContent}
                    onChange={(e) => setEditNameContent(e.target.value)}
                    className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-lg font-bold"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-gray-400 hover:text-white px-2"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() =>
                      handleSaveProfile(
                        "channelName",
                        editNameContent,
                        setIsEditingName,
                      )
                    }
                    className="text-[#3EA6FF] font-medium px-2 flex items-center"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Lưu"
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {channel.channelName}
                  </h2>
                  {isOwner && (
                    <button
                      onClick={() => {
                        setEditNameContent(channel.channelName);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {/* Mô tả */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Mô tả</h3>
                  {isOwner && !isEditingDesc && (
                    <button
                      onClick={() => {
                        setEditDescContent(channel.description || "");
                        setIsEditingDesc(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Chỉnh sửa mô tả"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-3">
                    <textarea
                      value={editDescContent}
                      onChange={(e) => setEditDescContent(e.target.value)}
                      rows="4"
                      className="w-full bg-[#2A2A2A] text-white p-3 rounded-xl border border-transparent focus:border-[#FF5722] focus:outline-none resize-none text-sm"
                      placeholder="Thêm mô tả về kênh của bạn..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                        disabled={isSavingProfile}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() =>
                          handleSaveProfile(
                            "description",
                            editDescContent,
                            setIsEditingDesc,
                          )
                        }
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#3EA6FF] text-black hover:bg-[#65B8FF] transition-colors flex items-center gap-2 cursor-pointer"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {channel.description || "Kênh này chưa có mô tả nào."}
                  </p>
                )}
              </div>

              {/* Đường liên kết (Tối đa 3 links) */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Đường liên kết
                  </h3>
                  {isOwner && !isEditingLinks && (
                    <button
                      onClick={() => {
                        setEditLinksContent(channel.links || []);
                        setIsEditingLinks(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingLinks ? (
                  <div className="space-y-3">
                    {editLinksContent.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                      >
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => {
                            const newLinks = [...editLinksContent];
                            newLinks[idx].title = e.target.value;
                            setEditLinksContent(newLinks);
                          }}
                          className="w-full sm:w-1/3 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="Tiêu đề (VD: Facebook)"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...editLinksContent];
                            newLinks[idx].url = e.target.value;
                            setEditLinksContent(newLinks);
                          }}
                          className="w-full sm:flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="URL (VD: https://facebook.com/...)"
                        />
                        <button
                          onClick={() => {
                            const newLinks = editLinksContent.filter(
                              (_, i) => i !== idx,
                            );
                            setEditLinksContent(newLinks);
                          }}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors self-end sm:self-auto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {editLinksContent.length < 3 && (
                      <button
                        onClick={() =>
                          setEditLinksContent([
                            ...editLinksContent,
                            { title: "", url: "" },
                          ])
                        }
                        className="text-[#3EA6FF] text-sm font-medium hover:underline flex items-center gap-1 mt-2"
                      >
                        + Thêm đường liên kết
                      </button>
                    )}
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-white/5">
                      <button
                        onClick={() => setIsEditingLinks(false)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() =>
                          handleSaveProfile(
                            "links",
                            editLinksContent,
                            setIsEditingLinks,
                          )
                        }
                        className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#3EA6FF] text-black hover:bg-[#65B8FF] transition-colors flex items-center gap-2"
                      >
                        {isSavingProfile ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Lưu"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!channel.links || channel.links.length === 0 ? (
                      <div className="text-gray-400 text-sm">
                        Chưa có đường liên kết nào.
                      </div>
                    ) : (
                      channel.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={
                            link.url.startsWith("http")
                              ? link.url
                              : `https://${link.url}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-4 text-gray-300 hover:bg-white/5 p-3 rounded-xl transition-colors"
                        >
                          <LinkIcon className="w-6 h-6 text-gray-400 shrink-0" />
                          <div>
                            <div className="font-medium text-white text-sm mb-1">
                              {link.title || link.url}
                            </div>
                            <div className="text-[#3EA6FF] text-sm truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                              {link.url}
                            </div>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Thông tin khác */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Thông tin khác
                </h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center gap-4 text-gray-300 group">
                    <Mail className="w-5 h-5 shrink-0" />
                    {isEditingEmail ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="email"
                          value={editEmailContent}
                          onChange={(e) => setEditEmailContent(e.target.value)}
                          className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="Email liên hệ..."
                        />
                        <button
                          onClick={() => setIsEditingEmail(false)}
                          className="text-gray-400 hover:text-white px-2 text-sm"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() =>
                            handleSaveProfile(
                              "contactEmail",
                              editEmailContent,
                              setIsEditingEmail,
                            )
                          }
                          className="text-[#3EA6FF] font-medium px-2 flex items-center text-sm"
                        >
                          {isSavingProfile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Lưu"
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {channel.contactEmail || "Chưa cập nhật email"}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setEditEmailContent(channel.contactEmail || "");
                              setIsEditingEmail(true);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Handle Link */}
                  <div className="flex items-center gap-4 text-gray-300">
                    <MonitorPlay className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      www.youtube.com/@{channel.handle}
                    </span>
                  </div>

                  {/* Country */}
                  <div className="flex items-center gap-4 text-gray-300 group">
                    <Globe className="w-5 h-5 shrink-0" />
                    {isEditingCountry ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editCountryContent}
                          onChange={(e) =>
                            setEditCountryContent(e.target.value)
                          }
                          className="flex-1 bg-[#2A2A2A] text-white px-3 py-1.5 rounded-lg border border-transparent focus:border-[#FF5722] focus:outline-none text-sm"
                          placeholder="Quốc gia..."
                        />
                        <button
                          onClick={() => setIsEditingCountry(false)}
                          className="text-gray-400 hover:text-white px-2 text-sm"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() =>
                            handleSaveProfile(
                              "country",
                              editCountryContent,
                              setIsEditingCountry,
                            )
                          }
                          className="text-[#3EA6FF] font-medium px-2 flex items-center text-sm"
                        >
                          {isSavingProfile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Lưu"
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {channel.country || "Chưa cập nhật quốc gia"}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setEditCountryContent(channel.country || "");
                              setIsEditingCountry(true);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-gray-300">
                    <Info className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      Đã tham gia{" "}
                      {new Date(channel.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-300">
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      {formatViews(channel.subscriberCount)} người đăng ký
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-300">
                    <PlaySquare className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{videos.length} video</span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-300">
                    <TrendingUp className="w-5 h-5 shrink-0" />
                    <span className="text-sm">
                      {formatViews(channel.totalViews || 0)} lượt xem
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-wrap gap-3 mt-8 pt-8 border-t border-white/10">
                <button className="px-4 py-2 rounded-full font-medium text-sm text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Chia sẻ kênh
                </button>
                {!isOwner && (
                  <button className="px-4 py-2 rounded-full font-medium text-sm text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Flag className="w-4 h-4" /> Báo cáo người dùng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Livestreams Tab */}
      {activeTab === "livestreams" && (
        <LivestreamsTab channelId={channel?.id} />
      )}
    </div>
  );
}

function DashboardCard({ title, value, icon, gradient, color, trend, trendDown }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group`}>
       <div className="flex justify-between items-start mb-4">
         <div className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10 ${color}`}>
           {icon}
         </div>
       </div>
       <div className="relative z-10">
         <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1 opacity-80 truncate">{title}</p>
         <h4 className="text-xl lg:text-2xl font-black text-white mb-2">{value}</h4>
         <p className={`text-xs font-semibold ${trendDown ? 'text-red-400' : 'text-green-400'} flex items-center gap-1`}>
           {trendDown ? '↓' : '↑'} {trend}
         </p>
       </div>
       <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,20 L0,15 Q10,10 20,15 T40,15 T60,15 T80,15 T100,10 L100,20 Z" fill="currentColor" className={color} />
          </svg>
       </div>
    </div>
  );
}

function GiftCard({ icon, name, count }) {
  return (
    <div className="rounded-xl p-0 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
      <span className="text-2xl mb-2">{icon}</span>
      <p className="text-[10px] font-medium text-gray-400 truncate w-full">{name}</p>
      <p className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full mt-1">{count}</p>
    </div>
  );
}

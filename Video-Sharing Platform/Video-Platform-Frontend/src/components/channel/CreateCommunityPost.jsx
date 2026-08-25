import { useState, useRef } from "react";
import axios from "axios";
import { Image as ImageIcon, BarChart2, X, Upload, Video } from "lucide-react";

export default function CreateCommunityPost({
  channelId,
  isOwner,
  onPostCreated,
}) {
  const [content, setContent] = useState("");
  const [isPoll, setIsPoll] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError("Bạn chỉ có thể đăng tối đa 5 ảnh.");
      return;
    }
    setError("");
    const newImages = [...images, ...files];
    setImages(newImages);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (videoFile) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handlePollChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung bài viết.");
      return;
    }

    if (isPoll) {
      const validOptions = pollOptions.filter((o) => o.trim() !== "");
      if (validOptions.length < 2) {
        setError("Cần ít nhất 2 lựa chọn cho cuộc thăm dò.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      let uploadedImageUrls = [];
      let uploadedVideoUrl = null;

      if (!isPoll) {
        if (images.length > 0) {
          for (const file of images) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post("/api/upload/image", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                ...authHeader,
              },
            });
            uploadedImageUrls.push(res.data.url);
          }
        }

        if (videoFile) {
          const formData = new FormData();
          formData.append("file", videoFile);
          const res = await axios.post("/api/upload/video", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              ...authHeader,
            },
          });
          uploadedVideoUrl = res.data.url;
        }
      }

      const payload = {
        channelId,
        content,
        isMembersOnly,
        imageUrls: !isPoll ? uploadedImageUrls : null,
        videoUrl: !isPoll ? uploadedVideoUrl : null,
        pollOptions: isPoll ? pollOptions.filter((o) => o.trim() !== "") : null,
      };

      await axios.post("/api/community", payload, { headers: authHeader });

      setContent("");
      setImages([]);
      setImagePreviews([]);
      if (videoFile) removeVideo();
      setPollOptions(["", ""]);
      setIsPoll(false);
      setIsMembersOnly(false);

      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError(err.response.data || "Bạn không có quyền đăng bài viết này.");
      } else {
        setError("Có lỗi xảy ra khi đăng bài.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAvatar = localStorage.getItem("avatar");
  const currentName = localStorage.getItem("handle") || "User";

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 mb-6">
      {!isOwner && (
        <div className="mb-3 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg inline-block font-medium">
          Đăng bài với tư cách Hội viên
        </div>
      )}

      <div className="flex gap-3 items-start mb-4">
        <img
          src={
            currentAvatar || `https://ui-avatars.com/api/?name=${currentName}`
          }
          alt={currentName}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full bg-transparent text-white border-b border-white/10 pb-2 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {!isPoll && (images.length > 0 || videoPreview) && (
        <div className="mb-4 space-y-3">
          {videoPreview && (
            <div className="relative w-full max-w-sm rounded-lg overflow-hidden group border border-white/10">
              <video src={videoPreview} className="w-full" controls />
              <button
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-red-500 transition-colors z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 rounded-lg overflow-hidden group border border-white/10"
                >
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">Thêm ảnh</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isPoll && (
        <div className="space-y-2 mb-4">
          {pollOptions.map((opt, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => handlePollChange(index, e.target.value)}
                placeholder={`Lựa chọn ${index + 1}`}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => removePollOption(index)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button
              onClick={addPollOption}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              + Thêm lựa chọn
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          {!isPoll && (
            <>
              <button
                onClick={() => {
                  if (images.length < 5) imageInputRef.current?.click();
                }}
                className={`p-2 rounded-full transition-colors text-gray-400 hover:bg-white/10 hover:text-white`}
                title="Thêm ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!videoFile) videoInputRef.current?.click();
                }}
                className={`p-2 rounded-full transition-colors text-gray-400 hover:bg-white/10 hover:text-white`}
                title="Thêm video"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}

          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoSelect}
            accept="video/*"
            className="hidden"
          />

          {isOwner && (
            <button
              onClick={() => {
                if (!isPoll) {
                  setImages([]);
                  setImagePreviews([]);
                  if (videoFile) removeVideo();
                }
                setIsPoll(!isPoll);
              }}
              className={`p-2 rounded-full transition-colors ${isPoll ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
              title="Thăm dò ý kiến"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isOwner && (
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isMembersOnly}
                onChange={(e) => setIsMembersOnly(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
              />
              Chỉ hội viên
            </label>
          )}
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (!content.trim() && !isPoll && images.length === 0 && !videoFile)
            }
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? "Đang đăng..." : "Đăng"}
          </button>
        </div>
      </div>
    </div>
  );
}

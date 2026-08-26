import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Video,
  Zap,
  Eye,
  ThumbsUp,
  MessageSquare,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Clock,
  Check,
  X,
  MoreVertical,
  Search,
  Filter,
  ChevronDown,
  Image,
  Link2,
  Plus,
  PlaySquare,
  FileVideo,
  Clock as ClockIcon,
  Ban,
  Calendar,
  LayoutGrid,
  List,
} from "lucide-react";

const VideoManagement = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterVisibility]);

  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState("Public");
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchMyVideos();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập");
        setLoading(false);
        return;
      }
      const res = await axios.get("/api/videos/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos(res.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Phiên đăng nhập hết hạn."
          : "Không thể tải danh sách video.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditVisibility(video.visibility);
    setEditThumbnailFile(null);
    setEditVideoFile(null);
    setThumbnailPreview(video.thumbnailUrl || "");
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      let finalThumbnailUrl = editingVideo.thumbnailUrl;
      let finalVideoUrl = null;

      if (editThumbnailFile) {
        const formData = new FormData();
        formData.append("file", editThumbnailFile);
        const res = await axios.post("/api/upload/image", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        finalThumbnailUrl = res.data.url;
      }

      if (editVideoFile) {
        const formData = new FormData();
        formData.append("file", editVideoFile);
        const res = await axios.post("/api/upload/video", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        finalVideoUrl = res.data.url;
      }

      await axios.put(
        `/api/videos/${editingVideo.id}`,
        {
          title: editTitle,
          description: editDescription,
          visibility: editVisibility,
          thumbnailUrl: finalThumbnailUrl,
          videoUrl: finalVideoUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setVideos((prev) =>
        prev.map((v) =>
          v.id === editingVideo.id
            ? {
                ...v,
                title: editTitle,
                description: editDescription,
                visibility: editVisibility,
                thumbnailUrl: finalThumbnailUrl,
              }
            : v,
        ),
      );
      setEditingVideo(null);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      await axios.delete(`/api/videos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setDeletingId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa video");
    } finally {
      setDeleting(false);
    }
  };

  const formatViews = (n) => {
    if (!n) return "0";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
    return n.toString();
  };

  const formatDuration = (s) => {
    if (!s) return "0:00";
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = s % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDateString = (d) => {
    const date = new Date(d);
    return `${date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}\n${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const normalVideos = videos.filter((v) => !v.isShort);
  const shortVideos = videos.filter((v) => v.isShort);
  const displayed = (
    activeTab === "videos" ? normalVideos : shortVideos
  ).filter((v) => {
    const matchesSearch = v.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesVis =
      filterVisibility === "all" || v.visibility === filterVisibility;
    return matchesSearch && matchesVis;
  });

  const totalItems = displayed.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedVideos = displayed.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // KPI Calculations
  const totalVideos = videos.length;
  const publicVideos = videos.filter((v) => v.visibility === "Public").length;
  const pendingVideos = videos.filter((v) => v.visibility === "Private").length;
  const rejectedVideos = videos.filter(
    (v) => v.visibility === "Scheduled",
  ).length; // using Scheduled as proxy for Rejected to match colors
  const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);
  const publicPercent =
    totalVideos > 0 ? ((publicVideos / totalVideos) * 100).toFixed(1) : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">{error}</p>
      </div>
    );

  return (
    <div className="pb-20 max-w-[1600px] mx-auto text-white">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Quản lý Video</h1>
          <p className="text-gray-400 text-sm">
            Quản lý, kiểm duyệt và theo dõi hiệu suất video trên nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm video, tiêu đề, kênh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-bg-[#0F0F0F] text-gray-300 text-sm rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none w-72 transition-colors"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded">
              <span className="text-[10px] text-gray-400 font-mono">⌘K</span>
            </button>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-bg-[#0F0F0F] text-gray-300 text-sm font-medium rounded-xl border border-white/10 hover:border-gray-500 transition-colors">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>
      </div>

      {/* ─── Tabs & KPIs ─── */}
      <div className="mb-6 flex items-center gap-2 border-b border-white/5 pb-6">
        <div className="flex bg-bg-[#0F0F0F] rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "videos" ? "bg-[#1e2029] text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <PlaySquare className="w-4 h-4" /> Video
          </button>
          <button
            onClick={() => setActiveTab("shorts")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "shorts" ? "bg-[#1e2029] text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Zap className="w-4 h-4" /> Video ngắn (Shorts)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
        <div className="bg-[#141418] p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileVideo className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">
              Tổng video
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1.5">
            {totalVideos.toLocaleString()}
          </p>
          <p className="text-[11px] text-green-400 font-medium">
            ↑ 12.5%{" "}
            <span className="text-gray-500 font-normal">so với tuần trước</span>
          </p>
        </div>

        <div className="bg-[#141418] p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">
              Video công khai
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1.5">
            {publicVideos.toLocaleString()}
          </p>
          <p className="text-[11px] text-green-400 font-medium">
            ↑ {publicPercent}%{" "}
            <span className="text-gray-500 font-normal">tổng số video</span>
          </p>
        </div>

        <div className="bg-[#141418] p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">Chờ duyệt</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1.5">
            {pendingVideos.toLocaleString()}
          </p>
          <p className="text-[11px] text-yellow-400 font-medium">
            ↑ 3 <span className="text-gray-500 font-normal">video mới</span>
          </p>
        </div>

        <div className="bg-[#141418] p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">
              Bị từ chối
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1.5">
            {rejectedVideos.toLocaleString()}
          </p>
          <p className="text-[11px] text-red-400 font-medium">
            ↓ 2 <span className="text-gray-500 font-normal">video</span>
          </p>
        </div>

        <div className="bg-[#141418] p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium">
              Tổng lượt xem
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1.5">
            {formatViews(totalViews)}
          </p>
          <p className="text-[11px] text-green-400 font-medium">
            ↑ 15.3%{" "}
            <span className="text-gray-500 font-normal">so với tuần trước</span>
          </p>
        </div>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6 p-1">
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-500 font-medium ml-1">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="appearance-none bg-[#141418] border border-white/10 text-gray-300 text-xs rounded-lg pl-4 pr-10 py-2.5 focus:border-purple-500 focus:outline-none cursor-pointer w-44"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Public">Công khai</option>
                <option value="Private">Chờ duyệt</option>
                <option value="Scheduled">Bị từ chối</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-5">
            <button 
              onClick={() => {
                setSearchQuery("");
                setFilterVisibility("all");
              }}
              className="px-5 py-2.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-transparent cursor-pointer"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-5">
          <div className="flex items-center gap-1 bg-bg-[#0F0F0F] border border-white/10 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-gray-500 hover:text-white"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Table / Grid ─── */}
      {viewMode === "list" ? (
        <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-black/20 text-[10px] uppercase tracking-wider text-gray-400 border-b border-white/5">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      className="rounded bg-black/50 border-gray-600 text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-4 font-semibold">Video</th>
                  <th className="px-6 py-4 font-semibold">Danh mục</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Ngày đăng</th>
                  <th className="px-6 py-4 font-semibold">Lượt xem</th>
                  <th className="px-6 py-4 font-semibold">Thích</th>
                  <th className="px-6 py-4 font-semibold">Bình luận</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVideos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-20 text-center text-gray-500"
                    >
                      Không tìm thấy video nào.
                    </td>
                  </tr>
                ) : (
                  paginatedVideos.map((video) => {
                    const statusColors =
                      video.visibility === "Public"
                        ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        : video.visibility === "Private"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                          : "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                    const statusText =
                      video.visibility === "Public"
                        ? "Công khai"
                        : video.visibility === "Private"
                          ? "Chờ duyệt"
                          : "Bị từ chối";

                    return (
                      <tr
                        key={video.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded bg-black/50 border-gray-600 text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-4 min-w-[350px] max-w-[450px] whitespace-normal">
                          <div className="flex gap-4">
                            <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-black/50 border border-white/5 flex items-center justify-center">
                              {video.isShort ? (
                                <>
                                  <img
                                    src={
                                      video.thumbnailUrl ||
                                      "https://via.placeholder.com/320x180"
                                    }
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
                                  />
                                  <img
                                    src={
                                      video.thumbnailUrl ||
                                      "https://via.placeholder.com/320x180"
                                    }
                                    alt="Thumb"
                                    className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                  />
                                </>
                              ) : (
                                <img
                                  src={
                                    video.thumbnailUrl ||
                                    "https://via.placeholder.com/320x180"
                                  }
                                  alt="Thumb"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                              <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-medium text-white shadow-sm">
                                {formatDuration(video.duration)}
                              </div>
                              {video.isShort && (
                                <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">
                                  Short
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                              <h4 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors cursor-pointer">
                                {video.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {video.description || "Không có mô tả"}
                              </p>
                              <p className="text-[10px] text-purple-400 mt-1.5 font-medium tracking-wide">
                                #
                                {video.category?.name?.replace(/\s+/g, "") ||
                                  (video.isShort ? "Shorts" : "Video")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {video.category?.name || "Chưa phân loại"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium border ${statusColors}`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-pre-line leading-relaxed">
                          {formatDateString(video.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                          {formatViews(video.viewsCount)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                          {formatViews(video.likesCount)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-300">
                          {formatViews(video.commentsCount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/watch/${video.id}`}
                              target="_blank"
                              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Xem video"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleEdit(video)}
                              className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Sửa video"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <div
                              className="relative"
                              ref={openMenuId === video.id ? menuRef : null}
                            >
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === video.id ? null : video.id,
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === video.id && (
                                <div className="absolute right-0 top-full mt-1 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl z-50 w-36 overflow-hidden">
                                  <button
                                    onClick={() => {
                                      setDeletingId(video.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa video
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px]">
          {paginatedVideos.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 bg-[#141418] rounded-2xl border border-white/5 flex items-center justify-center">
              Không tìm thấy video nào.
            </div>
          ) : (
            paginatedVideos.map((video) => {
              const statusColors =
                video.visibility === "Public"
                  ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                  : video.visibility === "Private"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                    : "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
              const statusText =
                video.visibility === "Public"
                  ? "Công khai"
                  : video.visibility === "Private"
                    ? "Chờ duyệt"
                    : "Bị từ chối";

              return (
                <div
                  key={video.id}
                  className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors flex flex-col"
                >
                  <div className="relative aspect-video flex items-center justify-center bg-black/50 overflow-hidden">
                    {video.isShort ? (
                      <>
                        <img
                          src={
                            video.thumbnailUrl ||
                            "https://via.placeholder.com/320x180"
                          }
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
                        />
                        <img
                          src={
                            video.thumbnailUrl ||
                            "https://via.placeholder.com/320x180"
                          }
                          alt="Thumb"
                          className="relative h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </>
                    ) : (
                      <img
                        src={
                          video.thumbnailUrl ||
                          "https://via.placeholder.com/320x180"
                        }
                        alt="Thumb"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium text-white shadow-sm">
                      {formatDuration(video.duration)}
                    </div>
                    {video.isShort && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                        Short
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h4
                      className="text-sm font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors cursor-pointer mb-2"
                      title={video.title}
                    >
                      {video.title}
                    </h4>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-medium border ${statusColors}`}
                      >
                        {statusText}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateString(video.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-400 mb-3">
                      {video.category?.name || "Chưa phân loại"}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4 mt-auto">
                      <div
                        className="flex items-center gap-1.5"
                        title="Lượt xem"
                      >
                        <Eye className="w-4 h-4" />{" "}
                        {formatViews(video.viewsCount)}
                      </div>
                      <div className="flex items-center gap-1.5" title="Thích">
                        <ThumbsUp className="w-4 h-4" />{" "}
                        {formatViews(video.likesCount)}
                      </div>
                      <div
                        className="flex items-center gap-1.5"
                        title="Bình luận"
                      >
                        <MessageSquare className="w-4 h-4" />{" "}
                        {formatViews(video.commentsCount)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3 relative">
                      <Link
                        to={`/watch/${video.id}`}
                        target="_blank"
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Xem video"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(video)}
                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Sửa video"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <div
                        className="relative"
                        ref={openMenuId === video.id ? menuRef : null}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === video.id ? null : video.id,
                            )
                          }
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === video.id && (
                          <div className="absolute right-0 bottom-full mb-1 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl z-50 w-36 overflow-hidden">
                            <button
                              onClick={() => {
                                setDeletingId(video.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa video
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="px-6 py-4 mt-4 bg-bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số{" "}
            <span className="font-semibold text-gray-300">
              {totalItems.toLocaleString()} video
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="leading-none pb-0.5">‹</span>
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-purple-600 text-white"
                        : "bg-[#1a1c23] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-xs font-medium"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="leading-none pb-0.5">›</span>
              </button>
            </div>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-[#1a1c23] border border-white/5 text-gray-300 text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
      {/* ─── Modals (Edit & Delete) ─── */}
      {/* Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">Chỉnh sửa video</h2>
              <button
                onClick={() => setEditingVideo(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0f111a] text-white text-sm rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0f111a] text-white text-sm rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">
                  Trạng thái hiển thị
                </label>
                <div className="flex gap-2">
                  {[
                    [
                      "Public",
                      "Công khai",
                      <Globe key="pub" className="w-4 h-4" />,
                    ],
                    [
                      "Private",
                      "Chờ duyệt",
                      <Lock key="priv" className="w-4 h-4" />,
                    ],
                    [
                      "Scheduled",
                      "Bị từ chối",
                      <Ban key="ban" className="w-4 h-4" />,
                    ],
                  ].map(([val, label, icon]) => (
                    <button
                      key={val}
                      onClick={() => setEditVisibility(val)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-1 justify-center transition-all ${editVisibility === val ? "bg-purple-600 text-white" : "bg-[#0f111a] text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Tải lên ảnh thumbnail mới
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditThumbnailFile(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full bg-[#0f111a] text-gray-400 text-sm rounded-xl px-4 py-2.5 border border-white/5 focus:border-purple-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
                />
                {thumbnailPreview && (
                  <div className="mt-3 aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                    <img
                      src={thumbnailPreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setEditingVideo(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editTitle.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}{" "}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-[#0F0F0F] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-2xl mx-auto mb-5">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-center text-xl mb-2">
              Xóa video?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-8">
              Hành động này không thể hoàn tác. Video sẽ bị xóa vĩnh viễn khỏi
              hệ thống.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}{" "}
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;

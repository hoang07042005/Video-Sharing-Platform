import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Check,
  X,
  Search,
  Clock,
  ExternalLink,
  Filter,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  ChevronDown,
  Eye,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserSearch,
  UploadCloud,
  Image,
} from "lucide-react";
import { toast } from "react-toastify";
import moment from "moment";

const STATUS_CONFIG = {
  All: { label: "Tất cả", color: "text-gray-300", icon: LayoutGrid },
  Pending: { label: "Chờ duyệt", color: "text-blue-400", icon: Clock },
  Checking: { label: "Đang kiểm tra", color: "text-indigo-400", icon: Search },
  Approved: { label: "Đã duyệt", color: "text-green-400", icon: CheckCircle },
  Rejected: { label: "Từ chối", color: "text-red-400", icon: XCircle },
  Revoked: {
    label: "Bị tắt kiếm tiền",
    color: "text-yellow-400",
    icon: AlertTriangle,
  },
};

export default function AdminMonetization() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    Total: 0,
    Approved: 0,
    Rejected: 0,
    Revoked: 0,
    Pending: 0,
  });
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [activeTab, setActiveTab] = useState("chung");

  const [isProcessing, setIsProcessing] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, page, pageSize]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/monetization/applications?status=${statusFilter}&page=${page}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setApplications(res.data.applications || res.data.Applications || []);
      const rawStats = res.data.stats || res.data.Stats || {};
      setStats({
        Total: rawStats.total ?? rawStats.Total ?? 0,
        Approved: rawStats.approved ?? rawStats.Approved ?? 0,
        Rejected: rawStats.rejected ?? rawStats.Rejected ?? 0,
        Revoked: rawStats.revoked ?? rawStats.Revoked ?? 0,
        Pending: rawStats.pending ?? rawStats.Pending ?? 0,
        Checking: rawStats.checking ?? rawStats.Checking ?? 0,
      });
      setTotalItems(res.data.totalItems || res.data.TotalItems || 0);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!selectedApp) return;

    // If it's a reject or revoke action and reason input isn't shown yet
    if (
      (actionType === "reject" || actionType === "revoke") &&
      !showReasonInput
    ) {
      setPendingAction(actionType);
      setShowReasonInput(true);
      return;
    }

    if (
      (actionType === "reject" || actionType === "revoke") &&
      !rejectReason.trim()
    ) {
      toast.error("Vui lòng nhập lý do");
      return;
    }

    try {
      setIsProcessing(true);
      if (actionType === "check") {
        await axios.post(
          `/api/admin/monetization/applications/${selectedApp.id}/check`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        toast.success("Đã chuyển sang trạng thái đang kiểm tra");
      } else if (actionType === "approve" || actionType === "re_enable") {
        await axios.post(
          `/api/admin/monetization/applications/${selectedApp.id}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success("Đã duyệt đơn đăng ký thành công");
      } else {
        await axios.post(
          `/api/admin/monetization/applications/${selectedApp.id}/reject`,
          {
            reason: rejectReason,
            adminNote: adminNoteInput,
            evidenceUrl: evidenceUrls.join(','),
            actionType: actionType === "reject" ? "Reject" : "Revoke",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success(
          actionType === "revoke"
            ? "Đã tắt tính năng kiếm tiền"
            : "Đã từ chối đơn đăng ký",
        );
      }

      setSelectedApp(null);
      setShowReasonInput(false);
      setRejectReason("");
      setAdminNoteInput("");
      setEvidenceUrls([]);
      setPendingAction(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xử lý");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (evidenceUrls.length + files.length > 5) {
      toast.error("Chỉ được tải lên tổng cộng tối đa 5 ảnh bằng chứng.");
      return;
    }

    // Validate type and size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} không phải là hình ảnh hợp lệ.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Kích thước file ${file.name} quá lớn (tối đa 5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingEvidence(true);
    
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post("/api/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        return res.data.url || res.data.fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url);

      if (validUrls.length > 0) {
        setEvidenceUrls(prev => [...prev, ...validUrls]);
        toast.success(`Đã tải lên ${validUrls.length} ảnh thành công`);
      } else {
        toast.error("Không nhận được đường dẫn ảnh từ server.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải ảnh lên");
    } finally {
      setIsUploadingEvidence(false);
      e.target.value = ""; // Reset input so same files can be selected again
    }
  };

  const removeEvidenceUrl = (indexToRemove) => {
    setEvidenceUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const getSparklinePath = (width, height, isPositive) => {
    // Generate a pseudo-random looking smooth curve for the sparkline
    return `M 0 ${height / 2} Q ${width / 4} ${isPositive ? height : 0}, ${width / 2} ${height / 2} T ${width} ${isPositive ? height / 4 : height * 0.8}`;
  };

  return (
    <div className="p-2 text-gray-200 flex flex-col h-full bg-[#0F0F0F] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Duyệt Đăng Ký Kiếm Tiền</h1>
          <p className="text-sm text-gray-400">
            Quản lý và xem xét các yêu cầu đăng ký kiếm tiền từ các kênh.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-xs text-gray-400 font-medium">Tổng yêu cầu</p>
            <p className="text-2xl font-bold mt-0.5">{stats.Total}</p>
            <p className="text-[10px] text-gray-500 mt-1">Tất cả thời gian</p>
          </div>
          <svg
            className="absolute right-0 bottom-2 w-24 h-12 stroke-purple-500/30 fill-none"
            strokeWidth="2"
          >
            <path d={getSparklinePath(100, 40, true)} />
          </svg>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-xs text-gray-400 font-medium">Đã duyệt</p>
            <p className="text-2xl font-bold mt-0.5">{stats.Approved}</p>
            <p className="text-[10px] text-green-400 mt-1">
              {stats.Total > 0
                ? ((stats.Approved / stats.Total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <svg
            className="absolute right-0 bottom-2 w-24 h-12 stroke-green-500/30 fill-none"
            strokeWidth="2"
          >
            <path d={getSparklinePath(100, 40, true)} />
          </svg>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-xs text-gray-400 font-medium">Từ chối</p>
            <p className="text-2xl font-bold mt-0.5">{stats.Rejected}</p>
            <p className="text-[10px] text-red-400 mt-1">
              {stats.Total > 0
                ? ((stats.Rejected / stats.Total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <svg
            className="absolute right-0 bottom-2 w-24 h-12 stroke-red-500/30 fill-none"
            strokeWidth="2"
          >
            <path d={getSparklinePath(100, 40, false)} />
          </svg>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1 z-10">
            <p className="text-xs text-gray-400 font-medium">
              Bị tắt kiếm tiền
            </p>
            <p className="text-2xl font-bold mt-0.5">{stats.Revoked}</p>
            <p className="text-[10px] text-yellow-400 mt-1">
              {stats.Total > 0
                ? ((stats.Revoked / stats.Total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <svg
            className="absolute right-0 bottom-2 w-24 h-12 stroke-yellow-500/30 fill-none"
            strokeWidth="2"
          >
            <path d={getSparklinePath(100, 40, false)} />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = key === "All" ? stats.Total : stats[key];
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setStatusFilter(key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  isActive
                    ? `border-yellow-500 bg-yellow-500/10 text-yellow-400`
                    : `border-white/5 bg-[#1A1A1A] text-gray-400 hover:bg-white/5`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs bg-black/40`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm kênh, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1A1A1A] border border-white/5 rounded-full text-sm focus:border-white/20 outline-none w-[250px]"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-2 overflow-hidden min-h-[900px]">
        {/* Main Table Area */}
        <div
          className={`bg-[#151515] rounded-1xl border border-white/5 flex flex-col overflow-hidden relative transition-all duration-300 ${selectedApp ? "hidden lg:flex lg:w-[calc(100%-350px-1.5rem)]" : "w-full"}`}
        >
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#1A1A1A] border-b border-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  <th className="p-2 font-medium">Kênh</th>
                  <th className="p-2 font-medium">Ngày gửi</th>
                  <th className="p-2 font-medium">Trạng thái</th>
                  <th className="p-2 font-medium">Lý do / Ghi chú</th>
                  <th className="p-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  applications
                    .filter(
                      (app) =>
                        app.channelName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        app.handle
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        app.email
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((app) => {
                      const conf =
                        STATUS_CONFIG[app.status] || STATUS_CONFIG.Pending;
                      const StatusIcon = conf.icon;
                      const isSelected = selectedApp?.id === app.id;

                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-white/[0.02] transition-colors ${isSelected ? "bg-white/[0.03]" : ""}`}
                        >
                          <td className="p-1 w-[22%]">
                            <div className="flex items-center gap-3">
                              {app.avatar ? (
                                <img
                                  src={app.avatar}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#252525] border border-white/10 flex items-center justify-center font-bold">
                                  {(app.channelName || "?").charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-[13px] text-gray-100">
                                  {app.channelName}
                                </div>
                                <div className="text-[11px] text-blue-400 flex items-center gap-1 mt-0.5">
                                  <a
                                    href={`/c/${app.handle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline"
                                  >
                                    @{app.handle}
                                  </a>
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {app.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-1 w-[11%] text-sm text-gray-400">
                            <div>
                              {moment(app.appliedAt).format("DD/MM/YYYY")}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {moment(app.appliedAt).format("HH:mm")}
                            </div>
                          </td>
                          <td className="p-1 w-[12%]">
                            <span
                              className={`inline-flex items-center gap-1.5  rounded-md text-xs font-medium ${conf.color} `}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {conf.label}
                            </span>
                            {app.reviewedAt && (
                              <div className="text-[11px] text-gray-500 mt-1.5">
                                {moment(app.reviewedAt).format(
                                  "DD/MM/YYYY - HH:mm",
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-1 w-[22%]">
                            <div className="max-w-[300px]">
                              <div className="text-sm font-medium text-yellow-500 mb-0.5">
                                {app.status === "Revoked" ||
                                app.status === "Rejected"
                                  ? "Vi phạm chính sách"
                                  : app.status === "Approved"
                                    ? "Đủ điều kiện"
                                    : "Đang xử lý"}
                              </div>
                              <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {app.adminNote || "Chưa có ghi chú."}
                              </div>
                            </div>
                          </td>
                          <td className="p-1 w-[5%]">
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setShowReasonInput(false);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#252525] hover:bg-[#333] border border-white/5 rounded-lg text-xs text-gray-300 font-medium transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-white/5 p-4 flex items-center justify-between bg-[#1A1A1A]">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#252525] border border-white/10 rounded-lg px-2 py-1 text-gray-200 outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>trên mỗi trang</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#252525] hover:bg-[#333] text-gray-400 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === p
                          ? "bg-purple-600 text-white"
                          : "bg-[#252525] hover:bg-[#333] text-gray-400"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 2 || p === page + 2) {
                  return (
                    <span key={p} className="text-gray-500 px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#252525] hover:bg-[#333] text-gray-400 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-gray-400">
              Hiển thị {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, totalItems)} trên {totalItems} kết quả
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {selectedApp && (
          <div className="w-[500px] shrink-0 bg-[#121212] border border-white/5 rounded-1xl flex flex-col shadow-xl animate-fade-in-right relative">
            {/* Panel Header */}
            <div className="p-6 border-b border-white/5 relative">
              <button
                onClick={() => setSelectedApp(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6">Chi tiết yêu cầu</h2>

              <div className="flex items-start gap-4">
                {selectedApp.avatar ? (
                  <img
                    src={selectedApp.avatar}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#252525] border border-white/10 flex items-center justify-center font-bold text-xl">
                    {(selectedApp.channelName || "?").charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-100">
                        {selectedApp.channelName}
                      </h3>
                      <a
                        href={`/c/${selectedApp.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        @{selectedApp.handle}{" "}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {(() => {
                      const conf =
                        STATUS_CONFIG[selectedApp.status] ||
                        STATUS_CONFIG.Pending;
                      const Icon = conf.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${conf.bg} ${conf.color} ${conf.border} border`}
                        >
                          <Icon className="w-4 h-4" />
                          {conf.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Ngày gửi:{" "}
                    {moment(selectedApp.appliedAt).format("DD/MM/YYYY - HH:mm")}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center justify-center gap-6 px-6 border-b border-white/5">
              {[
                { id: "chung", label: "Thông tin chung" },
                { id: "lichsu", label: "Lý do & Lịch sử" },
                { id: "tailieu", label: "Tài liệu đính kèm" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto pl-2 pr-2 pt-6 pb-6">
              {activeTab === "chung" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-2">
                    {/* Personal Info */}
                    <div className="flex-1 bg-[#1A1A1A] p-3 rounded-1xl border border-white/5">
                      <h4 className="text-sm font-semibold text-gray-200 mb-4">
                        Thông tin cá nhân
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500">Họ và tên:</span>
                          <span className="text-gray-200 text-right">
                            {selectedApp.channelName}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-200 text-right pl-6">
                            {selectedApp.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500">Số điện thoại:</span>
                          <span className="text-gray-200 text-right">
                            {selectedApp.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500">Quốc gia:</span>
                          <span className="text-gray-200 flex items-center gap-2 text-right">
                            {selectedApp.country === "VN"
                              ? "🇻🇳 Việt Nam"
                              : selectedApp.country || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                          <span className="text-gray-500">Ngày đăng ký:</span>
                          <span className="text-gray-200 text-right">
                            {selectedApp.createdAt
                              ? moment(selectedApp.createdAt).format("DD/MM/YYYY")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="flex-1 bg-[#1A1A1A] p-3 rounded-1xl border border-white/5">
                      <h4 className="text-sm font-semibold text-gray-200 mb-4">
                        Trạng thái hiện tại
                      </h4>
                      {(() => {
                        const conf =
                          STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.Pending;
                        const Icon = conf.icon;
                        return (
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-3 ${conf.color}`}
                          >
                            <Icon className="w-5 h-5" />
                            {conf.label}
                          </div>
                        );
                      })()}
                      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                        Kênh của bạn hiện đang ở trạng thái{" "}
                        {STATUS_CONFIG[selectedApp.status]?.label?.toLowerCase() || "chờ duyệt"}
                        .
                        {selectedApp.reviewedAt &&
                          ` Cập nhật lần cuối: ${moment(selectedApp.reviewedAt).format(
                            "DD/MM/YYYY - HH:mm"
                          )}`}
                      </p>
                      <button 
                        onClick={() => setActiveTab("lichsu")}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium transition-colors"
                      >
                        Xem lịch sử trạng thái
                      </button>
                    </div>
                  </div>

                  {/* Reason Box Preview */}
                  <div 
                    onClick={() => setActiveTab("lichsu")}
                    className="bg-[#1A1A1A] p-5 rounded-1xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-200">
                        Lý do & Ghi chú quản trị viên
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Xem chi tiết</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="bg-[#221c10] border border-[#4d3a1c] rounded-1xl p-4">
                      <h5 className="text-sm font-bold text-yellow-500 mb-1">
                        {selectedApp.status === "Revoked" ||
                        selectedApp.status === "Rejected"
                          ? "Vi phạm chính sách"
                          : "Ghi chú hệ thống"}
                      </h5>
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                        {selectedApp.rejectReason || selectedApp.adminNote ? (
                          <>
                            {selectedApp.rejectReason && <span className="block mb-1"><strong className="text-gray-300">Lý do:</strong> {selectedApp.rejectReason}</span>}
                            {selectedApp.adminNote && <span><strong className="text-gray-300">Ghi chú:</strong> {selectedApp.adminNote}</span>}
                          </>
                        ) : (
                          "Không có ghi chú hoặc lý do nào được lưu lại."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Input Form for Reject/Revoke */}
                  {showReasonInput && (
                    <div className="bg-[#1A1A1A] p-5 rounded-1xl border border-purple-500/30 animate-fade-in shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <h4 className="text-sm font-semibold text-purple-400 mb-4">
                        {pendingAction === "revoke" ? "Nội dung tắt kiếm tiền" : "Nội dung từ chối"}
                      </h4>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={pendingAction === "revoke" ? "Nhập lý do tắt kiếm tiền để gửi cho chủ kênh (Bắt buộc)..." : "Nhập lý do từ chối chi tiết để gửi cho chủ kênh (Bắt buộc)..."}
                        className="w-full bg-[#151515] border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none min-h-[80px] text-gray-200 mb-3"
                      />
                      <textarea
                        value={adminNoteInput}
                        onChange={(e) => setAdminNoteInput(e.target.value)}
                        placeholder="Ghi chú nội bộ của quản trị viên (Không bắt buộc)..."
                        className="w-full bg-[#151515] border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none min-h-[80px] text-gray-200 mb-3"
                      />
                      
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block font-medium">Bằng chứng vi phạm (Tối đa 5 ảnh)</label>
                        <div className="flex flex-wrap items-center gap-3">
                          {evidenceUrls.map((url, index) => (
                            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                              <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => removeEvidenceUrl(index)}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          
                          {evidenceUrls.length < 5 && (
                            <label className={`cursor-pointer w-16 h-16 flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg text-gray-400 transition-colors ${isUploadingEvidence ? 'opacity-50 pointer-events-none' : ''}`}>
                              <UploadCloud className="w-5 h-5" />
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleEvidenceUpload} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-200 mb-4">
                      Hành động
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {/* Bật kiếm tiền (Approve) - Show for Checking and Revoked */}
                      {(selectedApp.status === "Checking" || selectedApp.status === "Revoked") && (
                        <button
                          onClick={() => handleAction("approve")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 font-medium transition-colors"
                        >
                          <Check className="w-4 h-4" /> Bật kiếm tiền
                        </button>
                      )}

                      {/* Kiểm tra (Check) - Show only for Pending */}
                      {selectedApp.status === "Pending" && (
                        <button
                          onClick={() => handleAction("check")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-medium transition-colors"
                        >
                          <Search className="w-4 h-4" /> Kiểm tra
                        </button>
                      )}

                      {/* Tắt kiếm tiền (Revoke) - Show only for Approved */}
                      {selectedApp.status === "Approved" && (
                        <button
                          onClick={() => handleAction("revoke")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 font-medium transition-colors"
                        >
                          <MinusCircle className="w-4 h-4" /> Tắt kiếm tiền
                        </button>
                      )}

                      {/* Từ chối (Reject) - Show for all EXCEPT Pending, but text changes if already Rejected */}
                      {selectedApp.status !== "Pending" && (
                        <button
                          onClick={() => handleAction("reject")}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium transition-colors"
                        >
                          <X className="w-4 h-4" /> 
                          {selectedApp.status === "Rejected" ? "Cập nhật từ chối" : "Từ chối"}
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedApp(null);
                          setShowReasonInput(false);
                          setRejectReason("");
                          setAdminNoteInput("");
                          setEvidenceUrls([]);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 font-medium transition-colors"
                      >
                        <MinusCircle className="w-4 h-4" /> Giữ nguyên
                      </button>
                    </div>
                  </div>

                  {/* Processing Timeline */}
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-gray-200 mb-2">
                      Thời gian xử lý
                    </h4>
                    <p className="text-xs text-gray-500 mb-6">
                      Thời gian xử lý trung bình: 1 - 3 ngày làm việc
                    </p>

                    <div className="relative flex items-center justify-between">
                      <div className="absolute left-0 right-0 top-1.5 h-0.5 bg-[#252525] z-0"></div>
                      {/* Step 1 */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500 ring-4 ring-[#121212]"></div>
                        <div className="text-xs text-purple-400 font-medium text-center">
                          Đã gửi yêu cầu
                          <br />
                          <span className="text-[10px] text-gray-500">
                            {moment(selectedApp.appliedAt).format("DD/MM/YYYY")}
                          </span>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${selectedApp.reviewedAt || selectedApp.status !== "Pending" ? "bg-purple-500" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"} ring-4 ring-[#121212]`}
                        ></div>
                        <div
                          className={`text-xs ${selectedApp.reviewedAt || selectedApp.status !== "Pending" ? "text-purple-400" : "text-blue-400"} font-medium text-center`}
                        >
                          Đang xem xét
                          <br />
                          <span className="text-[10px] text-gray-500">
                            {moment(selectedApp.appliedAt).format("DD/MM/YYYY")}
                          </span>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full ${selectedApp.reviewedAt ? (selectedApp.status === "Approved" ? "bg-green-500" : "bg-red-500") : "bg-[#252525] border border-white/20"} ring-4 ring-[#121212]`}
                        ></div>
                        <div
                          className={`text-xs ${selectedApp.reviewedAt ? (selectedApp.status === "Approved" ? "text-green-400" : "text-red-400") : "text-gray-500"} font-medium text-center`}
                        >
                          Có kết quả
                          <br />
                          <span className="text-[10px] text-gray-500">
                            {selectedApp.reviewedAt
                              ? moment(selectedApp.reviewedAt).format(
                                  "DD/MM/YYYY",
                                )
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "kenh" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                    <h4 className="text-[15px] font-semibold text-gray-200 mb-4">Chỉ số kênh</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#121212] p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center">
                        <span className="text-gray-500 text-xs mb-1">Người đăng ký</span>
                        <span className="text-xl font-bold text-gray-100">{selectedApp.subscribersCount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="bg-[#121212] p-4 rounded-lg border border-white/5 flex flex-col items-center justify-center">
                        <span className="text-gray-500 text-xs mb-1">Số lượng video</span>
                        <span className="text-xl font-bold text-gray-100">{selectedApp.videosCount?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                    <h4 className="text-[15px] font-semibold text-gray-200 mb-4">Mô tả kênh</h4>
                    <div className="text-sm text-gray-400 leading-relaxed bg-[#121212] p-4 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {selectedApp.channelDescription || "Kênh này chưa có mô tả."}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "lichsu" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Section 1: Lý do yêu cầu & Giải trình */}
                  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-5">
                      <UserSearch className="w-5 h-5 text-purple-400" />
                      <h4 className="text-[15px] font-semibold text-gray-200">Lý do yêu cầu & Giải trình</h4>
                    </div>
                    <div className="space-y-4">
                      {/* Warning box */}
                      <div className="bg-[#2a2113] border border-[#523d1a] rounded-lg p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                          </div>
                          <h5 className="text-sm font-semibold text-yellow-500">Lý do tắt kiếm tiền từ hệ thống</h5>
                        </div>
                        <p className="text-[13px] text-yellow-600/90 font-medium mb-1.5 pl-9">Hành động vi phạm chính sách</p>
                        <p className="text-[13px] text-gray-400 leading-relaxed pl-9">
                          {selectedApp.rejectReason || "Không có lý do từ chối nào được ghi nhận."}
                        </p>
                      </div>

                      {/* Explanation box */}
                      <div className="bg-[#1e1b29] border border-[#3b2d59] rounded-lg p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <h5 className="text-sm font-semibold text-purple-400">Giải trình của người dùng</h5>
                        </div>
                        <p className="text-[13px] text-gray-300 leading-relaxed pl-9 mb-4">
                          Hệ thống hiện chưa có phần giải trình cho người dùng khi nộp đơn. (Đây là dữ liệu chờ cập nhật).
                        </p>
                        <p className="text-xs text-gray-500 pl-9">Ngày gửi giải trình: {moment(selectedApp.appliedAt).format("DD/MM/YYYY - HH:mm")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Lịch sử xử lý */}
                  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-8">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <h4 className="text-[15px] font-semibold text-gray-200">Lịch sử xử lý</h4>
                    </div>

                    <div className="relative space-y-8 before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-white/10">
                      
                      {/* Step 1 */}
                      <div className="relative pl-8 flex gap-8">
                        <div className="absolute left-0 w-[11px] h-[11px] rounded-full bg-purple-500 ring-4 ring-[#18181b] z-10 mt-1"></div>
                        <div className="flex-1 max-w-[200px]">
                          <h5 className="text-[13px] font-semibold text-purple-400">Tiếp nhận yêu cầu</h5>
                          <p className="text-xs text-gray-500 mt-1">{moment(selectedApp.appliedAt).format("DD/MM/YYYY - HH:mm")}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-gray-400 mt-0.5">Hệ thống đã ghi nhận yêu cầu đăng ký kiếm tiền.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative pl-8 flex gap-8">
                        <div className="absolute left-0 w-[11px] h-[11px] rounded-full bg-purple-500 ring-4 ring-[#18181b] z-10 mt-1"></div>
                        <div className="flex-1 max-w-[200px]">
                          <h5 className="text-[13px] font-semibold text-purple-400">Đang xem xét hồ sơ</h5>
                          <p className="text-xs text-gray-500 mt-1">{moment(selectedApp.appliedAt).add(1, 'hours').format("DD/MM/YYYY - HH:mm")}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-gray-400 mt-0.5">Đội ngũ kiểm duyệt đang xem xét thông tin và nội dung kênh.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative pl-8 flex gap-8">
                        <div className={`absolute left-0 w-[11px] h-[11px] rounded-full ring-4 ring-[#18181b] z-10 mt-1 ${selectedApp.status === "Pending" ? "bg-gray-500" : (selectedApp.status === "Approved" ? "bg-green-500" : "bg-red-500")}`}></div>
                        <div className="flex-1 max-w-[200px]">
                          <h5 className={`text-[13px] font-semibold ${selectedApp.status === "Pending" ? "text-gray-400" : (selectedApp.status === "Approved" ? "text-green-500" : "text-red-500")}`}>
                            {selectedApp.status === "Pending" ? "Đang chờ kết quả" : (selectedApp.status === "Approved" ? "Đã duyệt" : "Đã từ chối")}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedApp.reviewedAt && selectedApp.status !== "Revoked" ? moment(selectedApp.reviewedAt).format("DD/MM/YYYY - HH:mm") : (selectedApp.status === "Pending" ? "Chưa có" : moment(selectedApp.reviewedAt).format("DD/MM/YYYY - HH:mm"))}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-gray-400 mt-0.5">
                            {selectedApp.status === "Pending" ? "Hồ sơ đang chờ kết quả đánh giá." : (selectedApp.status === "Approved" ? "Kênh đã đủ điều kiện bật kiếm tiền." : "Kênh không đủ điều kiện bật kiếm tiền.")}
                          </p>
                        </div>
                      </div>

                      {/* Step 4 - Only show if revoked or if we want to show it as disabled */}
                      <div className={`relative pl-8 flex gap-8 transition-opacity duration-300 ${selectedApp.status === "Revoked" ? "opacity-100" : "opacity-40"}`}>
                        <div className={`absolute left-0 w-[11px] h-[11px] rounded-full ring-4 ring-[#18181b] z-10 mt-1 ${selectedApp.status === "Revoked" ? "bg-yellow-500" : "bg-gray-500"}`}></div>
                        <div className="flex-1 max-w-[200px]">
                          <h5 className={`text-[13px] font-semibold ${selectedApp.status === "Revoked" ? "text-yellow-500" : "text-gray-400"}`}>Bị tắt kiếm tiền / Thu hồi</h5>
                          <p className="text-xs text-gray-500 mt-1">{selectedApp.status === "Revoked" && selectedApp.reviewedAt ? moment(selectedApp.reviewedAt).format("DD/MM/YYYY - HH:mm") : "Chưa có"}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-gray-400 mt-0.5">
                            {selectedApp.status === "Revoked" ? "Tính năng kiếm tiền của kênh đã bị hệ thống thu hồi." : "Kênh chưa bị vô hiệu hóa kiếm tiền."}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Section 3: Ghi chú của quản trị viên
                  <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Edit3 className="w-5 h-5 text-purple-400" />
                      <h4 className="text-[15px] font-semibold text-gray-200">Ghi chú của quản trị viên</h4>
                    </div>
                    
                    <textarea
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder={selectedApp.adminNote || "Chưa có ghi chú nội bộ. Nhập để thêm mới..."}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none min-h-[100px] text-gray-200 resize-y mb-4"
                    />
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Ghi chú này chỉ hiển thị cho quản trị viên.</p>
                      <button className="px-5 py-2.5 bg-[#3b2d59] hover:bg-[#4a3970] text-gray-200 rounded-lg text-sm font-medium transition-colors">
                        Lưu ghi chú
                      </button>
                    </div>
                  </div> */}

                </div>
              )}

              {activeTab === "tailieu" && (
                <div className="animate-fade-in space-y-6">
                  {selectedApp.evidenceUrl ? (
                    <div className="bg-[#18181b] p-5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <h4 className="text-[15px] font-semibold text-gray-200">Tài liệu bằng chứng vi phạm</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedApp.evidenceUrl.split(',').map((url, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden border border-white/10 bg-[#121212]">
                            <img 
                              src={url} 
                              alt={`Bằng chứng vi phạm ${idx + 1}`} 
                              className="w-full h-auto object-contain max-h-[300px]"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        Bằng chứng được đính kèm bởi Quản trị viên vào lúc {moment(selectedApp.reviewedAt).format("DD/MM/YYYY - HH:mm")}.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-[#18181b] rounded-xl border border-white/5">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500">
                        <Image className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">Chưa có tài liệu</h3>
                      <p className="text-sm text-gray-500 max-w-[300px]">
                        Đơn này không có hình ảnh bằng chứng vi phạm nào được đính kèm bởi Quản trị viên.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS for animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `,
        }}
      />
    </div>
  );
}

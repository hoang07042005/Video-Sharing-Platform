import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Crown,
  Search,
  SlidersHorizontal,
  Download,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Frown,
} from "lucide-react";
import moment from "moment";
import "moment/locale/vi";

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    typeFilter,
    statusFilter,
    dateFilter,
    itemsPerPage,
  ]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/feedbacks?status=All", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent(feedback.adminReply || "");
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung trả lời");
      return;
    }
    setReplying(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/feedbacks/${selectedFeedback.id}/reply`,
        { replyContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Gửi trả lời thành công");
      setReplyModalOpen(false);
      fetchFeedbacks();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi trả lời");
    } finally {
      setReplying(false);
    }
  };

  // Tạo Badge cho Loại phản hồi
  const getTypeBadge = (type) => {
    switch (type) {
      case "bug":
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-semibold whitespace-nowrap">
            Báo lỗi
          </span>
        );
      case "feature":
        return (
          <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[11px] font-semibold whitespace-nowrap">
            Góp ý
          </span>
        );
      case "ui":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-semibold whitespace-nowrap">
            Giao diện
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold whitespace-nowrap">
            Khác
          </span>
        );
    }
  };

  const totalFeedbacks = feedbacks.length;
  const pendingFeedbacks = feedbacks.filter(
    (f) => f.status !== "Resolved",
  ).length;
  const resolvedFeedbacks = feedbacks.filter(
    (f) => f.status === "Resolved",
  ).length;
  const premiumPending = feedbacks.filter(
    (f) => f.isPremium && f.status !== "Resolved",
  ).length;

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      [feedback.content, feedback.userFullName, feedback.userEmail].some(
        (value) => value?.toLowerCase().includes(search),
      );
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Pending" && feedback.status !== "Resolved") ||
      (activeTab === "Resolved" && feedback.status === "Resolved");
    const matchesType = typeFilter === "All" || feedback.type === typeFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Pending" && feedback.status !== "Resolved") ||
      (statusFilter === "Resolved" && feedback.status === "Resolved");
    const matchesDate =
      !dateFilter ||
      moment(feedback.createdAt).format("YYYY-MM") === dateFilter;
    return (
      matchesSearch && matchesTab && matchesType && matchesStatus && matchesDate
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFeedbacks.length / itemsPerPage),
  );
  const visibleFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const exportFeedbacks = () => {
    // ... logic xuất file giữ nguyên
    const rows = filteredFeedbacks.map((f) => [
      f.userFullName,
      f.userEmail,
      f.type,
      f.content,
      f.status,
      f.createdAt,
    ]);
    const csv = [
      ["Người gửi", "Email", "Loại", "Nội dung", "Trạng thái", "Ngày gửi"],
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedbacks.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Tổng phản hồi",
      value: totalFeedbacks,
      color: "purple",
      icon: MessageSquare,
      trend: "18.5%",
      isUp: true,
    },
    {
      label: "Chờ xử lý",
      value: pendingFeedbacks,
      color: "blue",
      icon: Clock,
      trend: "6.2%",
      isUp: false,
    },
    {
      label: "Đã trả lời",
      value: resolvedFeedbacks,
      color: "orange",
      icon: CheckCircle,
      trend: "20.1%",
      isUp: true,
    },
  ];

  const statColorClasses = {
    purple: [
      "bg-[#1a1525]",
      "bg-purple-500/20",
      "text-purple-400",
      "border-purple-500/50",
    ],
    blue: [
      "bg-[#121a2f]",
      "bg-blue-500/20",
      "text-blue-400",
      "border-blue-500/50",
    ],
    orange: [
      "bg-[#221711]",
      "bg-orange-500/20",
      "text-orange-400",
      "border-orange-500/50",
    ],
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý phản hồi</h1>
            <p className="text-sm text-gray-400 mt-1">
              Theo dõi và xử lý các phản hồi từ người dùng
            </p>
          </div>
        </div>
        {/* <button
          onClick={exportFeedbacks}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8b3dff] hover:bg-[#7b32e6] text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" /> Xuất dữ liệu
        </button> */}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, color, icon: Icon, trend, isUp }) => {
          const [cardBg, iconBg, iconText, chartBorder] =
            statColorClasses[color];
          return (
            <div
              key={label}
              className={`relative overflow-hidden min-h-[118px] rounded-xl border border-white/5 ${cardBg} p-5`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${iconText}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {value.toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p
                  className={`text-[11px] font-medium flex items-center gap-1 ${isUp ? "text-green-500" : "text-blue-500"}`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {trend}{" "}
                  <span className="text-gray-500">so với tuần trước</span>
                </p>
              </div>
              {/* Fake Chart Wave */}
              <div
                className={`absolute -bottom-6 right-0 w-32 h-16 border-t-[3px] ${chartBorder} rounded-[100%] rotate-[-15deg] opacity-50`}
              ></div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#141418] border border-white/5 rounded-xl p-4 mb-6 flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo nội dung, email, tên người gửi..."
            className="w-full bg-[#141418] border border-white/10 rounded-lg pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Loại phản hồi</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#141418] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none"
            >
              <option value="All">Tất cả</option>
              <option value="bug">Báo lỗi</option>
              <option value="feature">Góp ý</option>
              <option value="ui">Giao diện</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141418] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none"
            >
              <option value="All">Tất cả</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="Resolved">Đã trả lời</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Thời gian gửi</span>
            <label className="flex items-center bg-[#141418] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300">
              <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent outline-none text-gray-300 w-[120px]"
              />
            </label>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-[#141418] text-sm text-gray-300 hover:bg-white/5 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" /> Bộ lọc
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-white/5 px-2">
          {[
            [
              "All",
              "Tất cả",
              totalFeedbacks,
              "bg-purple-500/20 text-purple-400",
            ],
            [
              "Pending",
              "Chờ xử lý",
              pendingFeedbacks,
              "bg-orange-500/20 text-orange-400",
            ],
            [
              "Resolved",
              "Đã trả lời",
              resolvedFeedbacks,
              "bg-green-500/20 text-green-400",
            ],
          ].map(([value, label, count, badgeColor]) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`whitespace-nowrap px-5 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === value
                  ? "text-purple-400 border-purple-500"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              {label}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}
              >
                {count.toLocaleString("vi-VN")}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center p-12 text-gray-400 text-sm">
            Không có phản hồi nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#141418]">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-transparent accent-purple-500"
                    />
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                    Người gửi
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                    Loại phản hồi
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400">
                    Nội dung
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                    Tệp đính kèm
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                    Ngày gửi
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-400 text-center whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleFeedbacks.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-600 bg-transparent accent-purple-500"
                      />
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            f.userAvatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userEmail}`
                          }
                          className="w-9 h-9 rounded-full object-cover bg-gray-800"
                          alt="avatar"
                        />
                        <div>
                          <div className="font-semibold text-sm text-gray-200 flex items-center gap-1.5">
                            {f.userFullName}
                            {f.isPremium && (
                              <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider flex items-center">
                                <Crown
                                  className="w-3 h-3 mr-0.5"
                                  fill="currentColor"
                                />{" "}
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {f.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getTypeBadge(f.type)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-400 line-clamp-1 max-w-[250px] xl:max-w-[300px]">
                        {f.content}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {f.attachmentUrl ? (
                        <div className="flex items-center gap-1">
                          {(() => {
                            let images = [];
                            try {
                              images = JSON.parse(f.attachmentUrl);
                              if (!Array.isArray(images)) images = [f.attachmentUrl];
                            } catch {
                              images = [f.attachmentUrl];
                            }
                            return images.slice(0, 3).map((url, i) => (
                              <button
                                type="button"
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(images, i);
                                }}
                                className="block w-8 h-8 rounded border border-white/10 overflow-hidden hover:border-white/30 transition-colors relative cursor-pointer"
                              >
                                <img
                                  src={url}
                                  alt="Đính kèm"
                                  className="w-full h-full object-cover"
                                />
                                {i === 2 && images.length > 3 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white">
                                    +{images.length - 3}
                                  </div>
                                )}
                              </button>
                            ));
                          })()}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {moment(f.createdAt).fromNow()}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {moment(f.createdAt).format("DD/MM/YYYY HH:mm")}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {f.status === "Resolved" ? (
                        <span className="inline-flex items-center gap-1.5 text-green-500 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã trả lời
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-orange-500 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleReplyClick(f)}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors mx-auto block"
                        title={
                          f.status === "Resolved" ? "Xem & Sửa" : "Trả lời"
                        }
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredFeedbacks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/5 bg-[#0a0a0c]">
            <span className="text-xs text-gray-500 font-medium">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredFeedbacks.length)}{" "}
              của {filteredFeedbacks.length.toLocaleString("vi-VN")} phản hồi
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(Math.min(totalPages, 3))].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-8 h-8 rounded-lg border text-xs font-medium transition-colors ${
                    currentPage === index + 1
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              {totalPages > 3 && (
                <MoreHorizontal className="w-4 h-4 mx-1 text-gray-600" />
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="ml-2 bg-[#141418] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {/* Reply Modal */}
      {replyModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111115] rounded-1xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[100vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-[#1a1a20]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Xử lý phản hồi
                  </h2>
                  <p className="text-xs text-gray-400">
                    Trả lời trực tiếp đến người dùng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 overflow-y-auto">
              {/* Tin nhắn của người dùng */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={
                      selectedFeedback.userAvatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFeedback.userEmail}`
                    }
                    className="w-10 h-10 rounded-full object-cover bg-[#1a1a20] border border-white/5"
                    alt="avatar"
                  />
                  <div>
                    <div className="font-semibold text-sm text-gray-200 flex items-center gap-2">
                      {selectedFeedback.userFullName}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                        {selectedFeedback.type === "bug"
                          ? "Báo lỗi"
                          : selectedFeedback.type === "feature"
                            ? "Góp ý"
                            : selectedFeedback.type === "ui"
                              ? "Giao diện"
                              : "Khác"}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <span>{selectedFeedback.userEmail}</span>
                      <span>•</span>
                      <span>
                        {moment(selectedFeedback.createdAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bong bóng chat */}
                <div className="bg-[#1a1a20] p-4 rounded-2xl rounded-tl-none border border-white/5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap ml-[52px]">
                  {selectedFeedback.content}

                  {selectedFeedback.attachmentUrl && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-gray-500 mb-2 font-medium">
                        Tệp đính kèm:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          let images = [];
                          try {
                            images = JSON.parse(selectedFeedback.attachmentUrl);
                            if (!Array.isArray(images)) images = [selectedFeedback.attachmentUrl];
                          } catch {
                            images = [selectedFeedback.attachmentUrl];
                          }
                          return images.map((url, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => openLightbox(images, i)}
                              className="block w-32 h-32 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer"
                            >
                              <img
                                src={url}
                                alt={`Đính kèm ${i + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form trả lời của Admin */}
              <form
                onSubmit={handleReplySubmit}
                className="flex flex-col gap-4 ml-[52px]"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Crown className="w-3 h-3 text-purple-400" />
                    </div>
                    Phản hồi từ Ban quản trị
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Nhập nội dung trả lời cho người dùng này (hệ thống sẽ gửi thông báo đến email của họ)..."
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none h-40 shadow-inner"
                  ></textarea>
                </div>

                <div className="flex justify-end items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReplyModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={replying || !replyContent.trim()}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    {replying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {selectedFeedback.status === "Resolved"
                      ? "Cập nhật câu trả lời"
                      : "Gửi câu trả lời"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === 0 ? lightboxImages.length - 1 : prev - 1
              )
            }
            disabled={lightboxImages.length <= 1}
            className={`absolute left-6 p-3 rounded-full transition-colors ${
              lightboxImages.length > 1 
                ? "text-white/70 hover:text-white hover:bg-white/10 cursor-pointer" 
                : "text-white/20 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={lightboxImages[lightboxIndex]}
            alt="Phóng to"
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          />

          <button
            onClick={() =>
              setLightboxIndex((prev) =>
                prev === lightboxImages.length - 1 ? 0 : prev + 1
              )
            }
            disabled={lightboxImages.length <= 1}
            className={`absolute right-6 p-3 rounded-full transition-colors ${
              lightboxImages.length > 1 
                ? "text-white/70 hover:text-white hover:bg-white/10 cursor-pointer" 
                : "text-white/20 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {lightboxImages.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {lightboxImages.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                    i === lightboxIndex
                      ? "bg-white scale-125"
                      : "bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, unread, read
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/notifications?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error("Lỗi khi đánh dấu đã đọc");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu đọc tất cả");
    } catch (error) {
      toast.error("Lỗi khi xử lý");
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Đã xóa thông báo");
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "Report":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "Violation":
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "Feedback":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-purple-500" />;
    }
  };

  const adminTypes = ["Report", "Violation", "Feedback", "Withdrawal", "System", "Admin"];

  // Lọc dữ liệu
  const filteredData = notifications.filter((item) => {
    if (!adminTypes.includes(item.type)) return false;

    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "unread"
        ? !item.isRead
        : item.isRead;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#FF5722]" />
            Thông báo hệ thống
          </h1>
          <p className="text-gray-400 mt-2">
            Quản lý và theo dõi các thông báo, cảnh báo từ hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            <CheckCircle className="w-4 h-4" />
            Đánh dấu đọc tất cả
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#141418] border border-white/10 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-[#FF5722] focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#141418] border border-white/10 rounded-xl px-3 py-1">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none text-white focus:outline-none cursor-pointer py-1.5"
          >
            <option value="all" className="bg-[#141418]">Tất cả trạng thái</option>
            <option value="unread" className="bg-[#141418]">Chưa đọc</option>
            <option value="read" className="bg-[#141418]">Đã đọc</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#FF5722] animate-spin mb-4" />
              <p className="text-gray-400">Đang tải thông báo...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Không có thông báo nào
              </h3>
              <p className="text-gray-400 max-w-md">
                Hiện tại bạn chưa nhận được thông báo mới nào hoặc không có kết quả phù hợp với tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-colors group relative ${
                    notif.isRead
                      ? "bg-white/[0.02] border-white/5"
                      : "bg-[#FF5722]/10 border-[#FF5722]/30"
                  }`}
                >
                  {/* Status Indicator */}
                  {!notif.isRead && (
                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#FF5722] animate-pulse"></div>
                  )}

                  <div className="shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-white/5' : 'bg-[#FF5722]/20'}`}>
                      {getIconForType(notif.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-medium mb-1 ${notif.isRead ? 'text-gray-300' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <p className={`text-sm mb-2 whitespace-pre-wrap ${notif.isRead ? 'text-gray-500' : 'text-gray-300'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{new Date(notif.createdAt).toLocaleString("vi-VN")}</span>
                      {notif.type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{notif.type}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 text-gray-400 hover:text-green-400 bg-white/5 hover:bg-green-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Hiển thị <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> đến{" "}
              <span className="text-white">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              trong số <span className="text-white">{filteredData.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-white/5 text-white hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                Trước
              </button>
              <div className="text-sm text-gray-400 px-2">
                Trang {currentPage} / {totalPages}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm bg-white/5 text-white hover:bg-white/10 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

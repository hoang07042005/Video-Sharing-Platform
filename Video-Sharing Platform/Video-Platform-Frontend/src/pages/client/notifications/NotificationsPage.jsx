import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "moment/dist/locale/vi";
import {
  Bell,
  Trash2,
  Check,
  UserPlus,
  MessageSquare,
  DollarSign,
  PlayCircle,
  Search,
  CheckCircle2,
  X,
  Clock,
  Calendar,
  Target,
  Zap,
  Shield,
  Crown,
  Wallet,
  Send,
  Pin,
  Quote,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

moment.locale("vi");

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, unread, read
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotif, setSelectedNotif] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/notifications?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(
        "/api/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(
        `/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const closeNotifModal = () => setSelectedNotif(null);

  const getFallbackTitle = (type) => {
    switch (type?.toLowerCase()) {
      case "comment":
        return "Bình luận mới";
      case "subscribe":
        return "Người đăng ký mới";
      case "follow":
        return "Người theo dõi mới";
      case "donation":
        return "Ủng hộ mới";
      case "stream":
        return "Cập nhật Stream";
      case "communitypost":
        return "Bài viết cộng đồng";
      case "feedbackreply":
        return "Phản hồi hỗ trợ";
      default:
        return "Thông báo hệ thống";
    }
  };

  const getNotificationIcon = (type, title) => {
    const t = type?.toLowerCase();
    const ttl = title?.toLowerCase() || "";
    if (t === "subscribe" || t === "follow")
      return <UserPlus className="w-5 h-5 text-[#3b82f6]" />;
    if (t === "comment")
      return <MessageSquare className="w-5 h-5 text-[#f97316]" />;
    if (t === "donation")
      return <DollarSign className="w-5 h-5 text-[#eab308]" />;
    if (t === "stream")
      return <PlayCircle className="w-5 h-5 text-[#a855f7]" />;
    if (t === "communitypost")
      return <MessageSquare className="w-5 h-5 text-[#a855f7]" />;
    if (t === "feedbackreply")
      return <CheckCircle2 className="w-5 h-5 text-[#14b8a6]" />;
    if (t === "system") {
      if (ttl.includes("rút tiền"))
        return <Wallet className="w-5 h-5 text-[#ef4444]" />;
      if (ttl.includes("hội viên") || ttl.includes("vip"))
        return <Crown className="w-5 h-5 text-[#eab308]" />;
      if (ttl.includes("bảo mật") || ttl.includes("đăng nhập"))
        return <Shield className="w-5 h-5 text-gray-300" />;
      return <Bell className="w-5 h-5 text-[#f97316]" />;
    }
    return <Bell className="w-5 h-5 text-gray-400" />;
  };

  const getNotificationColor = (type, title) => {
    const t = type?.toLowerCase();
    const ttl = title?.toLowerCase() || "";
    if (t === "subscribe" || t === "follow")
      return "bg-[#3b82f6]/20 border-transparent";
    if (t === "comment") return "bg-[#f97316]/20 border-transparent";
    if (t === "donation") return "bg-[#eab308]/20 border-transparent";
    if (t === "stream" || t === "communitypost")
      return "bg-[#a855f7]/20 border-transparent";
    if (t === "feedbackreply") return "bg-[#14b8a6]/20 border-transparent";
    if (t === "system") {
      if (ttl.includes("rút tiền")) return "bg-[#ef4444]/20 border-transparent";
      if (ttl.includes("hội viên") || ttl.includes("vip"))
        return "bg-[#eab308]/20 border-transparent";
      if (ttl.includes("bảo mật") || ttl.includes("đăng nhập"))
        return "bg-gray-600/40 border-transparent";
      return "bg-[#f97316]/20 border-transparent";
    }
    return "bg-gray-500/20 border-transparent";
  };

  const getNotificationGlowColor = (type, title) => {
    const t = type?.toLowerCase();
    const ttl = title?.toLowerCase() || "";
    if (t === "subscribe" || t === "follow") return "bg-[#3b82f6]";
    if (t === "comment") return "bg-[#f97316]";
    if (t === "donation") return "bg-[#eab308]";
    if (t === "stream" || t === "communitypost") return "bg-[#a855f7]";
    if (t === "feedbackreply") return "bg-[#14b8a6]";
    if (t === "system") {
      if (ttl.includes("rút tiền")) return "bg-[#ef4444]";
      if (ttl.includes("hội viên") || ttl.includes("vip"))
        return "bg-[#eab308]";
      if (ttl.includes("bảo mật") || ttl.includes("đăng nhập"))
        return "bg-gray-500";
      return "bg-[#f97316]";
    }
    return "bg-gray-500";
  };

  const getNotificationBorderColor = (type, title) =>
    getNotificationGlowColor(type, title).replace("bg-", "border-");

  const getNotificationTheme = (type, title) => {
    const t = type?.toLowerCase();
    const ttl = title?.toLowerCase() || "";

    let hex = "#a854f7ff";
    let bgGradient = "from-[#111111] via-[#150f1c] to-[#1a082a]";
    let text = "text-[#8400ffff]";
    let activeBg = "bg-[#8400ffff]/10";
    let activeBorder = "border-l-[#8400ffff]";

    if (t === "subscribe" || t === "follow") {
      hex = "#3b82f6";
      bgGradient = "from-[#111111] via-[#0f151c] to-[#08152a]";
      text = "text-[#3b82f6]";
      activeBg = "bg-[#3b82f6]/10";
      activeBorder = "border-l-[#3b82f6]";
    } else if (t === "comment") {
      hex = "#f97316";
      bgGradient = "from-[#111111] via-[#2a1608] to-[#1a082a]";
      text = "text-[#f97316]";
      activeBg = "bg-gradient-to-r from-orange-500/10 to-purple-500/10";
      activeBorder = "border-l-[#f97316]";
    } else if (t === "donation") {
      hex = "#eab308";
      bgGradient = "from-[#111111] via-[#1c1a0f] to-[#2a2508]";
      text = "text-[#eab308]";
      activeBg = "bg-[#eab308]/10";
      activeBorder = "border-l-[#eab308]";
    } else if (t === "system" && ttl.includes("rút tiền")) {
      hex = "#ef4444";
      bgGradient = "from-[#111111] via-[#1c0f0f] to-[#2a0808]";
      text = "text-[#ef4444]";
      activeBg = "bg-[#ef4444]/10";
      activeBorder = "border-l-[#ef4444]";
    } else if (
      t === "system" &&
      (ttl.includes("hội viên") || ttl.includes("vip"))
    ) {
      hex = "#eab308";
      bgGradient = "from-[#111111] via-[#1c1a0f] to-[#2a2508]";
      text = "text-[#eab308]";
      activeBg = "bg-[#eab308]/10";
      activeBorder = "border-l-[#eab308]";
    } else if (
      t === "system" &&
      (ttl.includes("bảo mật") || ttl.includes("đăng nhập"))
    ) {
      hex = "#9ca3af";
      bgGradient = "from-[#111111] via-[#151515] to-[#1f1f1f]";
      text = "text-[#9ca3af]";
      activeBg = "bg-gray-500/10";
      activeBorder = "border-l-gray-400";
    } else if (t === "system") {
      hex = "#f97316";
      bgGradient = "from-[#111111] via-[#2a1608] to-[#1a082a]";
      text = "text-[#f97316]";
      activeBg = "bg-gradient-to-r from-orange-500/10 to-purple-500/10";
      activeBorder = "border-l-[#f97316]";
    }

    return { hex, bgGradient, text, activeBg, activeBorder };
  };

  const parseSystemMessage = (message) => {
    if (!message) return { header: "", details: [], footer: "" };
    const lines = message.split("\n");
    let header = [];
    let details = [];
    let footer = [];
    let state = "header";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) {
        state = "details";
        const parts = trimmed.substring(2).split(":");
        if (parts.length >= 2) {
          details.push({
            key: parts[0].trim(),
            value: parts.slice(1).join(":").trim(),
          });
        }
      } else {
        if (state === "details" && trimmed !== "") {
          state = "footer";
        }
        if (state === "header") {
          header.push(line);
        } else if (state === "footer") {
          footer.push(line);
        }
      }
    });

    return {
      header: header.join("\n").trim(),
      details: details,
      footer: footer.join("\n").trim(),
    };
  };

  // Filter logic
  const filteredNotifications = notifications.filter((notif) => {
    // Tab filter
    if (activeTab === "unread" && notif.isRead) return false;
    if (activeTab === "read" && !notif.isRead) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const titleLower = (notif.title || "").toLowerCase();
      const messageLower = notif.message.toLowerCase();
      return (
        titleLower.includes(searchLower) || messageLower.includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="pt-20 px-4 md:px-8 max-w-[1400px] mx-auto min-h-screen flex flex-col pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0 mt-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Thông báo</h1>
          <p className="text-gray-400">
            Xem và quản lý tất cả các hoạt động liên quan đến bạn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-white/20 w-64 transition-colors"
            />
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#202020] hover:bg-[#252525] border border-white/5 rounded-xl text-sm font-medium text-gray-300 transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-[#FF8A65]" />
            Đánh dấu đã đọc tất cả
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* LLeft Pane: List */}
        <div className="flex-1 lg:max-w-[35%] flex flex-col bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === "all" ? "text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
            >
              Tất cả
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${activeTab === "all" ? "bg-[#ef4444] text-white" : "bg-white/10 text-gray-400"}`}
              >
                {notifications.length}
              </span>
              {activeTab === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === "unread" ? "text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
            >
              Chưa đọc
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${activeTab === "unread" ? "bg-[#ef4444] text-white" : "bg-white/10 text-gray-400"}`}
              >
                {notifications.filter((n) => !n.isRead).length}
              </span>
              {activeTab === "unread" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("read")}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${activeTab === "read" ? "text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
            >
              Đã đọc
              {activeTab === "read" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex flex-col flex-1">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-4">
                <div className="w-8 h-8 border-2 border-white/10 border-t-[#FF8A65] rounded-full animate-spin"></div>
                <p>Đang tải thông báo...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const theme = getNotificationTheme(notif.type, notif.title);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group flex items-start gap-4 p-5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 ${selectedNotif?.id === notif.id ? `${theme.activeBg} border-l-4 ${theme.activeBorder}` : !notif.isRead ? "bg-white/[0.02]" : ""}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border ${getNotificationColor(notif.type, notif.title)}`}
                    >
                      {getNotificationIcon(notif.type, notif.title)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p
                          className={`text-[15px] leading-relaxed line-clamp-1 ${!notif.isRead ? "text-white font-medium" : "text-gray-300"}`}
                        >
                          {notif.title}
                        </p>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="p-1.5 text-gray-400 hover:text-[#FF8A65] hover:bg-[#FF8A65]/10 rounded-lg transition-colors tooltip"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors tooltip"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          {moment
                            .utc(notif.createdAt)
                            .local()
                            .locale("vi")
                            .fromNow()}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Không có thông báo nào
                </h3>
                <p className="text-gray-400">
                  Bạn hiện không có thông báo nào trong danh mục này.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Notification Detail */}
        {selectedNotif ? (
          (() => {
            const selectedTheme = getNotificationTheme(
              selectedNotif.type,
              selectedNotif.title,
            );
            return (
              <div
                className={`hidden lg:flex flex-1 flex-col bg-gradient-to-b ${selectedTheme.bgGradient} border border-white/5 rounded-2xl overflow-hidden shadow-xl relative`}
              >
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  {/* Ambient Glow */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
                    <div
                      className={`absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 ${getNotificationGlowColor(selectedNotif.type, selectedNotif.title)}`}
                    />
                    <div
                      className={`absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 ${getNotificationGlowColor(selectedNotif.type, selectedNotif.title)}`}
                    />
                  </div>

                  {/* Landscape Background Image (Dễ dàng thay đổi ảnh tại public/landscape.png) */}
                  <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none z-0 overflow-hidden rounded-b-2xl">
                    <img
                      src="/notification.png"
                      alt="Landscape"
                      className="w-full h-auto max-h-[350px] object-cover opacity-80"
                    />
                  </div>

                  <div className="p-10 flex-1 relative z-10">
                    <div className="flex flex-col items-center text-center mb-10 mt-2 relative">
                      <div className="absolute right-0 top-0 flex gap-2">
                        <button className="p-2 bg-black/40 border border-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors backdrop-blur-md">
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            handleDelete(selectedNotif.id, e);
                            setSelectedNotif(null);
                          }}
                          className="p-2 bg-black/40 border border-white/5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors backdrop-blur-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={closeNotifModal}
                          className="p-2 bg-black/40 border border-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors backdrop-blur-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        className={`w-32 h-32 rounded-full flex items-center justify-center shrink-0 border mb-8 ${selectedNotif.type?.toLowerCase() === "system" && selectedNotif.title?.toLowerCase().includes("rút tiền") ? "bg-[#2a1111] border-[#ef4444]" : getNotificationColor(selectedNotif.type, selectedNotif.title)} relative group mt-8`}
                      >
                        <div
                          className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl ${getNotificationGlowColor(selectedNotif.type, selectedNotif.title)}`}
                        />
                        <div className="scale-[2.5] relative z-10">
                          {selectedNotif.type?.toLowerCase() === "system" &&
                          selectedNotif.title
                            ?.toLowerCase()
                            .includes("rút tiền") ? (
                            <Check className="w-6 h-6 text-white font-bold stroke-[3px]" />
                          ) : (
                            getNotificationIcon(
                              selectedNotif.type,
                              selectedNotif.title,
                            )
                          )}
                        </div>
                        {/* Sparkles */}
                        <div
                          className={`absolute -top-6 left-0 ${selectedTheme.text} opacity-50 text-xl animate-pulse`}
                        >
                          ✦
                        </div>
                        <div
                          className={`absolute -top-2 -right-8 ${selectedTheme.text} opacity-50 text-2xl animate-pulse delay-150`}
                        >
                          ✦
                        </div>
                        <div
                          className={`absolute bottom-4 -right-4 ${selectedTheme.text} opacity-50 text-sm animate-pulse delay-300`}
                        >
                          ✦
                        </div>
                        <div
                          className={`absolute top-1/2 -left-8 ${selectedTheme.text} opacity-30 text-sm animate-pulse delay-75`}
                        >
                          ✦
                        </div>
                      </div>

                      <h2 className="text-3xl font-extrabold text-white mt-6 mb-3 px-8 drop-shadow-lg text-center leading-tight max-w-[90%]">
                        {selectedNotif.title ||
                          getFallbackTitle(selectedNotif.type)}
                      </h2>
                      {selectedNotif.type?.toLowerCase() === "system" &&
                        selectedNotif.title
                          ?.toLowerCase()
                          .includes("rút tiền") && (
                          <div className="flex items-center gap-2 text-sm text-[#22c55e] bg-[#0f2a1a] px-4 py-1.5 rounded-full font-medium border border-[#22c55e] mb-4 shadow-lg shadow-green-900/20">
                            <CheckCircle2 className="w-4 h-4" />
                            Giao dịch thành công
                          </div>
                        )}
                      <div className="flex items-center gap-2 text-[15px] text-gray-400 font-medium opacity-80">
                        <Calendar className="w-4 h-4" />
                        {moment
                          .utc(selectedNotif.createdAt)
                          .local()
                          .locale("vi")
                          .format("DD/MM/YYYY • HH:mm")}
                      </div>
                    </div>

                    {selectedNotif.type?.toLowerCase() === "system" &&
                    selectedNotif.title?.toLowerCase().includes("rút tiền") ? (
                      (() => {
                        const parsed = parseSystemMessage(
                          selectedNotif.message,
                        );
                        return (
                          <div className="max-w-2xl mx-auto w-full">
                            <div className="bg-black/5 backdrop-blur-2xl border border-white/5 rounded-[10px] p-6 mb-6">
                              <h3 className="text-white font-semibold mb-6 text-[15px]">
                                Chi tiết giao dịch
                              </h3>
                              <div className="flex flex-col gap-4">
                                {parsed.details.map((detail, idx) => {
                                  let Icon = Target;
                                  if (detail.key.toLowerCase().includes("mã"))
                                    Icon = Calendar;
                                  if (detail.key.toLowerCase().includes("tiền"))
                                    Icon = UserPlus;
                                  if (
                                    detail.key.toLowerCase().includes("phương")
                                  )
                                    Icon = Zap;

                                  let valueColor = "text-white";
                                  if (detail.key.toLowerCase().includes("mã"))
                                    valueColor = "text-[#ef4444]";
                                  if (detail.key.toLowerCase().includes("tiền"))
                                    valueColor = "text-[#eab308]";

                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between pb-4 border-b border-white/5 last:border-b-0 last:pb-0"
                                    >
                                      <div className="flex items-center gap-3 text-white">
                                        <Icon className="w-5 h-5 text-white" />
                                        <span className="text-[15px]">
                                          {detail.key}
                                        </span>
                                      </div>
                                      {detail.key
                                        .toLowerCase()
                                        .includes("trạng thái") ? (
                                        <span className="text-[13px] text-[#22c55e] bg-green-900/30 px-3 py-1 rounded-md font-semibold">
                                          {detail.value}
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-[15px] font-semibold ${valueColor}`}
                                        >
                                          {detail.value}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="bg-black/5 backdrop-blur-2xl border border-white/5 rounded-[10px] p-6 mb-[100px] relative overflow-hidden">
                              <Quote
                                className={`w-6 h-6 ${selectedTheme.text} mb-4 opacity-70`}
                              />
                              <p className="text-white text-[15px] leading-[1.8] whitespace-pre-wrap mb-6">
                                {parsed.header}
                              </p>
                              <p className="text-white text-[15px] leading-[1.8] whitespace-pre-wrap mb-8">
                                {parsed.footer}
                              </p>

                              <div className="flex flex-col gap-1">
                                <p className="text-sm text-white italic">
                                  Trân trọng,
                                </p>
                                <p className="text-[15px] font-semibold text-white">
                                  Đội ngũ Quản trị Video Sharing Platform
                                </p>
                              </div>
                              <Send
                                className={`absolute bottom-6 right-6 w-8 h-8 ${selectedTheme.text} opacity-20 -rotate-12`}
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div
                        className={`relative bg-black/20 backdrop-blur-2xl p-8 rounded-[10px] border border-white/10 mb-10 overflow-hidden max-w-2xl mx-auto w-full`}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none scale-[3]">
                          {getNotificationIcon(
                            selectedNotif.type,
                            selectedNotif.title,
                          )}
                        </div>
                        <div className="relative z-10 flex gap-4 w-full">
                          <div className="mt-1 opacity-60 shrink-0">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-200 text-[16px] leading-[1.8] whitespace-pre-wrap">
                              {selectedNotif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!selectedNotif.title
                      ?.toLowerCase()
                      .includes("rút tiền") && (
                      <div className="flex gap-4 max-w-lg mx-auto mt-10">
                        {selectedNotif.targetUrl && (
                          <button
                            onClick={() => navigate(selectedNotif.targetUrl)}
                            className="flex-1 py-4 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                          >
                            Xem chi tiết
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            handleDelete(selectedNotif.id, e);
                            setSelectedNotif(null);
                          }}
                          className="flex-1 py-4 rounded-xl border border-white/10 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Xóa thông báo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="hidden lg:flex flex-1 flex-col bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl relative">
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Chưa chọn thông báo nào
              </h3>
              <p className="text-gray-400 max-w-sm">
                Vui lòng chọn một thông báo từ danh sách bên trái để xem chi
                tiết
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Mobile Modal (Optional fallback for small screens) */}
      {selectedNotif && (
        <div className="lg:hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151515] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <button
              onClick={closeNotifModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${getNotificationColor(selectedNotif.type)}`}
                >
                  {selectedNotif.imageUrl ? (
                    <img
                      src={selectedNotif.imageUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getNotificationIcon(selectedNotif.type)
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-200">
                    {selectedNotif.title ||
                      getFallbackTitle(selectedNotif.type)}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {moment
                      .utc(selectedNotif.createdAt)
                      .local()
                      .locale("vi")
                      .format("DD/MM/YYYY HH:mm")}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {selectedNotif.message}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeNotifModal}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                  Đóng
                </button>
                {selectedNotif.targetUrl && (
                  <button
                    onClick={() => {
                      closeNotifModal();
                      navigate(selectedNotif.targetUrl);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#FF8A65] text-black hover:bg-[#FF8A65]/90 font-medium transition-colors"
                  >
                    Xem chi tiết
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

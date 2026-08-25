import { useState, useRef, useEffect } from "react";
import {
  Search,
  Video,
  Bell,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  User,
  UserPlus,
  Upload,
  Smartphone,
  Radio,
  Crown,
  Users,
  Coins,
  DollarSign,
  PlayCircle,
  MessageSquare,
  X,
  Clock,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import moment from "moment";

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const handle = localStorage.getItem("handle");
  const avatar =
    localStorage.getItem("avatar") ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";
  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const isAdmin = roles.includes("Admin");

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [logoUrl, setLogoUrl] = useState("/logotrang.png");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [premiumUntil, setPremiumUntil] = useState(null);
  const [coins, setCoins] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isChannelVerified, setIsChannelVerified] = useState(false);
  const [tier, setTier] = useState(
    parseInt(localStorage.getItem("subscriptionTier") || "0", 10),
  );
  const headerRef = useRef(null);

  useEffect(() => {
    if (!token || !handle) {
      return;
    }

    axios
      .get("/api/channels/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setIsChannelVerified(
          res.data?.isVerified === true || res.data?.isVerified === "true",
        );
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          console.error("Lỗi khi tải trạng thái xác minh kênh:", err);
        }
        setIsChannelVerified(false);
      });
  }, [token, handle]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await axios.get("/api/admin/settings/public");
        if (res.data) {
          if (res.data.logoUrl) {
            setLogoUrl(res.data.logoUrl);
          }
          if (res.data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.getElementsByTagName("head")[0].appendChild(link);
            }
            link.href = res.data.faviconUrl;
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu hình public:", err);
      }
    };
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    if (token) {
      // Fetch unread count
      axios
        .get("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUnreadCount(res.data.unreadCount || 0))
        .catch((err) => console.error("Error fetching unread count", err));
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchPlan = async () => {
      try {
        const res = await axios.get("/api/payment/current-plan", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const plan = res.data?.plan?.trim();
        if (!plan) return;

        const normalizedPlan =
          plan.toLowerCase() === "premium"
            ? "Premium"
            : plan.toLowerCase() === "plus"
              ? "Plus"
              : "Free";

        setCurrentPlan(normalizedPlan);
        localStorage.setItem("plan", normalizedPlan);

        const currentTier =
          normalizedPlan === "Premium"
            ? 2
            : normalizedPlan === "Plus"
              ? 1
              : 0;
        localStorage.setItem("subscriptionTier", currentTier);
        setTier(currentTier);
        setPremiumUntil(
          res.data.premiumUntil ? new Date(res.data.premiumUntil) : null,
        );

        if (res.data.coins !== undefined) {
          setCoins(res.data.coins);
        }
      } catch (err) {
        console.error("Lỗi khi tải gói:", err);
      }
    };

    fetchPlan();
    window.addEventListener("focus", fetchPlan);
    document.addEventListener("visibilitychange", fetchPlan);

    return () => {
      window.removeEventListener("focus", fetchPlan);
      document.removeEventListener("visibilitychange", fetchPlan);
    };
  }, [token, location.pathname]);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Handle outside click for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
        );
        const { channels, playlists, videos, shorts } = res.data;

        const allTitles = [
          ...(channels || []).map((c) => c.channelName),
          ...(playlists || []).map((p) => p.title),
          ...(videos || []).map((v) => v.title),
          ...(shorts || []).map((s) => s.title),
        ];

        // Remove duplicate titles for suggestions
        const uniqueTitles = Array.from(new Set(allTitles)).slice(0, 8);
        const formattedSuggestions = uniqueTitles.map((title) => ({ title }));
        setSuggestions(formattedSuggestions);
      } catch (err) {
        console.error("Lỗi khi tìm kiếm gợi ý:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleNotifications = async () => {
    if (activeDropdown === "notifications") {
      setActiveDropdown(null);
      return;
    }
    setActiveDropdown("notifications");
    setLoadingNotifs(true);
    try {
      const res = await axios.get("/api/notifications?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.put(
          `/api/notifications/${notif.id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        // Update local state to reflect it's read
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
      } catch (err) {
        console.error(err);
      }
    }
    setActiveDropdown(null);
    setSelectedNotif(notif);
  };

  const closeNotifModal = () => setSelectedNotif(null);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "subscribe":
      case "follow":
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      case "comment":
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      case "donation":
        return <DollarSign className="w-5 h-5 text-yellow-400" />;
      case "stream":
        return <PlayCircle className="w-5 h-5 text-purple-400" />;
      case "communitypost":
        return <MessageSquare className="w-5 h-5 text-orange-400" />;
      case "system":
        return <Bell className="w-5 h-5 text-red-400" />;
      case "feedbackreply":
        return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case "subscribe":
      case "follow":
        return "bg-blue-500/10 border-blue-500/20";
      case "comment":
        return "bg-green-500/10 border-green-500/20";
      case "donation":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "stream":
        return "bg-purple-500/10 border-purple-500/20";
      case "communitypost":
        return "bg-orange-500/10 border-orange-500/20";
      case "system":
        return "bg-red-500/10 border-red-500/20";
      case "feedbackreply":
        return "bg-teal-500/10 border-teal-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  const getNotificationGlowColor = (type) => {
    switch (type?.toLowerCase()) {
      case "subscribe":
      case "follow":
        return "bg-blue-500";
      case "comment":
        return "bg-green-500";
      case "donation":
        return "bg-yellow-500";
      case "stream":
        return "bg-purple-500";
      case "communitypost":
        return "bg-orange-500";
      case "system":
        return "bg-red-500";
      case "feedbackreply":
        return "bg-teal-500";
      default:
        return "bg-gray-500";
    }
  };

  const getNotificationBorderColor = (type) =>
    getNotificationGlowColor(type).replace("bg-", "border-");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(
        `/results?search_query=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowSuggestions(false);
    navigate(`/results?search_query=${encodeURIComponent(title)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("handle");
    localStorage.removeItem("avatar");
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F0F]  border-white/5 flex items-center justify-between px-3 z-50">
      {/* Left Area: Menu & Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center h-18 w-28 ml-2">
          <img
            src={logoUrl}
            alt="Video Sharing Platform"
            className="w-full h-full object-contain"
          />
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex justify-end"
        >
          <div className="relative w-[500px] h-8 flex justify-end">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none">
              <Search className="w-full h-full" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-full py-2.5 pl-12 pr-16 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-[#202020] transition-colors text-sm"
            />
            {/* Action button inside input (optional look like youtube) */}
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-5 bg-white/5 hover:bg-white/10 border-l border-white/5 rounded-r-full text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#202020] border border-white/10 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(item.title)}
                  className="w-full flex items-center gap-4 px-5 py-2 hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[15px] font-medium text-gray-200 truncate">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-0.5 ml-4">
        {token ? (
          <>
            <div
              className="relative"
              ref={activeDropdown === "create" ? headerRef : null}
            >
              <div
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "create" ? null : "create",
                  )
                }
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-[52px] h-[48px] rounded-[18px] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5">
                  <Video className="w-[22px] h-[22px] text-[#FF8A65]" />
                </div>
              </div>

              {activeDropdown === "create" && (
                <div className="absolute right-0 top-full bg-[#0F0F0F] mt-4 w-56 border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                  <Link
                    to="/studio/upload"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                  >
                    <Upload className="w-5 h-5" /> Tải video lên
                  </Link>
                  <Link
                    to="/studio/upload-short"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                  >
                    <Smartphone className="w-5 h-5" /> Tải video ngắn lên
                  </Link>
                  <Link
                    to="/studio/live"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                  >
                    <Radio className="w-5 h-5" /> Phát trực tiếp
                  </Link>
                </div>
              )}
            </div>

            <div
              className="flex flex-col items-center gap-1.5 group cursor-pointer relative"
              ref={activeDropdown === "notifications" ? headerRef : null}
            >
              <div
                onClick={toggleNotifications}
                className="w-[52px] h-[48px] rounded-[18px] group-hover:bg-[#252525] transition-colors flex items-center justify-center border border-transparent group-hover:border-white/5 relative"
              >
                <Bell className="w-[22px] h-[22px] text-[#FF8A65]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 w-[18px] h-[18px] bg-[#FF1E46] rounded-full flex items-center justify-center text-[10px] font-bold text-white translate-x-1/2 -translate-y-1/2 border-2 border-[#1A1A1A]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>

              {activeDropdown === "notifications" && (
                <div className="absolute right-0 top-full bg-[#151515] mt-4 w-[360px] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Thông báo</h3>
                    <span className="text-xs text-gray-400">
                      {unreadCount} chưa đọc
                    </span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto hide-scrollbar flex flex-col">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        Đang tải...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 ${!notif.isRead ? "bg-white/[0.02]" : ""}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center shrink-0">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm line-clamp-1 ${!notif.isRead ? "text-white font-medium" : "text-gray-300"}`}
                            >
                              {notif.title}
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {moment
                                .utc(notif.createdAt)
                                .local()
                                .locale("vi")
                                .fromNow()}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        Không có thông báo nào
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-white/5">
                    <Link
                      to="/notifications"
                      onClick={() => setActiveDropdown(null)}
                      className="block w-full py-2.5 text-center text-sm text-[#FF8A65] hover:bg-[#FF8A65]/10 rounded-xl transition-colors font-medium"
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="w-[1px] h-10 bg-white/10 mx-1"></div>

            <Link
              to={
                location.pathname.startsWith("/live/")
                  ? `/buy-coins?returnTo=${location.pathname}`
                  : "/buy-coins"
              }
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors mx-1 cursor-pointer"
            >
              <Coins className="w-[18px] h-[18px] text-yellow-500" />
              <span className="text-[13px] font-bold text-yellow-500">
                {coins.toLocaleString()} Xu
              </span>
            </Link>

            <div className="w-[1px] h-10 bg-white/10 mx-1"></div>

            {currentPlan && (
              <Link
                to="/premium"
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-full border ${currentPlan === "Premium" ? "border-[#FF9800]/60 bg-[#1f130b] shadow-[0_0_15px_rgba(255,152,0,0.3)]" : currentPlan === "Plus" ? "border-[#9C27B0]/60 bg-[#140b1c] shadow-[0_0_15px_rgba(156,39,176,0.3)]" : "border-white/10 bg-[#1A1A1A] hover:bg-[#222]"} transition-colors cursor-pointer mx-1`}
              >
                <div className="flex items-center justify-center">
                  {currentPlan === "Premium" ? (
                    <Crown
                      className="w-[20px] h-[20px] text-[#FF9800]"
                      fill="currentColor"
                    />
                  ) : currentPlan === "Plus" ? (
                    <User className="w-5 h-5 text-[#9C27B0]" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[12px] font-bold text-white leading-none">
                    {currentPlan === "Premium"
                      ? "Premium"
                      : currentPlan === "Plus"
                          ? "PLUS"
                          : "Miễn phí"}
                  </span>
                  {currentPlan !== "Free" && premiumUntil ? (
                    <span className="text-[8px] text-gray-400 mt-[5px] leading-none">
                      HSD: {premiumUntil.toLocaleDateString("vi-VN")}
                    </span>
                  ) : (
                    <span className="text-[8px] text-gray-400 mt-[5px] leading-none">
                      {currentPlan === "Free"
                        ? "HSD: Không giới hạn"
                        : "Gói bạn đang dùng"}
                    </span>
                  )}
                </div>
                {currentPlan !== "Free" && (
                  <svg
                    className="w-[16px] h-[16px] text-[#8b5cf6] ml-1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="12" />
                    <path
                      d="M10 16.5l-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5-7 7z"
                      fill="#fff"
                    />
                  </svg>
                )}
              </Link>
            )}

            <div className="w-[1px] h-10 bg-white/10 mx-1"></div>

            <div
              className="relative flex items-center"
              ref={activeDropdown === "user" ? headerRef : null}
            >
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === "user" ? null : "user")
                }
                className="flex items-center gap-3 cursor-pointer text-left group relative"
              >
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-full overflow-hidden border-[2px] transition-colors ${tier === 2 ? "border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : tier === 1 ? "border-purple-500" : "border-[#272727] group-hover:border-gray-500"}`}
                  >
                    <img
                      src={avatar}
                      alt="Ảnh đại diện"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {tier >= 1 && (
                    <div className="absolute -top-2 -right-1 bg-[#1a1a1a] rounded-full p-0.5">
                      <Crown
                        className={`w-4 h-4 ${tier === 2 ? "text-orange-500" : "text-purple-400"}`}
                        fill="currentColor"
                      />
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col">
                  <span
                    className={`text-[15px] font-bold leading-tight ${tier === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500" : "text-white"}`}
                  >
                    {handle || "Người dùng"}
                  </span>
                  <span className="text-[12px] text-gray-400 mt-0.5 group-hover:text-gray-300 transition-colors">
                    Xem kênh của bạn
                  </span>
                  {isChannelVerified && (
                    <div className="absolute top-6 right-0 bg-[#1a1a1a] rounded-full p-0.5">
                      <CheckCircle
                        className="w-4 h-4 text-white fill-green-500 shrink-0"
                        fill="currentColor"
                      />
                    </div>
                  )}
                </div>
              </button>

              {activeDropdown === "user" && (
                <div className="absolute right-0 top-full mt-4 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                  <Link
                    to={handle ? `/c/${handle}` : "#"}
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                  >
                    <User className="w-4 h-4" /> Kênh của bạn
                  </Link>
                  <Link
                    to="/studio/revenue"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" /> Doanh thu & Rút tiền
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Trang quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-gray-200 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className="relative flex items-center"
            ref={activeDropdown === "user" ? headerRef : null}
          >
            <button
              onClick={() =>
                setActiveDropdown(activeDropdown === "user" ? null : "user")
              }
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1A1A1A] border-[3px] border-[#272727] hover:border-gray-500 transition-colors cursor-pointer group"
            >
              <User className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
            </button>

            {activeDropdown === "user" && (
              <div className="absolute right-0 top-full mt-4 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden py-2 z-50">
                <Link
                  to="/login"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-200 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Search Mobile (Optional) */}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151515] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <button
              onClick={closeNotifModal}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 overflow-y-auto custom-scrollbar relative">
              <div className="flex items-center gap-3 mb-6 mt-2 relative z-10">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${getNotificationColor(selectedNotif.type)} relative group`}
                >
                  <div
                    className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-lg ${getNotificationGlowColor(selectedNotif.type)}`}
                  />
                  <div className="scale-110 relative z-10">
                    {getNotificationIcon(selectedNotif.type)}
                  </div>
                  {/* Decorative dot */}
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-[2px] border-[#151515] ${getNotificationGlowColor(selectedNotif.type)} z-20`}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight pr-6">
                    {selectedNotif.title}
                  </h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3" />
                    {moment
                      .utc(selectedNotif.createdAt)
                      .local()
                      .locale("vi")
                      .format("DD/MM/YYYY - HH:mm")}
                  </span>
                </div>
              </div>

              <div
                className={`relative bg-gradient-to-br from-[#1C1C1C] to-[#151515] p-5 rounded-2xl border border-white/5 border-l-4 shadow-xl mb-6 ${getNotificationBorderColor(selectedNotif.type)} overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none scale-[2.5]">
                  {getNotificationIcon(selectedNotif.type)}
                </div>
                <div className="relative z-10 flex gap-3 w-full">
                  <div className="mt-0.5 opacity-60 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {["system", "feedbackreply"].includes(
                      selectedNotif.type?.toLowerCase(),
                    ) ? (
                      <div className="flex flex-col h-full">
                        <div className="uppercase tracking-[0.15em] text-[10px] font-bold mb-3 pb-2 border-b border-white/10 opacity-70 flex items-center gap-1.5">
                          <Bell className="w-3 h-3" />
                          Thông báo chính thức từ Video Sharing Platform
                        </div>
                        <p className="text-gray-200 text-[15px] leading-[1.7] whitespace-pre-wrap flex-1">
                          {selectedNotif.message}
                        </p>
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-0.5">
                          <p className="text-xs text-gray-500 italic">
                            Trân trọng,
                          </p>
                          <p className="text-xs font-semibold text-gray-400">
                            Đội ngũ Quản trị Video Sharing Platform
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-[15px] leading-[1.7] whitespace-pre-wrap">
                        {selectedNotif.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeNotifModal}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                  Đóng
                </button>
                {selectedNotif.targetUrl && (
                  <button
                    onClick={() => {
                      closeNotifModal();
                      navigate(selectedNotif.targetUrl);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  >
                    Xem chi tiết
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

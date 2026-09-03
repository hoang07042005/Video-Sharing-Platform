import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Video,
  LogOut,
  List,
  MessageSquare,
  DollarSign,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  Settings as SettingsIcon,
  Shield,
  Search,
  Bell,
  BarChart2,
  HomeIcon,
  Tv,
  Activity,
  HandCoins,
  Trophy,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";
import AdminGlobalSearch from "./AdminGlobalSearch";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState("/logotrang.png");
  const [unreadCount, setUnreadCount] = useState(0);
  const currentHandle = localStorage.getItem("handle") || "Admin";
  const currentAvatar =
    localStorage.getItem("avatar") ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentHandle)}`;
  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  const roleLabel = roles.includes("Admin")
    ? "Quản trị viên"
    : roles.includes("Moderator")
      ? "Moderator"
      : "Người dùng";

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
    
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("/api/notifications?limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const adminTypes = ["Report", "Violation", "Feedback", "Withdrawal", "System", "Admin"];
          const adminUnread = res.data.filter(n => adminTypes.includes(n.type) && !n.isRead);
          setUnreadCount(adminUnread.length);
        } catch (err) {
          console.error("Lỗi khi tải số thông báo:", err);
        }
      }
    };

    fetchPublicSettings();
    fetchUnreadCount();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("handle");
    localStorage.removeItem("avatar");
    navigate("/login");
  };

    const navGroups = [
      {
        label: "TỔNG QUAN",
        items: [
          { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
          { name: "Báo cáo nhanh", path: "/admin/reports", icon: BarChart2 },
        ],
      },
      {
        label: "NỘI DUNG",
        items: [
          { name: "Quản lý Video", path: "/admin/videos", icon: Video },
          { name: "Danh mục", path: "/admin/categories", icon: List },
          { name: "Bình luận", path: "/admin/comments", icon: MessageSquare },
        ],
      },
      {
        label: "NGƯỜI DÙNG & KÊNH",
        items: [
          { name: "Quản lý người dùng", path: "/admin/users", icon: Users },
          { name: "Quản lý Kênh", path: "/admin/channels", icon: Tv },
          { name: "Vai trò & Quyền", path: "/admin/roles", icon: Shield },
        ],
      },
      {
        label: "KIỂM DUYỆT & HỖ TRỢ",
        items: [
          {
            name: "Báo cáo & Khiếu nại",
            path: "/admin/complaints",
            icon: AlertTriangle,
          },
          { name: "Vi phạm", path: "/admin/violations", icon: ShieldAlert },
          { name: "Lịch sử đánh gậy", path: "/admin/strikes", icon: AlertOctagon },
          {
            name: "Phản hồi & Góp ý",
            path: "/admin/feedbacks",
            icon: MessageSquare,
          },
          { name: "Quản lý FAQs", path: "/admin/faqs", icon: HelpCircle },
        ],
      },
      {
        label: "TÀI CHÍNH & DOANH THU",
        items: [
          { name: "Giao dịch", path: "/admin/transactions", icon: CreditCard },
          { name: "Doanh thu", path: "/admin/revenue", icon: DollarSign },
          {
            name: "Rút tiền",
            path: "/admin/withdrawals",
            icon: HandCoins,
          },
          { name: "Chính sách kiếm tiền", path: "/admin/monetization", icon: Trophy },
        ],
      },
      {
        label: "HỆ THỐNG",
        items: [
          { name: "Thông báo", path: "/admin/notifications", icon: Bell },
          {
            name: "Lịch sử hoạt động",
            path: "/admin/activities",
            icon: Activity,
          },
          { name: "Cài đặt chung", path: "/admin/settings", icon: SettingsIcon },
        ],
      },
      {
        label: "TRUY CẬP WEBSITE",
        items: [{ name: "Trang chủ", path: "/", icon: HomeIcon }],
      },
    ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-[190px] h-screen bg-[#141418] border-r border-white/5 flex flex-col shrink-0 sticky top-0">
        {/* Logo */}
        <div className="py-1 px-4 flex items-center justify-center w-full shrink-0">
          <Link to="/admin" className="flex items-center justify-center">
            <div className="h-16 w-28">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          <nav className="px-3 py-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pt-5 border-t border-white/8 pb-1 text-[9px] font-bold text-gray-700 uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-2 px-2 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-[#FF5722] to-[#9C27B0] text-white font-semibold shadow-lg shadow-[#FF5722]/20"
                            : "text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : ""}`}
                        />
                        <span className="text-xs font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout — always visible at bottom */}
        <div className="px-4 py-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0F0F0F] h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-[80px] px-8 flex items-center justify-between shrink-0">
          <div className="flex-1">
          </div>
          <div className="flex-1 flex justify-center">
            <AdminGlobalSearch className="" />
          </div>
          <div className="flex-1 flex justify-end items-center gap-6">
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <Link to="/admin/notifications" className="relative text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-[#0f111a]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3 cursor-pointer">
                <img
                  src={currentAvatar}
                  alt={currentHandle}
                  className="w-9 h-9 rounded-full bg-white/10 object-cover"
                />
                <div className="hidden md:block text-sm">
                  <p className="font-semibold text-white leading-tight">
                    {currentHandle}
                  </p>
                  <p className="text-[11px] text-gray-400">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  Search,
  Calendar,
  Filter,
  Download,
  ChevronRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  Video,
  Tv,
  User,
  Settings,
  AlertCircle,
  DollarSign,
  Ban,
  ChevronLeft,
  ChevronRight as IconChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Sparkline SVG components for the cards
const SparklineGreen = () => (
  <svg
    width="60"
    height="20"
    viewBox="0 0 60 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 15C5.5 15 8.5 12 13 8C17.5 4 20.5 4 25 8C29.5 12 32.5 16 37 12C41.5 8 44.5 4 49 8C53.5 12 56.5 6 59 2"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparklineYellow = () => (
  <svg
    width="60"
    height="20"
    viewBox="0 0 60 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 15C5.5 15 8.5 16 13 14C17.5 12 20.5 14 25 12C29.5 10 32.5 12 37 8C41.5 4 44.5 6 49 4C53.5 2 56.5 6 59 4"
      stroke="#eab308"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparklineRed = () => (
  <svg
    width="60"
    height="20"
    viewBox="0 0 60 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 4C5.5 4 8.5 6 13 8C17.5 10 20.5 6 25 8C29.5 10 32.5 12 37 10C41.5 8 44.5 14 49 14C53.5 14 56.5 16 59 18"
      stroke="#ef4444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparklinePurple = () => (
  <svg
    width="60"
    height="20"
    viewBox="0 0 60 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 18C5.5 18 8.5 14 13 14C17.5 14 20.5 10 25 8C29.5 6 32.5 10 37 6C41.5 2 44.5 6 49 4C53.5 2 56.5 4 59 2"
      stroke="#a855f7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1="30"
        y1="2"
        x2="30"
        y2="18"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#a855f7" stopOpacity="0.3" />
        <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Không thể tải hoạt động hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (target) => {
    const targetStr = (target || "").toLowerCase();

    if (targetStr.startsWith("video")) {
      return {
        id: "video",
        name: "Video",
        icon: <Video className="w-5 h-5 text-blue-400" />,
        bg: "bg-blue-500/10",
      };
    }
    if (targetStr.startsWith("channel")) {
      return {
        id: "channel",
        name: "Kênh",
        icon: <Tv className="w-5 h-5 text-green-400" />,
        bg: "bg-green-500/10",
      };
    }
    if (targetStr.startsWith("user")) {
      return {
        id: "user",
        name: "Người dùng",
        icon: <User className="w-5 h-5 text-purple-400" />,
        bg: "bg-purple-500/10",
      };
    }
    if (targetStr.startsWith("role")) {
      return {
        id: "role",
        name: "Phân quyền",
        icon: <Settings className="w-5 h-5 text-yellow-400" />,
        bg: "bg-yellow-500/10",
      };
    }
    if (targetStr.startsWith("systemsettings")) {
      return {
        id: "system",
        name: "Cài đặt",
        icon: <Settings className="w-5 h-5 text-gray-400" />,
        bg: "bg-gray-400/10",
      };
    }
    if (targetStr.startsWith("report")) {
      return {
        id: "report",
        name: "Báo cáo",
        icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        bg: "bg-red-500/10",
      };
    }

    return {
      id: "other",
      name: "Khác",
      icon: <LayoutGrid className="w-5 h-5 text-blue-400" />,
      bg: "bg-blue-500/10",
    };
  };

  const categories = [
    { id: "all", name: "Tất cả loại" },
    { id: "video", name: "Video" },
    { id: "channel", name: "Kênh" },
    { id: "user", name: "Người dùng" },
    { id: "role", name: "Vai trò" },
    { id: "system", name: "Hệ thống" },
    { id: "report", name: "Báo cáo" },
  ];

  const filteredActivities = activities.filter((activity) => {
    // Ẩn nhật ký nâng cấp tài khoản và tham gia hội viên
    const actionLower = (activity.action || "").toLowerCase();
    const detailsLower = (activity.details || "").toLowerCase();
    
    if (
      actionLower.includes("nâng cấp") ||
      actionLower.includes("hội viên") ||
      detailsLower.includes("nâng cấp") ||
      detailsLower.includes("hội viên")
    ) {
      return false;
    }

    const catInfo = getCategoryInfo(activity.target);
    if (selectedCategory !== "all" && catInfo.id !== selectedCategory) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (activity.user && activity.user.toLowerCase().includes(searchLower)) ||
        (activity.action &&
          activity.action.toLowerCase().includes(searchLower)) ||
        (activity.details &&
          activity.details.toLowerCase().includes(searchLower)) ||
        (activity.target &&
          activity.target.toLowerCase().includes(searchLower)) ||
        (activity.ipAddress &&
          activity.ipAddress.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    if (timeFilter !== "all") {
      const activityDate = new Date(activity.date || activity.time);
      const now = new Date();
      let diffDays = 0;
      if (timeFilter === "3days") diffDays = 3;
      else if (timeFilter === "7days") diffDays = 7;
      else if (timeFilter === "15days") diffDays = 15;
      else if (timeFilter === "1month") diffDays = 30;

      const thresholdDate = new Date(
        now.getTime() - diffDays * 24 * 60 * 60 * 1000,
      );
      if (activityDate < thresholdDate) {
        return false;
      }
    }

    if (startDate || endDate) {
      const activityDate = new Date(activity.date || activity.time);
      activityDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (activityDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (activityDate > end) return false;
      }
    }

    return true;
  });

  const totalActivities = filteredActivities.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(totalActivities / itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Thành công":
        return (
          <span className="px-3 py-1 rounded-md text-[13px] font-medium text-green-400 border border-green-500/20 bg-green-500/10">
            Thành công
          </span>
        );
      case "Cảnh báo":
        return (
          <span className="px-3 py-1 rounded-md text-[13px] font-medium text-yellow-400 border border-yellow-500/20 bg-yellow-500/10">
            Cảnh báo
          </span>
        );
      case "Thất bại":
        return (
          <span className="px-3 py-1 rounded-md text-[13px] font-medium text-red-400 border border-red-500/20 bg-red-500/10">
            Thất bại
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-md text-[13px] font-medium text-gray-400 border border-gray-500/20 bg-gray-500/10">
            {status}
          </span>
        );
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "Thành công":
        return "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"; // Using purple dot like the image for success? Actually image uses purple/blue for some
      case "Cảnh báo":
        return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]";
      case "Thất bại":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen font-sans text-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-purple-500" />
            Hoạt động hệ thống
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Theo dõi và quản lý tất cả lịch sử hoạt động và sự kiện trong hệ
            thống.
          </p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">
                Tổng hoạt động
              </p>
            </div>
            <h3 className="text-2xl font-bold text-white">1,248</h3>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              12.5% so với hôm qua
            </p>
          </div>
          <SparklinePurple />
        </div>

        {/* Card 2 */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Thành công</p>
            </div>
            <h3 className="text-2xl font-bold text-white">1,108</h3>
            <p className="text-xs text-green-400 mt-1">88.8%</p>
          </div>
          <SparklineGreen />
        </div>

        {/* Card 3 */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Cảnh báo</p>
            </div>
            <h3 className="text-2xl font-bold text-white">98</h3>
            <p className="text-xs text-gray-500 mt-1">7.9%</p>
          </div>
          <SparklineYellow />
        </div>

        {/* Card 4 */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Thất bại</p>
            </div>
            <h3 className="text-2xl font-bold text-white">42</h3>
            <p className="text-xs text-gray-500 mt-1">3.3%</p>
          </div>
          <SparklineRed />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#141418] p-2 rounded-xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm hoạt động, địa chỉ IP, người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-transparent border-none text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 px-2 w-full md:w-auto">
          {/* Time filter */}
          <div className="relative border-l border-white/10 pl-3">
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#141418] border border-white/5 rounded-lg text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-white/5"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="3days">3 ngày qua</option>
                <option value="7days">7 ngày qua</option>
                <option value="15days">15 ngày qua</option>
                <option value="1month">1 tháng qua</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#141418] border border-white/5 rounded-lg text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500 transition-colors cursor-pointer hover:bg-white/5"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={fetchActivities}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/5 bg-[#141418] hover:bg-white/5 transition-colors text-sm text-gray-300 ml-2"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold min-w-[120px]">
                  THỜI GIAN
                </th>
                <th className="py-4 px-6 font-semibold min-w-[280px]">
                  HOẠT ĐỘNG
                </th>
                <th className="py-4 px-6 font-semibold min-w-[200px]">
                  NGƯỜI THỰC HIỆN
                </th>
                <th className="py-4 px-6 font-semibold min-w-[180px]">
                  ĐỊA CHỈ IP
                </th>
                <th className="py-4 px-6 font-semibold w-[160px]">KẾT QUẢ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">
                      Đang tải lịch sử hoạt động...
                    </p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      Không có dữ liệu phù hợp.
                    </p>
                  </td>
                </tr>
              ) : (
                currentItems.map((activity, idx) => {
                  const catInfo = getCategoryInfo(activity.target);
                  // Split time string assuming it's like "HH:mm dd/MM/yyyy"
                  const [timePart, datePart] = activity.time
                    ? activity.time.split(" ")
                    : ["--:--", "--/--/----"];

                  return (
                    <tr
                      key={activity.id || idx}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 relative flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-[#0F0F0F] flex items-center justify-center border border-white/5 z-10">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusDotColor(activity.status)}`}
                              ></div>
                            </div>
                            {idx !== currentItems.length - 1 && (
                              <div className="absolute top-5 w-px h-16 bg-white/5 -z-0"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-[13px] text-gray-300 font-medium font-mono">
                              {timePart}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {datePart}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catInfo.bg}`}
                          >
                            {catInfo.icon}
                          </div>
                          <div>
                            <div className="text-[14px] text-gray-200 font-semibold mb-0.5">
                              {activity.action}
                            </div>
                            <div className="text-[12px] text-gray-500 line-clamp-1">
                              {activity.details}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={activity.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=System"}
                            alt=""
                            className="w-8 h-8 rounded-full bg-[#1a1a1f] object-cover"
                          />
                          <div>
                            <div className="text-[13px] text-gray-200 font-medium line-clamp-1">
                              {activity.user}
                            </div>
                            <div className="text-[11px] text-gray-500 line-clamp-1">
                              {activity.handle ? activity.handle : activity.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[13px] text-gray-300 font-mono mb-0.5">
                          {activity.ipAddress}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {activity.browser}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(activity.status)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredActivities.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[13px] text-gray-500">
              Hiển thị{" "}
              <span className="font-semibold text-white">
                {indexOfFirstItem + 1} -{" "}
                {Math.min(indexOfLastItem, totalActivities)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-semibold text-white">
                {totalActivities}
              </span>{" "}
              hoạt động
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#0F0F0F] border border-white/10 text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-white/5 bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Simplified page numbers for demo */}
                <button className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-500 text-white font-medium text-xs shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                  {currentPage}
                </button>

                {currentPage < totalPages && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-white/5 bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                  >
                    {currentPage + 1}
                  </button>
                )}

                {currentPage < totalPages - 1 && (
                  <button
                    onClick={() => setCurrentPage(currentPage + 2)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-white/5 bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                  >
                    {currentPage + 2}
                  </button>
                )}

                {totalPages > 3 && currentPage < totalPages - 2 && (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-500 text-xs">
                    ...
                  </span>
                )}

                {totalPages > 3 && currentPage < totalPages - 2 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-white/5 bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-white/5 bg-[#0F0F0F] text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivities;

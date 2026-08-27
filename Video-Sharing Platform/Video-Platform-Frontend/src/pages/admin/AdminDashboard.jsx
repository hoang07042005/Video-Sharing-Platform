import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Video,
  Eye,
  DollarSign,
  Loader2,
  Database,
  Heart,
  AlertTriangle,
  Flag,
  Video as VideoIcon,
  Calendar,
} from "lucide-react";

const toInputValue = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date))
    return date.slice(0, 10);
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
  const d1 = new Date();
  const d2 = new Date(Date.now() - 6 * 86400000);
  return { todayStr: toInputValue(d1), sevenDaysAgoStr: toInputValue(d2) };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [tempMonth, setTempMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activeMonth, setActiveMonth] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [chartDays, setChartDays] = useState("custom");

  const handleChartDaysChange = async (e) => {
    const d = e.target.value;
    setChartDays(d);
    if (d === "custom") return;
    try {
      const res = await axios.get(`/api/admin/chart-data?days=${d}`);
      setChartData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target))
        setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAllData = async ({ startDate, endDate, days } = {}) => {
    try {
      setChartDays("custom");
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (days) params.set("days", String(days));
      const qs = params.toString() ? `?${params.toString()}` : "";
      const [statsRes, chartRes, feedbacksRes] = await Promise.all([
        axios.get(`/api/admin/stats${qs}`),
        axios.get(`/api/admin/chart-data${qs}`),
        axios
          .get(`/api/admin/feedbacks?status=All`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          .catch((err) => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setRecentFeedbacks(feedbacksRes.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setRefetching(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const params = new URLSearchParams();
        params.set("startDate", "2000-01-01");
        params.set("endDate", "2099-12-31");
        params.set("days", "36500");
        const qs = `?${params.toString()}`;
        const [statsRes, chartRes, feedbacksRes] = await Promise.all([
          axios.get(`/api/admin/stats${qs}`),
          axios.get(`/api/admin/chart-data${qs}`),
          axios
            .get(`/api/admin/feedbacks?status=All`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
            .catch((err) => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data);
        setRecentFeedbacks(feedbacksRes.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching initial dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const PIE_COLORS = [
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#EF4444",
    "#02ddffff",
    "#F97316",
    "#6366F1",
    "#F43F5E",
  ];

  const buildTrendSeries = (currentValue, growthPercent = 0) => {
    const safeValue =
      Number.isFinite(currentValue) && currentValue > 0 ? currentValue : 0;
    const growth = Number.isFinite(growthPercent) ? growthPercent : 0;
    const direction = growth >= 0 ? 1 : -1;
    const normalizedGrowth = Math.min(Math.abs(growth), 80);
    const base = safeValue * (1 - normalizedGrowth / 200);
    return [
      Math.max(0, base * 0.68),
      Math.max(0, base * 0.8),
      Math.max(0, base * 0.92),
      Math.max(0, base * (1 + (direction * normalizedGrowth) / 220)),
      Math.max(0, base * (1.08 + (direction * normalizedGrowth) / 220)),
      Math.max(0, base * (1.18 + (direction * normalizedGrowth) / 280)),
      safeValue,
    ];
  };

  const renderMiniChart = (values, color, type = "area") => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 80 - 10;
      return `${x},${y}`;
    });

    if (type === "area") {
      const path = `M 0,100 L 0,${points[0].split(",")[1]} ${points.map((p, i) => (i === 0 ? "" : `L ${p.replace(",", " ")}`)).join(" ")} L 100,100 Z`;
      return (
        <svg
          width="100%"
          height="100%"
          viewBox="-2 0 104 100"
          preserveAspectRatio="none"
          className="opacity-80"
        >
          <defs>
            <linearGradient
              id={`grad-${color.replace("#", "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={path} fill={`url(#grad-${color.replace("#", "")})`} />
          <path
            d={`M ${points.map((p) => p.replace(",", " ")).join(" L ")}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => {
            const [x, y] = p.split(",");
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      );
    } else if (type === "bar") {
      const barWidth = (100 / values.length) * 0.6;
      return (
        <svg
          width="100%"
          height="100%"
          viewBox="-2 0 104 100"
          preserveAspectRatio="none"
          className="opacity-80"
        >
          {points.map((p, i) => {
            const [x, y] = p.split(",").map(Number);
            return (
              <rect
                key={i}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={100 - y}
                fill={color}
                opacity="0.8"
                rx="1"
              />
            );
          })}
        </svg>
      );
    } else if (type === "line") {
      return (
        <svg
          width="100%"
          height="100%"
          viewBox="-2 0 104 100"
          preserveAspectRatio="none"
          className="opacity-80"
        >
          <path
            d={`M ${points.map((p) => p.replace(",", " ")).join(" L ")}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => {
            const [x, y] = p.split(",");
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.5"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      );
    } else if (type === "donut") {
      const percent = Math.min(
        100,
        Math.max(0, values[values.length - 1] || 75),
      );
      return (
        <div className="flex justify-between items-end h-full w-full px-4 pb-2">
          <svg
            width="50%"
            height="100%"
            viewBox="-2 0 104 100"
            preserveAspectRatio="none"
            className="opacity-60"
          >
            {points.slice(0, 5).map((p, i) => {
              const [x, y] = p.split(",").map(Number);
              return (
                <rect
                  key={i}
                  x={(i / 4) * 100 - 8}
                  y={y}
                  width="16"
                  height={100 - y}
                  fill={color}
                  rx="2"
                />
              );
            })}
          </svg>
          <div className="relative w-12 h-11 flex items-center justify-center">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
            >
              <path
                className="text-white/10"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500"
                strokeDasharray={`${percent}, 100`}
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-white">
              {Math.round(percent)}%
            </span>
          </div>
        </div>
      );
    } else if (type === "smooth") {
      const path = points
        .map((p, i) => {
          if (i === 0) return `M ${p.replace(",", " ")}`;
          const [prevX, prevY] = points[i - 1].split(",").map(Number);
          const [currX, currY] = p.split(",").map(Number);
          const controlX1 = prevX + (currX - prevX) / 2;
          const controlX2 = prevX + (currX - prevX) / 2;
          return `C ${controlX1} ${prevY}, ${controlX2} ${currY}, ${currX} ${currY}`;
        })
        .join(" ");
      const fillPath = `${path} L 100,100 L 0,100 Z`;

      return (
        <svg
          width="100%"
          height="100%"
          viewBox="-2 0 104 100"
          preserveAspectRatio="none"
          className="opacity-80"
        >
          <defs>
            <linearGradient
              id={`grad-${color.replace("#", "")}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#grad-${color.replace("#", "")})`} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
          {points.map((p, i) => {
            const [x, y] = p.split(",");
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="pb-20 max-w-[1600px] mx-auto text-white px-1">
      {refetching && (
        <div className="fixed top-4 right-4 z-[999] flex items-center gap-2 bg-purple-600/90 backdrop-blur px-4 py-2 rounded-xl shadow-xl text-sm text-white">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang cập nhật dữ liệu...
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Tổng quan
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Theo dõi số liệu thống kê và hiệu suất hoạt động của hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker((v) => !v)}
              className="flex items-center gap-2 bg-[#1a1c23] border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300 w-fit hover:border-white/20 transition-colors"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                {activeMonth
                  ? (() => {
                      const [y, m] = activeMonth.split("-").map(Number);
                      return `Tháng ${m}/${y}`;
                    })()
                  : "Tất cả thời gian"}
              </span>
              <svg
                className={`w-3 h-3 ml-2 text-gray-500 transition-transform ${showDatePicker ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl p-4 w-[260px]">
                <p className="text-xs font-semibold text-gray-400 mb-3">
                  Chọn tháng
                </p>
                <input
                  type="month"
                  value={tempMonth}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}
                  onChange={(e) => setTempMonth(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/60 [color-scheme:dark]"
                />
                {tempMonth && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    {(() => {
                      const [y, m] = tempMonth.split("-").map(Number);
                      const ld = new Date(y, m, 0).getDate();
                      return `01/${String(m).padStart(2, "0")}/${y} — ${String(ld).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
                    })()}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 py-2 rounded-lg text-xs text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      if (!tempMonth) {
                        setActiveMonth("");
                        setShowDatePicker(false);
                        setIsFiltered(false);
                        setRefetching(true);
                        fetchAllData({
                          startDate: "2000-01-01",
                          endDate: "2099-12-31",
                          days: 36500,
                        });
                        return;
                      }
                      const [y, m] = tempMonth.split("-").map(Number);
                      const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
                      const ld = new Date(y, m, 0).getDate();
                      const endStr = `${y}-${String(m).padStart(2, "0")}-${String(ld).padStart(2, "0")}`;
                      setActiveMonth(tempMonth);
                      setShowDatePicker(false);
                      setIsFiltered(true);
                      setRefetching(true);
                      fetchAllData({
                        startDate: startStr,
                        endDate: endStr,
                        days: ld,
                      });
                    }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!isFiltered) return;
              const now = new Date();
              const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              setActiveMonth("");
              setTempMonth(thisMonth);
              setIsFiltered(false);
              setRefetching(true);
              fetchAllData({
                startDate: "2000-01-01",
                endDate: "2099-12-31",
                days: 36500,
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-all ${isFiltered ? "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 cursor-pointer" : "text-gray-600 bg-white/5 border-white/5 cursor-not-allowed opacity-40"}`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Bỏ lọc
          </button>
        </div>
      </div>

      {/* ── ROW 1: 6 STAT CARDS ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-3 h-[240px]">
        {[
          {
            icon: <Users className="w-5 h-5 text-purple-400" />,
            bg: "bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
            label: "Người dùng",
            value: stats?.totalUsers?.toLocaleString() ?? "0",
            growth: stats?.userGrowth,
            chart: renderMiniChart(
              buildTrendSeries(stats?.totalUsers ?? 0, stats?.userGrowth ?? 0),
              "#A78BFA",
              "line",
            ),
          },
          {
            icon: <Video className="w-5 h-5 text-blue-400" />,
            bg: "bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
            label: "Tổng video",
            value: stats?.totalVideos?.toLocaleString() ?? "0",
            growth: stats?.videoGrowth,
            chart: renderMiniChart(
              buildTrendSeries(
                stats?.totalVideos ?? 0,
                stats?.videoGrowth ?? 0,
              ),
              "#3B82F6",
              "bar",
            ),
          },
          {
            icon: <Eye className="w-5 h-5 text-orange-400" />,
            bg: "bg-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
            label: "Lượt xem",
            value: stats?.totalViews?.toLocaleString() ?? "0",
            growth: stats?.viewsGrowth,
            chart: renderMiniChart(
              buildTrendSeries(stats?.totalViews ?? 0, stats?.viewsGrowth ?? 0),
              "#F59E0B",
              "area",
            ),
          },
          {
            icon: <DollarSign className="w-5 h-5 text-green-400" />,
            bg: "bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
            label: "Doanh thu",
            value: `${(stats?.monthlyRevenue ?? 0).toLocaleString("en-US")}₫`,
            growth: stats?.revenueGrowth,
            chart: renderMiniChart(
              buildTrendSeries(
                stats?.monthlyRevenue ?? 0,
                stats?.revenueGrowth ?? 0,
              ),
              "#22C55E",
              "bar",
            ),
          },
          {
            icon: <Database className="w-5 h-5 text-blue-400" />,
            bg: "bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
            label: "Lưu trữ",
            value: `${stats?.totalStorageGB ?? 0} GB`,
            growth: stats?.storageGrowth,
            chart: renderMiniChart(
              buildTrendSeries(
                stats?.totalStorageGB ?? 0,
                stats?.storageGrowth ?? 0,
              ),
              "#3B82F6",
              "donut",
            ),
          },
          {
            icon: <Heart className="w-5 h-5 text-pink-400" />,
            bg: "bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
            label: "Lượt thích",
            value: stats?.totalLikes?.toLocaleString() ?? "0",
            growth: stats?.likesGrowth,
            chart: renderMiniChart(
              buildTrendSeries(stats?.totalLikes ?? 0, stats?.likesGrowth ?? 0),
              "#EC4899",
              "smooth",
            ),
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#141418] rounded-xl border border-white/5 relative overflow-hidden flex flex-col h-[230px] pt-7 px-7 pb-0"
          >
            <div className="flex flex-col z-10 relative">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}
                >
                  {card.icon}
                </div>
                <span className="text-gray-400 text-[14px] font-medium truncate">
                  {card.label}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-2xl font-bold leading-none mb-2 truncate">
                  {card.value}
                </span>
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-[12px] font-bold ${card.growth >= 0 ? "text-green-400" : "text-red-400"} whitespace-nowrap`}
                  >
                    {card.growth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(card.growth ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-500 text-[10px] mt-1 truncate">
                    so với 7 ngày trước
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] px-4 pb-7 flex items-end justify-center">
              {card.chart}
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Line chart | Bar chart | System status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.4fr] gap-3 mb-3">
        {/* Xu hướng hiệu suất */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5 flex flex-col h-[280px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-white">
              Xu hướng hiệu suất tổng quan
            </h3>
            <select
              value={chartDays}
              onChange={handleChartDaysChange}
              className="bg-[#1a1c23] border border-white/10 px-2 py-1 rounded text-[10px] text-gray-400 outline-none cursor-pointer"
            >
              <option value="7">7 ngày qua</option>
              <option value="16">16 ngày qua</option>
              <option value="30">30 ngày qua</option>
              {chartDays === "custom" && (
                <option value="custom">Theo bộ lọc chung</option>
              )}
            </select>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData?.traffic}
                margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1c23",
                    borderColor: "#374151",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gViews)"
                  name="Lượt xem"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34D399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gRevenue)"
                  name="Doanh thu"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nâng cấp vs Đăng ký */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5 flex flex-col h-[280px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-white">
              Nâng cấp tài khoản vs Đăng kí hội viên
            </h3>
            <select
              value={chartDays}
              onChange={handleChartDaysChange}
              className="bg-[#1a1c23] border border-white/10 px-2 py-1 rounded text-[10px] text-gray-400 outline-none cursor-pointer"
            >
              <option value="7">7 ngày qua</option>
              <option value="16">16 ngày qua</option>
              <option value="30">30 ngày qua</option>
              {chartDays === "custom" && (
                <option value="custom">Theo bộ lọc chung</option>
              )}
            </select>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData?.accountUpgradesVsRegistrations}
                margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
                barCategoryGap="30%"
                barGap={3}
              >
                <defs>
                  <linearGradient id="bUpg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="bReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#4b5563"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1c23",
                    borderColor: "#374151",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar
                  dataKey="upgrades"
                  fill="url(#bUpg)"
                  radius={[3, 3, 0, 0]}
                  name="Nâng cấp tài khoản"
                  maxBarSize={22}
                />
                <Bar
                  dataKey="registrations"
                  fill="url(#bReg)"
                  radius={[3, 3, 0, 0]}
                  name="Đăng kí hội viên"
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tình hình hệ thống */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5 h-[280px] flex flex-col">
          <h3 className="text-xs font-semibold text-white mb-3">
            Tình hình hệ thống
          </h3>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {[
              {
                icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
                bg: "bg-red-500/20",
                label: "Báo cáo vi phạm",
                value: stats?.recentReports?.length ?? 0,
                trend: "↑ 15%",
                trendColor: "text-green-400",
              },
              {
                icon: <Flag className="w-3.5 h-3.5 text-orange-400" />,
                bg: "bg-orange-500/20",
                label: "Khiếu nại mới",
                value: 17,
                trend: "↑ 8%",
                trendColor: "text-green-400",
              },
              {
                icon: <VideoIcon className="w-3.5 h-3.5 text-purple-400" />,
                bg: "bg-purple-500/20",
                label: "Video chờ xét duyệt",
                value: 42,
                trend: "↓ 5%",
                trendColor: "text-red-400",
              },
              {
                icon: <Database className="w-3.5 h-3.5 text-blue-400" />,
                bg: "bg-blue-500/20",
                label: "Lưu trữ đã dùng",
                value: `${stats?.totalStorageGB ?? 0} GB`,
                trend: "↑ 100%",
                trendColor: "text-green-400",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#1a1c23] rounded-lg p-2.5 flex items-center gap-2"
              >
                <div className={`p-1.5 ${item.bg} rounded-lg shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 leading-tight">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {item.value}
                  </p>
                  <p className={`text-[9px] ${item.trendColor}`}>
                    {item.trend}
                  </p>
                </div>
              </div>
            ))}
            <div className="col-span-2 bg-[#1a1c23] rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 bg-green-500/20 rounded-lg shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-gray-500">Hệ thống ổn định</p>
                <p className="text-xs font-bold text-green-400">Ổn định</p>
              </div>
              <p className="text-[9px] text-green-400 font-semibold">↑ 100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Pie | Categories | Reports | Transactions | Feedbacks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_4.5fr] gap-3 mb-3">
        {/* Phân bố doanh thu */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5 h-full">
          <h3 className="text-xs font-semibold text-white mb-2">
            Phân bố doanh thu
          </h3>
          <div className="w-full h-[160px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.revenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData?.revenue?.map((_, index) => (
                    <Cell
                      key={`c-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-white">
                {(stats?.monthlyRevenue ?? 0).toLocaleString("vi-VN")}₫
              </span>
              <span className="text-[9px] text-gray-500">Tổng doanh thu</span>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {chartData?.revenue?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  ></div>
                  <span className="text-[10px] text-gray-400 truncate max-w-[85px]">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-white">
                    {stats?.monthlyRevenue
                      ? ((item.value / stats.monthlyRevenue) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                  <p className="text-[9px] text-gray-500">
                    {item.value?.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Cột phải: 3 cột trên, phản hồi dưới */}
        <div className="flex flex-col gap-3">
          {/* Phần trên */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_1.3fr] gap-3">
            {/* Top danh mục */}
            <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-semibold text-white mb-3">
                Top danh mục{" "}
                <span className="text-gray-500 font-normal">
                  (theo lượt xem)
                </span>
              </h3>
              <div className="flex flex-col gap-3">
                {stats?.categoryDistribution?.map((cat, idx) => {
                  const maxVal = Math.max(
                    ...(stats.categoryDistribution?.map((c) => c.value) ?? [1]),
                  );
                  const pct = Math.round((cat.value / maxVal) * 100);
                  const colors = [
                    "#8B5CF6",
                    "#3B82F6",
                    "#10B981",
                    "#F59E0B",
                    "#EC4899",
                  ];
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] text-gray-300">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {cat.value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: colors[idx % colors.length],
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Báo cáo chờ duyệt */}
            <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">
                  Báo cáo chờ duyệt
                </h3>
                <a href="/admin/activities" className="text-[11px] text-purple-400 cursor-pointer hover:underline">
                  Xem tất cả →
                </a>
              </div>
              <table className="w-full text-left table-fixed">
                <thead className="text-[9px] uppercase text-gray-500 border-b border-white/10">
                  <tr>
                    <th className="pb-2 pr-2 font-medium w-[22%]">
                      Người báo cáo
                    </th>
                    <th className="pb-1 px-2 font-medium w-[32%]">Lý do</th>
                    <th className="pb-1 px-2 font-medium w-[18%]">Thời gian</th>
                    <th className="pb-1 px-2 font-medium text-center w-[14%]">
                      Trạng thái
                    </th>
                    <th className="pb-1 pl-2 font-medium text-right w-[14%]">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recentReports?.map((report, idx) => (
                    <tr
                      key={idx}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-1 pr-2 text-[11px] text-gray-300 font-medium truncate">
                        {report.user}
                      </td>
                      <td className="py-1 px-1 text-[10px] text-red-400 line-clamp-2">
                        {report.reason}
                      </td>
                      <td className="py-1 px-2 text-[10px] text-gray-500 whitespace-nowrap">
                        {report.time}
                      </td>
                      <td className="py-1 px-2 text-center">
                        {(() => {
                          let badgeClass = "";
                          let badgeText = report.status;
                          switch (report.status) {
                            case "Pending":
                              badgeClass = "text-orange-400";
                              badgeText = "Chờ duyệt";
                              break;
                            case "Resolved":
                              badgeClass = "text-green-400";
                              badgeText = "Đã xử lý";
                              break;
                            case "Rejected":
                              badgeClass = "text-red-400";
                              badgeText = "Từ chối";
                              break;
                          }
                          return (
                            <span className={`inline-block text-[9px] font-medium  ${badgeClass}`}>
                              {badgeText}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <a href="/admin/activities" className="inline-block text-[10px] px-2 py-0.5 rounded-md font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                          Xem
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Giao dịch gần nhất */}
            <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">
                  Giao dịch gần nhất
                </h3>
                <a href="/admin/settings" className="text-[11px] text-purple-400 cursor-pointer hover:underline">
                  Xem tất cả giao dịch →
                </a>
                </div>
              <div className="flex flex-col gap-2.5">
                {stats?.recentTransactions?.map((trx, idx) => {
                  const typeStr = trx.type || "Other";
                  const isPremium =
                    typeStr.startsWith("Premium") ||
                    typeStr.startsWith("ChannelMembership");
                  const isDonation = typeStr === "Donation";
                  const isBuyCoins = typeStr === "BuyCoins";

                  let bgColor = "bg-gray-500/20 text-gray-400";
                  if (isPremium) bgColor = "bg-blue-500/20 text-blue-400";
                  else if (isDonation)
                    bgColor = "bg-green-500/20 text-green-400";
                  else if (isBuyCoins)
                    bgColor = "bg-yellow-500/20 text-yellow-400";
                  else if (typeStr === "Ad Revenue")
                    bgColor = "bg-red-500/20 text-red-400";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between pb-1.5 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        {trx.userAvatar ? (
                          <img
                            src={trx.userAvatar}
                            alt="Avatar"
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${bgColor}`}
                          >
                            {typeStr.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-medium text-gray-300 leading-tight">
                            {typeStr}
                          </p>
                          <p className="text-[9px] text-gray-500">
                            User: {trx.user}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-white">
                          {(trx.amount ?? 0).toLocaleString("vi-VN")}₫
                        </p>
                        <p className="text-[9px] text-gray-500">
                          {trx.time?.replace("trước", "")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>{" "}
          {/* Kết thúc phần trên */}
          
          {/* Phần dưới: 2 Cột (Phản hồi & Đăng ký kiếm tiền) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1">
            {/* Cột trái: Phản hồi người dùng mới nhất */}
            <div className="bg-[#141418] p-4 rounded-xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">
                  Phản hồi người dùng mới nhất
                </h3>
                <a
                  href="/admin/feedbacks"
                  className="text-[11px] text-purple-400 cursor-pointer hover:underline"
                >
                  Xem tất cả phản hồi →
                </a>
              </div>
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <table className="w-full text-left table-fixed min-w-full">
                  <thead className="text-[9px] uppercase text-gray-500 border-b border-white/10">
                    <tr>
                      <th className="pb-2 pr-2 font-medium w-[25%]">Người dùng</th>
                      <th className="pb-2 px-2 font-medium w-[15%]">Loại</th>
                      <th className="pb-2 px-2 font-medium w-[30%]">Nội dung</th>
                      <th className="pb-2 px-2 font-medium text-center w-[16%]">Trạng thái</th>
                      <th className="pb-2 pl-2 font-medium text-right w-[14%]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentFeedbacks.length > 0 ? (
                      recentFeedbacks.map((fb, idx) => (
                        <tr
                          key={idx}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              {fb.userAvatarUrl ? (
                                <img
                                  src={fb.userAvatarUrl}
                                  alt="Avatar"
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#FF5722]/20 flex items-center justify-center text-[#FF5722] font-bold text-[8px] shrink-0">
                                  {fb.userFullName?.charAt(0) || "U"}
                                </div>
                              )}
                              <span
                                className="text-[11px] text-gray-300 font-medium truncate max-w-[80px]"
                                title={fb.userFullName || "Người dùng"}
                              >
                                {fb.userFullName || "Người dùng"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-[10px] text-gray-400 capitalize">
                            {fb.type === "bug"
                              ? "Báo lỗi"
                              : fb.type === "feature"
                                ? "Góp ý"
                                : fb.type === "ui"
                                  ? "Giao diện"
                                  : "Khác"}
                          </td>
                          <td className="py-1 px-1 text-[10px] text-gray-400">
                            <div className="flex items-start gap-2">
                              <span className="line-clamp-2 flex-1">
                                {fb.content}
                              </span>
                              {fb.attachmentUrl && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {(() => {
                                    let images = [];
                                    try {
                                      images = JSON.parse(fb.attachmentUrl);
                                      if (!Array.isArray(images)) images = [fb.attachmentUrl];
                                    } catch {
                                      images = [fb.attachmentUrl];
                                    }
                                    return images.slice(0, 1).map((url, i) => (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-8 h-8 rounded border border-white/10 overflow-hidden hover:border-white/30 transition-colors relative shrink-0"
                                      >
                                        <img
                                          src={url}
                                          alt="Đính kèm"
                                          className="w-full h-full object-cover"
                                        />
                                        {images.length > 1 && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white">
                                            +{images.length - 1}
                                          </div>
                                        )}
                                      </a>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium ${fb.status === "Pending" ? "border-none text-orange-400 " : "border-none text-green-400"}`}
                            >
                              {fb.status === "Pending" ? "Chờ xử lý" : "Đã trả lời"}
                            </span>
                          </td>
                          <td className="py-2 pl-2 text-center">
                            <a
                              href="/admin/feedbacks"
                              className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-[#272727] hover:bg-[#353535] text-white transition-colors"
                            >
                              Xem
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-6 text-center text-xs text-gray-500"
                        >
                          Không có phản hồi mới
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cột phải: Duyệt Đăng Ký Kiếm Tiền mới nhất */}
            <div className="bg-[#141418] p-4 rounded-xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white">
                  Duyệt Đăng Ký Kiếm Tiền mới nhất
                </h3>
                <a
                  href="/admin/monetization"
                  className="text-[11px] text-purple-400 cursor-pointer hover:underline"
                >
                  Xem tất cả đơn →
                </a>
              </div>
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <table className="w-full text-left table-fixed min-w-[600px]">
                  <thead className="text-[9px] uppercase text-gray-500 border-b border-white/10">
                    <tr>
                      <th className="pb-2 pr-2 font-medium w-[24%]">Kênh</th>
                      <th className="pb-2 px-2 font-medium w-[28%]">Lý do</th>
                      <th className="pb-2 px-2 font-medium w-[16%] text-center">Ngày gửi</th>
                      <th className="pb-2 px-2 font-medium w-[15%] text-center">Trạng thái</th>
                      <th className="pb-2 pl-2 font-medium text-right w-[17%]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats?.recentMonetizationRequests?.length > 0 ? (
                      stats.recentMonetizationRequests.map((req, idx) => (
                        <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2.5">
                              {req.avatarUrl ? (
                                <img
                                  src={req.avatarUrl}
                                  alt="Avatar"
                                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-green-500/30 transition-all"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-[10px] shrink-0">
                                  {req.channelName?.charAt(0) || "C"}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="text-[11px] text-gray-200 font-semibold truncate"
                                  title={req.channelName}
                                >
                                  {req.channelName}
                                </span>
                                <span className="text-[9px] text-gray-500 mt-0.5">
                                  {req.subscribersCount?.toLocaleString() || 0} đăng ký
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            {req.rejectReason ? (
                              <p className="text-[10px] text-gray-400 line-clamp-2" title={req.rejectReason}>
                                {req.rejectReason}
                              </p>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center text-[10px] text-gray-400">
                            {req.time}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {(() => {
                              let badgeClass = "";
                              let badgeText = req.status;
                              switch (req.status) {
                                case "Pending":
                                  badgeClass = "text-yellow-400 border-none bg-none";
                                  badgeText = "Chờ duyệt";
                                  break;
                                case "Checking":
                                  badgeClass = "text-blue-400 border-none bg-none";
                                  badgeText = "Đang kiểm tra";
                                  break;
                                case "Approved":
                                  badgeClass = "text-green-400 border-none bg-none";
                                  badgeText = "Đã duyệt";
                                  break;
                                case "Rejected":
                                  badgeClass = "text-red-400 border-none bg-none";
                                  badgeText = "Từ chối";
                                  break;
                                case "Revoked":
                                  badgeClass = "text-orange-400 border-none bg-none";
                                  badgeText = "Thu hồi";
                                  break;
                              }
                              return (
                                <span className={`inline-block text-[9px] font-medium  ${badgeClass}`}>
                                  {badgeText}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <a
                              href={`/admin/monetization`}
                              className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md font-medium bg-[#272727] hover:bg-[#353535] border border-white/10 hover:border-white/20 text-white transition-all"
                            >
                              Duyệt ngay
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-xs text-gray-500">
                          Không có đơn đăng ký mới
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Kết thúc cột phải */}
      </div>

      {/* ── ROW 4: Top Videos | Top Channels | Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.4fr_1.4fr] gap-3">
        {/* Top 5 Videos — thumbnail cards */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-white">
              Top video thịnh hành
            </h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stats?.topVideos?.map((video, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 group cursor-pointer"
              >
                <div className="relative">
                  <div className="w-full aspect-video bg-gray-800 rounded overflow-hidden">
                    <img
                      src={
                        video.thumbnailUrl ||
                        "https://via.placeholder.com/320x180?text=Video"
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt="Thumb"
                    />
                  </div>
                  <div className="absolute top-1 left-1 w-4 h-4 rounded bg-purple-600/80 text-white flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </div>
                </div>
                <p className="text-[9px] font-medium text-gray-300 line-clamp-2 leading-tight group-hover:text-purple-400 transition-colors">
                  {video.title}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[8px] text-gray-500">
                    {video.channelName}
                  </p>
                  <span className="text-[8px] text-gray-200">
                    {video.views?.toLocaleString()} lượt xem
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Channels */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-white">
              Top 5 kênh hàng đầu
            </h3>
          </div>
          <div className="flex flex-col gap-3 p-3">
            {stats?.topChannels?.map((channel, idx) => (
              <div key={idx} className="flex items-center gap-2.5 group">
                <div className="w-4 text-[11px] font-bold text-gray-500 text-center shrink-0">
                  {idx + 1}
                </div>
                <img
                  src={
                    channel.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${channel.channelName}`
                  }
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-purple-500/50 transition-all"
                  alt="Avatar"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                    {channel.channelName}
                  </h4>
                  <p className="text-[9px] text-gray-500">
                    @{channel.channelName?.replace(/\s+/g, "").toLowerCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold text-white">
                    {(channel.subscribers ?? 0).toLocaleString()}{" "}
                    <span className="text-[9px] text-gray-500 font-normal">
                      {" "}
                      - người đăng ký
                    </span>
                  </p>
                  <p className="text-[9px] text-purple-300">
                    {channel.videoCount ?? 0} - video
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tài khoản nâng cấp gói gần đây */}
        <div className="bg-[#141418] p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-orange-400" />
              Tài khoản nâng cấp gói gần đây
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {stats?.recentPremiumUpgrades?.length > 0 ? (
              stats.recentPremiumUpgrades.map((upgrade, idx) => {
                const parts = (upgrade.transactionType || "").split("_");
                const plan = parts[1] || "Premium";
                const cycle = parts[2] === "Yearly" ? "Năm" : "Tháng";
                const isPremium = plan === "Premium";
                const planColor = isPremium
                  ? "text-[#FF9800] bg-[#FF9800]/10 border-[#FF9800]/25"
                  : "text-[#9C27B0] bg-[#9C27B0]/10 border-[#9C27B0]/25";
                const crownColor = isPremium ? "text-[#FF9800]" : "text-[#9C27B0]";
                return (
                  <div key={idx} className="flex items-center gap-2.5 group">
                    <div className="relative shrink-0">
                      <img
                        src={
                          upgrade.userAvatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${upgrade.user}`
                        }
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-purple-500/40 transition-all"
                        alt={upgrade.user}
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${isPremium ? "bg-[#FF9800]" : "bg-[#9C27B0]"}`}>
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                        {upgrade.user}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{upgrade.time}</p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${planColor}`}>
                        {plan === "Plus" ? "PLUS" : "PREMIUM"} · {cycle}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-300">
                        {Number(upgrade.amount).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-gray-500 text-center py-4">
                Chưa có giao dịch nâng cấp nào
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

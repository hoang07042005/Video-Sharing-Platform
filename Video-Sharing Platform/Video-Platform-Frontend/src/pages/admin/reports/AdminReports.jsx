import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  AlertTriangle,
  Flag,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const statsRes = await axios.get("/api/admin/reports/stats", {
          headers,
        });
        setStats(statsRes.data);

        const reportsRes = await axios.get(
          `/api/admin/reports?page=${page}&pageSize=5`,
          { headers },
        );
        setReports(reportsRes.data);

        // Mocking total pages since it's not implemented on backend yet
        setTotalPages(Math.ceil(statsRes.data.TotalReports / 5) || 1);
      } catch (error) {
        console.error("Error fetching admin reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [page]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`/api/admin/reports/${id.replace("#BC-", "")}/status`, {
        status: newStatus,
      });
      // Refresh data
      setPage(1);
      const statsRes = await axios.get("/api/admin/reports/stats");
      setStats(statsRes.data);
      const reportsRes = await axios.get(
        `/api/admin/reports?page=1&pageSize=5`,
      );
      setReports(reportsRes.data);
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const reportsTimelineData = stats.timelineData;
  const sparklineData1 = stats.totalReportsSparkline;
  const sparklineData2 = stats.pendingReportsSparkline;
  const sparklineData3 = stats.copyrightReportsSparkline;
  const sparklineData4 = stats.resolvedThisWeekSparkline;

  const priorityData = [
    {
      name: "Nghiêm trọng",
      value: stats.severePriority || 0,
      color: "#EF4444",
    },
    { name: "Cảnh báo", value: stats.warningPriority || 0, color: "#F97316" },
    {
      name: "Kiểm tra lại",
      value: stats.reviewPriority || 0,
      color: "#EAB308",
    },
  ];

  const totalPriority =
    stats.severePriority + stats.warningPriority + stats.reviewPriority || 1;
  const recentReports = reports;

  const openReportDetail = (report) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const closeReportDetail = () => {
    setSelectedReport(null);
    setIsDetailOpen(false);
  };

  const handleQuickAction = async (report, newStatus) => {
    try {
      setActionLoadingId(report.originalId || report.id);
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/reports/${report.originalId || report.id.replace("#BC-", "")}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      closeReportDetail();
      const [statsRes, reportsRes] = await Promise.all([
        axios.get("/api/admin/reports/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/admin/reports?page=${page}&pageSize=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      console.error("Error updating report status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="pb-20 max-w-[1600px] mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Báo cáo nhanh</h1>
          <p className="text-gray-400 text-sm">
            Tổng quan tình hình báo cáo, khiếu nại và vi phạm trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#1a1c23] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-gray-300">
            <span>12/05/2024 - 18/05/2024</span>
            <Calendar className="w-4 h-4 text-gray-500" />
          </div>
          <button className="flex items-center gap-2 bg-[#1a1c23] border border-white/5 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ─── A. KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
        {/* Card 1 */}
        <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between pt-5">
          <div className="px-5 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
              <Flag className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                Tổng báo cáo mới
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white">
                  {stats.totalReports}
                </span>
                <span
                  className={`text-xs font-semibold flex items-center ${stats.totalReportsTrend >= 0 ? "text-red-500" : "text-emerald-500"}`}
                >
                  {stats.totalReportsTrend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(stats.totalReportsTrend)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                So với 7 ngày trước
              </p>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData1}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between pt-5">
          <div className="px-5 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                Khiếu nại chưa giải quyết
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white">
                  {stats.pendingReports}
                </span>
                <span
                  className={`text-xs font-semibold flex items-center ${stats.pendingReportsTrend >= 0 ? "text-orange-500" : "text-emerald-500"}`}
                >
                  {stats.pendingReportsTrend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(stats.pendingReportsTrend)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                So với 7 ngày trước
              </p>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData2}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between pt-5">
          <div className="px-5 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                Vi phạm bản quyền
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white">
                  {stats.copyrightReports}
                </span>
                <span
                  className={`text-xs font-semibold flex items-center ${stats.copyrightReportsTrend >= 0 ? "text-purple-500" : "text-emerald-500"}`}
                >
                  {stats.copyrightReportsTrend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(stats.copyrightReportsTrend)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                So với 7 ngày trước
              </p>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData3}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#A855F7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#141418] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between pt-5">
          <div className="px-5 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                Đã xử lý (Tuần này)
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-white">
                  {stats.resolvedThisWeek}
                </span>
                <span
                  className={`text-xs font-semibold flex items-center ${stats.resolvedThisWeekTrend >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {stats.resolvedThisWeekTrend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(stats.resolvedThisWeekTrend)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                So với tuần trước
              </p>
            </div>
          </div>
          <div className="h-10 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData4}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── B. Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Trend Chart */}
        <div className="bg-[#141418] p-5 rounded-2xl border border-white/5 lg:col-span-2 h-[420px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-bold text-white">
                Xu hướng báo cáo
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1c23] border border-white/5 rounded-lg text-xs text-gray-300 cursor-pointer">
              <span>7 ngày qua</span>
              <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-400">Nội dung xấu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-400">Spam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-400">Bản quyền</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={reportsTimelineData}
                margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorInappropriate"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorCopyright"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                  vertical={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#15171f",
                    borderColor: "#374151",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inappropriate"
                  name="Nội dung xấu"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInappropriate)"
                  activeDot={{
                    r: 6,
                    fill: "#15171f",
                    stroke: "#EF4444",
                    strokeWidth: 3,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spam"
                  name="Spam"
                  stroke="#F97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSpam)"
                  activeDot={{
                    r: 6,
                    fill: "#15171f",
                    stroke: "#F97316",
                    strokeWidth: 3,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="copyright"
                  name="Bản quyền"
                  stroke="#A855F7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCopyright)"
                  activeDot={{
                    r: 6,
                    fill: "#15171f",
                    stroke: "#A855F7",
                    strokeWidth: 3,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Priority */}
        <div className="bg-[#141418] p-6 rounded-2xl border border-white/5 lg:col-span-1 h-[420px] flex flex-col">
          <h3 className="text-base font-bold text-white mb-6">
            Mức độ ưu tiên
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    stroke="none"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400">Tổng</span>
                <span className="text-2xl font-bold text-white leading-none my-1">
                  {totalPriority}
                </span>
                <span className="text-[10px] text-gray-500">báo cáo</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-4 w-full px-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-300">
                    Nghiêm trọng (Khóa ngay)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-semibold">
                    {stats.severePriority}
                  </span>
                  <span className="text-gray-500">
                    ({Math.round((stats.severePriority / totalPriority) * 100)}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-300">
                    Cảnh báo (Warning)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-semibold">
                    {stats.warningPriority}
                  </span>
                  <span className="text-gray-500">
                    ({Math.round((stats.warningPriority / totalPriority) * 100)}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-300">
                    Kiểm tra lại (Review)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-semibold">
                    {stats.reviewPriority}
                  </span>
                  <span className="text-gray-500">
                    ({Math.round((stats.reviewPriority / totalPriority) * 100)}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── C. Recent Reports Table ─── */}
      <div className="bg-[#141418] p-5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-white">
            Danh sách báo cáo mới nhất
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1c23] border border-white/5 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors cursor-pointer">
            Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5">
              <tr>
                <th className="pb-4 px-4 font-semibold">Mã báo cáo</th>
                <th className="pb-4 px-4 font-semibold">Người báo cáo</th>
                <th className="pb-4 px-4 font-semibold">Lý do chính</th>
                <th className="pb-4 px-4 font-semibold">Thời gian</th>
                <th className="pb-4 px-4 font-semibold">Mức độ ưu tiên</th>
                <th className="pb-4 px-4 font-semibold">Trạng thái</th>
                <th className="pb-4 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentReports.map((report, idx) => (
                <tr
                  key={idx}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-4 text-xs text-gray-400 font-mono">
                    {report.id}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {report.avatar?.startsWith("http") ? (
                        <img
                          src={report.avatar}
                          alt={report.user}
                          className="w-7 h-7 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg">
                          {report.avatar}
                        </div>
                      )}
                      <span className="text-sm text-gray-200">
                        {report.user}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-300 hover:text-red-400 cursor-pointer transition-colors">
                        {report.reason}
                      </span>
                      {report.description && (
                        <span
                          className="text-[10px] text-gray-500 mt-1 line-clamp-1"
                          title={report.description}
                        >
                          {report.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-gray-400">
                    {report.time}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${report.pColor}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {report.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs font-semibold flex items-center gap-1.5 ${report.status === "Chờ xử lý" ? "text-orange-500" : "text-emerald-500"}`}
                    >
                      {report.status === "Chờ xử lý" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      )}
                      {report.status === "Đã giải quyết" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openReportDetail(report)}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="relative group/menu">
                        <button
                          className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Khác"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1c23] border border-white/5 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                          {report.status !== "Đã giải quyết" && (
                            <button
                              onClick={() =>
                                handleStatusChange(report.id, "Resolved")
                              }
                              className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-white/5 transition-colors"
                            >
                              Đánh dấu đã giải quyết
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleStatusChange(report.id, "Ignored")
                            }
                            className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-white/5 transition-colors"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isDetailOpen && selectedReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={closeReportDetail}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-red-400">
                    Chi tiết báo cáo
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {selectedReport.id}
                  </h3>
                </div>
                <button
                  onClick={closeReportDetail}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Người báo cáo</p>
                  <div className="mt-2 flex items-center gap-3">
                    {selectedReport.avatar?.startsWith("http") ? (
                      <img
                        src={selectedReport.avatar}
                        alt={selectedReport.user}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                        {selectedReport.avatar}
                      </div>
                    )}
                    <span className="font-medium text-white">
                      {selectedReport.user}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Đối tượng</p>
                  <p className="mt-2 font-semibold text-white">
                    {selectedReport.targetType || "Video"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Mức độ ưu tiên</p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedReport.pColor}`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {selectedReport.priority}
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Trạng thái</p>
                  <p className="mt-2 font-semibold text-white">
                    {selectedReport.status}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Lý do</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {selectedReport.reason}
                </p>
              </div>

              {selectedReport.description && (
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Mô tả chi tiết</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {selectedReport.status !== "Đã giải quyết" && (
                  <>
                    <button
                      onClick={() =>
                        handleQuickAction(selectedReport, "Resolved")
                      }
                      disabled={
                        actionLoadingId ===
                        (selectedReport.originalId || selectedReport.id)
                      }
                      className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      {actionLoadingId ===
                      (selectedReport.originalId || selectedReport.id)
                        ? "Đang xử lý..."
                        : "Đánh dấu đã giải quyết"}
                    </button>
                    <button
                      onClick={() =>
                        handleQuickAction(selectedReport, "Ignored")
                      }
                      disabled={
                        actionLoadingId ===
                        (selectedReport.originalId || selectedReport.id)
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white disabled:opacity-60"
                    >
                      Bỏ qua
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative">
          <div className="flex items-center gap-1 mx-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${page === i + 1 ? "border border-red-500/50 bg-red-500/10 text-red-400 font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 text-right absolute right-4 hidden md:block">
            Hiển thị {recentReports.length > 0 ? (page - 1) * 5 + 1 : 0} -{" "}
            {Math.min(page * 5, stats.totalReports)} trong {stats.totalReports}{" "}
            báo cáo
          </div>
        </div>
      </div>
    </div>
  );
}

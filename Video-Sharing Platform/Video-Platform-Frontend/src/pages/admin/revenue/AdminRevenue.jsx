import { useState, useEffect } from "react";
import axios from "axios";
import {
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  Loader2,
  PieChart as PieChartIcon
} from "lucide-react";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalRevenue: 0,
      currentMonthRevenue: 0,
      percentChange: 0,
      totalWithdrawals: 0,
      averageRevenuePerWithdrawal: 0,
    },
    chartData: [],
    breakdownChart: [],
    history: [],
  });

  const COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"];

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/api/admin/revenue/stats", { headers });
      setData(res.data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  const { stats, chartData, breakdownChart, history } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#141418] border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-lg">
            {Number(payload[0].value).toLocaleString()} VNĐ
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Doanh thu Nền tảng</h1>
          <p className="text-sm text-gray-400">
            Tổng hợp doanh thu từ các giao dịch rút tiền (phí chiết khấu)
          </p>
        </div>
        <button 
          onClick={fetchRevenueData}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-white/10"
        >
          <Activity className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng doanh thu */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Tổng doanh thu</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-gray-500 font-medium">VNĐ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500 relative z-10">Toàn thời gian</div>
        </div>

        {/* Doanh thu tháng này */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Tháng này</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {stats.currentMonthRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-gray-500 font-medium">VNĐ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-1.5 relative z-10">
            <span className={`flex items-center text-xs font-medium ${stats.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.percentChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : null}
              {stats.percentChange > 0 ? '+' : ''}{stats.percentChange.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">so với tháng trước</span>
          </div>
        </div>

        {/* Tổng số lệnh */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Giao dịch thu phí</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {stats.totalWithdrawals.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium">Lệnh</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500 relative z-10">Đã hoàn tất</div>
        </div>

        {/* ARPU */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">Trung bình / Lệnh</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {stats.averageRevenuePerWithdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-gray-500 font-medium">VNĐ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500 relative z-10">Tỷ suất lợi nhuận TB</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-[#141418] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-medium mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Biến động doanh thu (30 ngày)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525B" 
                  tick={{ fill: '#71717A', fontSize: 12 }} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth()+1}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#52525B" 
                  tick={{ fill: '#71717A', fontSize: 12 }} 
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${val/1000}k`}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#141418", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-medium mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-orange-400" />
            Nguồn thu phân bổ
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {breakdownChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#141418', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} VNĐ`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#0F0F0F] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-white font-medium text-lg">Lịch sử thu phí</h3>
          <p className="text-xs text-gray-400 mt-1">Chi tiết các khoản phí thu được từ các lệnh rút tiền hoàn tất</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#0A0A0C] text-gray-400 border-b border-white/5">
              <tr>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Thời gian</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Streamer</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Thực nhận (VND)</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Phí nền tảng (VND)</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Nguồn chính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Chưa có dữ liệu doanh thu
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3 whitespace-nowrap align-middle">
                      <div className="text-white">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.streamerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.streamerEmail}`}
                          alt=""
                          className="w-8 h-8 rounded-full bg-[#1A1A20]"
                        />
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {item.streamerName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.streamerEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle text-right">
                      <div className="font-medium text-gray-300">
                        {item.amountReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle text-right bg-green-500/5">
                      <div className="font-bold text-green-400">
                        +{item.platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <span className="px-2 py-1 bg-white/5 text-gray-300 rounded text-xs border border-white/10">
                        {item.mainSource}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

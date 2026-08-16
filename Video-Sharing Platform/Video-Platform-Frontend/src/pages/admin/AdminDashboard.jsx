import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Users, Video, Eye, DollarSign, Loader2, Database, ThumbsUp, AlertTriangle, Flag, Video as VideoIcon, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/chart-data')
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B']; // Custom colors matching the image mostly

  return (
    <div className="pb-20 max-w-[1600px] mx-auto text-white">
      
      {/* Date Picker Header (Aligned Right) */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2 bg-[#1a1c23] border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>12/05/2024 - 18/05/2024</span>
          <svg className="w-3 h-3 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      
      {/* ─── A. KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5 mb-5">
        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg"><Users className="w-4 h-4 text-purple-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Người dùng</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalUsers?.toLocaleString()}</p>
          <p className="text-[10px] text-green-400 font-medium">↑ 12.5% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>
        
        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg"><Video className="w-4 h-4 text-indigo-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Tổng video</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalVideos?.toLocaleString()}</p>
          <p className="text-[10px] text-green-400 font-medium">↑ 8.7% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/20 rounded-lg"><Eye className="w-4 h-4 text-orange-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Lượt xem</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalViews?.toLocaleString()}</p>
          <p className="text-[10px] text-green-400 font-medium">↑ 15.2% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/20 rounded-lg"><DollarSign className="w-4 h-4 text-green-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Doanh thu</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">${stats?.monthlyRevenue?.toLocaleString()}</p>
          <p className="text-[10px] text-green-400 font-medium">↑ {stats?.revenueGrowth}% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg"><Database className="w-4 h-4 text-blue-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Lưu trữ</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalStorageGB} GB</p>
          <p className="text-[10px] text-gray-500">/ 100 GB</p>
        </div>

        <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-500/20 rounded-lg"><ThumbsUp className="w-4 h-4 text-pink-400" /></div>
              <span className="text-gray-400 text-xs font-medium">Lượt thích</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalLikes?.toLocaleString()}</p>
          <p className="text-[10px] text-green-400 font-medium">↑ 11.1% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>
      </div>

      {/* ─── B. Analytics Charts (Row 2) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 h-[320px]">
        
        {/* Biểu đồ Lưu lượng (Chiếm 1.25 -> adjust layout later if needed, we'll just use grid layout. Actually, the image has 3 main blocks: AreaChart, DonutChart, Alerts. We can use grid-cols-10: 4, 4, 2 */}
        
        {/* Lượt xem trong 7 ngày qua */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-1 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Lượt xem trong 7 ngày qua</h3>
            <div className="bg-[#1a1c23] border border-white/10 px-2 py-1 rounded text-[10px] text-gray-400 cursor-pointer flex items-center gap-1">
              7 ngày qua <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.traffic} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4b5563" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#4b5563" tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}K`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1c23', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#8B5CF6' }}
                />
                <Area type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" activeDot={{ r: 6, fill: "#8B5CF6", stroke: "#000", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phân bổ Doanh thu */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-1 h-full flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Phân bổ doanh thu</h3>
          <div className="flex-1 flex items-center">
            <div className="w-1/2 h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData?.revenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData?.revenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-white">${stats?.monthlyRevenue?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">Tổng doanh thu</span>
              </div>
            </div>
            
            {/* Legend Right Side */}
            <div className="w-1/2 pl-4 flex flex-col gap-4">
              {chartData?.revenue?.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                      <span className="text-xs text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold">{((item.value / stats.monthlyRevenue) * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[10px] text-gray-500 text-right">${item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Column */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex items-center gap-4 flex-1">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Báo cáo video vi phạm</p>
              <h4 className="text-xl font-bold text-white leading-tight">23</h4>
              <p className="text-xs text-gray-500">Video <span className="text-green-400 font-medium ml-1">↑ 15%</span> <span className="text-[10px]">so với tuần trước</span></p>
            </div>
          </div>
          <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex items-center gap-4 flex-1">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Flag className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Khiếu nại mới</p>
              <h4 className="text-xl font-bold text-white leading-tight">17</h4>
              <p className="text-xs text-gray-500">Khiếu nại <span className="text-green-400 font-medium ml-1">↑ 8%</span> <span className="text-[10px]">so với tuần trước</span></p>
            </div>
          </div>
          <div className="bg-bg-[#0F0F0F] p-4 rounded-2xl border border-white/5 flex items-center gap-4 flex-1">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <VideoIcon className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400">Video chờ xét duyệt</p>
              <h4 className="text-xl font-bold text-white leading-tight">42</h4>
              <p className="text-xs text-gray-500">Video <span className="text-red-400 font-medium ml-1">↓ 5%</span> <span className="text-[10px]">so với tuần trước</span></p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── C. Báo Cáo & Danh Mục & Giao Dịch (Row 3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 mb-5">
        
        {/* Top Danh Mục (Bar chart) */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-white mb-6">Top danh mục <span className="text-gray-500 text-xs font-normal">(theo lượt xem)</span></h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.categoryDistribution} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f2937" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fontSize: 11}} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1c23', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cảnh báo (Alerts / Reports) */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-4">
          <h3 className="text-sm font-semibold text-white mb-4">Báo cáo chờ duyệt</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase text-gray-500 border-b border-white/10">
                <tr>
                  <th className="pb-2 font-medium">Người báo cáo</th>
                  <th className="pb-2 font-medium">Lý do</th>
                  <th className="pb-2 font-medium">Thời gian</th>
                  <th className="pb-2 font-medium text-center">Trạng thái</th>
                  <th className="pb-2 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentReports?.map((report, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-2.5 text-xs text-gray-300 font-medium">{report.user}</td>
                    <td className="py-2.5 text-xs text-red-400">{report.reason}</td>
                    <td className="py-2.5 text-[10px] text-gray-500">{report.time}</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${report.status === 'Pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button className={`text-[10px] px-3 py-1 rounded-md transition-colors ${report.status === 'Pending' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600/50 text-gray-300'}`}>
                        {report.status === 'Pending' ? 'Xử lý' : 'Xem'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Giao dịch gần đây */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-white mb-4">Giao dịch gần nhất</h3>
          <div className="flex flex-col gap-3">
            {stats?.recentTransactions?.map((trx, idx) => {
              const bgColor = trx.type === 'Premium' ? 'bg-blue-500/20 text-blue-400' : (trx.type === 'Donate' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400');
              const init = trx.type.charAt(0);
              
              return (
                <div key={idx} className="flex items-center justify-between pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${bgColor}`}>{init}</div>
                    <div>
                      <p className="text-xs font-medium text-gray-300">{trx.type === 'Premium' ? 'Premium Subscription' : (trx.type === 'Donate' ? 'Donate' : 'Ad Revenue')}</p>
                      <p className="text-[10px] text-gray-500">{trx.type === 'Ad Revenue' ? 'Google Ads' : `User: ${trx.user}`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">${trx.amount.toFixed(2)}</p>
                    <p className="text-[9px] text-gray-500">{trx.time.replace('trước', '')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─── D. Bảng Xếp Hạng & Sự Kiện (Row 4) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
        
        {/* Top 5 Videos */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-4">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold text-white">Top 5 video thịnh hành</h3>
            <span className="text-xs text-purple-400 cursor-pointer hover:underline">Xem tất cả</span>
          </div>
          <div className="flex flex-col gap-3">
            {stats?.topVideos?.map((video, idx) => (
              <div key={idx} className="flex items-center gap-3 group cursor-pointer pb-2">
                <div className="w-5 h-5 rounded-md bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                <div className="w-[72px] h-10 bg-gray-800 rounded overflow-hidden shrink-0">
                  <img src={video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video'} className="w-full h-full object-cover" alt="Thumb" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-300 truncate group-hover:text-purple-400 transition-colors">{video.title}</h4>
                  <p className="text-[10px] text-gray-500">{video.channelName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">{video.views.toLocaleString()} lượt xem</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Channels */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-3">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold text-white">Top 5 kênh hàng đầu</h3>
            <span className="text-xs text-purple-400 cursor-pointer hover:underline">Xem tất cả</span>
          </div>
          <div className="flex flex-col gap-4">
            {stats?.topChannels?.map((channel, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="w-4 font-bold text-gray-500 text-xs text-center">{idx + 1}</div>
                <img src={channel.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.channelName}`} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-purple-500/50 transition-all" alt="Avatar" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-300 truncate group-hover:text-white transition-colors">{channel.channelName}</h4>
                  <p className="text-[10px] text-gray-500">@{channel.channelName.replace(/\s+/g, '').toLowerCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{(channel.subscribers / 1000).toFixed(0)}K</p>
                  <p className="text-[9px] text-gray-500">người đăng ký</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Luồng Sự kiện (Activity Feed) */}
        <div className="bg-bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-white mb-5">Hoạt động hệ thống</h3>
          <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[1px] before:bg-white/10">
            {stats?.recentActivities?.map((activity, idx) => {
              const IconType = activity.type === 'user' ? Users : (activity.type === 'video' ? VideoIcon : DollarSign);
              const Color = activity.type === 'user' ? 'text-purple-400 bg-bg-[#0F0F0F] border-purple-500/30' : (activity.type === 'video' ? 'text-pink-400 bg-bg-[#0F0F0F] border-pink-500/30' : 'text-orange-400 bg-bg-[#0F0F0F] border-orange-500/30');
              
              return (
                <div key={idx} className="flex gap-3 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${Color}`}>
                    <IconType className="w-3 h-3" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[11px] text-gray-300 leading-snug font-medium">{activity.action}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

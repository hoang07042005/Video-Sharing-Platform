import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Hammer
} from "lucide-react";
import moment from "moment";
import axios from "axios";

export default function AdminStrikes() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [strikeHistory, setStrikeHistory] = useState(null);
  const [strikeLoading, setStrikeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    totalStrikes: 0,
    affectedChannels: 0,
    severeStrikes: 0,
    activeWarnings: 0,
    expiredStrikes: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setPage(1); // Reset page on new search
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const loadChannels = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let url = `/api/admin/reports/channels/strikes?page=${page}&pageSize=10`;
        if (activeTab !== "all") {
            if (activeTab === "expired") {
                url += `&strikes=0`;
            } else {
                url += `&strikes=${activeTab}`;
            }
        }
        if (debouncedSearchTerm) {
            url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
        }

        const [res, statsRes] = await Promise.all([
          axios.get(url, { headers }),
          axios.get(`/api/admin/reports/channels/strikes/stats`, { headers })
        ]);

        if (isMounted) {
          setChannels(res.data.data || res.data.Data || []);
          setTotalPages(res.data.totalPages || res.data.TotalPages || 1);
          setTotalItems(res.data.totalItems || res.data.TotalItems || 0);
          setStats({
            totalStrikes: statsRes.data.totalStrikes || statsRes.data.TotalStrikes || 0,
            affectedChannels: statsRes.data.affectedChannels || statsRes.data.AffectedChannels || 0,
            severeStrikes: statsRes.data.severeStrikes || statsRes.data.SevereStrikes || 0,
            activeWarnings: statsRes.data.activeWarnings || statsRes.data.ActiveWarnings || 0,
            expiredStrikes: statsRes.data.expiredStrikes || statsRes.data.ExpiredStrikes || 0
          });
        }
      } catch (error) {
        console.error("Error fetching channels with strikes:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChannels();

    return () => {
      isMounted = false;
    };
  }, [page, activeTab, debouncedSearchTerm]);

  const openStrikeDetail = async (channel) => {
    setSelectedChannel(channel);
    setIsDetailOpen(true);
    setStrikeHistory(null);
    setStrikeLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/admin/reports/target/${channel.channelId}/strikes?targetType=Channel`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStrikeHistory(res.data);
    } catch (error) {
      console.error("Error fetching strike history:", error);
    } finally {
      setStrikeLoading(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedChannel(null);
    setStrikeHistory(null);
  };

  const getTimelineColor = (strikes) => {
    if (strikes >= 3) return "text-red-500 border-red-500";
    if (strikes === 2) return "text-orange-500 border-orange-500";
    return "text-yellow-500 border-yellow-500";
  };

  const getBadgeStyle = (strikes) => {
    if (strikes >= 3) return "bg-red-500/10 text-red-500";
    if (strikes === 2) return "bg-orange-500/10 text-orange-500";
    return "bg-yellow-500/10 text-yellow-500";
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Lịch sử đánh gậy kênh</h1>
            <p className="text-sm text-gray-400">
              Theo dõi và quản lý các kênh đã bị hệ thống xử phạt với hình thức đánh gậy.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Hammer className="w-5 h-5 -rotate-12" />
            </div>
            <span className="text-gray-400 font-medium">Tổng số gậy</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white">{stats.totalStrikes}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">↑ 12%</span>
              <span className="text-[10px] text-gray-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Channels Affected */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-gray-400 font-medium">Kênh bị ảnh hưởng</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white">{stats.affectedChannels}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">↑ 8%</span>
              <span className="text-[10px] text-gray-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* 3 Strikes (Severe) */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-gray-400 font-medium">Gậy nặng (3 gậy)</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white">{stats.severeStrikes}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs text-rose-500 font-medium flex items-center gap-1">↓ 3%</span>
              <span className="text-[10px] text-gray-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Under Observation */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]" title="Đang trong thời gian theo dõi">Đang theo dõi</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white">{stats.activeWarnings}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">↑ 15%</span>
              <span className="text-[10px] text-gray-500">so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* Expired Strikes */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-gray-400 font-medium">Đã hết hạn gậy</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white">{stats.expiredStrikes}</h3>
            <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">↑ 9%</span>
              <span className="text-[10px] text-gray-500">so với tháng trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Table Area */}
      <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-500/10 text-indigo-400 cursor-default`}
            >
              <Hammer className="w-4 h-4" />
              Danh sách kênh bị đánh gậy
            </button>
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setActiveTab("1"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "1" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              1 gậy
            </button>
            <button
              onClick={() => { setActiveTab("2"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "2" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              2 gậy
            </button>
            <button
              onClick={() => { setActiveTab("3"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "3" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              3 gậy
            </button>
            <button
              onClick={() => { setActiveTab("expired"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === "expired" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Đã hết hạn gậy
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm kênh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50 w-full md:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="w-16"></th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  KÊNH
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SỐ GẬY
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ĐỐI TƯỢNG VI PHẠM
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  LÝ DO (GẦN NHẤT)
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  NGÀY VI PHẠM
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  TRẠNG THÁI
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative">
              {/* Timeline decorative line */}
              {channels.length > 0 && (
                <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5 -z-10" />
              )}
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-2 text-sm">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : channels.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-gray-400">
                    <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    Không tìm thấy kênh nào
                  </td>
                </tr>
              ) : (
                channels.map((channel, idx) => (
                  <tr
                    key={channel.channelId}
                    className="hover:bg-white/[0.02] transition-colors relative"
                  >
                    <td className="py-4 px-4 relative">
                      <div className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className={`w-8 h-8 rounded-full border-2 bg-[#1A1D21] flex items-center justify-center ${getTimelineColor(channel.totalStrikes)}`}>
                          <Hammer className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={channel.avatar || "https://ui-avatars.com/api/?name=" + channel.channelName}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full bg-white/10 object-cover shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">
                            {channel.channelName}
                          </span>
                          <span className="text-gray-500 text-xs">
                            @{channel.channelName.toLowerCase().replace(/\s+/g, '.')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getBadgeStyle(channel.totalStrikes)}`}>
                        {channel.totalStrikes} gậy
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {channel.latestTargetType === "Livestream" && channel.latestTargetTitle ? (
                        <div className="text-xs p-2.5 bg-red-500/5 border border-red-500/20 rounded-md max-w-[220px]">
                          <span className="text-red-400 font-medium block truncate mb-1">Live: {channel.latestTargetTitle}</span>
                          <div className="text-gray-400 flex flex-col gap-0.5">
                            <span className="truncate">Bắt đầu: {channel.latestTargetStartTime ? moment(channel.latestTargetStartTime).format("DD/MM/YYYY HH:mm") : '?'}</span>
                            <span className="truncate">Kết thúc: {channel.latestTargetEndTime ? moment(channel.latestTargetEndTime).format("DD/MM/YYYY HH:mm") : '?'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm italic">Không có dữ liệu đối tượng</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-300 text-sm line-clamp-2 max-w-[220px]">
                        {channel.latestStrikeReason || "Không rõ"}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {channel.latestStrikeDate ? (
                        <div className="text-sm text-gray-300 flex flex-col">
                          <span>{moment(channel.latestStrikeDate).format("DD/MM/YYYY")}</span>
                          <span className="text-gray-500">{moment(channel.latestStrikeDate).format("HH:mm")}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {channel.isSuspended ? (
                        <span className="text-red-500 text-xs font-medium">
                          Đã khóa kênh
                        </span>
                      ) : channel.totalStrikes >= 2 ? (
                        <span className="text-orange-500 text-xs font-medium">
                          Đang theo dõi
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-xs font-medium">
                          Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => openStrikeDetail(channel)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-gray-500">Hiển thị {channels.length > 0 ? (page - 1) * 10 + 1 : 0} - {Math.min(page * 10, totalItems)} của {totalItems} kết quả</span>
          <div className="flex items-center gap-1">
            <select className="bg-transparent border border-white/10 text-gray-400 rounded-md px-2 py-1 mr-2 outline-none">
              <option>10 / trang</option>
            </select>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button 
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${page === p ? 'bg-[#5355D6] text-white' : 'border border-white/10 text-gray-400 hover:bg-white/5'}`}>
                {p}
              </button>
            ))}
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div
            className="bg-[#12131A] border border-white/5 rounded-1xl w-full h-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-500 p-[1px]">
                  <div className="w-full h-full bg-[#12131A] rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-pink-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Chi tiết lịch sử vi phạm (Gậy)
                  </h2>
                  <p className="text-sm text-gray-400">
                    Theo dõi và quản lý các lần vi phạm của kênh
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0F0F0F] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#0F0F0F]">
              {strikeLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : strikeHistory ? (
                <>
                  {/* Channel Info Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedChannel.avatar || "https://ui-avatars.com/api/?name=" + selectedChannel.channelName}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                      />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{selectedChannel.channelName}</span>
                          <CheckCircle className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                            {selectedChannel.isSuspended ? "Bị khóa" : "Hoạt động"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-1 max-w-[220px]">
                          ID kênh: {selectedChannel.channelId}
                          <button 
                            className="hover:text-white" 
                            title="Copy ID"
                            onClick={() => navigator.clipboard.writeText(selectedChannel.channelId)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-xl min-w-[240px]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${strikeHistory.totalStrikes >= 3 ? "bg-red-500/10 border-red-500/20" : strikeHistory.totalStrikes === 2 ? "bg-orange-500/10 border-orange-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
                        <Hammer className={`w-6 h-6 -rotate-12 ${strikeHistory.totalStrikes >= 3 ? "text-red-500" : strikeHistory.totalStrikes === 2 ? "text-orange-500" : "text-yellow-500"}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">Tổng số gậy</span>
                        <div className="text-white font-bold text-xl flex items-baseline gap-1">
                          {strikeHistory.totalStrikes} <span className="text-gray-500 text-sm font-medium">/ 3</span>
                        </div>
                        <span className="text-gray-500 text-[10px] mt-0.5">
                          {strikeHistory.totalStrikes >= 3 ? "Kênh đã bị khóa do đủ 3 gậy" : `Còn lại ${3 - strikeHistory.totalStrikes} gậy trước khi bị khóa kênh`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strike History List */}
                  {strikeHistory.history && strikeHistory.history.length > 0 ? (
                    <div className="space-y-6">
                      {strikeHistory.history.map((strike, index) => {
                        const strikeNumber = strikeHistory.history.length - index;
                        const textColor = strikeNumber >= 3 ? "text-red-500" : strikeNumber === 2 ? "text-orange-500" : "text-yellow-500";
                        const bgBase = strikeNumber >= 3 ? "bg-red-500" : strikeNumber === 2 ? "bg-orange-500" : "bg-yellow-500";
                        const bgOpacity = strikeNumber >= 3 ? "bg-red-500/10" : strikeNumber === 2 ? "bg-orange-500/10" : "bg-yellow-500/10";
                        const bgPulse = strikeNumber >= 3 ? "bg-red-500/20" : strikeNumber === 2 ? "bg-orange-500/20" : "bg-yellow-500/20";
                        const borderColor = strikeNumber >= 3 ? "border-red-500/20" : strikeNumber === 2 ? "border-orange-500/20" : "border-yellow-500/20";
                        const leftLineColor = strikeNumber >= 3 ? "bg-red-500/50" : strikeNumber === 2 ? "bg-orange-500/50" : "bg-yellow-500/50";

                        return (
                          <div key={strike.id} className="space-y-4">
                            {/* Strike Item Header */}
                            <div className="flex flex-col p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className={`w-5 h-5 ${textColor}`} />
                                  <span className="text-white font-bold">Lần vi phạm #{strikeNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Calendar className="w-4 h-4" />
                                  {moment(strike.createdAt).format("DD/MM/YYYY HH:mm")}
                                </div>
                              </div>

                              <div className="text-gray-300 text-sm mb-4">
                                <span className={`${textColor} font-medium`}>Lý do:</span> {strike.reason}
                              </div>

                              {strike.targetInfo && strike.targetType === "Livestream" && (
                                <div className={`p-4 bg-black/40 border ${borderColor} rounded-xl relative overflow-hidden`}>
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftLineColor}`}></div>
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${bgPulse}`}>
                                      <div className={`w-2 h-2 rounded-full ${bgBase} animate-pulse`}></div>
                                    </div>
                                    <span className="text-gray-300 font-medium text-sm">Buổi Live vi phạm: <span className={textColor}>{strike.targetInfo.title}</span></span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-2">
                                    <div>
                                      <span className="text-gray-500 text-xs block mb-1">Bắt đầu</span>
                                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {strike.targetInfo.actualStartTime ? moment(strike.targetInfo.actualStartTime).format("DD/MM/YYYY HH:mm:ss") : 'Không rõ'}
                                      </div>
                                    </div>
                                    <div className="border-l border-white/5 pl-4">
                                      <span className="text-gray-500 text-xs block mb-1">Kết thúc (bị sập)</span>
                                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {strike.targetInfo.endTime ? moment(strike.targetInfo.endTime).format("DD/MM/YYYY HH:mm:ss") : 'Không rõ'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Reports List */}
                            {strike.reports && strike.reports.length > 0 && (
                              <div className="bg-[#161821] border border-white/5 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-5">
                                  <Users className="w-5 h-5 text-indigo-400" />
                                  <h4 className="text-indigo-400 font-medium">Các báo cáo liên quan ({strike.reports.length})</h4>
                                </div>

                                <div className="space-y-1">
                                  {strike.reports.map((report) => (
                                    <div key={report.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-2 hover:bg-white/[0.02] rounded-xl transition-colors">
                                      <div className="col-span-4 flex items-center gap-3">
                                        {report.reporterAvatar ? (
                                          <img
                                            src={report.reporterAvatar}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full object-cover shrink-0 bg-white/10"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0">
                                            {report.reporterName.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="flex flex-col overflow-hidden">
                                          <span className="text-white font-medium text-sm truncate">{report.reporterName}</span>
                                          <span className="text-gray-500 text-xs truncate">{report.reporterEmail}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="col-span-5 flex flex-col justify-center">
                                        <span className="text-gray-400 text-[11px] uppercase tracking-wider mb-0.5">Vi phạm</span>
                                        <span className="text-gray-200 text-sm">{report.reason}</span>
                                        {report.description && (
                                          <span className="text-gray-500 text-xs italic truncate mt-0.5">"{report.description}"</span>
                                        )}
                                      </div>

                                      <div className="col-span-3 flex items-center justify-end gap-1.5 text-gray-400 text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        {moment(report.createdAt).format("DD/MM/YYYY HH:mm")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/[0.02]">
                      <p className="text-gray-400 text-sm">Lịch sử trống. Gậy có thể được ghi nhận qua dữ liệu cũ.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">Không thể tải thông tin vi phạm.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-[#12131A] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <span className="text-indigo-400 font-serif italic font-bold">i</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Mỗi kênh sẽ bị khóa khi nhận đủ 3 gậy trong 90 ngày.<br/>
                  Các gậy cũ hơn 90 ngày sẽ được tự động xóa.
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="px-6 py-2.5 bg-[#5355D6] hover:bg-[#4648c0] text-white font-medium rounded-xl transition-colors cursor-pointer min-w-[100px]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

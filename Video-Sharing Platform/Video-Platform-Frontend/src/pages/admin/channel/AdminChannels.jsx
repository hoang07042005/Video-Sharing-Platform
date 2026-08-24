import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Loader2, MoreVertical, Tv, Shield, ShieldOff,
  Users, Activity, CheckCircle, Video as VideoIcon, Radio
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function AdminChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, verified, suspended
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, itemsPerPage]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/channels/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannels(res.data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (id, isVerified) => {
    if (!window.confirm(`Bạn có chắc muốn ${isVerified ? 'thu hồi' : 'cấp'} tích xanh cho kênh này?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/channels/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChannels();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
    setOpenMenuId(null);
  };

  const handleToggleSuspend = async (id, isSuspended) => {
    if (!window.confirm(`Bạn có chắc muốn ${isSuspended ? 'mở lại' : 'đình chỉ'} kênh này?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/channels/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChannels();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
    setOpenMenuId(null);
  };

  const handleTogglePermissions = async (id, currentCanLivestream, currentCanUpload, type) => {
    if (!window.confirm(`Bạn có chắc muốn ${type === 'upload' ? (!currentCanUpload ? 'mở' : 'tắt') : (!currentCanLivestream ? 'mở' : 'tắt')} quyền này?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/channels/${id}/permissions`, {
        canLivestream: type === 'livestream' ? !currentCanLivestream : currentCanLivestream,
        canUploadVideo: type === 'upload' ? !currentCanUpload : currentCanUpload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchChannels();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
    setOpenMenuId(null);
  };

  // Lọc danh sách kênh
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = 
      (channel.channelName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (channel.handle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (channel.ownerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'verified' && channel.isVerified) ||
      (activeTab === 'suspended' && channel.isSuspended);
      
    return matchesSearch && matchesTab;
  });

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredChannels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage);

  const stats = {
    total: channels.length,
    active: channels.filter(c => !c.isSuspended).length,
    suspended: channels.filter(c => c.isSuspended).length,
    uploadDisabled: channels.filter(c => !c.canUploadVideo).length,
    livestreamDisabled: channels.filter(c => !c.canLivestream).length,
  };

  const chartData = [
    { name: 'Hoạt động', value: stats.active, color: '#22c55e' },
    { name: 'Bị đình chỉ', value: stats.suspended, color: '#ef4444' },
    { name: 'Tắt tải video', value: stats.uploadDisabled, color: '#f97316' },
    { name: 'Tắt livestream', value: stats.livestreamDisabled, color: '#3b82f6' }
  ];

  // Only pass non-zero values to the pie chart, or a fallback if all are zero
  const pieData = chartData.filter(item => item.value > 0);
  if (pieData.length === 0) {
    pieData.push({ name: 'Chưa có dữ liệu', value: 1, color: '#374151' });
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tv className="w-6 h-6 text-purple-500" />
            Quản lý Kênh
          </h1>
          <p className="text-gray-400 mt-1">Kiểm soát hoạt động, trạng thái và cấp quyền cho các kênh.</p>
        </div>
      </div>

      {/* Top 5 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Channels */}
        <div className="bg-[#141418] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Tv className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Tổng số kênh</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-purple-500" fill="none" strokeWidth="2">
              <path d="M0,30 L20,25 L40,35 L60,15 L80,25 L100,5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Active Channels */}
        <div className="bg-[#141418] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Kênh hoạt động</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.active}</h3>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-green-500" fill="none" strokeWidth="2">
              <path d="M0,35 L20,25 L40,30 L60,15 L80,20 L100,5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Suspended Channels */}
        <div className="bg-[#141418] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Kênh bị đình chỉ</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.suspended}</h3>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-red-500" fill="none" strokeWidth="2">
              <path d="M0,5 L20,15 L40,10 L60,25 L80,20 L100,35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Upload Disabled */}
        <div className="bg-[#141418] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Tắt tải video</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.uploadDisabled}</h3>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-orange-500" fill="none" strokeWidth="2">
              <path d="M0,20 L20,20 L40,25 L60,20 L80,20 L100,20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Livestream Disabled */}
        <div className="bg-[#141418] border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Radio className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-400">Tắt livestream</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.livestreamDisabled}</h3>
          </div>
          <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-blue-500" fill="none" strokeWidth="2">
              <path d="M0,15 L20,10 L40,15 L60,20 L80,25 L100,20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content (Table) */}
        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Filters and Search */}
          <div className=" rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex bg-[#141418] rounded-lg p-1 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-none ${
                  activeTab === 'all' ? 'bg-[#2A2A35] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-none ${
                  activeTab === 'verified' ? 'bg-[#2A2A35] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Đã xác minh
              </button>
              <button
                onClick={() => setActiveTab('suspended')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-none ${
                  activeTab === 'suspended' ? 'bg-[#2A2A35] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bị đình chỉ
              </button>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên kênh, email, @handle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#141418] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-[#141418] border border-white/5 rounded-1xl overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-[11px] uppercase bg-[#141418] border-b border-white/5 text-gray-400 tracking-wider">
                  <tr>
                    <th className="px-2 py-3 font-semibold">Kênh</th>
                    <th className="px-2 py-3 font-semibold">Chủ sở hữu</th>
                    <th className="px-2 py-3 font-semibold">Chỉ số</th>
                    <th className="px-2 py-3 font-semibold">Quyền hạn</th>
                    <th className="px-2 py-3 font-semibold">Trạng thái</th>
                    <th className="px-2 py-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#141418]">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Đang tải danh sách kênh...</p>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Tv className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-gray-400">Không tìm thấy kênh nào.</p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((channel) => (
                      <tr key={channel.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {channel.avatarUrl ? (
                                <img src={channel.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                                  <span className="text-purple-400 font-medium text-lg">
                                    {channel.channelName?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {channel.isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-[#0F0F13] rounded-full p-0.5">
                                  <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-xs text-white transition-colors flex items-center gap-1">
                                {channel.channelName}
                              </div>
                              <div className="text-[12px] text-gray-500">{channel.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-gray-300">{channel.ownerName || 'N/A'}</div>
                          <div className="text-[13px] text-gray-500">{channel.ownerEmail}</div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-2 text-[13px] text-gray-400">
                              <Users className="w-3.5 h-3.5" />
                              {channel.subscribersCount?.toLocaleString() || 0} đăng ký
                            </span>
                            <span className="flex items-center gap-2 text-[13px] text-gray-400">
                              <Activity className="w-3.5 h-3.5" />
                              {channel.totalViews?.toLocaleString() || 0} lượt xem
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-3 items-center">
                            <span title={channel.canUploadVideo ? "Được phép tải video" : "Bị cấm tải video"}>
                              <VideoIcon className={`w-4 h-4 ${channel.canUploadVideo ? 'text-red-500' : 'text-gray-600'}`} />
                            </span>
                            <span title={channel.canLivestream ? "Được phép phát trực tiếp" : "Bị cấm phát trực tiếp"}>
                              <Radio className={`w-4 h-4 ${channel.canLivestream ? 'text-red-500' : 'text-gray-600'}`} />
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          {channel.isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium text-red-500 bg-red-500/10">
                              Đình chỉ
                            </span>
                          ) : channel.isVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium text-green-500 bg-green-500/10">
                              Xác minh
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium text-green-500 bg-green-500/10 border border-green-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === channel.id ? null : channel.id);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors inline-flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === channel.id && (
                            <div 
                              ref={menuRef}
                              className="absolute right-6 top-12 w-56 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden transform opacity-100 scale-100 origin-top-right transition-all"
                            >
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Quản trị viên
                              </div>
                              <button
                                onClick={() => handleToggleVerify(channel.id, channel.isVerified)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
                              >
                                <CheckCircle className={`w-4 h-4 ${channel.isVerified ? 'text-gray-400' : 'text-blue-400'}`} />
                                {channel.isVerified ? 'Thu hồi Tích xanh' : 'Cấp Tích xanh'}
                              </button>
                              
                              <div className="my-1 border-t border-white/5"></div>
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Quyền hệ thống
                              </div>

                              <button
                                onClick={() => {
                                  if (channel.isSuspended) return alert("Không thể thay đổi quyền khi kênh đang bị đình chỉ.");
                                  handleTogglePermissions(channel.id, channel.canLivestream, channel.canUploadVideo, 'upload');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${channel.isSuspended ? 'opacity-50 cursor-not-allowed text-gray-500' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
                              >
                                <VideoIcon className={`w-4 h-4 ${channel.isSuspended ? 'text-gray-500' : (channel.canUploadVideo ? 'text-orange-400' : 'text-green-400')}`} />
                                {channel.canUploadVideo ? 'Cấm tải Video' : 'Mở quyền tải Video'}
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (channel.isSuspended) return alert("Không thể thay đổi quyền khi kênh đang bị đình chỉ.");
                                  handleTogglePermissions(channel.id, channel.canLivestream, channel.canUploadVideo, 'livestream');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${channel.isSuspended ? 'opacity-50 cursor-not-allowed text-gray-500' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
                              >
                                <Radio className={`w-4 h-4 ${channel.isSuspended ? 'text-gray-500' : (channel.canLivestream ? 'text-orange-400' : 'text-green-400')}`} />
                                {channel.canLivestream ? 'Cấm Livestream' : 'Mở quyền Livestream'}
                              </button>

                              <div className="my-1 border-t border-white/5"></div>
                              
                              <button
                                onClick={() => handleToggleSuspend(channel.id, channel.isSuspended)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-400 hover:text-red-300"
                              >
                                <ShieldOff className="w-4 h-4" />
                                {channel.isSuspended ? 'Mở lại Kênh' : 'Đình chỉ Kênh'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-[13px] text-gray-400">
                  Hiển thị <span className="text-white font-medium">{indexOfFirstItem + 1}</span> - <span className="text-white font-medium">{Math.min(indexOfLastItem, filteredChannels.length)}</span> trong số <span className="text-white font-medium">{filteredChannels.length}</span> kênh
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent text-gray-400 transition-colors"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                        currentPage === i + 1 ? 'bg-purple-600 text-white border border-purple-500' : 'border border-white/10 hover:bg-white/5 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent text-gray-400 transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-6">
          {/* Chart Card */}
          <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Tổng quan kênh</h3>
            <div className="h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    stroke="none"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#333', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '14px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white leading-none">{stats.total}</span>
                <span className="text-[13px] text-gray-400 mt-1">Tổng số</span>
              </div>
            </div>
            
            <div className="mt-8 space-y-3.5">
              {chartData.filter(d => d.name !== 'Chưa có dữ liệu').map((item, index) => (
                <div key={index} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}></div>
                    {item.name}
                  </div>
                  <div className="text-white font-medium">
                    {item.value} <span className="text-gray-500 font-normal ml-1">({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-[#141418] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-6">Hoạt động gần đây</h3>
            <div className="space-y-5">
              {/* Mock activities based on the screenshot */}
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Tv className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white mb-0.5">Kênh mới được thêm</p>
                  <p className="text-xs text-gray-500">Kênh Giải Trí Official</p>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">2 giờ trước</div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white mb-0.5">Kênh được xác minh</p>
                  <p className="text-xs text-gray-500">Hoàng Đỗ</p>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">5 giờ trước</div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <ShieldOff className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white mb-0.5">Kênh bị đình chỉ</p>
                  <p className="text-xs text-gray-500">Streamer XYZ</p>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">1 ngày trước</div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white mb-0.5">Chủ sở hữu mới</p>
                  <p className="text-xs text-gray-500">user_new@test.com</p>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">2 ngày trước</div>
              </div>
            </div>
            
            <button className="w-full mt-6 pt-4 border-t border-white/5 text-[13px] text-purple-400 hover:text-purple-300 font-medium text-left transition-colors">
              Xem tất cả hoạt động →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Loader2, ArrowRight, Video, MessageSquare, UserX } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminViolations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/admin/violations?page=1&pageSize=50', { headers });
      setViolations(res.data);
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTargetIcon = (type) => {
    switch(type) {
      case 'Video': return <Video className="w-4 h-4" />;
      case 'Comment': return <MessageSquare className="w-4 h-4" />;
      case 'User': return <UserX className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-6 h-6" />
            Vi phạm
          </h2>
          <p className="text-sm text-gray-400 mt-1">Quản lý các nội dung và tài khoản vi phạm chính sách cộng đồng</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm vi phạm..." 
              className="w-full bg-[#15171f] border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <button className="p-2 bg-[#15171f] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#15171f] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Video vi phạm</p>
            <p className="text-2xl font-bold text-white mt-1">{violations.filter(v => v.targetType === 'Video').length}</p>
          </div>
        </div>
        <div className="bg-[#15171f] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Bình luận vi phạm</p>
            <p className="text-2xl font-bold text-white mt-1">{violations.filter(v => v.targetType === 'Comment').length}</p>
          </div>
        </div>
        <div className="bg-[#15171f] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Tài khoản vi phạm</p>
            <p className="text-2xl font-bold text-white mt-1">{violations.filter(v => v.targetType === 'User').length}</p>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5">
        <div className="w-full">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5">
              <tr>
                <th className="pb-4 px-4 font-semibold">Mã vi phạm</th>
                <th className="pb-4 px-4 font-semibold">Người báo cáo</th>
                <th className="pb-4 px-4 font-semibold">Đối tượng vi phạm</th>
                <th className="pb-4 px-4 font-semibold">Lý do & Mô tả</th>
                <th className="pb-4 px-4 font-semibold">Mức độ</th>
                <th className="pb-4 px-4 font-semibold">Thời gian</th>
                <th className="pb-4 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-2 text-sm">Đang tải danh sách vi phạm...</p>
                  </td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <ShieldAlert className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-white font-semibold">Không có vi phạm nào</p>
                    <p className="text-gray-400 text-sm mt-1">Tuyệt vời! Cộng đồng đang hoạt động rất tốt.</p>
                  </td>
                </tr>
              ) : (
                violations.map((violation, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-xs text-red-400 font-mono font-bold">{violation.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {violation.avatar?.startsWith('http') ? (
                          <img src={violation.avatar} alt={violation.user} className="w-7 h-7 rounded-full object-cover shadow-lg" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg">
                            {violation.avatar}
                          </div>
                        )}
                        <span className="text-sm text-gray-200">{violation.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                          {getTargetIcon(violation.targetType)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{violation.targetType || 'Không rõ'}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {violation.targetId?.substring(0, 8) || 'N/A'}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-300">
                          {violation.reason}
                        </span>
                        {violation.description && (
                          <span className="text-[10px] text-gray-500 mt-1 line-clamp-2" title={violation.description}>
                            {violation.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${violation.pColor}`}>
                        <ShieldAlert className="w-3 h-3" />
                        {violation.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-400">
                      {violation.time}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        title="Xem mục vi phạm"
                      >
                        Kiểm tra <ArrowRight className="w-3 h-3" />
                      </button>
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

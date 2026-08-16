import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Search, Filter, ArrowUpRight, Loader2, Eye, MoreVertical } from 'lucide-react';
import axios from 'axios';

export default function AdminComplaints() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/admin/reports?page=${page}&pageSize=50`, { headers });
      setReports(res.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (originalId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/reports/${originalId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return r.status === 'Chờ xử lý';
    if (filter === 'Resolved') return r.status === 'Đã giải quyết';
    if (filter === 'Dismissed') return r.status === 'Bỏ qua';
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-6 h-6" />
            Báo cáo & Khiếu nại
          </h2>
          <p className="text-sm text-gray-400 mt-1">Quản lý và xử lý các báo cáo vi phạm từ cộng đồng</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm theo ID báo cáo, người dùng..." 
              className="w-full bg-[#0F0F0F] border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <button className="p-2 bg-[#0F0F0F] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        {['All', 'Pending', 'Resolved', 'Dismissed'].map(tab => {
          const labels = {
            'All': 'Tất cả',
            'Pending': 'Chờ xử lý',
            'Resolved': 'Đã xử lý',
            'Dismissed': 'Bỏ qua'
          };
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === tab 
                  ? 'bg-red-500/10 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Reports Table */}
      <div className="bg-[#0F0F0F] p-5 rounded-2xl border border-white/5">
        <div className="w-full">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5">
              <tr>
                <th className="pb-4 px-4 font-semibold">Mã báo cáo</th>
                <th className="pb-4 px-4 font-semibold">Người báo cáo</th>
                <th className="pb-4 px-4 font-semibold">Đối tượng</th>
                <th className="pb-4 px-4 font-semibold">Lý do & Mô tả</th>
                <th className="pb-4 px-4 font-semibold">Mức độ ưu tiên</th>
                <th className="pb-4 px-4 font-semibold">Trạng thái</th>
                <th className="pb-4 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-2 text-sm">Đang tải báo cáo...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-white font-semibold">Không có báo cáo nào</p>
                    <p className="text-gray-400 text-sm mt-1">Chưa có dữ liệu phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, idx) => (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-xs text-gray-400 font-mono">{report.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {report.avatar?.startsWith('http') ? (
                          <img src={report.avatar} alt={report.user} className="w-7 h-7 rounded-full object-cover shadow-lg" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg">
                            {report.avatar}
                          </div>
                        )}
                        <span className="text-sm text-gray-200">{report.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-white font-medium bg-white/10 px-2 py-1 rounded">
                        {report.targetType || 'Video'}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-300">
                          {report.reason}
                        </span>
                        {report.description && (
                          <span className="text-[10px] text-gray-500 mt-1 line-clamp-2" title={report.description}>
                            {report.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${report.pColor}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {report.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                        report.status === 'Chờ xử lý' ? 'text-orange-500' : 
                        report.status === 'Đã giải quyết' ? 'text-emerald-500' : 'text-gray-500'
                      }`}>
                        {report.status === 'Chờ xử lý' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                        {report.status === 'Đã giải quyết' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {report.status === 'Bỏ qua' && <XCircle className="w-3.5 h-3.5" />}
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {report.status === 'Chờ xử lý' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(report.originalId, 'Resolved')}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(report.originalId, 'Dismissed')}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors cursor-pointer" title="Chi tiết">
                            <Eye className="w-4 h-4" />
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
      </div>
    </div>
  );
}

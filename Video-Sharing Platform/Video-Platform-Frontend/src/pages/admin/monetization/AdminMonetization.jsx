import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Search, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminMonetization() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  
  // Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/monetization/applications?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplications(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setIsApproving(true);
      await axios.post(`/api/admin/monetization/applications/${selectedApp.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Đã duyệt đơn đăng ký thành công');
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setIsRejecting(true);
      await axios.post(`/api/admin/monetization/applications/${selectedApp.id}/reject`, {
        reason: rejectReason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Đã từ chối đơn đăng ký');
      setSelectedApp(null);
      setRejectReason('');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Duyệt Đăng Ký Kiếm Tiền</h1>

      <div className="mb-6 flex gap-2">
        {['Pending', 'Approved', 'Rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#252525]'
            }`}
          >
            {status === 'Pending' ? 'Chờ duyệt' : status === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'}
          </button>
        ))}
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#252525] border-b border-white/5 text-sm text-gray-400 uppercase tracking-wider">
              <th className="p-4 font-medium">Kênh</th>
              <th className="p-4 font-medium">Ngày gửi</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">Không có đơn nào</td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {app.avatar ? (
                         <img src={app.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                         <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                           {(app.channelName || '?').charAt(0)}
                         </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-200">{app.channelName}</div>
                        <a href={`/c/${app.handle}`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                          @{app.handle} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {app.status === 'Pending' ? 'Chờ duyệt' : app.status === 'Approved' ? 'Đã duyệt' : 'Bị từ chối'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {app.status === 'Pending' && (
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Xử lý
                      </button>
                    )}
                    {app.status === 'Rejected' && app.adminNote && (
                      <span className="text-sm text-gray-500" title={app.adminNote}>Xem lý do</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Xử lý Đơn Đăng Ký</h2>
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <div className="font-semibold mb-2">Thông tin kênh:</div>
              <p>Tên kênh: <span className="text-gray-300">{selectedApp.channelName}</span></p>
              <p>Ngày nộp: <span className="text-gray-300">{new Date(selectedApp.appliedAt).toLocaleString('vi-VN')}</span></p>
              <p className="mt-2 text-sm text-yellow-400">
                Hãy đảm bảo bạn đã kiểm tra nội dung kênh này (không vi phạm bản quyền, nguyên tắc cộng đồng) trước khi duyệt.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Lý do từ chối (bắt buộc nếu từ chối)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px]"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setSelectedApp(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || isApproving}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium transition-colors"
                >
                  {isRejecting ? 'Đang xử lý...' : 'Từ chối'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                >
                  {isApproving ? 'Đang xử lý...' : 'Phê duyệt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

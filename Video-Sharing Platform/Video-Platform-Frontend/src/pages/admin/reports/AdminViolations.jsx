import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Search, Filter, Loader2, ArrowRight, Video, MessageSquare, UserX } from 'lucide-react';
import axios from 'axios';

export default function AdminViolations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [messageContent, setMessageContent] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  const fetchViolations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchViolations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchViolations]);

  const getTargetIcon = (type) => {
    switch(type) {
      case 'Video': return <Video className="w-4 h-4" />;
      case 'Comment': return <MessageSquare className="w-4 h-4" />;
      case 'User': return <UserX className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  const openViolationDetail = (violation) => {
    setSelectedViolation(violation);
    setIsDetailOpen(true);
    
    // Fetch LiveMessage content if this is a LiveMessage violation
    if (violation.targetType === 'LiveMessage') {
      fetchLiveMessageContent(violation.targetId);
    } else {
      setMessageContent(null);
    }
  };

  const closeViolationDetail = () => {
    setSelectedViolation(null);
    setIsDetailOpen(false);
    setMessageContent(null);
  };

  const fetchLiveMessageContent = async (messageId) => {
    setLoadingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/livemessages/${messageId}`, { headers });
      setMessageContent(res.data);
    } catch (error) {
      console.error('Error fetching live message:', error);
      setMessageContent(null);
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleViolationAction = async (violation, action) => {
    try {
      setActionLoadingId(violation.originalId || violation.id);
      const token = localStorage.getItem('token');

      const targetType = violation.targetType || 'Comment';
      const targetId = violation.targetId || violation.originalId;

      await axios.post('/api/admin/reports/handle-violation', {
        targetId,
        targetType,
        action,
        reason: violation.reason || 'Vi phạm nội quy'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setViolations(prev => prev.filter(item => (item.originalId || item.id) !== (violation.originalId || violation.id)));
      closeViolationDetail();
    } catch (error) {
      console.error('Error handling violation:', error);
      alert('Có lỗi xảy ra khi xử lý vi phạm');
    } finally {
      setActionLoadingId(null);
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
              className="w-full bg-[#141418] border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <button className="p-2 bg-[#141418] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Video vi phạm</p>
            <p className="text-2xl font-bold text-white mt-1">{violations.filter(v => v.targetType === 'Video').length}</p>
          </div>
        </div>
        <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Bình luận vi phạm</p>
            <p className="text-2xl font-bold text-white mt-1">{violations.filter(v => v.targetType === 'Comment').length}</p>
          </div>
        </div>
        <div className="bg-[#141418] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
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
      <div className="bg-[#141418] p-5 rounded-2xl border border-white/5">
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViolationDetail(violation)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Xem mục vi phạm"
                        >
                          Kiểm tra <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailOpen && selectedViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={closeViolationDetail}>
          <div className="w-full h-full max-w-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-red-400">Chi tiết vi phạm</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{selectedViolation.id}</h3>
              </div>
              <button onClick={closeViolationDetail} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:text-white">Đóng</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Người vi phạm</p>
                <div className="mt-2 flex items-center gap-3">
                  {selectedViolation.avatar?.startsWith('http') ? (
                    <img src={selectedViolation.avatar} alt={selectedViolation.user} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                      {selectedViolation.avatar}
                    </div>
                  )}
                  <span className="font-medium text-white">{selectedViolation.user}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Đối tượng</p>
                <p className="mt-2 font-semibold text-white">{selectedViolation.targetType || 'Không rõ'}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Mức độ ưu tiên</p>
                <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedViolation.pColor}`}>
                  <ShieldAlert className="w-3 h-3" />
                  {selectedViolation.priority}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Thời gian</p>
                <p className="mt-2 font-semibold text-white">{selectedViolation.time}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Lý do</p>
                <p className="mt-2 text-base font-semibold text-white">{selectedViolation.reason}</p>
              </div>

              {selectedViolation.description && (
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-gray-400">Mô tả chi tiết</p>
                  <p className="mt-2 text-sm leading-6 text-gray-200">{selectedViolation.description}</p>
                </div>
              )}
            </div>

            {selectedViolation.targetType === 'LiveMessage' && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-gray-400">Nội dung bình luận Live</p>
                {loadingMessage ? (
                  <p className="mt-2 text-sm text-gray-300">Đang tải nội dung...</p>
                ) : messageContent ? (
                  <div className="mt-2 bg-[#0F0F0F] rounded-lg p-3 border border-white/5">
                    <p className="text-sm leading-6 text-white break-words">{messageContent.content}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <span>{messageContent.userName || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{messageContent.sentAt ? new Date(messageContent.sentAt).toLocaleString('vi-VN') : 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">Không thể tải nội dung bình luận</p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {selectedViolation.targetType === 'Comment' && (
                <>
                  <button
                    onClick={() => handleViolationAction(selectedViolation, 'hide')}
                    disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                    className="rounded-xl bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/20 disabled:opacity-60"
                  >
                    {actionLoadingId === (selectedViolation.originalId || selectedViolation.id) ? 'Đang xử lý...' : 'Ẩn bình luận'}
                  </button>
                  <button
                    onClick={() => handleViolationAction(selectedViolation, 'delete')}
                    disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                    className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60"
                  >
                    Xóa bình luận
                  </button>
                </>
              )}

              {selectedViolation.targetType === 'Video' && (
                <>
                  <button
                    onClick={() => handleViolationAction(selectedViolation, 'hide')}
                    disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                    className="rounded-xl bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/20 disabled:opacity-60"
                  >
                    Ẩn video
                  </button>
                  <button
                    onClick={() => handleViolationAction(selectedViolation, 'delete')}
                    disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                    className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60"
                  >
                    Xóa video
                  </button>
                </>
              )}

              {(selectedViolation.targetType === 'LiveMessage' || selectedViolation.targetType === 'User') && (
                <button
                  onClick={() => handleViolationAction(selectedViolation, selectedViolation.targetType === 'User' ? 'ban' : 'hide')}
                  disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                  className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60"
                >
                  {selectedViolation.targetType === 'User' ? 'Cấm tài khoản' : 'Ẩn tin nhắn'}
                </button>
              )}

              <button
                onClick={() => handleViolationAction(selectedViolation, 'ignore')}
                disabled={actionLoadingId === (selectedViolation.originalId || selectedViolation.id)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white disabled:opacity-60"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

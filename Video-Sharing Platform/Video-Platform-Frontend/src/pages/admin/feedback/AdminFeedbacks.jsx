import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MessageSquare, Send, X, Loader2, CheckCircle, Clock, Crown } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Resolved'
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/feedbacks?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent(feedback.adminReply || '');
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }
    setReplying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/feedbacks/${selectedFeedback.id}/reply`, { replyContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Gửi trả lời thành công');
      setReplyModalOpen(false);
      fetchFeedbacks(); // Reload
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi trả lời');
    } finally {
      setReplying(false);
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'bug': return 'Báo lỗi';
      case 'feature': return 'Góp ý';
      case 'ui': return 'Giao diện';
      default: return 'Khác';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#FF5722]" />
          Quản lý phản hồi
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#202020] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF5722]"
        >
          <option value="All">Tất cả</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Resolved">Đã trả lời</option>
        </select>
      </div>

      <div className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5722]" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center p-12 text-gray-400">Không có phản hồi nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#1F1F1F]">
                  <th className="p-4 text-sm font-semibold text-gray-300">Người gửi</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Loại</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Nội dung</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Ngày gửi</th>
                  <th className="p-4 text-sm font-semibold text-gray-300">Trạng thái</th>
                  <th className="p-4 text-sm font-semibold text-gray-300 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {feedbacks.map((f) => (
                  <tr key={f.id} className={`transition-colors ${f.isPremium && f.status !== 'Resolved' ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'hover:bg-white/5'}`}>
                    <td className="p-4 relative">
                      {f.isPremium && f.status !== 'Resolved' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                      )}
                      <div className="flex items-center gap-3">
                        {f.userAvatarUrl ? (
                          <img src={f.userAvatarUrl} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FF5722]/20 flex items-center justify-center text-[#FF5722] font-bold">
                            {f.userFullName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            {f.userFullName}
                            {f.isPremium && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-[10px] uppercase font-bold border border-orange-500/20">
                                <Crown className="w-3 h-3" fill="currentColor" /> VIP
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{f.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                      {getTypeName(f.type)}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="max-w-xs truncate">{f.content}</span>
                        {f.attachmentUrl && (
                          <a href={f.attachmentUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img src={f.attachmentUrl} alt="Đính kèm" className="w-10 h-10 rounded object-cover border border-white/10 hover:border-white/30 transition-colors" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                      {moment(f.createdAt).fromNow()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {f.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Đã trả lời
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleReplyClick(f)}
                        className="bg-[#272727] hover:bg-[#353535] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        {f.status === 'Resolved' ? 'Xem & Sửa' : 'Trả lời'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Trả lời phản hồi</h2>
              <button onClick={() => setReplyModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 bg-[#161616] p-4 rounded-xl border border-white/5">
                <div className="text-sm text-gray-500 mb-2">Người dùng ({selectedFeedback.userFullName}) đã viết:</div>
                <div className="text-gray-300 whitespace-pre-wrap">{selectedFeedback.content}</div>
                {selectedFeedback.attachmentUrl && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Ảnh đính kèm:</div>
                    <img src={selectedFeedback.attachmentUrl} alt="Ảnh đính kèm" className="max-h-48 rounded-lg border border-white/10 object-contain" />
                  </div>
                )}
              </div>

              <form onSubmit={handleReplySubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nội dung trả lời</label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết phản hồi của bạn..."
                    className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF5722] transition-colors resize-none h-32"
                  ></textarea>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={replying}
                    className="flex items-center gap-2 bg-[#FF5722] hover:bg-[#F4511E] text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70 cursor-pointer"
                  >
                    {replying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Gửi trả lời
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { MessageSquare, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function Feedback() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bug',
    content: '',
    attachmentUrl: ''
  });
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh vượt quá 5MB');
      return;
    }

    setUploadingImage(true);
    const formPayload = new FormData();
    formPayload.append('file', file);

    try {
      const response = await axios.post('/api/upload/image', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData({ ...formData, attachmentUrl: response.data.url });
      toast.success('Tải ảnh lên thành công!');
    } catch (err) {
      toast.error('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/feedback', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success(response.data.message || 'Cảm ơn bạn đã gửi phản hồi!');
      setFormData({ type: 'bug', content: '', attachmentUrl: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#FA5A5A] flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gửi phản hồi</h1>
            <p className="text-gray-400 mt-1">Cho chúng tôi biết trải nghiệm của bạn để ứng dụng tốt hơn mỗi ngày</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161616] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl">
          {/* Feedback Type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">Loại phản hồi</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'bug', label: 'Báo lỗi' },
                { id: 'feature', label: 'Góp ý tính năng' },
                { id: 'ui', label: 'Giao diện' },
                { id: 'other', label: 'Khác' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    formData.type === type.id 
                      ? 'bg-[#FF5722] text-white shadow-lg shadow-[#FF5722]/20' 
                      : 'bg-[#202020] text-gray-400 hover:bg-[#252525] hover:text-white border border-white/5'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">Mô tả chi tiết</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Vui lòng cung cấp thêm chi tiết để chúng tôi có thể hiểu rõ vấn đề..."
              className="w-full bg-[#202020] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all resize-none h-40"
            />
          </div>

          {/* Attachments */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-gray-300 mb-2">Đính kèm ảnh màn hình (Không bắt buộc)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {formData.attachmentUrl ? (
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 group">
                <img src={formData.attachmentUrl} alt="Đính kèm" className="w-full max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, attachmentUrl: '' })}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-md transition-colors"
                >
                  Xóa ảnh
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full border-2 border-dashed border-white/10 hover:border-[#FF5722]/50 bg-[#202020] hover:bg-[#252525] rounded-2xl py-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {uploadingImage ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#FF5722] transition-colors" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-400">
                  {uploadingImage ? 'Đang tải lên...' : 'Nhấn để tải ảnh lên (Tối đa 5MB)'}
                </span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-8 py-3.5 rounded-xl font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 shadow-lg shadow-[#FF5722]/20 hover:shadow-[#FF5722]/40"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Gửi phản hồi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

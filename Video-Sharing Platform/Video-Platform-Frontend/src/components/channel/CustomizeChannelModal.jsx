import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Loader2, Save, Upload } from 'lucide-react';

export default function CustomizeChannelModal({ isOpen, onClose, channelData, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    channelName: '',
    handle: '',
    description: '',
    bannerUrl: '',
    avatarUrl: ''
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (channelData) {
      setFormData({
        channelName: channelData.channelName || '',
        handle: channelData.handle || '',
        description: channelData.description || '',
        bannerUrl: channelData.bannerUrl || '',
        avatarUrl: channelData.avatarUrl || ''
      });
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [channelData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'avatar') {
        setAvatarFile(file);
        setFormData(prev => ({ ...prev, avatarUrl: previewUrl }));
      } else {
        setBannerFile(file);
        setFormData(prev => ({ ...prev, bannerUrl: previewUrl }));
      }
    }
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axios.post('/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalAvatarUrl = formData.avatarUrl;
      let finalBannerUrl = formData.bannerUrl;

      // Upload if there are new files
      if (avatarFile) {
        finalAvatarUrl = await uploadFile(avatarFile);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadFile(bannerFile);
      }

      const updatedData = {
        ...formData,
        avatarUrl: finalAvatarUrl,
        bannerUrl: finalBannerUrl
      };

      await axios.put(`/api/channels/${channelData.id}`, updatedData);
      
      // Update local storage if handle or avatar changed
      if (updatedData.handle !== localStorage.getItem('handle')) {
        localStorage.setItem('handle', updatedData.handle);
      }
      if (updatedData.avatarUrl !== localStorage.getItem('avatar')) {
        localStorage.setItem('avatar', updatedData.avatarUrl);
      }

      onSaveSuccess(updatedData.handle);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">Tùy chỉnh kênh</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-8">
            {/* Live Preview Area */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Xem trước (Preview)</h3>
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0F0F0F]">
                {/* Banner Preview */}
                <div className="w-full h-32 md:h-40 bg-[#2A2A2A] relative">
                  {formData.bannerUrl ? (
                    <img 
                      src={formData.bannerUrl} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/1200x400?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Chưa có ảnh bìa</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-80"></div>
                </div>
                
                {/* Avatar and Name Preview */}
                <div className="px-6 pb-6 -mt-10 relative z-10 flex items-end gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-[#0F0F0F] overflow-hidden bg-[#2A2A2A] shrink-0">
                    {formData.avatarUrl ? (
                      <img 
                        src={formData.avatarUrl} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=L%E1%BB%97i+%E1%BA%A3nh'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center">Chưa có<br/>avatar</div>
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <h4 className="text-lg font-bold text-white line-clamp-1">{formData.channelName || 'Tên kênh'}</h4>
                    <p className="text-gray-400 text-sm">{formData.handle || '@handle'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <form id="customize-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Tên kênh</label>
                  <input 
                    type="text" name="channelName" required
                    value={formData.channelName} onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-transparent rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[#FF8A65]/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Tên định danh (Handle)</label>
                  <input 
                    type="text" name="handle" required
                    value={formData.handle} onChange={handleChange}
                    className="w-full bg-[#2A2A2A] border border-transparent rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[#FF8A65]/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 block mb-1">Ảnh Đại Diện (Avatar)</label>
                  <input 
                    type="file" accept="image/*" className="hidden" ref={avatarInputRef}
                    onChange={(e) => handleFileChange(e, 'avatar')}
                  />
                  <button 
                    type="button" onClick={() => avatarInputRef.current?.click()}
                    className="w-full bg-[#2A2A2A] hover:bg-[#333333] border border-white/10 rounded-xl py-2.5 px-4 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Tải ảnh lên từ máy
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 block mb-1">Ảnh Bìa (Banner)</label>
                  <input 
                    type="file" accept="image/*" className="hidden" ref={bannerInputRef}
                    onChange={(e) => handleFileChange(e, 'banner')}
                  />
                  <button 
                    type="button" onClick={() => bannerInputRef.current?.click()}
                    className="w-full bg-[#2A2A2A] hover:bg-[#333333] border border-white/10 rounded-xl py-2.5 px-4 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> Tải ảnh lên từ máy
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Mô tả kênh (Bio)</label>
                <textarea 
                  name="description" rows="4"
                  value={formData.description} onChange={handleChange}
                  placeholder="Giới thiệu đôi nét về bạn..."
                  className="w-full bg-[#2A2A2A] border border-transparent rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-[#FF8A65]/50 transition-colors resize-none"
                ></textarea>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 shrink-0 flex justify-end gap-3 bg-[#1A1A1A]">
          <button 
            type="button" onClick={onClose}
            className="px-6 py-2.5 rounded-full font-medium text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button 
            type="submit" form="customize-form" disabled={loading}
            className="px-6 py-2.5 bg-[#FF5722] hover:bg-[#E64A19] text-white rounded-full font-medium flex items-center gap-2 transition-colors disabled:opacity-70 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

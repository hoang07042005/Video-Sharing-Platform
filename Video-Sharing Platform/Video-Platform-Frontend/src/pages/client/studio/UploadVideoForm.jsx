import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Globe, Settings, PlaySquare, Check, ChevronDown, Clock, FileCode, FileVideo, HardDrive, Image as ImageIcon, Upload, UploadCloud, AlertTriangle } from 'lucide-react';

export function UploadVideoForm({ onUploadSuccess, channel, editingVideo, onCancelEdit, isShortType }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isShortVideo, setIsShortVideo] = useState(isShortType || false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [bannedError, setBannedError] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    axios.get('/api/videos/categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (editingVideo) {
      setTitle(editingVideo.title || '');
      setDescription(editingVideo.description || '');
      setVisibility(editingVideo.visibility || 'Public');
      setThumbnailPreview(editingVideo.thumbnailUrl || '');
      setDuration(editingVideo.duration || 0);
      setCategoryId(editingVideo.categoryId || '');
      setThumbnailFile(null);
      setVideoFile(null);
      setVideoPreview(null);
      setError('');
      setSuccessMsg('');
      setIsShortVideo(editingVideo.isShort || false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTitle('');
      setDescription('');
      setVisibility('Public');
      setThumbnailPreview(null);
      setDuration(0);
      setThumbnailFile(null);
      setVideoFile(null);
      setVideoPreview(null);
      setIsShortVideo(isShortType || false);
    }
  }, [editingVideo, isShortType]);

  const formatDurationStr = (s) => {
    if (!s) return '00:00';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Vui lòng chọn file video hợp lệ.');
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      
      const videoElement = document.createElement('video');
      videoElement.src = url;
      videoElement.onloadedmetadata = () => {
        setDuration(Math.round(videoElement.duration));
      };

      setError('');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ.');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!title) {
      setError('Vui lòng nhập tiêu đề.');
      return;
    }
    if (!editingVideo && (!videoFile || !thumbnailFile)) {
      setError('Vui lòng chọn video và ảnh bìa.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      let uploadedThumbUrl = '';
      if (thumbnailFile) {
        const thumbFormData = new FormData();
        thumbFormData.append('file', thumbnailFile);
        const thumbRes = await axios.post('/api/upload/image', thumbFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedThumbUrl = thumbRes.data.url;
      }

      let uploadedVideoUrl = '';
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await axios.post('/api/upload/video', videoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedVideoUrl = videoRes.data.url;
      }

      const token = localStorage.getItem('token');
      if (editingVideo) {
        await axios.put(`/api/videos/${editingVideo.id}`, {
          title,
          description,
          visibility,
          thumbnailUrl: uploadedThumbUrl,
          videoUrl: uploadedVideoUrl,
          duration: duration,
          categoryId: categoryId ? parseInt(categoryId) : null,
          isShort: isShortVideo
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Đã cập nhật video thành công!');
        if (onCancelEdit) onCancelEdit();
      } else {
        await axios.post('/api/videos', {
          title,
          description,
          visibility,
          thumbnailUrl: uploadedThumbUrl,
          videoUrl: uploadedVideoUrl,
          duration: duration,
          categoryId: categoryId ? parseInt(categoryId) : null,
          isShort: isShortVideo
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Đã tải video lên thành công!');
        setTitle('');
        setDescription('');
        setVisibility('Public');
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setVideoFile(null);
        setVideoPreview(null);
        setDuration(0);
        setCategoryId('');
      }
      
      if (onUploadSuccess) onUploadSuccess();
      
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 403) {
        setBannedError(err.response.data.message || 'Kênh của bạn đã bị cấm tải lên video.');
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải video lên.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 md:p-6 mb-8 flex flex-col xl:flex-row gap-6 md:gap-8 relative">
      
      {/* Modal Cấm */}
      {bannedError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-red-500/30 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hành động bị chặn</h3>
            <p className="text-gray-400 mb-8">{bannedError}</p>
            <button onClick={() => setBannedError(null)} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors">
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/60 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-[#FF4E00] animate-spin mb-4" />
          <p className="text-white font-medium text-lg">Đang xử lý tải lên...</p>
          <p className="text-gray-400 text-sm mt-2">Vui lòng không đóng trang này</p>
        </div>
      )}

      {/* Left side: Form */}
      <div className="flex-1 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white mb-2">{editingVideo ? 'Cập nhật video' : 'Tải video lên'}</h2>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">{error}</div>}
        {successMsg && <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-2 rounded-lg text-sm">{successMsg}</div>}

        {/* Tiêu đề */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Tiêu đề *</label>
          <div className="relative">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value.substring(0, 100))}
              placeholder="Nhập tiêu đề video của bạn" 
              className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4E00]"
            />
            <span className="absolute right-3 top-3 text-gray-500 text-xs">{title.length}/100</span>
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Mô tả</label>
          <div className="relative">
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value.substring(0, 5000))}
              placeholder="Giới thiệu nội dung video của bạn với người xem..." 
              rows="4"
              className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF4E00] resize-none"
            ></textarea>
            <span className="absolute right-3 bottom-3 text-gray-500 text-xs">{description.length}/5000</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Danh mục */}
          <div className="flex-1">
            <label className="block text-white text-sm font-medium mb-2">Danh mục</label>
            <div className="relative">
              <div 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {categoryId ? categories.find(c => c.id === categoryId)?.name || 'Chọn danh mục' : 'Chọn danh mục'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#212121] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                  <div onClick={() => { setCategoryId(''); setShowCategoryDropdown(false); }} className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                    <p className="text-gray-400 text-sm font-medium">Không chọn danh mục</p>
                  </div>
                  {categories.map(cat => (
                    <div key={cat.id} onClick={() => { setCategoryId(cat.id); setShowCategoryDropdown(false); }} className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                      <div>
                        <p className="text-white text-sm font-medium">{cat.name}</p>
                      </div>
                      {categoryId === cat.id && <Check className="w-4 h-4 text-[#FF4E00] ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ảnh thu nhỏ */}
          <div className="flex-1">
            <label className="block text-white text-sm font-medium mb-1">Ảnh thu nhỏ {editingVideo ? '' : '*'}</label>
            <p className="text-gray-400 text-xs mb-3 line-clamp-1" title={editingVideo ? 'Chọn ảnh mới nếu bạn muốn thay thế ảnh hiện tại.' : 'Chọn hoặc tải lên ảnh đại diện cho video của bạn.'}>
              {editingVideo ? 'Chọn ảnh mới để thay thế ảnh hiện tại.' : 'Tải lên ảnh đại diện cho video của bạn.'}
            </p>
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageSelect} />
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center justify-center w-32 h-20 border border-dashed border-white/20 rounded-lg bg-[#121212] hover:bg-white/5 shrink-0 cursor-pointer">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-white text-xs font-medium">Tải ảnh lên</span>
                <span className="text-gray-500 text-[9px]">JPG, PNG</span>
              </button>
              
              {thumbnailPreview && (
                <div className="relative w-32 h-20 rounded-lg border-2 border-[#FF4E00] overflow-hidden shrink-0">
                  <img src={thumbnailPreview} className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-[#FF4E00] rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">Video {editingVideo ? '' : '*'}</label>
          <p className="text-gray-400 text-xs mb-3">Tải lên video của bạn. {editingVideo ? 'Chỉ chọn nếu bạn muốn thay thế video hiện tại.' : 'Định dạng hỗ trợ: MP4, MOV, AVI, WMV, FLV, WebM. Kích thước tối đa: 10GB.'}</p>
          <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleVideoSelect} />
          
          <div 
            onClick={() => !videoFile && fileInputRef.current?.click()}
            className={`border border-dashed ${videoFile ? 'border-[#FF4E00] bg-[#FF4E00]/5' : 'border-white/20 bg-[#121212] hover:bg-white/5'} rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer transition-colors`}
          >
            {videoFile ? (
              <>
                <FileVideo className="w-10 h-10 text-[#FF4E00] mb-3" />
                <p className="text-white text-sm font-medium mb-1">{videoFile.name}</p>
                <p className="text-gray-500 text-xs mb-4">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); setVideoPreview(null); }} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  Chọn file khác
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-white text-sm font-medium mb-1">Kéo và thả video vào đây</p>
                <p className="text-gray-500 text-xs mb-4">hoặc</p>
                <button className="bg-[#FF4E00] hover:bg-[#ff6a2b] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  Chọn file để tải lên
                </button>
              </>
            )}
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div>
          <label className="block text-white text-sm font-medium mb-1">Trạng thái hiển thị *</label>
          <p className="text-gray-400 text-xs mb-3">Chọn ai có thể xem video này</p>
          <div className="relative">
            <div 
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className="w-full md:w-[60%] bg-[#121212] border border-white/10 rounded-lg p-3 flex justify-between items-center cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm font-medium">{visibility === 'Public' ? 'Công khai' : 'Riêng tư'}</p>
                  <p className="text-gray-500 text-xs">{visibility === 'Public' ? 'Mọi người đều có thể xem video này' : 'Chỉ bạn mới có thể xem'}</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            
            {showVisibilityDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[60%] bg-[#212121] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                <div onClick={() => { setVisibility('Public'); setShowVisibilityDropdown(false); }} className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Công khai</p>
                    <p className="text-gray-500 text-[10px]">Mọi người đều có thể xem</p>
                  </div>
                </div>
                <div onClick={() => { setVisibility('Private'); setShowVisibilityDropdown(false); }} className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Riêng tư</p>
                    <p className="text-gray-500 text-[10px]">Chỉ bạn mới có thể xem</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loại Video */}
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="isShortVideoCheck" 
            checked={isShortVideo} 
            onChange={(e) => setIsShortVideo(e.target.checked)} 
            className="w-4 h-4 accent-[#FF4E00] cursor-pointer"
          />
          <label htmlFor="isShortVideoCheck" className="text-gray-300 text-sm font-medium cursor-pointer select-none">
            Đánh dấu là Video ngắn (Shorts)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => {
            setTitle(''); setDescription(''); setVisibility('Public'); setThumbnailFile(null); setThumbnailPreview(null); setVideoFile(null); setVideoPreview(null); setDuration(0); setError(''); setSuccessMsg('');
            if (onCancelEdit) onCancelEdit();
          }} className="px-8 py-2 rounded-lg bg-[#2A2A2A] text-white text-sm font-medium hover:bg-[#333] cursor-pointer">Hủy</button>
          <button onClick={handleUpload} disabled={isUploading} className={`px-8 py-2 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer ${isUploading ? 'bg-[#FF4E00]/50' : 'bg-[#FF4E00] hover:bg-[#ff6a2b]'}`}>{editingVideo ? 'Lưu thay đổi' : 'Tiếp tục'}</button>
        </div>
      </div>

      {/* Right side: Preview */}
      <div className="w-full xl:w-[400px] shrink-0">
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5 sticky top-24">
          <h3 className="text-white text-sm font-bold mb-4">Xem trước video</h3>
          
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 group border border-white/5">
             {videoPreview ? (
                <video src={videoPreview} className="w-full h-full object-cover" controls />
             ) : thumbnailPreview ? (
                <img src={thumbnailPreview} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                  <PlaySquare className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-500 text-xs">Chưa có video/ảnh</p>
                </div>
             )}
          </div>

          <h4 className="text-white font-bold text-base mb-2 break-words">{title || 'Tiêu đề video'}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <img src={channel?.avatarUrl || localStorage.getItem('avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150'} className="w-5 h-5 rounded-full" />
            <span className="text-white font-medium">{channel?.channelName || 'Bạn'}</span>
            <span>•</span>
            <span>{visibility === 'Public' ? 'Công khai' : 'Riêng tư'}</span>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            0 lượt xem • Vừa xong
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 border-b border-white/10 pb-6 break-words line-clamp-3">
            {description || 'Chưa có mô tả nào.'}
          </p>

          <div className="space-y-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><Settings className="w-4 h-4"/> Trạng thái</span>
              <span className="text-green-500">{visibility === 'Public' ? 'Công khai' : 'Riêng tư'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><Clock className="w-4 h-4"/> Độ dài</span>
              <span className="text-white">{formatDurationStr(duration)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><FileVideo className="w-4 h-4"/> Định dạng</span>
              <span className="text-white">{videoFile ? videoFile.type.split('/')[1]?.toUpperCase() : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><HardDrive className="w-4 h-4"/> Kích thước</span>
              <span className="text-white">{videoFile ? (videoFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><FileCode className="w-4 h-4"/> Tệp video</span>
              <span className="text-white truncate max-w-[150px]">{videoFile ? videoFile.name : '-'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Tệp ảnh thu nhỏ</span>
              <span className="text-white truncate max-w-[150px]">{thumbnailFile ? thumbnailFile.name : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
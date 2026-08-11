import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2, Video, Zap, Eye, ThumbsUp, MessageSquare,
  Pencil, Trash2, Globe, Lock, Clock, Check, X,
  MoreVertical, Search, Filter, ChevronDown, Image, Link2
} from 'lucide-react';

const VideoManagement = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('Public');
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchMyVideos();
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

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { setError('Vui lòng đăng nhập'); setLoading(false); return; }
      const res = await axios.get('/api/videos/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Phiên đăng nhập hết hạn.' : 'Không thể tải danh sách video.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditVisibility(video.visibility);
    setEditThumbnailFile(null);
    setEditVideoFile(null);
    setThumbnailPreview(video.thumbnailUrl || '');
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      let finalThumbnailUrl = editingVideo.thumbnailUrl;
      let finalVideoUrl = null;

      if (editThumbnailFile) {
        const formData = new FormData();
        formData.append('file', editThumbnailFile);
        const res = await axios.post('/api/upload/image', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        finalThumbnailUrl = res.data.url;
      }

      if (editVideoFile) {
        const formData = new FormData();
        formData.append('file', editVideoFile);
        const res = await axios.post('/api/upload/video', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        finalVideoUrl = res.data.url;
      }

      await axios.put(`/api/videos/${editingVideo.id}`, {
        title: editTitle,
        description: editDescription,
        visibility: editVisibility,
        thumbnailUrl: finalThumbnailUrl,
        videoUrl: finalVideoUrl
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setVideos(prev => prev.map(v =>
        v.id === editingVideo.id
          ? { ...v, title: editTitle, description: editDescription, visibility: editVisibility,
              thumbnailUrl: finalThumbnailUrl }
          : v
      ));
      setEditingVideo(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/api/videos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setVideos(prev => prev.filter(v => v.id !== id));
      setDeletingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa video');
    } finally {
      setDeleting(false);
    }
  };

  const formatViews = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' Tr';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' N';
    return n.toString();
  };

  const formatDuration = (s) => {
    if (!s) return '0:00';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });

  const normalVideos = videos.filter(v => !v.isShort);
  const shortVideos = videos.filter(v => v.isShort);
  const displayed = (activeTab === 'videos' ? normalVideos : shortVideos).filter(v => {
    const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterVisibility === 'all' || v.visibility === filterVisibility;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-gray-400">{error}</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Quản lý Video</h1>
        <p className="text-gray-400 text-sm">{normalVideos.length} video · {shortVideos.length} shorts</p>
      </div>

      {/* Tabs + controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
          <button
            id="tab-videos"
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'videos' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <Video className="w-4 h-4" /> Video ({normalVideos.length})
          </button>
          <button
            id="tab-shorts"
            onClick={() => setActiveTab('shorts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'shorts' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            <Zap className="w-4 h-4" /> Shorts ({shortVideos.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800 text-white text-sm rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none w-52"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {filterVisibility === 'all' ? 'Tất cả' : filterVisibility === 'Public' ? 'Công khai' : 'Riêng tư'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-11 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-30 w-40">
                {[['all','Tất cả'],['Public','Công khai'],['Private','Riêng tư']].map(([val, label]) => (
                  <button key={val} onClick={() => { setFilterVisibility(val); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${filterVisibility === val ? 'text-red-400 bg-white/5' : 'text-gray-300 hover:bg-white/5'}`}>
                    {filterVisibility === val ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5" />}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-600">
          {activeTab === 'videos' ? <Video className="w-14 h-14" /> : <Zap className="w-14 h-14" />}
          <p className="text-gray-500">{searchQuery ? 'Không tìm thấy video nào' : `Chưa có ${activeTab === 'videos' ? 'video' : 'shorts'}`}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Video</th>
                <th className="px-4 py-3 text-center font-semibold">Hiển thị</th>
                <th className="px-4 py-3 text-center font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 text-center font-semibold"><span className="flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" />Xem</span></th>
                <th className="px-4 py-3 text-center font-semibold"><span className="flex items-center justify-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />Thích</span></th>
                <th className="px-4 py-3 text-center font-semibold"><span className="flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Bình luận</span></th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((video) => (
                <tr key={video.id} className="bg-gray-900 hover:bg-gray-800/60 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <Link to={`/watch/${video.id}`} target="_blank"
                        className="relative shrink-0 w-36 aspect-video rounded-lg overflow-hidden bg-black block">
                        <img src={video.thumbnailUrl || 'https://via.placeholder.com/320x180'} alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          {formatDuration(video.duration)}
                        </div>
                        {video.isShort && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Short</div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium line-clamp-2 leading-snug">{video.title}</p>
                        <p className="text-red-400 text-xs mt-1 font-medium">{video.channelName}</p>
                        {video.description && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">{video.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      video.visibility === 'Public' ? 'bg-emerald-500/15 text-emerald-400' :
                      video.visibility === 'Private' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {video.visibility === 'Public' && <Globe className="w-3 h-3" />}
                      {video.visibility === 'Private' && <Lock className="w-3 h-3" />}
                      {video.visibility === 'Scheduled' && <Clock className="w-3 h-3" />}
                      {video.visibility === 'Public' ? 'Công khai' : video.visibility === 'Private' ? 'Riêng tư' : 'Lên lịch'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-400 text-xs whitespace-nowrap">{formatDate(video.createdAt)}</td>
                  <td className="px-4 py-4 text-center text-gray-300 font-medium">{formatViews(video.viewsCount)}</td>
                  <td className="px-4 py-4 text-center text-gray-300 font-medium">{formatViews(video.likesCount)}</td>
                  <td className="px-4 py-4 text-center text-gray-300 font-medium">{video.commentsCount}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="relative inline-block" ref={openMenuId === video.id ? menuRef : null}>
                      <button
                        id={`menu-btn-${video.id}`}
                        onClick={() => setOpenMenuId(openMenuId === video.id ? null : video.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === video.id && (
                        <div className="absolute right-0 top-9 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-30 w-40">
                          <button onClick={() => handleEdit(video)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2.5">
                            <Pencil className="w-3.5 h-3.5 text-blue-400" /> Chỉnh sửa
                          </button>
                          <button onClick={() => { setDeletingId(video.id); setOpenMenuId(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5">
                            <Trash2 className="w-3.5 h-3.5" /> Xóa video
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-white font-bold text-lg">Chỉnh sửa video</h2>
              <button onClick={() => setEditingVideo(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Tiêu đề</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-700 focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Mô tả</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-700 focus:border-red-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Trạng thái hiển thị</label>
                <div className="flex gap-2">
                  {[['Public','Công khai',<Globe key="pub" className="w-3.5 h-3.5"/>],['Private','Riêng tư',<Lock key="priv" className="w-3.5 h-3.5"/>]].map(([val,label,icon]) => (
                    <button key={val} onClick={() => setEditVisibility(val)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all ${editVisibility === val ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> Tải lên ảnh thumbnail mới</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setEditThumbnailFile(file);
                    setThumbnailPreview(URL.createObjectURL(file));
                  }
                }}
                  className="w-full bg-gray-800 text-gray-400 text-sm rounded-lg px-4 py-2 border border-gray-700 focus:border-red-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-500/10 file:text-red-400 hover:file:bg-red-500/20" />
                {thumbnailPreview && (
                  <div className="mt-2 aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-700">
                    <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Tải lên video mới (để trống nếu không đổi)</label>
                <input type="file" accept="video/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setEditVideoFile(file);
                }}
                  className="w-full bg-gray-800 text-gray-400 text-sm rounded-lg px-4 py-2 border border-gray-700 focus:border-red-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setEditingVideo(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700">Hủy</button>
              <button onClick={handleSaveEdit} disabled={saving || !editTitle.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-center w-14 h-14 bg-red-500/15 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-2">Xóa video?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Hành động này không thể hoàn tác. Video sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700">Hủy</button>
              <button onClick={() => handleDelete(deletingId)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;

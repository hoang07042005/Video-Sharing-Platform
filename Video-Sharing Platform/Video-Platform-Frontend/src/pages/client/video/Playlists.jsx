import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListVideo, Lock, Globe, PlayCircle, Film, Plus, Trash2,
  Clock, Eye, ChevronRight, X, CheckCircle, MoreVertical,
  LayoutGrid, List, SlidersHorizontal, Loader2, Activity, Pencil, ChevronLeft
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────── */
const formatViews = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Tr';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + ' N';
  return String(v);
};
const formatDuration = (s) => {
  if (!s) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
};
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s >= 2592000) return Math.floor(s / 2592000) + ' tháng trước';
  if (s >= 604800)  return Math.floor(s / 604800)  + ' tuần trước';
  if (s >= 86400)   return Math.floor(s / 86400)   + ' ngày trước';
  if (s >= 3600)    return Math.floor(s / 3600)    + ' giờ trước';
  if (s >= 60)      return Math.floor(s / 60)      + ' phút trước';
  return 'Vừa xong';
};

/* ── Playlist Card ───────────────────────────────────────────── */
function PlaylistCard({ playlist, onOpen, onDelete }) {
  const [err, setErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group flex flex-col cursor-pointer" onClick={() => onOpen(playlist)}>
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1A1A1A] mb-3">
        {!err && playlist.thumbnailUrl ? (
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            onError={() => setErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A]">
            <ListVideo className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Video count badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          <Film className="w-3 h-3" />
          {playlist.videoCount ?? 0} video
        </div>

        {/* Hover play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <PlayCircle className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-bold leading-snug line-clamp-1 group-hover:text-[#FF5722] transition-colors mb-1">
            {playlist.title}
          </h3>
          <p className="text-gray-500 text-[11px]">
            Cập nhật {timeAgo(playlist.createdAt)} • {playlist.visibility === 'Private' ? 'Riêng tư' : 'Công khai'}
          </p>
        </div>

        {/* Context menu */}
        <div className="relative shrink-0" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}>
          <button className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[140px] overflow-hidden">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(playlist); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(playlist.id); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xoá
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Video Item in Detail Panel ──────────────────────────────── */
function VideoItem({ video, index, onNavigate }) {
  const [err, setErr] = useState(false);
  return (
    <div
      onClick={() => onNavigate(video)}
      className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
    >
      <div className="shrink-0 text-gray-600 text-xs w-5 text-center pt-3">{index + 1}</div>
      <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-[#1A1A1A] shrink-0">
        {!err && video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} onError={() => setErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-gray-600" />
          </div>
        )}
        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
          {formatDuration(video.duration || 0)}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-[#FF5722] transition-colors">{video.title}</h4>
        <p className="text-gray-400 text-xs mt-1 truncate">{video.channelName}</p>
        <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
          <Eye className="w-3 h-3" />
          <span>{formatViews(video.viewsCount)} lượt xem</span>
        </div>
      </div>
    </div>
  );
}

/* ── Playlist List Row (list-view) ──────────────────────────── */
function PlaylistListItem({ playlist, onOpen, onDelete, onEdit }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      onClick={() => onOpen(playlist)}
      className="group flex items-center gap-4 p-3 bg-[#111] border border-white/5 hover:border-white/15 rounded-2xl cursor-pointer transition-all hover:bg-[#161616]"
    >
      <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-[#1A1A1A] shrink-0">
        {!imgErr && playlist.thumbnailUrl ? (
          <img src={playlist.thumbnailUrl} alt={playlist.title} onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListVideo className="w-7 h-7 text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
          <Film className="w-2.5 h-2.5" />{playlist.videoCount ?? 0}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm group-hover:text-[#FF5722] transition-colors line-clamp-1 mb-1">{playlist.title}</h3>
        {playlist.description && <p className="text-gray-500 text-xs line-clamp-1 mb-1">{playlist.description}</p>}
        <p className="text-gray-600 text-[11px]">Cập nhật {timeAgo(playlist.createdAt)} • {playlist.visibility === 'Public' ? 'Công khai' : 'Riêng tư'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {playlist.visibility === 'Public'
          ? <Globe className="w-4 h-4 text-gray-500" />
          : <Lock className="w-4 h-4 text-gray-500" />
        }
        <button
          onClick={e => { e.stopPropagation(); onEdit(playlist); }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(playlist.id); }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Activity Item ───────────────────────────────────────────── */
function ActivityItem({ playlist, onOpen }) {
  const [err, setErr] = useState(false);
  return (
    <div
      onClick={() => onOpen(playlist)}
      className="shrink-0 flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#222] border border-white/5 hover:border-white/10 rounded-xl p-3 cursor-pointer transition-all group min-w-[200px]"
    >
      <div className="relative w-14 aspect-video rounded-lg overflow-hidden bg-[#252525] shrink-0">
        {!err && playlist.thumbnailUrl ? (
          <img src={playlist.thumbnailUrl} alt={playlist.title} onError={() => setErr(true)}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListVideo className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[12px] font-semibold line-clamp-1 group-hover:text-[#FF5722] transition-colors">{playlist.title}</p>
        <p className="text-gray-500 text-[10px] mt-0.5">Thêm {playlist.videoCount ?? 0} video mới</p>
        <p className="text-gray-600 text-[10px]">{timeAgo(playlist.createdAt)}</p>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function Playlists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sort, setSort] = useState('newest');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState('Public');
  const [isCreating, setIsCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVisibility, setEditVisibility] = useState('Public');
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { setNotLoggedIn(true); setLoading(false); return; }
    axios.get('/api/playlists/my', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => { setPlaylists(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const openPlaylist = (playlist) => {
    setSelected({ ...playlist, videos: null });
    setDetailLoading(true);
    axios.get(`/api/playlists/${playlist.id}/videos`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => {
        setSelected(prev => ({ ...prev, videos: r.data.videos, totalVideos: r.data.videoCount }));
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  };

  const deletePlaylist = async (id) => {
    if (!window.confirm('Xoá danh sách phát này?')) return;
    try {
      await axios.delete(`/api/playlists/${id}`, { headers: { Authorization: 'Bearer ' + token } });
      setPlaylists(prev => prev.filter(p => p.id !== id));
      showToast('Đã xoá danh sách phát');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xoá');
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await axios.post('/api/playlists/create', {
        title: newTitle,
        visibility: newVisibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists([res.data, ...playlists]);
      showToast('Tạo danh sách phát thành công!');
      setShowCreate(false);
      setNewTitle('');
      setNewVisibility('Public');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (playlist) => {
    if (playlist.title === 'Xem sau') {
      alert('Không thể chỉnh sửa danh sách mặc định.');
      return;
    }
    setEditId(playlist.id);
    setEditTitle(playlist.title);
    setEditVisibility(playlist.visibility || 'Public');
    setShowEdit(true);
  };

  const handleEditPlaylist = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setIsEditing(true);
    try {
      const res = await axios.put(`/api/playlists/${editId}`, {
        title: editTitle,
        visibility: editVisibility
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(prev => prev.map(p => p.id === editId ? res.data : p));
      showToast('Đã lưu thay đổi!');
      setShowEdit(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsEditing(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // ── Derived stats ──
  const totalVideos = playlists.reduce((s, p) => s + (p.videoCount || 0), 0);
  const publicCount = playlists.filter(p => p.visibility === 'Public').length;
  const privateCount = playlists.filter(p => p.visibility !== 'Public').length;

  // ── Filtered + Sorted list ──
  const filtered = playlists
    .filter(p => {
      if (activeTab === 'public') return p.visibility === 'Public';
      if (activeTab === 'private') return p.visibility !== 'Public';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'videos') return (b.videoCount || 0) - (a.videoCount || 0);
      return a.title.localeCompare(b.title);
    });

  // ── Recent activity: last 4 playlists updated ──
  const recentActivity = [...playlists]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  /* ── Not logged in ── */
  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center">
          <ListVideo className="w-9 h-9 text-gray-600" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">Danh sách phát của bạn</p>
          <p className="text-gray-500 text-sm">Đăng nhập để xem và quản lý danh sách phát</p>
        </div>
        <button onClick={() => navigate('/login')}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
          style={{ background: 'linear-gradient(to right,#FF5722,#E91E63)' }}>
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-20">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm text-white">
          <CheckCircle className="w-3 h-3 text-white fill-green-500 shrink-0" />{toast}
        </div>
      )}

      {/* ── Detail View ── */}
      {selected && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelected(null)} className="p-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-full text-white transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
              {selected.description && <p className="text-gray-400 text-sm mt-1">{selected.description}</p>}
              <p className="text-gray-500 text-xs mt-1">{selected.totalVideos || selected.videoCount} video</p>
            </div>
          </div>
          
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 md:p-6">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF5722]" />
              </div>
            ) : selected.videos && selected.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Film className="w-12 h-12 text-gray-600" />
                <p className="text-gray-500 text-base">Danh sách này chưa có video nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selected.videos?.map((v, i) => (
                  <VideoItem key={v.id} video={v} index={i} onNavigate={(videoObj) => { setSelected(null); navigate(videoObj.isShort ? `/shorts?id=${videoObj.id}` : `/watch/${videoObj.id}?list=${selected.id}`); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Playlist Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isCreating && setShowCreate(false)} />
          <div className="relative z-50 w-full max-w-md bg-[#181818] rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Tạo danh sách phát</h3>
              <button onClick={() => !isCreating && setShowCreate(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tên danh sách phát *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Nhập tên danh sách..."
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Quyền riêng tư</label>
                <select
                  value={newVisibility}
                  onChange={e => setNewVisibility(e.target.value)}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Public">Công khai</option>
                  <option value="Private">Riêng tư</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF5722] hover:bg-[#E64A19] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Playlist Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isEditing && setShowEdit(false)} />
          <div className="relative z-50 w-full max-w-md bg-[#181818] rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Chỉnh sửa danh sách phát</h3>
              <button onClick={() => !isEditing && setShowEdit(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditPlaylist} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tên danh sách phát *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Quyền riêng tư</label>
                <select
                  value={editVisibility}
                  onChange={e => setEditVisibility(e.target.value)}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Public">Công khai</option>
                  <option value="Private">Riêng tư</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  disabled={isEditing}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditing || !editTitle.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF5722] hover:bg-[#E64A19] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!selected && (
        <>
          {/* ── HERO BANNER ── */}
          <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a0533 0%,#0d1a3a 50%,#1a0533 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#9C27B0,transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#FF5722,transparent)' }} />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-8 flex items-center justify-between gap-8">
          <div className="flex-1">
            {/* Title */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                style={{ background: 'linear-gradient(135deg,#9C27B0,#FF5722)' }}>
                <ListVideo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Danh sách phát</h1>
                <p className="text-gray-400 text-sm mt-0.5">Quản lý và sắp xếp các danh sách phát của bạn</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-6">
              {[
                { icon: ListVideo, label: 'Danh sách', value: playlists.length, color: '#9C27B0' },
                { icon: Film, label: 'Video', value: totalVideos, color: '#FF5722' },
                { icon: Globe, label: 'Công khai', value: publicCount, color: '#2196F3' },
                { icon: Lock, label: 'Riêng tư', value: privateCount, color: '#607D8B' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: stat.color + '22' }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-white text-lg font-bold leading-none">{formatViews(stat.value)}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right decoration — stacked playlist visual */}
          <div className="hidden lg:flex items-center justify-center relative w-52 h-40 shrink-0">
            <div className="absolute right-4 top-2 w-36 h-24 rounded-xl bg-gradient-to-br from-purple-600/40 to-indigo-600/40 border border-white/10 rotate-6 shadow-xl" />
            <div className="absolute right-6 top-4 w-36 h-24 rounded-xl bg-gradient-to-br from-pink-600/40 to-red-600/40 border border-white/10 rotate-3 shadow-xl" />
            <div className="relative w-36 h-24 rounded-xl bg-gradient-to-br from-orange-500/60 to-pink-600/60 border border-white/20 shadow-2xl flex items-center justify-center">
              <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </div>

      {/* ── CONTROLS BAR ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#111] border border-white/5 rounded-xl p-1">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'public', label: 'Công khai' },
              { key: 'private', label: 'Riêng tư' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#FF5722] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative flex items-center gap-2 bg-[#111] border border-white/5 rounded-xl px-3 py-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-400 text-xs shrink-0">Sắp xếp:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="videos">Nhiều video nhất</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>

            {/* View mode */}
            <div className="flex items-center gap-1 bg-[#111] border border-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Create button */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-lg cursor-pointer"
              style={{ background: 'linear-gradient(to right,#FF5722,#E91E63)' }}
            >
              <Plus className="w-4 h-4" /> Tạo danh sách phát
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5' : 'space-y-4'}`}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-[#1A1A1A] mb-3" />
                <div className="h-3 bg-[#1A1A1A] rounded mb-1.5 w-3/4" />
                <div className="h-2.5 bg-[#1A1A1A] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <ListVideo className="w-9 h-9 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">
                {activeTab === 'all' ? 'Chưa có danh sách phát nào' : `Không có danh sách ${activeTab === 'public' ? 'công khai' : 'riêng tư'} nào`}
              </p>
              <p className="text-gray-500 text-sm">Tạo danh sách phát đầu tiên của bạn ngay!</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {filtered.map(pl => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onOpen={openPlaylist}
                onDelete={deletePlaylist}
                onEdit={openEditModal}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3">
            {filtered.map(pl => (
              <PlaylistListItem
                key={pl.id}
                playlist={pl}
                onOpen={openPlaylist}
                onDelete={deletePlaylist}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RECENT ACTIVITY ── */}
      {recentActivity.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-12">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF5722]" /> Hoạt động gần đây
              </h2>
              <button className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors group cursor-pointer">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {recentActivity.map(pl => (
                <ActivityItem key={pl.id} playlist={pl} onOpen={openPlaylist} />
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
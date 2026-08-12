import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ListPlus, Check, Plus, X, Loader2, Lock, Globe } from 'lucide-react';

/**
 * SaveToPlaylistDropdown
 * Props:
 *  - videoId: string
 *  - onClose: () => void (called when dropdown closes)
 * 
 * Handles fetching user playlists, toggling video in/out, and creating new playlists.
 */
export default function SaveToPlaylistDropdown({ videoId, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // playlist id being toggled
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState('Public');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');

  const fetchPlaylists = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/playlists/my?videoId=${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phát:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [videoId]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose && onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleToggle = async (playlist) => {
    if (!token || toggling) return;
    setToggling(playlist.id);
    try {
      await axios.post(`/api/playlists/${playlist.id}/toggle-video`, { videoId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optimistically update UI
      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlist.id ? { ...p, containsVideo: !p.containsVideo, videoCount: p.containsVideo ? p.videoCount - 1 : p.videoCount + 1 } : p
        )
      );
    } catch (err) {
      console.error('Lỗi khi cập nhật danh sách phát:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const res = await axios.post('/api/playlists/create', { title: newTitle.trim(), visibility: newVisibility }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newPlaylist = { ...res.data, containsVideo: false };
      setPlaylists(prev => [newPlaylist, ...prev]);
      setNewTitle('');
      setShowCreate(false);
      // Auto-add video to the newly created playlist
      await handleToggle(newPlaylist);
    } catch (err) {
      console.error('Lỗi khi tạo danh sách phát:', err);
    } finally {
      setCreating(false);
    }
  };

  const hasSaved = playlists.some(p => p.containsVideo);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-72 bg-[#212121] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">Lưu vào danh sách phát</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Playlist list */}
      <div className="max-h-60 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Chưa có danh sách phát nào.</p>
        ) : (
          playlists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => handleToggle(playlist)}
              disabled={toggling === playlist.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${playlist.containsVideo ? 'bg-[#FF4E00] border-[#FF4E00]' : 'border-gray-500'}`}>
                {playlist.containsVideo && <Check className="w-3 h-3 text-white" />}
                {toggling === playlist.id && <Loader2 className="w-3 h-3 animate-spin text-white" />}
              </div>

              {/* Info */}
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{playlist.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{playlist.videoCount} video • {playlist.visibility === 'Public' || playlist.visibility === 'public' ? 'Công khai' : 'Riêng tư'}</p>
              </div>

              {/* Visibility icon */}
              {playlist.visibility === 'Private' || playlist.visibility === 'private'
                ? <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                : <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              }
            </button>
          ))
        )}
      </div>

      {/* Create new playlist */}
      <div className="border-t border-white/10">
        {showCreate ? (
          <div className="p-3 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Tên danh sách phát..."
              autoFocus
              className="w-full bg-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-[#FF4E00] placeholder-gray-500"
            />
            <div className="flex gap-2">
              <select
                value={newVisibility}
                onChange={e => setNewVisibility(e.target.value)}
                className="flex-1 bg-[#2A2A2A] text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 focus:outline-none cursor-pointer"
              >
                <option value="Public">Công khai</option>
                <option value="Private">Riêng tư</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="flex-1 bg-[#FF4E00] hover:bg-[#ff6a2b] disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Tạo'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewTitle(''); }}
                className="px-2 py-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors text-gray-300 hover:text-white cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF4E00]" />
            <span className="text-sm">Tạo danh sách phát mới</span>
          </button>
        )}
      </div>

      {/* Done button */}
      {hasSaved && (
        <div className="border-t border-white/10 px-4 py-2">
          <p className="text-xs text-gray-400 text-center">
            Đã lưu vào {playlists.filter(p => p.containsVideo).length} danh sách phát
          </p>
        </div>
      )}
    </div>
  );
}

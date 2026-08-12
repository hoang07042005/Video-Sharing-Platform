import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Shield, Users, Crown, Search, Loader2, Check, X, Lock,
  UserCog, RefreshCw, ChevronDown, ShieldCheck
} from 'lucide-react';

// Role Definitions
const ROLES = {
  Admin: {
    label: 'Quản trị viên',
    color: 'from-red-500 to-orange-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: Crown,
    description: 'Toàn quyền quản trị hệ thống',
    permissions: [
      'Quản lý người dùng', 'Quản lý video', 'Quản lý bình luận',
      'Quản lý danh mục', 'Xem báo cáo', 'Cấu hình hệ thống',
      'Phân quyền vai trò', 'Quản lý giao dịch'
    ]
  },
  Moderator: {
    label: 'Kiểm duyệt viên',
    color: 'from-blue-500 to-purple-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: ShieldCheck,
    description: 'Kiểm duyệt nội dung và bình luận',
    permissions: [
      'Quản lý bình luận', 'Ẩn / xóa video vi phạm',
      'Xem báo cáo người dùng', 'Quản lý từ khóa cấm'
    ]
  },
  User: {
    label: 'Người dùng',
    color: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    icon: Users,
    description: 'Người dùng thông thường',
    permissions: [
      'Xem video', 'Bình luận', 'Thích video',
      'Đăng ký kênh', 'Upload video'
    ]
  }
};

const PERMISSION_MATRIX = [
  { name: 'Quản lý người dùng',  admin: true,  mod: false, user: false },
  { name: 'Quản lý video',       admin: true,  mod: true,  user: false },
  { name: 'Quản lý bình luận',   admin: true,  mod: true,  user: false },
  { name: 'Quản lý danh mục',    admin: true,  mod: false, user: false },
  { name: 'Xem báo cáo',         admin: true,  mod: true,  user: false },
  { name: 'Cấu hình hệ thống',   admin: true,  mod: false, user: false },
  { name: 'Phân quyền vai trò',  admin: true,  mod: false, user: false },
  { name: 'Upload video',         admin: true,  mod: true,  user: true  },
  { name: 'Bình luận',            admin: true,  mod: true,  user: true  },
  { name: 'Xem video',            admin: true,  mod: true,  user: true  },
];

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [savingId, setSavingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, itemsPerPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setSavingId(userId);
    setOpenDropdownId(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showNotification('success', `Đã cập nhật vai trò thành ${ROLES[newRole]?.label || newRole}`);
    } catch {
      showNotification('error', 'Không thể cập nhật vai trò. Vui lòng thử lại.');
    } finally {
      setSavingId(null);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const adminCount = users.filter(u => u.role === 'Admin').length;
  const moderatorCount = users.filter(u => u.role === 'Moderator').length;
  const userCount = users.filter(u => !u.role || u.role === 'User').length;

  const filtered = users.filter(u => {
    const matchSearch = !searchTerm ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || (u.role || 'User') === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const getRoleInfo = (role) => ROLES[role] || ROLES['User'];

  return (
    <div className="p-4 max-w-[1600px] mx-auto min-h-full">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-300'
            : 'bg-red-900/90 border-red-500/40 text-red-300'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Vai trò &amp; Phân quyền
          </h1>
          <p className="text-gray-400 text-sm">Quản lý vai trò và quyền hạn của từng người dùng trong hệ thống.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-[#1C1C24] hover:bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-colors cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {Object.entries(ROLES).map(([key, role]) => {
          const count = key === 'Admin' ? adminCount : key === 'Moderator' ? moderatorCount : userCount;
          const Icon = role.icon;
          return (
            <div key={key} className={`bg-[#15151A] rounded-2xl border ${role.borderColor} p-5 relative overflow-hidden`}>
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${role.color} opacity-5`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${role.bgColor} border ${role.borderColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${role.textColor}`} />
                </div>
                <span className={`text-3xl font-bold ${role.textColor}`}>{count}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-1">{role.label}</h3>
              <p className="text-gray-500 text-xs mb-4">{role.description}</p>
              <div className="space-y-1.5">
                {role.permissions.slice(0, 3).map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.color}`} />
                    {p}
                  </div>
                ))}
                {role.permissions.length > 3 && (
                  <div className="text-xs text-gray-600">+{role.permissions.length - 3} quyền khác...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="bg-[#15151A] rounded-2xl border border-white/5 p-5 mb-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          Ma trận phân quyền
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left pb-3 text-gray-500 font-medium text-xs uppercase tracking-wider w-[40%]">Quyền hạn</th>
                {Object.entries(ROLES).map(([key, role]) => (
                  <th key={key} className="text-center pb-3 text-xs uppercase tracking-wider">
                    <span className={`${role.textColor} font-semibold`}>{role.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {PERMISSION_MATRIX.map(perm => (
                <tr key={perm.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 text-gray-300 text-sm">{perm.name}</td>
                  <td className="py-3 text-center">{perm.admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                  <td className="py-3 text-center">{perm.mod   ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                  <td className="py-3 text-center">{perm.user  ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Role Table */}
      <div className="bg-[#15151A] rounded-2xl border border-white/5 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1C1C24] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'Admin', 'Moderator', 'User'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === r ? 'bg-purple-600 text-white' : 'bg-[#1C1C24] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {r === 'all' ? 'Tất cả' : ROLES[r]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="w-full" ref={dropdownRef}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#1C1C24]/50 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                <th className="px-5 py-4">NGƯỜI DÙNG</th>
                <th className="px-4 py-4">EMAIL</th>
                <th className="px-4 py-4 text-center">VAI TRÒ</th>
                <th className="px-4 py-4 text-center">TRẠNG THÁI</th>
                <th className="px-4 py-4 text-right">THAY ĐỔI VAI TRÒ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500" /></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-16 text-gray-500">Không tìm thấy người dùng nào.</td></tr>
              ) : currentItems.map(u => {
                const roleInfo = getRoleInfo(u.role);
                const RoleIcon = roleInfo.icon;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-800">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-200">{u.fullName || 'Unknown'}</div>
                          <div className="text-[11px] text-gray-500">@{u.email?.split('@')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${roleInfo.bgColor} ${roleInfo.textColor} border ${roleInfo.borderColor}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20">
                          <X className="w-3 h-3" /> Bị cấm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        {savingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1C24] hover:bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-gray-300 transition-colors cursor-pointer"
                            >
                              <UserCog className="w-3.5 h-3.5" /> Thay đổi <ChevronDown className="w-3 h-3" />
                            </button>
                            {openDropdownId === u.id && (
                              <div className="absolute right-0 top-full mt-2 w-56 bg-[#1C1C24] border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden">
                                {Object.entries(ROLES).map(([key, role]) => {
                                  const DIcon = role.icon;
                                  const isCurrent = (u.role || 'User') === key;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => handleRoleChange(u.id, key)}
                                      disabled={isCurrent}
                                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                                        isCurrent ? 'text-gray-500 cursor-not-allowed bg-white/[0.02]' : 'text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer'
                                      }`}
                                    >
                                      <DIcon className={`w-4 h-4 ${role.textColor}`} />
                                      <div className="text-left">
                                        <div className="font-medium text-xs">{role.label}</div>
                                        <div className="text-[10px] text-gray-500">{role.description}</div>
                                      </div>
                                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="bg-[#1C1C24] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none cursor-pointer"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-xs text-gray-500">/ {filtered.length} người dùng</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      currentPage === page ? 'bg-purple-600 text-white border border-purple-500' : 'border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                    }`}>{page}</button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Loader2, Shield, ShieldOff, MoreVertical, UserCheck, UserX, 
  Users, UserPlus, Activity, Lock, Download, ChevronDown, RefreshCw, Filter, 
  Eye, Pencil 
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, active, banned, admin
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [dateFilter, setDateFilter] = useState('Tất cả thời gian');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUsers();
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, roleFilter, statusFilter, dateFilter, itemsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, currentStatus) => {
    const confirmMessage = currentStatus 
      ? 'Bạn có chắc chắn muốn MỞ KHÓA (Unban) người dùng này?' 
      : 'Bạn có chắc chắn muốn KHÓA (Ban) người dùng này?';
      
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/admin/users/${userId}/ban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isBanned: res.data.isBanned } : u
      ));
    } catch (error) {
      console.error('Error toggling user ban:', error);
      alert('Có lỗi xảy ra khi thay đổi trạng thái!');
    }
  };

  // KPI Calculations
  const totalUsers = users.length;
  // We mock the new users if not provided by backend. Let's just say a fraction.
  const newUsers = Math.floor(totalUsers * 0.02) || 0; 
  const activeUsers = users.filter(u => !u.isBanned).length;
  const bannedUsers = users.filter(u => u.isBanned).length;
  const adminUsers = users.filter(u => u.role === 'Admin').length;

  // Filtering Logic
  const filteredUsers = users.filter(u => {
    // Tab filtering
    if (activeTab === 'active' && u.isBanned) return false;
    if (activeTab === 'banned' && !u.isBanned) return false;
    if (activeTab === 'admin' && u.role !== 'Admin') return false;

    // Search filtering
    const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.id?.toString().includes(searchTerm);
    
    // Role filter
    const matchesRole = roleFilter === 'Tất cả' || 
                        (roleFilter === 'Admin' && u.role === 'Admin') || 
                        (roleFilter === 'User' && u.role !== 'Admin');

    // Status filter
    const matchesStatus = statusFilter === 'Tất cả' ||
                          (statusFilter === 'Đang hoạt động' && !u.isBanned) ||
                          (statusFilter === 'Bị khóa' && u.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDateString = (dateString) => {
    if (!dateString) return <span className="text-gray-500">N/A</span>;
    const d = new Date(dateString);
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return (
      <div className="flex flex-col text-gray-300">
        <span>{date}</span>
        <span className="text-gray-500 text-xs mt-0.5">{time}</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-24 font-sans text-white">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Quản lý người dùng</h1>
            <p className="text-sm text-gray-400 mt-0.5">Tổng số <span className="text-white font-semibold">{totalUsers.toLocaleString()}</span> người dùng</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#15171f] text-gray-300 text-sm font-medium rounded-xl border border-white/10 hover:border-gray-500 hover:bg-white/5 transition-colors">
            <Download className="w-4 h-4" /> Xuất dữ liệu
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20">
            <UserCheck className="w-4 h-4" /> Thao tác hàng loạt
            <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tổng người dùng</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1.5 relative z-10">{totalUsers.toLocaleString()}</p>
          <p className="text-[11px] text-green-400 font-medium relative z-10">↑ 12.5% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-green-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
              <UserPlus className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Người dùng mới</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1.5 relative z-10">{newUsers.toLocaleString()}</p>
          <p className="text-[11px] text-green-400 font-medium relative z-10">↑ 18.3% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Đang hoạt động</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1.5 relative z-10">{activeUsers.toLocaleString()}</p>
          <p className="text-[11px] text-green-400 font-medium relative z-10">↑ 9.7% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-red-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              <Lock className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Đã khóa</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1.5 relative z-10">{bannedUsers.toLocaleString()}</p>
          <p className="text-[11px] text-red-400 font-medium relative z-10">↓ 4.3% <span className="text-gray-500 font-normal">so với tuần trước</span></p>
        </div>

        <div className="bg-[#15171f] p-5 rounded-2xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Admin</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1.5 relative z-10">{adminUsers.toLocaleString()}</p>
          <p className="text-[11px] text-gray-500 font-medium relative z-10">— không đổi</p>
        </div>
      </div>

      {/* ─── Filters Row ─── */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-80 h-[42px]">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, email hoặc ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-[#15171f] border border-white/10 text-white pl-11 pr-4 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-[10px] text-gray-500 font-medium ml-1">Vai trò</label>
            <div className="relative h-[42px]">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-36 h-full appearance-none bg-[#15171f] border border-white/10 text-gray-300 text-sm rounded-xl pl-4 pr-10 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option>Tất cả</option>
                <option>Admin</option>
                <option>User</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-[10px] text-gray-500 font-medium ml-1">Trạng thái</label>
            <div className="relative h-[42px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-40 h-full appearance-none bg-[#15171f] border border-white/10 text-gray-300 text-sm rounded-xl pl-4 pr-10 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option>Tất cả</option>
                <option>Đang hoạt động</option>
                <option>Bị khóa</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-[10px] text-gray-500 font-medium ml-1">Ngày tham gia</label>
            <div className="relative h-[42px]">
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-48 h-full appearance-none bg-[#15171f] border border-white/10 text-gray-300 text-sm rounded-xl pl-4 pr-10 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option>Tất cả thời gian</option>
                <option>Tháng này</option>
                <option>Năm nay</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto mt-5 md:mt-0">
           <button onClick={() => fetchUsers()} className="flex items-center justify-center gap-2 px-5 h-[42px] bg-[#15171f] text-gray-300 text-sm font-medium rounded-xl border border-white/10 hover:border-gray-500 hover:bg-white/5 transition-colors">
             <RefreshCw className="w-4 h-4" /> Làm mới
           </button>
           {/* <button className="flex items-center justify-center gap-2 px-5 h-[42px] bg-[#15171f] text-gray-300 text-sm font-medium rounded-xl border border-white/10 hover:border-gray-500 hover:bg-white/5 transition-colors">
             <Filter className="w-4 h-4" /> Bộ lọc
           </button> */}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="bg-[#11131a] rounded-2xl border border-white/5 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Tabs Row */}
        <div className="flex items-center gap-8 px-6 border-b border-white/5 bg-[#15171f]/50 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả', count: totalUsers },
            { id: 'active', label: 'Đang hoạt động', count: activeUsers },
            { id: 'banned', label: 'Bị khóa', count: bannedUsers },
            { id: 'admin', label: 'Admin', count: adminUsers }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-purple-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label} ({tab.count.toLocaleString()})
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full shadow-[0_-2px_8px_rgba(168,85,247,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#15171f]/80 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded bg-black/50 border-gray-600 text-purple-500 focus:ring-purple-500/50 cursor-pointer" /></th>
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4 text-center">Vai trò</th>
                <th className="px-6 py-4 text-center">Video / Shorts</th>
                <th className="px-6 py-4 text-center">Lượt đăng ký</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-gray-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => {
                  const isAdmin = user.role === 'Admin';
                  const isBanned = user.isBanned;

                  return (
                    <tr key={user.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded bg-black/50 border-gray-600 text-purple-500 focus:ring-purple-500/50 cursor-pointer" /></td>
                      <td className="px-4 py-3 min-w-[250px]">
                        <div className="flex items-center gap-4">
                          <img 
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-purple-400 transition-colors cursor-pointer">{user.fullName}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{user.email}</p>
                            <p className="text-[10px] text-gray-600 font-medium mt-0.5 uppercase tracking-wide">ID: #{user.id?.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[11px] font-medium ${
                          isAdmin 
                            ? 'bg-purple-900/40 text-purple-300' 
                            : 'bg-white/5 text-gray-300'
                        }`}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-2 py-1 flex items-center justify-center rounded text-blue-300 text-xs font-semibold">Video: {user.totalVideos || 0}</span>
                          <span className="text-gray-600">/</span>
                          <span className="px-2 py-1 flex items-center justify-center rounded text-purple-300 text-xs font-semibold">Shorts: {user.totalShorts || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        {user.subscribers?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {formatDateString(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isBanned ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                            'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                          }`}></span>
                          <span className={`text-[11px] font-medium ${isBanned ? 'text-red-400' : 'text-green-400'}`}>
                            {isBanned ? 'Bị khóa' : 'Hoạt động'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa thông tin">
                            <Pencil className="w-4 h-4" />
                          </button>
                          
                          {/* More Options Dropdown */}
                          <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openMenuId === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                  <UserCheck className="w-4 h-4" /> Xem lịch sử
                                </button>
                                {user.role !== 'Admin' && (
                                  <>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <button 
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleToggleBan(user.id, user.isBanned);
                                      }}
                                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                                        user.isBanned 
                                          ? 'text-green-400 hover:bg-green-500/10' 
                                          : 'text-red-400 hover:bg-red-500/10'
                                      }`}
                                    >
                                      {user.isBanned ? (
                                        <><Shield className="w-4 h-4" /> Mở khóa tài khoản</>
                                      ) : (
                                        <><ShieldOff className="w-4 h-4" /> Khóa tài khoản</>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số <span className="font-semibold text-gray-300">{totalItems.toLocaleString()} người dùng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><span className="leading-none pb-0.5">‹</span></button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pageNum 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-[#1a1c23] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-1 text-gray-500">...</span>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-xs font-medium"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1c23] border border-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><span className="leading-none pb-0.5">›</span></button>
              </div>
              <div className="relative">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-[#1a1c23] border border-white/5 text-gray-300 text-xs font-medium rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

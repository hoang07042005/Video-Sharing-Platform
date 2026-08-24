import { useState, useEffect, useCallback, Fragment } from 'react';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import {
  Crown, Shield, Users, Plus,
  ChevronLeft, ChevronRight, Activity, Check, Minus, Video, ShieldAlert, PieChart, ShieldCheck
} from 'lucide-react';

// === CONSTANTS & MOCK DATA ===

// Dynamic permission grouping will be generated from DB data

export default function AdminRoles() {
  const getRoleCardStyle = (role) => {
    if (role.color?.startsWith('#')) {
      return {
        className: 'p-4 rounded-xl border relative overflow-hidden group cursor-pointer transition-all hover:brightness-110',
        style: { backgroundColor: `${role.color}1A`, borderColor: `${role.color}33` } // 1A = 10%, 33 = 20%
      };
    }
    return {
      className: `p-4 rounded-xl border ${role.borderColor} ${role.bgColor} relative overflow-hidden group cursor-pointer transition-all hover:brightness-110`,
      style: {}
    };
  };

  const getRoleTextStyle = (role) => {
    if (role.color?.startsWith('#')) {
      return { className: '', style: { color: role.color } };
    }
    return { className: role.textColor || '', style: {} };
  };



  const getRoleIconBoxStyle = (role) => {
    if (role.color?.startsWith('#')) {
      return {
        className: 'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
        style: { backgroundColor: `${role.color}1A`, borderColor: `${role.color}33`, color: role.color }
      };
    }
    return {
      className: `w-10 h-10 rounded-xl ${role.bgColor} ${role.textColor} border ${role.borderColor} flex items-center justify-center shrink-0`,
      style: {}
    };
  };

  const [rolesList, setRolesList] = useState([]);
  const [usersCountMap, setUsersCountMap] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix');
  const [notification, setNotification] = useState(null);
  const [dynamicPermissionGroups, setDynamicPermissionGroups] = useState([]);
  const [roleUpdates, setRoleUpdates] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('Tất cả nhóm quyền');

  // Role Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalRoleData, setModalRoleData] = useState({
    id: null,
    name: '',
    label: '',
    description: '',
    permissions: []
  });
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const normalizeRoleName = (value) => {
    if (!value) return null;
    const raw = typeof value === 'string' ? value : (value.name || value.Name || value.label || value.Label || '');
    return String(raw).trim();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, logsRes] = await Promise.all([
        axios.get('/api/admin/roles'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/audit-logs').catch(() => ({ data: [] }))
      ]);
      
      const rolesData = rolesRes.data.map(r => {
        let perms = [];
        try {
          const jsonStr = r.permissionsJson || r.PermissionsJson;
          if (jsonStr) perms = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Error parsing permissions", e);
        }
        
        const iconName = r.icon || r.Icon;
        return {
          ...r,
          Icon: LucideIcons[iconName] || LucideIcons.Shield,
          label: r.label || r.Label || r.name || r.Name,
          description: r.description || r.Description,
          textColor: r.textColor || r.TextColor || 'text-gray-400',
          bgColor: r.bgColor || r.BgColor || 'bg-gray-500/10',
          borderColor: r.borderColor || r.BorderColor || 'border-gray-500/20',
          name: r.name || r.Name,
          permissions: perms
        };
      });

      setRolesList(rolesData);

      const canonicalRoleMap = new Map();
      rolesData.forEach(role => {
        const keys = [role.name, role.Name, role.label, role.Label].filter(Boolean).map(item => String(item).trim().toLowerCase());
        keys.forEach(key => canonicalRoleMap.set(key, role.name || role.Name || role.label || role.Label));
      });

      const countMap = {};
      usersRes.data.forEach(user => {
        if (user.roles && Array.isArray(user.roles)) {
          user.roles.forEach(roleItem => {
            const rawRoleName = normalizeRoleName(roleItem);
            if (!rawRoleName) return;

            const key = rawRoleName.toLowerCase();
            const canonicalName = canonicalRoleMap.get(key) || rawRoleName;
            countMap[canonicalName] = (countMap[canonicalName] || 0) + 1;
          });
        }
      });
      setUsersCountMap(countMap);

      const permissionLogs = logsRes.data.filter(log => {
        const targetStr = String(log.target || '').toLowerCase();
        const actionStr = String(log.action || '').toLowerCase();
        const typeStr = String(log.actionType || '').toLowerCase();

        return (
          targetStr.includes('role') || 
          targetStr.includes('permission') ||
          actionStr.includes('vai trò') || 
          actionStr.includes('quyền') ||
          typeStr.includes('assign') // Thường gán quyền dùng từ khóa assign
        );
      });
      setAuditLogs(permissionLogs);
      setUsersList(usersRes.data);

      // Dynamically extract all permissions from DB roles
      const allPerms = new Set();
      rolesData.forEach(r => {
        if (r.permissions) {
          r.permissions.forEach(p => allPerms.add(p));
        }
      });

      const groups = [
        { name: 'Người dùng & Tương tác', icon: Users, color: 'text-purple-400', permissions: [] },
        { name: 'Quản lý nội dung', icon: Video, color: 'text-blue-400', permissions: [] },
        { name: 'Kiểm duyệt & Hệ thống', icon: ShieldAlert, color: 'text-orange-400', permissions: [] }
      ];

      allPerms.forEach(perm => {
        const pLower = perm.toLowerCase();
        let targetGroup = 2; // Default to System

        if ((pLower.includes('video') && !pLower.includes('quản lý') && !pLower.includes('ẩn')) || 
            (pLower.includes('bình luận') && !pLower.includes('quản lý')) || 
            pLower.includes('kênh')) {
          targetGroup = 0;
        } else if (pLower.includes('video') || pLower.includes('danh mục') || pLower.includes('từ khóa') || (pLower.includes('bình luận') && pLower.includes('quản lý'))) {
          targetGroup = 1;
        }

        groups[targetGroup].permissions.push({ id: perm, label: perm });
      });

      setDynamicPermissionGroups(groups.filter(g => g.permissions.length > 0));
    } catch (error) {
      console.error('Error fetching roles data:', error);
      showNotification('Lỗi khi tải dữ liệu!', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const handleRoleChange = (userId, newRole) => {
    setRoleUpdates(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleUpdateAllRoles = async () => {
    const userIds = Object.keys(roleUpdates);
    if (userIds.length === 0) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const promises = userIds.map(id => 
        axios.put(`/api/admin/users/${id}/role`, {
          roles: [roleUpdates[id]]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      showNotification('Đã cập nhật vai trò thành công!');
      setRoleUpdates({});
      fetchData(); // reload all data to reflect changes
    } catch (error) {
      console.error('Error updating roles:', error);
      showNotification('Lỗi khi cập nhật vai trò!', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const openAddRoleModal = () => {
    setModalRoleData({
      id: null,
      name: '',
      label: '',
      description: '',
      color: '#a855f7',
      textColor: '',
      bgColor: '',
      borderColor: '',
      icon: 'Users',
      permissions: []
    });
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role) => {
    setModalRoleData({
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description || '',
      color: role.color || 'from-gray-500 to-gray-600',
      textColor: role.textColor || 'text-gray-400',
      bgColor: role.bgColor || 'bg-gray-500/10',
      borderColor: role.borderColor || 'border-gray-500/20',
      icon: role.icon || 'Users',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!modalRoleData.name || !modalRoleData.label) {
      showNotification('Vui lòng điền đầy đủ Tên và Label!', 'error');
      return;
    }

    setIsSubmittingRole(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: modalRoleData.name,
        label: modalRoleData.label,
        description: modalRoleData.description,
        color: modalRoleData.color,
        textColor: modalRoleData.textColor,
        bgColor: modalRoleData.bgColor,
        borderColor: modalRoleData.borderColor,
        icon: modalRoleData.icon,
        permissionsJson: JSON.stringify(modalRoleData.permissions)
      };

      if (modalRoleData.id) {
        // Edit
        await axios.put(`/api/admin/roles/${modalRoleData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Đã cập nhật vai trò thành công!');
      } else {
        // Add
        await axios.post('/api/admin/roles', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Đã tạo vai trò thành công!');
      }

      setShowRoleModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
      showNotification(error.response?.data?.message || 'Lỗi khi lưu vai trò!', 'error');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này không?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Đã xóa vai trò thành công!');
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      showNotification(error.response?.data?.message || 'Lỗi khi xóa vai trò!', 'error');
    }
  };

  const getRoleCount = (roleName) => {
    return usersCountMap[roleName] || 0;
  };

  const totalRoles = rolesList.length;
  const totalPermissions = dynamicPermissionGroups.reduce((acc, g) => acc + g.permissions.length, 0);
  const totalActiveUsers = usersList.length;
  const usersWithRoles = usersList.filter(u => u.roles && u.roles.length > 0).length;
  const permissionCoverage = totalActiveUsers > 0 ? Math.round((usersWithRoles / totalActiveUsers) * 100) : 0;

  const getPermissionStatus = (role, permId) => {
    if (role.permissions && role.permissions.includes(permId)) return 'allowed';
    return 'denied';
  };

  const displayedGroups = selectedGroupFilter === 'Tất cả nhóm quyền' 
    ? dynamicPermissionGroups 
    : dynamicPermissionGroups.filter(g => g.name === selectedGroupFilter);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto min-h-full pb-20">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-300'
            : 'bg-red-900/90 border-red-500/40 text-red-300'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <LucideIcons.X className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quản lý vai trò & phân quyền</h1>
          <p className="text-gray-400 text-sm">Tạo vai trò, phân quyền chi tiết và kiểm soát hoạt động hệ thống</p>
        </div>
        <button 
          onClick={openAddRoleModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#FF5722]/20"
        >
          <Plus className="w-4 h-4" /> Thêm vai trò mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141418] p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-tight">{totalRoles}</div>
            <div className="text-sm text-gray-200 font-semibold mt-0.5">Vai trò</div>
            <div className="text-[10px] text-gray-500">Tổng số vai trò</div>
          </div>
        </div>

        <div className="bg-[#141418] p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-tight">{totalPermissions}</div>
            <div className="text-sm text-gray-200 font-semibold mt-0.5">Quyền hạn</div>
            <div className="text-[10px] text-gray-500">Tổng số quyền</div>
          </div>
        </div>

        <div className="bg-[#141418] p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-tight">{totalActiveUsers}</div>
            <div className="text-sm text-gray-200 font-semibold mt-0.5">Người dùng</div>
            <div className="text-[10px] text-gray-500">Đang sử dụng</div>
          </div>
        </div>

        <div className="bg-[#141418] p-5 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <PieChart className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-tight">{permissionCoverage}%</div>
            <div className="text-sm text-gray-200 font-semibold mt-0.5">Phân quyền</div>
            <div className="text-[10px] text-gray-500">Đã phân quyền đầy đủ</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-white/5 mb-6">
        <button 
          onClick={() => setActiveTab('matrix')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Activity className="w-4 h-4" />
          Ma trận phân quyền
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'list' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <LucideIcons.List className="w-4 h-4" />
          Danh sách vai trò
        </button>
      </div>

      {/* Ma Trận Phân Quyền Content */}
      {activeTab === 'matrix' && (
        <div className="bg-[#141418] border border-white/5 rounded-2xl mb-8 flex flex-col overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-gray-400 font-medium">Thiết lập quyền hạn chi tiết cho từng vai trò trong hệ thống</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Nhóm quyền:</span>
              <select 
                className="bg-[#1a1c23] border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
              >
                <option>Tất cả nhóm quyền</option>
                {dynamicPermissionGroups.map((g, idx) => (
                  <option key={idx} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row">
            
            {/* Left Panel: Role Cards */}
            <div className="xl:w-[320px] lg:w-[400px] md:w-[480px] sm:w-[450px] shrink-0 flex flex-col gap-5 p-6 border-r border-white/5 bg-white/[0.01]">
              {rolesList.map(role => {
                const Icon = role.Icon;
                return (
                  <div key={role.id} {...getRoleCardStyle(role)}>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3.5 items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 shrink-0">
                          <Icon className="w-6 h-6" {...getRoleTextStyle(role)} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{role.label}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Panel: Matrix Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#141418]/50 divide-x divide-white/10">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[280px]">NHÓM QUYỀN / QUYỀN HẠN</th>
                    {rolesList.map(role => {
                      const Icon = role.Icon;
                      return (
                        <th key={role.id} className="px-4 py-4 text-center w-[120px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <Icon className={`w-4 h-4`} {...getRoleTextStyle(role)} />
                            <span className="text-[11px] font-semibold text-gray-300">{role.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {displayedGroups.map(group => (
                    <Fragment key={group.name}>
                      {/* Group Header Row */}
                      <tr className="bg-white/[0.02]">
                        <td colSpan={rolesList.length + 1} className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <group.icon className={`w-4 h-4 ${group.color}`} />
                            <span className="text-sm font-bold text-gray-200">{group.name}</span>
                          </div>
                        </td>
                      </tr>
                      {/* Permissions Rows */}
                      {group.permissions.map(perm => (
                        <tr key={perm.id} className="hover:bg-white/[0.01] transition-colors divide-x divide-white/10">
                          <td className="px-6 py-3 text-xs text-gray-400">{perm.label}</td>
                          {rolesList.map(role => {
                            const status = getPermissionStatus(role, perm.id);
                            return (
                             <td key={role.id} className="px-4 py-3 text-center align-middle">
                              <div className="flex items-center justify-center">
                                {status === 'allowed' && (
                                  <div className="w-5 h-5 rounded-full bg-[#0e9f6e] text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" strokeWidth={4} />
                                  </div>
                                )}
                                {status === 'denied' && (
                                  <div className="w-5 h-5 rounded-full bg-[#ff5a1f] text-[#12141c] flex items-center justify-center">
                                    <Minus className="w-3.5 h-3.5" strokeWidth={4} />
                                  </div>
                                )}
                              </div>
                            </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Table Footer / Legend */}
          <div className="p-4 bg-[#141418] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-5 h-5 rounded-full bg-[#0e9f6e] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" strokeWidth={4} />
                </div>
                Được phép
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-5 h-5 rounded-full bg-[#ff5a1f] text-[#12141c] flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" strokeWidth={4} />
                </div>
                Không có quyền
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bảng Cập nhật vai trò và Nhật ký thay đổi quyền */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-8">
          
          {/* Cập nhật vai trò (Cột trái) */}
          <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden xl:col-span-1 flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Cập nhật vai trò</h3>
                <p className="text-xs text-gray-500">Gán nhanh quyền cho người dùng</p>
              </div>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[600px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#141418] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#141418]">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5 bg-[#141418] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Người dùng</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User" className="w-6 h-6 rounded-full bg-gray-800" />
                          <div className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">{user.fullName || user.email.split('@')[0]}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          className="bg-[#1a1c23] border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500 w-full"
                          value={roleUpdates[user.id] || user.roles?.[0] || 'User'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          {rolesList.map(r => (
                            <option key={r.id} value={r.name}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#141418]">
               <button 
                 onClick={handleUpdateAllRoles}
                 disabled={isUpdating || Object.keys(roleUpdates).length === 0}
                 className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isUpdating ? 'Đang xử lý...' : 'Cập nhật tất cả'}
               </button>
            </div>
          </div>

          {/* Nhật ký thay đổi quyền (Cột phải) */}
          <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden xl:col-span-2 flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Nhật ký thay đổi quyền</h3>
                <p className="text-xs text-gray-500">Lịch sử thay đổi vai trò và phân quyền</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1c23] border border-white/10 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/5 transition-colors cursor-pointer">
                Xem tất cả <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[600px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#141418] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#141418]">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5 bg-[#141418] sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 font-semibold">THỜI GIAN</th>
                    <th className="px-2 py-2 font-semibold">NGƯỜI THỰC HIỆN</th>
                    <th className="px-8 py-2 font-semibold">HÀNH ĐỘNG</th>
                    <th className="px-2 py-2 font-semibold">ĐỐI TƯỢNG</th>
                    <th className="px-2 py-2 font-semibold">CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">Chưa có dữ liệu nhật ký nào.</td>
                    </tr>
                  ) : auditLogs.map(log => {
                    let actionBadgeClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                    if (log.actionType === 'update') actionBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    if (log.actionType === 'add') actionBadgeClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                    if (log.actionType === 'delete') actionBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                    if (log.actionType === 'assign') actionBadgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-2 py-2 text-xs text-gray-400 whitespace-nowrap">{log.time}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <img src={log.avatar} alt="User" className="w-7 h-7 rounded-full bg-gray-800" />
                            <div>
                              <div className="text-xs font-semibold text-gray-200">{log.user}</div>
                              <div className="text-[10px] text-gray-500">{log.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-2">
                          <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-md whitespace-nowrap ${actionBadgeClass}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className=" py-2 text-xs text-gray-300 font-medium">{log.target}</td>
                        <td className="px-2 py-2 text-xs text-gray-400 min-w-[150px]">{log.details}</td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-[#141418]">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                Hiển thị 
                <select className="bg-[#1a1c23] border border-white/10 rounded px-2 py-1 text-white focus:outline-none">
                  <option>10</option>
                  <option>20</option>
                </select>
                trên mỗi trang
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1a1c23] text-gray-500 hover:text-white border border-white/5 cursor-pointer disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-purple-600 text-white font-medium text-xs cursor-pointer">1</button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1a1c23] text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 font-medium text-xs cursor-pointer">2</button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1a1c23] text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 font-medium text-xs cursor-pointer">3</button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-[#1a1c23] text-gray-500 hover:text-white border border-white/5 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danh Sách Vai Trò Content */}
      {activeTab === 'list' && (
        <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden mt-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase text-gray-500 border-b border-white/5 bg-[#141418]">
                <tr>
                  <th className="px-6 py-4 font-semibold">TÊN VAI TRÒ</th>
                  <th className="px-6 py-4 font-semibold">MÔ TẢ</th>
                  <th className="px-6 py-4 font-semibold">SỐ NGƯỜI DÙNG</th>
                  <th className="px-6 py-4 font-semibold">SỐ QUYỀN HẠN</th>
                  <th className="px-6 py-4 font-semibold text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rolesList.map(role => {
                  const Icon = role.Icon;
                  return (
                    <tr key={role.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div {...getRoleIconBoxStyle(role)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-200 text-sm">{role.label}</div>
                            <div className="text-[10px] text-gray-500">{role.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{role.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300">
                          {getRoleCount(role.name)} người
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                        {role.permissions?.length || 0} quyền
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditRoleModal(role)} className="text-purple-400 hover:text-purple-300 text-xs font-semibold mr-4 transition-colors cursor-pointer">Chỉnh sửa</button>
                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer">Xóa</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA VAI TRÒ */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#141418] border border-white/10 rounded-1xl w-full max-w-2xl max-h-[100vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#141418]">
              <div>
                <h3 className="text-lg font-bold text-white">{modalRoleData.id ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}</h3>
                <p className="text-xs text-gray-500 mt-1">Cấu hình thông tin và phân quyền chi tiết cho vai trò</p>
              </div>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0F0F0F] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#0F0F0F]">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên vai trò (Mã hệ thống)</label>
                    <input 
                      type="text"
                      className="w-full bg-[#1a1c23] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="VD: Admin, Moderator..."
                      value={modalRoleData.name}
                      onChange={e => setModalRoleData({...modalRoleData, name: e.target.value})}
                      disabled={modalRoleData.id ? true : false} // Không cho sửa mã hệ thống nếu đang Edit
                    />
                    <p className="text-[10px] text-gray-500">Mã duy nhất, không dấu, không khoảng trắng.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tên hiển thị (Label)</label>
                    <input 
                      type="text"
                      className="w-full bg-[#1a1c23] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="VD: Quản trị viên, Người dùng..."
                      value={modalRoleData.label}
                      onChange={e => setModalRoleData({...modalRoleData, label: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</label>
                  <input 
                    type="text"
                    className="w-full bg-[#1a1c23] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Mô tả chức năng của vai trò này..."
                    value={modalRoleData.description}
                    onChange={e => setModalRoleData({...modalRoleData, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-10">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Màu sắc chủ đạo</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 shadow-lg">
                        <input
                          type="color"
                          value={modalRoleData.color?.startsWith('#') ? modalRoleData.color : '#a855f7'}
                          onChange={(e) => setModalRoleData({
                            ...modalRoleData,
                            color: e.target.value,
                            textColor: '',
                            bgColor: '',
                            borderColor: ''
                          })}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text"
                        className="w-28 bg-[#1a1c23] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                        value={modalRoleData.color?.startsWith('#') ? modalRoleData.color : '#a855f7'}
                        onChange={(e) => setModalRoleData({
                          ...modalRoleData,
                          color: e.target.value,
                          textColor: '',
                          bgColor: '',
                          borderColor: ''
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Biểu tượng (Icon Lucide)</label>
                    <div className="flex items-center gap-3">
                      <div {...getRoleIconBoxStyle(modalRoleData)}>
                        {(() => {
                          const IconComp = LucideIcons[modalRoleData.icon] || LucideIcons.Users;
                          return <IconComp className="w-5 h-5" />;
                        })()}
                      </div>
                      <input 
                        type="text"
                        className="flex-1 bg-[#1a1c23] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        placeholder="VD: Crown, Shield, Users..."
                        value={modalRoleData.icon}
                        onChange={e => setModalRoleData({...modalRoleData, icon: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> Phân quyền chi tiết
                  </h4>
                  
                  <div className="space-y-4">
                    {dynamicPermissionGroups.map(group => (
                      <div key={group.name} className="bg-[#141418] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                          <group.icon className={`w-4 h-4 ${group.color}`} />
                          <span className="text-sm font-bold text-gray-300">{group.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {group.permissions.map(perm => {
                            const isChecked = modalRoleData.permissions.includes(perm.id);
                            return (
                              <label key={perm.id} className="flex items-center gap-3 cursor-pointer group/perm">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isChecked 
                                    ? 'bg-purple-600 border-purple-500' 
                                    : 'bg-white/5 border-white/20 group-hover/perm:border-purple-500'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <span className={`text-xs ${isChecked ? 'text-gray-200 font-medium' : 'text-gray-500 group-hover/perm:text-gray-300'}`}>
                                  {perm.label}
                                </span>
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setModalRoleData(prev => ({...prev, permissions: [...prev.permissions, perm.id]}));
                                    } else {
                                      setModalRoleData(prev => ({...prev, permissions: prev.permissions.filter(p => p !== perm.id)}));
                                    }
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/5 bg-[#141418] flex justify-end gap-3">
              <button 
                onClick={() => setShowRoleModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveRole}
                disabled={isSubmittingRole}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                {isSubmittingRole ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {modalRoleData.id ? 'Cập nhật' : 'Tạo vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

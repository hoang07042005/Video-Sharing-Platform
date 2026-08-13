import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Check, 
  X,
  Loader2,
  FolderOpen,
  Filter,
  Download,
  Eye,
  EyeOff,
  LayoutGrid
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// List of available icons for categories
const AVAILABLE_ICONS = [
  'LayoutGrid', 'Music', 'Monitor', 'Gamepad2', 'Tv', 
  'BookOpen', 'Dumbbell', 'Clapperboard', 'Coffee', 'Plane',
  'Heart', 'Sparkles', 'Trophy', 'Code', 'Camera', 'Utensils',
  'Mic', 'Headphones', 'Briefcase', 'Globe', 'ShoppingBag'
];

const AdminVideoCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '', icon: 'LayoutGrid', isActive: true });
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admincategories');
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'active' ? c.isActive : !c.isActive;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const totalVideos = categories.reduce((sum, c) => sum + (c.videoCount || 0), 0);
  const activeCount = categories.filter(c => c.isActive).length;
  const inactiveCount = categories.length - activeCount;
  const emptyCount = categories.filter(c => !c.videoCount || c.videoCount === 0).length;

  const openAddModal = () => {
    setModalMode('add');
    setCurrentCategory({ id: null, name: '', description: '', icon: 'LayoutGrid', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setModalMode('edit');
    setCurrentCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory({ id: null, name: '', description: '', icon: 'LayoutGrid', isActive: true });
  };

  const handleSave = async () => {
    if (!currentCategory.name.trim()) {
      alert("Tên danh mục không được để trống");
      return;
    }

    try {
      if (modalMode === 'add') {
        const res = await axios.post('/api/admincategories', currentCategory);
        setCategories([...categories, res.data]);
      } else {
        const res = await axios.put(`/api/admincategories/${currentCategory.id}`, currentCategory);
        setCategories(categories.map(c => c.id === currentCategory.id ? res.data : c));
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      alert(error.response?.data || "Có lỗi xảy ra khi lưu");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await axios.delete(`/api/admincategories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert(error.response?.data || "Có lỗi xảy ra khi xóa");
    }
  };

  const renderIcon = (iconName, className = "w-4 h-4") => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.LayoutGrid;
    return <IconComponent className={className} />;
  };

  return (
    <div className="p-2 md:p-2 max-w-[1600px] mx-auto min-h-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Quản lý Danh mục</h1>
          <p className="text-gray-400 text-sm">Tạo, chỉnh sửa và quản lý danh mục video dễ dàng.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#1C1C24] p-1 rounded-xl border border-white/5">
            <button className="p-2 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA]  rounded-lg text-white"><LucideIcons.List className="w-4 h-4" /></button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors"><LucideIcons.LayoutGrid className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#FF5722]/20">
            <Plus className="w-4 h-4" /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#15151A] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
            <FolderOpen className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Tổng danh mục</p>
            <h3 className="text-2xl font-bold text-white">{categories.length}</h3>
            <p className="text-gray-500 text-xs mt-1">Tất cả danh mục</p>
          </div>
        </div>
        
        <div className="bg-[#15151A] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <FolderOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Đang hiển thị</p>
            <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
            <p className="text-gray-500 text-xs mt-1">Danh mục hiển thị</p>
          </div>
        </div>

        <div className="bg-[#15151A] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
            <EyeOff className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Đang ẩn</p>
            <h3 className="text-2xl font-bold text-white">{inactiveCount}</h3>
            <p className="text-gray-500 text-xs mt-1">Danh mục ẩn</p>
          </div>
        </div>

        <div className="bg-[#15151A] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
            <LucideIcons.PlaySquare className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Tổng video</p>
            <h3 className="text-2xl font-bold text-white">{totalVideos.toLocaleString()}</h3>
            <p className="text-gray-500 text-xs mt-1">Thuộc tất cả danh mục</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Tìm kiếm danh mục..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#15151A] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-purple-500 focus:outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          
          <div className="relative shrink-0">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-[#15151A] border border-white/10 text-white text-sm rounded-xl pl-4 pr-10 py-2.5 focus:border-purple-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="active">Trạng thái: Hiển thị</option>
              <option value="inactive">Trạng thái: Đang ẩn</option>
            </select>
            <LucideIcons.ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>

          <button onClick={() => {setSearchTerm(''); setFilterStatus('all');}} className="flex items-center gap-2 px-4 py-2.5 bg-[#15151A] hover:bg-[#1C1C24] border border-white/10 text-gray-300 text-sm font-medium rounded-xl transition-colors shrink-0">
            <LucideIcons.RotateCcw className="w-4 h-4" /> Làm mới
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#15151A] hover:bg-[#1C1C24] border border-white/10 text-gray-300 text-sm font-medium rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Xuất dữ liệu
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#15151A] hover:bg-[#1C1C24] border border-white/10 text-gray-300 text-sm font-medium rounded-xl transition-colors">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#15151A] rounded-2xl border border-white/5 overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#1C1C24]/50">
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs w-10">
                  <input type="checkbox" className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-600/50 cursor-pointer" />
                </th>
                <th className="px-4 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider w-12">#</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-center">Số Video</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500"/></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-gray-500">Chưa có danh mục nào.</td></tr>
              ) : (
                currentItems.map((c, index) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-600/50 cursor-pointer" />
                    </td>
                    <td className="px-4 py-4 text-gray-500 font-medium">
                      {(startIndex + index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                          {renderIcon(c.icon, "w-4 h-4")}
                        </div>
                        <span className="font-bold text-white text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-[250px] truncate">
                      {c.description || <span className="text-gray-600 italic">Chưa có mô tả</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-gray-300">{c.videoCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {c.isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Hiển thị
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Ẩn
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(c)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-[#1C1C24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                            <button onClick={() => handleDelete(c.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-white/5 flex items-center gap-2 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Xóa danh mục
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        
      </div>
      {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-gray-500">Hiển thị {filteredCategories.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCategories.length)} trong tổng số {filteredCategories.length} danh mục</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LucideIcons.ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="text-gray-500 px-1">...</span>
                      <button
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 transition-colors font-medium cursor-pointer"
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium cursor-pointer ${
                      currentPage === page 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:bg-white/5 transition-colors'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LucideIcons.ChevronRight className="w-4 h-4" />
            </button>
            
            <div className="ml-4 flex items-center gap-2 border border-white/10 rounded-lg px-3 py-1.5 bg-[#15151A]">
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-gray-400 text-sm focus:outline-none appearance-none cursor-pointer pr-2"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <LucideIcons.ChevronDown className="w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1C1C24] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">{modalMode === 'add' ? 'Thêm Danh mục mới' : 'Chỉnh sửa Danh mục'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto sidebar-scroll">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Tên danh mục <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={currentCategory.name} 
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="w-full bg-[#15151A] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors" 
                  placeholder="Ví dụ: Âm nhạc, Trò chơi..." 
                  autoFocus 
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Trạng thái</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={currentCategory.isActive === true}
                      onChange={() => setCurrentCategory({...currentCategory, isActive: true})}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${currentCategory.isActive ? 'border-emerald-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {currentCategory.isActive && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                    </div>
                    <span className={`text-sm font-medium ${currentCategory.isActive ? 'text-emerald-400' : 'text-gray-400'}`}>Hiển thị</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="isActive" 
                      checked={currentCategory.isActive === false}
                      onChange={() => setCurrentCategory({...currentCategory, isActive: false})}
                      className="hidden" 
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!currentCategory.isActive ? 'border-red-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {!currentCategory.isActive && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                    </div>
                    <span className={`text-sm font-medium ${!currentCategory.isActive ? 'text-red-400' : 'text-gray-400'}`}>Ẩn</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Mô tả (Tùy chọn)</label>
                <textarea 
                  value={currentCategory.description || ''} 
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                  className="w-full bg-[#15151A] text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:border-purple-500 focus:outline-none transition-colors min-h-[80px]" 
                  placeholder="Mô tả ngắn gọn về danh mục này..." 
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Chọn Biểu tượng (Icon)</label>
                <div className="bg-[#15151A] border border-white/10 rounded-xl p-3 grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-[160px] overflow-y-auto sidebar-scroll">
                  {AVAILABLE_ICONS.map(iconName => {
                    const isSelected = currentCategory.icon === iconName;
                    return (
                      <button
                        key={iconName}
                        onClick={() => setCurrentCategory({...currentCategory, icon: iconName})}
                        className={`flex items-center justify-center p-2.5 rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                            : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                        title={iconName}
                      >
                        {renderIcon(iconName, "w-5 h-5")}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                  <LucideIcons.Info className="w-3.5 h-3.5" /> Biểu tượng sẽ được hiển thị trên Sidebar và Trang chủ.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10 bg-[#15151A] rounded-b-2xl">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">Hủy bỏ</button>
              <button onClick={handleSave} disabled={!currentCategory.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 cursor-pointer">
                <Check className="w-4 h-4" /> Lưu Danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoCategory;

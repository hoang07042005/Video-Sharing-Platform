import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, ShieldBan, Trash2, Edit2, Plus, 
  Search, AlertTriangle, CheckCircle, ShieldAlert, Loader2, X,
  Clock, XCircle, Flag, ChevronDown, Filter, ChevronLeft, ChevronRight, Settings, Eye
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const AdminComments = () => {
  const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected, reported
  
  // Comments State
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  
  // Keywords State
  const [keywords, setKeywords] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  
  // Keyword Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentKeyword, setCurrentKeyword] = useState({ id: null, keyword: '', level: 'Medium', isActive: true, description: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchComments();
    fetchKeywords();
  }, []);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get('/api/admincomments');
      setComments(res.data);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      setLoadingKeywords(true);
      const res = await axios.get('/api/admincomments/bannedwords');
      setKeywords(res.data);
    } catch (error) {
      console.error("Lỗi khi tải từ khóa:", error);
    } finally {
      setLoadingKeywords(false);
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await axios.delete(`/api/admincomments/${id}`);
      setComments(comments.filter(c => c.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
    }
  };

  const handleSaveKeyword = async () => {
    if (!currentKeyword.keyword.trim()) return;
    
    try {
      setIsSaving(true);
      if (modalMode === 'add') {
        const res = await axios.post('/api/admincomments/bannedwords', currentKeyword);
        setKeywords([res.data, ...keywords]);
      } else {
        const res = await axios.put(`/api/admincomments/bannedwords/${currentKeyword.id}`, currentKeyword);
        setKeywords(keywords.map(k => k.id === currentKeyword.id ? res.data : k));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu từ khóa:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa từ khóa này?")) return;
    try {
      await axios.delete(`/api/admincomments/bannedwords/${id}`);
      setKeywords(keywords.filter(k => k.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa từ khóa:", error);
    }
  };

  const openAddKeywordModal = () => {
    setModalMode('add');
    setCurrentKeyword({ id: null, keyword: '', level: 'Medium', isActive: true, description: '' });
    setIsModalOpen(true);
  };

  const openEditKeywordModal = (kw) => {
    setModalMode('edit');
    setCurrentKeyword(kw);
    setIsModalOpen(true);
  };

  // Filter logic
  const filteredComments = comments.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'approved') return c.filterStatus === 'Normal';
    if (activeTab === 'pending') return c.filterStatus === 'Warning';
    if (activeTab === 'rejected') return c.filterStatus === 'Filtered' || c.filterStatus === 'Blocked';
    if (activeTab === 'reported') return c.filterStatus === 'Reported'; // Assuming we have reported status
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredComments.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const totalComments = comments.length;
  const approvedCount = comments.filter(c => c.filterStatus === 'Normal').length;
  const pendingCount = comments.filter(c => c.filterStatus === 'Warning').length;
  const rejectedCount = comments.filter(c => c.filterStatus === 'Filtered' || c.filterStatus === 'Blocked').length;
  const reportedCount = comments.filter(c => c.filterStatus === 'Reported').length;

  return (
    <div className="p-2 md:p-2 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Quản lý bình luận</h1>
      </div>

      {/* Tabs & Right Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 mb-8 gap-4">
        <div className="flex overflow-x-auto scrollbar-hide gap-8">
          <button onClick={() => setActiveTab('all')} className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4" /> Tất cả bình luận
          </button>
          <button onClick={() => setActiveTab('pending')} className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <Clock className="w-4 h-4" /> Chờ duyệt
          </button>
          <button onClick={() => setActiveTab('approved')} className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'approved' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <CheckCircle className="w-4 h-4" /> Đã duyệt
          </button>
          <button onClick={() => setActiveTab('rejected')} className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rejected' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <XCircle className="w-4 h-4" /> Bị từ chối / Ẩn
          </button>
          <button onClick={() => setActiveTab('reported')} className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reported' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <Flag className="w-4 h-4" /> Báo cáo
          </button>
        </div>
        <div className="pb-3 flex-shrink-0">
          <button className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium cursor-pointer">
            <ShieldBan className="w-4 h-4" /> Từ khóa bị cấm
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tổng bình luận</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{totalComments.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <LucideIcons.TrendingUp className="w-3 h-3" /> 12.5% <span className="text-gray-500">so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Đã duyệt</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{approvedCount.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <LucideIcons.TrendingUp className="w-3 h-3" /> 8.7% <span className="text-gray-500">so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chờ duyệt</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{pendingCount.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <LucideIcons.TrendingUp className="w-3 h-3" /> 3.2% <span className="text-gray-500">so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldBan className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bị từ chối / Ẩn</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{rejectedCount.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-red-400 font-medium">
                  <LucideIcons.TrendingDown className="w-3 h-3" /> 4.1% <span className="text-gray-500">so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Flag className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Báo cáo</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{reportedCount.toLocaleString()}</h3>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                  <LucideIcons.TrendingUp className="w-3 h-3" /> 10.3% <span className="text-gray-500">so với tuần trước</span>
                </div>
              </div>
            </div>
          </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input type="text" placeholder="Tìm kiếm bình luận, tên video, người dùng..." className="w-full bg-bg-[#0F0F0F] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            </div>
            
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              <div className="relative shrink-0">
                <select className="appearance-none bg-bg-[#0F0F0F] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer">
                  <option>Tất cả video</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <div className="relative shrink-0">
                <select className="appearance-none bg-bg-[#0F0F0F] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer">
                  <option>Tất cả trạng thái</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <div className="relative shrink-0">
                <select className="appearance-none bg-bg-[#0F0F0F] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer">
                  <option>Tất cả thời gian</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <button className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-bg-[#0F0F0F] hover:bg-[#1C1C24] border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-colors cursor-pointer">
                <LucideIcons.RotateCcw className="w-4 h-4" /> Làm mới
              </button>
            </div>

            <button className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-bg-[#0F0F0F] hover:bg-[#1C1C24] border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-colors md:ml-auto cursor-pointer">
              <Filter className="w-4 h-4" /> Bộ lọc nâng cao
            </button>
          </div>

      <div className="flex flex-col xl:flex-row gap-3 items-stretch">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          {/* Main Table */}
          <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1">
            <div className="w-full">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-[#1C1C24]/50 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    <th className="px-5 py-4 w-10">
                      <input type="checkbox" className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-600/50 cursor-pointer" />
                    </th>
                    <th className="px-4 py-4 w-[30%]">BÌNH LUẬN</th>
                    <th className="px-4 py-4 w-[20%]">VIDEO</th>
                    <th className="px-4 py-4">NGƯỜI DÙNG</th>
                    <th className="px-4 py-4 text-center">TRẠNG THÁI</th>
                    <th className="px-4 py-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingComments ? (
                    <tr><td colSpan="6" className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500"/></td></tr>
                  ) : currentItems.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-12 text-gray-500">Chưa có bình luận nào.</td></tr>
                  ) : currentItems.map(c => {
                    const dateObj = new Date(c.createdAt);
                    const dateStr = dateObj.toLocaleDateString('vi-VN');
                    const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-2">
                          <input type="checkbox" className="rounded border-white/20 bg-transparent text-purple-600 focus:ring-purple-600/50 cursor-pointer" />
                        </td>
                        <td className="px-1 py-2">
                          <div className="text-gray-200 text-[11px] mb-2 max-w-[280px] break-words line-clamp-2">
                            {c.displayContent || c.content}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <span className="flex items-center gap-1"><LucideIcons.ThumbsUp className="w-3.5 h-3.5" /> 0</span>
                            <span className="flex items-center gap-1"><LucideIcons.MessageCircle className="w-3.5 h-3.5" /> Trả lời (0)</span>
                            {(c.filterStatus === 'Filtered' || c.filterStatus === 'Blocked') && (
                              <span className="flex items-center gap-1 text-red-400 px-0 py-0 rounded"><ShieldAlert className="w-3 h-3" /> Bị báo cáo</span>
                            )}
                          </div>
                        </td>
                        <td className="px-1 py-1">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-800 relative">
                              {c.videoThumbnail ? (
                                <img src={c.videoThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-purple-900/40 flex items-center justify-center text-purple-500"><LucideIcons.Video className="w-4 h-4"/></div>
                              )}
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-medium">10:15</div>
                            </div>
                            <div className="text-[10px] font-semibold text-gray-300 line-clamp-2 max-w-[200px]">
                              {c.videoTitle}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-800">
                              {c.userAvatar ? (
                                <img src={c.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                  {c.userName ? c.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold text-gray-200">{c.userName}</div>
                              <div className="text-[11px] text-gray-500">@{c.userEmail?.split('@')[0]}</div>
                            </div>
                            <div className="ml-2 text-right">
                              <div className="text-xs text-gray-400">{dateStr}</div>
                              <div className="text-[11px] text-gray-600">{timeStr}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-1 py-1 text-center">
                          {c.filterStatus === 'Normal' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-400 bg-emerald-500/10">
                              Đã duyệt
                            </span>
                          )}
                          {c.filterStatus === 'Warning' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-yellow-400 bg-yellow-500/10">
                              Chờ duyệt
                            </span>
                          )}
                          {(c.filterStatus === 'Filtered' || c.filterStatus === 'Blocked') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-red-400 bg-red-500/10">
                              Bị từ chối
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                              <Flag className="w-4 h-4" />
                            </button>
                            <div className="relative group/menu">
                              <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                                <LucideIcons.MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-32 bg-[#1C1C24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                                <button onClick={() => handleDeleteComment(c.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-white/5 flex items-center gap-2 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa bình luận
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm mt-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-1.5 bg-bg-[#0F0F0F]">
                  <span className="text-gray-500 text-xs">Hiển thị</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none cursor-pointer pr-2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xs hidden sm:block">Hiển thị {filteredComments.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredComments.length)} trong tổng số {filteredComments.length} bình luận</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
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
                          className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm cursor-pointer ${
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
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Banned Keywords Sidebar */}
        <div className="w-full xl:w-[380px] shrink-0 h-full">
          <div className="bg-bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Từ khóa bị cấm <LucideIcons.Sparkles className="w-4 h-4 text-gray-500" />
              </h2>
              <button className="text-gray-500 hover:text-white transition-colors cursor-pointer"><Settings className="w-4 h-4" /></button>
            </div>
            
            <div className="p-4 border-b border-white/5 flex gap-2">
              <div className="relative flex-1">
                <input type="text" placeholder="Tìm kiếm..." className="w-full bg-[#1C1C24] border border-white/5 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors" />
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              </div>
              <button onClick={openAddKeywordModal} className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-[#FF5722]/20 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Thêm từ khóa
              </button>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-gray-500 font-semibold sticky top-0 bg-bg-[#0F0F0F] z-10">
                    <th className="px-4 py-3 w-[35%]">TỪ KHÓA</th>
                    <th className="px-4 py-3 text-center">MỨC ĐỘ</th>
                    <th className="px-4 py-3 text-center">TRẠNG THÁI</th>
                    <th className="px-4 py-3 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingKeywords ? (
                    <tr><td colSpan="4" className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-500"/></td></tr>
                  ) : keywords.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">Chưa có từ khóa</td></tr>
                  ) : keywords.slice(0, 10).map(kw => (
                    <tr key={kw.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-1 font-medium text-gray-200 truncate max-w-[100px]">{kw.keyword}</td>
                      <td className=" text-center">
                        <span className={`font-semibold ${kw.level === 'High' ? 'text-red-400' : kw.level === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {kw.level === 'High' ? 'Cao' : kw.level === 'Medium' ? 'Trung bình' : 'Thấp'}
                        </span>
                      </td>
                      <td className="px-1 py-1 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${kw.isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {kw.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditKeywordModal(kw)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteKeyword(kw.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#1C1C24]/30">
              <button className="w-full py-2.5 rounded-xl bg-[#1C1C24] hover:bg-white/5 border border-white/5 text-sm font-medium text-gray-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                Xem tất cả từ khóa <LucideIcons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1C1C24] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">{modalMode === 'add' ? 'Thêm Từ khóa' : 'Chỉnh sửa Từ khóa'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Từ khóa bị cấm <span className="text-red-500">*</span></label>
                <input type="text" value={currentKeyword.keyword} onChange={(e) => setCurrentKeyword({...currentKeyword, keyword: e.target.value})}
                  className="w-full bg-bg-[#0F0F0F] text-white text-sm rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500 focus:outline-none" 
                  placeholder="Nhập từ khóa..." autoFocus />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Mức độ xử lý</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map(level => (
                    <button key={level} onClick={() => setCurrentKeyword({...currentKeyword, level})}
                      className={`py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                        currentKeyword.level === level 
                        ? (level === 'High' ? 'bg-red-500/20 border-red-500/50 text-red-400' : level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400')
                        : 'bg-bg-[#0F0F0F] border-transparent text-gray-400 hover:bg-white/5'
                      }`}>
                      {level === 'Low' ? 'Thấp' : level === 'Medium' ? 'Trung bình' : 'Cao'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Trạng thái</label>
                <select value={currentKeyword.isActive} onChange={(e) => setCurrentKeyword({...currentKeyword, isActive: e.target.value === 'true'})}
                  className="w-full bg-bg-[#0F0F0F] text-white text-sm rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500 focus:outline-none appearance-none cursor-pointer">
                  <option value="true">Đang Bật (Hoạt động)</option>
                  <option value="false">Đã Tắt (Tạm ngưng)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Ghi chú (Tùy chọn)</label>
                <input type="text" value={currentKeyword.description || ''} onChange={(e) => setCurrentKeyword({...currentKeyword, description: e.target.value})}
                  className="w-full bg-bg-[#0F0F0F] text-white text-sm rounded-xl px-4 py-3 border border-white/5 focus:border-purple-500 focus:outline-none" 
                  placeholder="Lý do cấm từ khóa này..." />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10 bg-bg-[#0F0F0F] rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">Hủy</button>
              <button onClick={handleSaveKeyword} disabled={isSaving || !currentKeyword.keyword.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-500/20 cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Lưu Từ khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComments;

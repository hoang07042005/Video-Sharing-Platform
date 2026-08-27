import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  Folder,
  FilterX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const mockChartData = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 40 }, { value: 20 }, { value: 50 }, { value: 30 }
];

const MiniChart = ({ color }) => (
  <div className="absolute right-0 bottom-0 w-32 h-16 opacity-50">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={mockChartData}>
        <Area type="monotone" dataKey="value" stroke={color} fill="transparent" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    orderIndex: 0,
    isActive: true,
    category: "Chung",
  });

  const fetchFaqs = async () => {
    try {
      const res = await axios.get("/api/faqs/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setFaqs(res.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openModal = (faq = null) => {
    if (faq) {
      setEditingId(faq.id);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        orderIndex: faq.orderIndex,
        isActive: faq.isActive,
        category: faq.category || "Chung",
      });
    } else {
      setEditingId(null);
      setFormData({
        question: "",
        answer: "",
        orderIndex: faqs.length > 0 ? Math.max(...faqs.map(f => f.orderIndex)) + 1 : 0,
        isActive: true,
        category: "Chung",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`/api/faqs/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Cập nhật FAQ thành công");
      } else {
        await axios.post("/api/faqs", formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Thêm FAQ thành công");
      }
      closeModal();
      fetchFaqs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá FAQ này?")) return;
    try {
      await axios.delete(`/api/faqs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Đã xoá FAQ");
      fetchFaqs();
    } catch (error) {
      toast.error("Lỗi khi xoá FAQ");
    }
  };

  const moveOrder = async (faqToMove, direction) => {
    const sortedFaqs = [...faqs].sort((a, b) => a.orderIndex - b.orderIndex);
    const index = sortedFaqs.findIndex(f => f.id === faqToMove.id);
    
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sortedFaqs.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    const tempOrder = sortedFaqs[index].orderIndex;
    sortedFaqs[index].orderIndex = sortedFaqs[targetIndex].orderIndex;
    sortedFaqs[targetIndex].orderIndex = tempOrder;

    try {
      await Promise.all([
        axios.put(`/api/faqs/${sortedFaqs[index].id}`, sortedFaqs[index], {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.put(`/api/faqs/${sortedFaqs[targetIndex].id}`, sortedFaqs[targetIndex], {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      fetchFaqs();
    } catch (error) {
      toast.error("Lỗi khi thay đổi thứ tự");
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

  // Derived state
  const categories = [...new Set(faqs.map(f => f.category || "Chung"))].filter(Boolean);
  const activeCount = faqs.filter(f => f.isActive).length;
  const inactiveCount = faqs.filter(f => !f.isActive).length;

  const sortedFaqs = [...faqs].sort((a, b) => a.orderIndex - b.orderIndex);
  const filteredFaqs = sortedFaqs.filter((f) => {
    const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || (f.category || "Chung") === filterCategory;
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? f.isActive : !f.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage) || 1;
  const currentItems = filteredFaqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")}\n${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Helper for category badge colors
  const getCategoryColor = (category) => {
    const colors = {
      "Tài khoản": "bg-purple-500/10 text-purple-400",
      "Video": "bg-blue-500/10 text-blue-400",
      "Báo cáo": "bg-orange-500/10 text-orange-400",
      "Quyền riêng tư": "bg-pink-500/10 text-pink-400",
      "Kiếm tiền": "bg-emerald-500/10 text-emerald-400",
      "Chính sách": "bg-indigo-500/10 text-indigo-400"
    };
    return colors[category] || "bg-gray-500/10 text-gray-400";
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
            <HelpCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Quản lý FAQs</h1>
            <p className="text-gray-400 text-sm">
              Tạo, chỉnh sửa và quản lý các câu hỏi thường gặp
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#FF5722]/20"
        >
          <Plus className="w-4 h-4" /> Thêm FAQ mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <HelpCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tổng FAQ</p>
              <h3 className="text-2xl font-bold text-white">{faqs.length}</h3>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Tất cả câu hỏi</p>
          <MiniChart color="#A855F7" />
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Đang hiển thị</p>
              <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Đã công khai</p>
          <MiniChart color="#10B981" />
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <XCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Đang ẩn</p>
              <h3 className="text-2xl font-bold text-white">{inactiveCount}</h3>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Đang ẩn</p>
          <MiniChart color="#F97316" />
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Categories</p>
              <h3 className="text-2xl font-bold text-white">{categories.length}</h3>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Danh mục</p>
          <MiniChart color="#3B82F6" />
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
        <div className="flex items-center gap-3 w-full">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141418] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-[#141418] border border-white/10 text-gray-300 text-sm rounded-xl pl-10 pr-8 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <Folder className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-[#141418] border border-white/10 text-gray-300 text-sm rounded-xl pl-10 pr-8 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hiển thị</option>
              <option value="inactive">Đang ẩn</option>
            </select>
            <CheckCircle className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>

          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141418] border border-white/10 text-gray-300 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            <FilterX className="w-4 h-4" /> Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider w-16 text-center">#</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider w-[35%]">CÂU HỎI</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider text-center">DANH MỤC</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider text-center">TRẠNG THÁI</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider text-center">SẮP XẾP</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider text-center">CẬP NHẬT</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-[10px] uppercase tracking-wider text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF5722]" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    Không tìm thấy FAQ nào.
                  </td>
                </tr>
              ) : (
                currentItems.map((faq, index) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + index;
                  return (
                  <tr key={faq.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-[#A855F7] font-semibold text-center text-sm">
                      {(actualIndex + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm mb-1">{faq.question}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{faq.answer}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-medium ${getCategoryColor(faq.category || "Chung")}`}>
                        {faq.category || "Chung"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {faq.isActive ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Hiển thị
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 text-[10px] font-medium border border-orange-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Ẩn
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#1a1a1f] p-1 rounded-md border border-white/5">
                        <button
                          onClick={() => moveOrder(faq, "up")}
                          className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3 text-gray-400" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">
                          {faq.orderIndex}
                        </span>
                        <button
                          onClick={() => moveOrder(faq, "down")}
                          className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-[11px] text-gray-400 whitespace-pre-line">
                      {formatDate(faq.updatedAt || faq.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(faq)}
                          className="p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-md transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#141418]">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#1a1a1f] border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-[#FF5722]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>mục</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                  currentPage === page 
                    ? "bg-purple-500 text-white" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredFaqs.length)} của {filteredFaqs.length} FAQs
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141418] border border-white/5 rounded-1xl w-full h-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Cập nhật FAQ" : "Thêm FAQ mới"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Câu hỏi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
                    placeholder="VD: Làm sao để rút tiền?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Câu trả lời <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    rows={4}
                    className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors resize-none"
                    placeholder="Nội dung câu trả lời..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="Chung">Chung</option>
                    <option value="Tài khoản">Tài khoản</option>
                    <option value="Video">Video</option>
                    <option value="Báo cáo">Báo cáo</option>
                    <option value="Quyền riêng tư">Quyền riêng tư</option>
                    <option value="Kiếm tiền">Kiếm tiền</option>
                    <option value="Chính sách">Chính sách</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      value={formData.orderIndex}
                      onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex-1 flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-transparent text-[#FF5722] focus:ring-[#FF5722]/50 cursor-pointer"
                      />
                      <span className="text-sm text-gray-300">
                        Hiển thị
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-white/5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#FF5722]/20 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

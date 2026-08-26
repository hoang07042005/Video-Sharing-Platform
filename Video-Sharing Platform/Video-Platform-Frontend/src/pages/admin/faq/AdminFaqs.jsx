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
  MoveUp,
  MoveDown,
} from "lucide-react";

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    orderIndex: 0,
    isActive: true,
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
      });
    } else {
      setEditingId(null);
      setFormData({
        question: "",
        answer: "",
        orderIndex: faqs.length,
        isActive: true,
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

  const moveOrder = async (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === faqs.length - 1) return;

    const newFaqs = [...faqs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap orderIndex
    const tempOrder = newFaqs[index].orderIndex;
    newFaqs[index].orderIndex = newFaqs[targetIndex].orderIndex;
    newFaqs[targetIndex].orderIndex = tempOrder;

    // Call API for both
    try {
      await Promise.all([
        axios.put(`/api/faqs/${newFaqs[index].id}`, newFaqs[index], {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.put(`/api/faqs/${newFaqs[targetIndex].id}`, newFaqs[targetIndex], {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      fetchFaqs();
    } catch (error) {
      toast.error("Lỗi khi thay đổi thứ tự");
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = faqs.filter(f => f.isActive).length;
  const inactiveCount = faqs.filter(f => !f.isActive).length;

  return (
    <div className="p-2 md:p-2 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Quản lý FAQs
          </h1>
          <p className="text-gray-400 text-sm">
            Tạo, chỉnh sửa và quản lý các câu hỏi thường gặp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#CE1414FA] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-[#FF5722]/20"
          >
            <Plus className="w-4 h-4" /> Thêm FAQ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
            <HelpCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
              Tổng FAQ
            </p>
            <h3 className="text-2xl font-bold text-white">
              {faqs.length}
            </h3>
            <p className="text-gray-500 text-xs mt-1">Tất cả câu hỏi</p>
          </div>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
              Đang hiển thị
            </p>
            <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
            <p className="text-gray-500 text-xs mt-1">FAQ đang hiển thị</p>
          </div>
        </div>

        <div className="bg-[#141418] border border-white/5 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
            <XCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
              Đang ẩn
            </p>
            <h3 className="text-2xl font-bold text-white">{inactiveCount}</h3>
            <p className="text-gray-500 text-xs mt-1">FAQ bị ẩn</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141418] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider w-16 text-center">
                  #
                </th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">
                  Câu hỏi & Trả lời
                </th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-center">
                  Sắp xếp
                </th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-center">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF5722]" />
                  </td>
                </tr>
              ) : filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    Chưa có FAQ nào.
                  </td>
                </tr>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <tr
                    key={faq.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-4 py-4 text-gray-500 font-medium text-center">
                      {(index + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm mb-1 line-clamp-1">
                        {faq.question}
                      </div>
                      <div className="text-xs text-gray-400 max-w-[400px] truncate">
                        {faq.answer}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#1a1a1f] p-1 rounded-md border border-white/5">
                        <button
                          onClick={() => moveOrder(index, "up")}
                          disabled={index === 0}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <MoveUp className="w-3 h-3 text-gray-400" />
                        </button>
                        <span className="text-xs font-bold text-white px-2">
                          {faq.orderIndex}
                        </span>
                        <button
                          onClick={() => moveOrder(index, "down")}
                          disabled={index === faqs.length - 1}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <MoveDown className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {faq.isActive ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>{" "}
                          Hiển thị
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>{" "}
                          Ẩn
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(faq)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#141418] border border-white/5 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
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
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    rows={4}
                    className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors resize-none"
                    placeholder="Nội dung câu trả lời..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Thứ tự
                    </label>
                    <input
                      type="number"
                      value={formData.orderIndex}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orderIndex: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#1a1a1f] border border-white/5 text-white text-sm rounded-xl px-4 py-2.5 focus:border-[#FF5722] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex-1 flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
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
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
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

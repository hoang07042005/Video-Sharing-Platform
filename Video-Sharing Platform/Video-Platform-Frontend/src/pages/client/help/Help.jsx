import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  PlayCircle,
  DollarSign,
  Wallet,
  ShieldAlert,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  CloudUpload,
  Loader2,
  Users,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const categories = [
  {
    id: "account",
    icon: User,
    title: "Tài khoản & Bảo mật",
    subtitle: "Đăng nhập, bảo mật, xác minh...",
    color: "bg-[#9333ea]",
  },
  {
    id: "video",
    icon: PlayCircle,
    title: "Video & Nội dung",
    subtitle: "Tải lên, xử lý, định dạng...",
    color: "bg-[#ef4444]",
  },
  {
    id: "payment",
    icon: DollarSign,
    title: "Thanh toán & Nạp tiền",
    subtitle: "Nạp xu, thanh toán, hóa đơn...",
    color: "bg-[#22c55e]",
  },
  {
    id: "revenue",
    icon: Wallet,
    title: "Rút tiền & Doanh thu",
    subtitle: "Rút tiền, doanh thu, thuế...",
    color: "bg-[#f59e0b]",
  },
  {
    id: "copyright",
    icon: ShieldAlert,
    title: "Bản quyền & Vi phạm",
    subtitle: "Báo cáo, khiếu nại, vi phạm...",
    color: "bg-[#3b82f6]",
  },
  {
    id: "technical",
    icon: Settings,
    title: "Lỗi kỹ thuật",
    subtitle: "Lỗi hệ thống, không tải được...",
    color: "bg-[#8b5cf6]",
  },
];

export default function Help() {
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    axios
      .get("/api/faqs")
      .then((res) => setFaqs(res.data))
      .catch((err) => console.error("Lỗi khi tải FAQs:", err));
  }, []);

  const [siteConfig, setSiteConfig] = useState({
    contactEmail: "support@videosharing.vn",
    supportPhone: "1900 1234",
  });

  useEffect(() => {
    axios
      .get("/api/admin/settings/public")
      .then((res) => {
        if (res.data) {
          setSiteConfig((prev) => ({
            ...prev,
            contactEmail: res.data.contactEmail || prev.contactEmail,
            supportPhone: res.data.supportPhone || prev.supportPhone,
          }));
        }
      })
      .catch((err) => console.error("Lỗi lấy cấu hình public", err));
  }, []);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const feedbackFormRef = useRef(null);
  
  const [formData, setFormData] = useState({
    type: "technical",
    content: "",
    attachments: [],
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.attachments.length + files.length > 5) {
      toast.error("Bạn chỉ được tải lên tối đa 5 ảnh.");
      return;
    }

    setUploadingImage(true);
    let newAttachments = [...formData.attachments];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá 5MB`);
        continue;
      }
      
      const formPayload = new FormData();
      formPayload.append("file", file);

      try {
        const response = await axios.post("/api/upload/image", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newAttachments.push(response.data.url);
      } catch (err) {
        toast.error(`Lỗi khi tải ảnh ${file.name} lên.`);
      }
    }

    setFormData({ ...formData, attachments: newAttachments });
    setUploadingImage(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleCategoryClick = (categoryId) => {
    setFormData({ ...formData, type: categoryId });
    feedbackFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập chi tiết vấn đề");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        content: formData.content,
        attachmentUrl: formData.attachments.length > 0 ? JSON.stringify(formData.attachments) : null
      };
      
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/feedback", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message || "Gửi yêu cầu hỗ trợ thành công!");
      setFormData({
        type: "technical",
        content: "",
        attachments: [],
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] min-h-screen text-gray-200 font-sans pb-20">
      {/* Hero Section */}
      <div className="relative w-full bg-[#111116] border-b border-white/5 py-16 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left Content */}
          <div className="w-full md:w-[60%] z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-orange-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Trung tâm hỗ trợ
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
              Xin chào!
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Chúng tôi có thể giúp gì cho bạn?
            </h2>
            <p className="text-gray-400 text-[15px] mb-8 max-w-xl">
              Bạn gặp vấn đề hoặc cần hỗ trợ? Hãy tìm câu trả lời nhanh chóng
              hoặc gửi yêu cầu cho chúng tôi.
            </p>

            <div className="relative w-full max-w-2xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập từ khóa câu hỏi của bạn..."
                className="w-full bg-[#18181c] border border-white/10 rounded-xl py-4 pl-12 pr-28 text-white text-[15px] focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-colors cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6 text-sm">
              <span className="text-gray-500">Gợi ý tìm kiếm:</span>
              {["rút tiền", "lỗi video", "bản quyền", "tài khoản", "VIP"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-4 py-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Right Content - 3D Bubbles Illustration (Simulated with CSS) */}
          <div className="hidden md:flex w-full md:w-[40%] justify-center relative h-64 z-10">
            <div className="absolute right-10 top-0 w-32 h-24 bg-pink-500/90 rounded-[2rem] rounded-br-sm shadow-[0_20px_50px_rgba(236,72,153,0.3)] animate-[bounce_4s_infinite_alternate] flex items-center justify-center border-t border-l border-white/20 backdrop-blur-sm -rotate-6">
              <div className="w-8 h-8 flex gap-1 items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <div className="w-2 h-2 rounded-full bg-white/80" />
              </div>
            </div>
            <div className="absolute right-32 top-20 w-40 h-32 bg-blue-600/90 rounded-[2.5rem] rounded-bl-sm shadow-[0_20px_50px_rgba(37,99,235,0.3)] animate-[bounce_5s_infinite_alternate] flex flex-col gap-2 items-center justify-center border-t border-l border-white/20 backdrop-blur-sm rotate-3">
              <div className="w-16 h-2 rounded-full bg-white/40" />
              <div className="w-10 h-2 rounded-full bg-white/40 -ml-6" />
            </div>
            {/* Small floating orbs */}
            <div className="absolute top-4 right-1/2 w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-pulse" />
            <div className="absolute bottom-8 right-16 w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.8)] animate-ping" />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 mt-12">
        {/* Categories Grid */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-white mb-1">Danh mục hỗ trợ</h2>
          <p className="text-sm text-gray-500 mb-6">
            Chọn danh mục phù hợp để tìm kiếm câu trả lời nhanh hơn
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => handleCategoryClick(cat.id)}
                className="bg-[#141417] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.color} shadow-lg shadow-black/50`}
                >
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-200 text-[15px] truncate">
                    {cat.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 truncate mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20">
          {/* Left Column - 65% */}
          <div className="w-full lg:w-[65%] flex flex-col gap-10">
            {/* FAQs */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Câu hỏi thường gặp
                  </h2>
                  <p className="text-sm text-gray-500">
                    Những câu hỏi phổ biến nhất từ cộng đồng
                  </p>
                </div>
                <button className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer">
                  Xem tất cả câu hỏi <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-[#141417] border border-white/5 rounded-xl overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-white/[0.02]"
                      >
                        <span
                          className={`font-semibold text-[15px] pr-8 ${openFaq === idx ? "text-white" : "text-gray-300"}`}
                        >
                          {faq.question}
                        </span>
                        {openFaq === idx ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                        )}
                      </button>

                      <div
                        className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <p className="text-gray-400 text-[14px] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#141417] border border-white/5 rounded-xl p-8 text-center">
                    <p className="text-gray-400">
                      Không tìm thấy câu hỏi phù hợp với "{searchQuery}"
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Vui lòng thử từ khóa khác hoặc gửi yêu cầu hỗ trợ bên
                      dưới.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Support Form */}
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Gửi yêu cầu hỗ trợ
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Không tìm thấy câu trả lời? Hãy gửi yêu cầu cho chúng tôi. Đội
                ngũ hỗ trợ sẽ phản hồi sớm nhất.
              </p>

            <div className="bg-[#141417] border border-white/5 rounded-2xl p-1" ref={feedbackFormRef}>
              <form
                onSubmit={handleFeedbackSubmit}
                className="bg-[#141417] rounded-2xl p-6 md:p-8"
              >
                <div className="mb-6">
                  {/* Category Select */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-400 mb-2">
                      Phân loại vấn đề <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Content Textarea */}
                <div className="mb-6">
                  <label className="block text-[13px] font-medium text-gray-400 mb-2">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                      className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-purple-500/50 min-h-[140px] resize-none pb-8"
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-gray-600">
                      {formData.content.length}/2000
                    </span>
                  </div>
                </div>

                {/* Attachment */}
                <div className="mb-8">
                  <label className="block text-[13px] font-medium text-gray-400 mb-2">
                    Đính kèm hình ảnh (tùy chọn, tối đa 5 ảnh)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  {formData.attachments.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {formData.attachments.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-[#0a0a0c]">
                            <img
                              src={url}
                              alt={`Đính kèm ${idx + 1}`}
                              className="w-full h-full object-cover p-1"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                title="Xóa ảnh này"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {formData.attachments.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border border-dashed border-white/20 hover:border-purple-500/50 bg-[#0a0a0c] rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : (
                            <CloudUpload className="w-5 h-5 text-blue-400" />
                          )}
                          <span className="text-xs text-gray-400">Thêm ảnh khác</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-white/20 hover:border-purple-500/50 bg-[#0a0a0c] rounded-xl py-8 flex items-center justify-center gap-6 transition-colors cursor-pointer group disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1c2333] flex items-center justify-center shrink-0">
                        {uploadingImage ? (
                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        ) : (
                          <CloudUpload className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-300 font-medium mb-2">
                          Kéo thả hình ảnh vào đây hoặc:
                        </p>
                        <button
                          type="button"
                          className="bg-white/10 text-gray-200 px-4 py-1.5 rounded-lg hover:bg-white/20 transition-colors text-xs font-medium cursor-pointer pointer-events-none"
                        >
                          Chọn file
                        </button>
                        <p className="text-gray-600 text-[11px] mt-3">
                          Hỗ trợ: JPG, PNG, GIF (tối đa 5MB mỗi file)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 -rotate-45 mb-1" />
                    )}
                    GỬI YÊU CẦU HỖ TRỢ
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>

          {/* Right Column - 35% */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            {/* Contact Info */}
            <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">
                Thông tin hỗ trợ
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Hãy liên hệ qua các
                kênh dưới đây nếu cần hỗ trợ khẩn cấp.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-200">
                      Email hỗ trợ
                    </h3>
                    <p className="text-[13px] text-blue-400 font-medium">
                      {siteConfig.contactEmail}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Phản hồi trong 24h
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-200">
                      Trò chuyện trực tuyến
                    </h3>
                    <p className="text-[13px] text-gray-400">
                      Chat với nhân viên hỗ trợ
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Thời gian: 8:00 - 22:00
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-200">
                      Hotline
                    </h3>
                    <p className="text-[13px] text-gray-400">
                      {siteConfig.supportPhone}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      Thời gian: 8:00 - 22:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Banner */}
            <div className="bg-gradient-to-br from-[#2a1354] to-[#1a0f35] border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 blur-[50px] rounded-full pointer-events-none" />
              <h2 className="text-lg font-bold text-white mb-2 relative z-10">
                Cộng đồng VideoSharing
              </h2>
              <p className="text-[13px] text-purple-200/80 mb-6 leading-relaxed relative z-10">
                Tham gia cộng đồng để nhận hỗ trợ nhanh hơn từ người dùng khác.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer relative z-10 shadow-lg shadow-blue-900/50">
                <Users className="w-4 h-4" />
                Tham gia ngay
              </button>
            </div>

            {/* Tips */}
            <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <h2 className="text-[15px] font-bold text-white">Mẹo nhỏ</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    Mô tả chi tiết vấn đề để được hỗ trợ nhanh hơn
                  </p>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    Đính kèm hình ảnh giúp chúng tôi hiểu rõ hơn
                  </p>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    Kiểm tra câu hỏi thường gặp trước khi gửi
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

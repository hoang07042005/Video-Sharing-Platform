import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle, FileText, AlertTriangle } from 'lucide-react';

const faqs = [
  {
    question: "Làm thế nào để tạo kênh mới?",
    answer: "Để tạo kênh mới, hãy truy cập vào menu Cài đặt > Thông tin tài khoản và cập nhật 'Tên kênh' cũng như 'Mã định danh' của bạn. Kênh của bạn sẽ tự động được tạo."
  },
  {
    question: "Tôi có thể kiếm tiền từ video không?",
    answer: "Có, bạn có thể tham gia Chương trình đối tác khi đạt đủ điều kiện về số người đăng ký và giờ xem công khai. Bạn cũng có thể bật tính năng Hội viên kênh."
  },
  {
    question: "Cách báo cáo một video vi phạm?",
    answer: "Dưới mỗi video có biểu tượng Cờ (Báo cáo). Bạn nhấp vào đó và chọn lý do phù hợp để gửi báo cáo cho đội ngũ kiểm duyệt."
  },
  {
    question: "Thay đổi mật khẩu ở đâu?",
    answer: "Truy cập Cài đặt > Bảo mật để thay đổi mật khẩu của bạn. Bạn cần nhớ mật khẩu cũ để thực hiện thao tác này."
  }
];

const categories = [
  { id: 'general', name: 'Chung', icon: HelpCircle },
  { id: 'account', name: 'Tài khoản', icon: FileText },
  { id: 'monetization', name: 'Kiếm tiền', icon: MessageCircle },
  { id: 'policy', name: 'Chính sách', icon: AlertTriangle },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#1F1F1F] to-[#0F0F0F] px-4 py-16 text-center border-b border-white/5">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Chúng tôi có thể giúp gì cho bạn?</h1>
        <div className="max-w-2xl mx-auto relative mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Mô tả vấn đề của bạn..." 
            className="w-full bg-[#202020] border border-white/10 rounded-full py-4 pl-12 pr-6 text-white text-lg focus:outline-none focus:border-[#FF5722] transition-colors shadow-lg"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {categories.map(cat => (
            <button key={cat.id} className="flex flex-col items-center gap-3 p-6 bg-[#161616] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-[#FF5722]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <cat.icon className="w-6 h-6 text-[#FF5722]" />
              </div>
              <span className="text-sm font-medium text-white">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold text-white mb-8">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="font-medium text-white text-lg">{faq.question}</span>
                {openFaq === idx ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              <div className={`px-6 pb-6 text-gray-400 leading-relaxed ${openFaq === idx ? 'block' : 'hidden'}`}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 bg-gradient-to-r from-[#FF5722]/10 to-transparent border border-[#FF5722]/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Vẫn cần sự trợ giúp?</h3>
            <p className="text-gray-400">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng lắng nghe và giải đáp.</p>
          </div>
          <button className="bg-[#FF5722] hover:bg-[#F4511E] text-white font-medium px-8 py-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-[#FF5722]/20">
            Liên hệ hỗ trợ
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Shield, FileText, Users, Copyright, DollarSign, ChevronRight, Menu, X, 
  AlertTriangle, CheckCircle, Info, Lock, Eye, Ban, Scale, UploadCloud, 
  HelpCircle, CreditCard, Activity, Target, Settings, Globe, Copy, Tag, Clock,
  Database, ChevronUp, ChevronDown, Star, BarChart2, Share2, Briefcase, 
  UserCheck, User, Download, Trash2, ThumbsUp, ThumbsDown,
  Monitor, Plane, Heart, ShieldAlert, Frown, Megaphone, Mail, ClipboardList, UserX, Flag, MessageSquare, Book, Smile, PlayCircle, RefreshCw, Film
} from 'lucide-react';

const GlobeIcon = () => <Globe className="w-5 h-5" />;
const CopyrightIcon = () => <Copyright className="w-5 h-5" />;
const TagIcon = () => <Tag className="w-5 h-5" />;
const ClockIcon = () => <Clock className="w-5 h-5" />;

// Reusable component for policy sections
const PolicySection = ({ title, icon: Icon, index, children, highlightClass = "from-purple-500 to-blue-500", iconClass = "text-purple-400 bg-purple-500/10" }) => (
  <div className="bg-[#1C1C1C] rounded-1xl p-6 md:p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
    <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${highlightClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        {Icon ? <Icon className="w-6 h-6" /> : <span className="text-xl font-black">{index}</span>}
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-white m-0">{title}</h3>
    </div>
    <div className="text-gray-400 text-sm md:text-base leading-relaxed space-y-4">
      {children}
    </div>
  </div>
);

export default function Policies() {
  const [activeTab, setActiveTab] = useState('tos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const policies = [
    {
      id: 'tos',
      title: 'Điều khoản dịch vụ',
      icon: FileText,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 ease-out font-sans">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-400" />
              Điều khoản dịch vụ
            </h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Cập nhật lần cuối: 08/05/2025
            </div>
          </div>

          {/* Banner */}
          <div 
            className="relative rounded-1xl p-8 md:p-10 flex items-center border border-white/5 overflow-hidden mb-8 min-h-[200px] shadow-lg bg-[#18181B]"
          >
            {/* Background Image - Bạn thay đổi đường dẫn ảnh ở thuộc tính src bên dưới nhé */}
            <img 
              src="./Điều khoản dịch vụ (2).png" 
              alt="Policy Banner Background" 
              className="absolute inset-0 w-full" 
            />

            
            {/* Content on top */}
            <div className="relative z-10 w-full max-w-4xl pl-70">
              <p className="text-white leading-relaxed text-base md:text-lg font-medium">
                Vui lòng đọc kỹ các Điều khoản Dịch vụ này trước khi sử dụng nền tảng của chúng tôi. Bằng việc truy cập hoặc sử dụng dịch vụ, bạn đồng ý chịu sự ràng buộc của các điều khoản này.
              </p>
            </div>
          </div>

          {/* Sections Container */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg flex flex-col divide-y divide-white/5">
            
            {/* Section 1 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <svg className="w-6 h-6 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">1. Chấp nhận điều khoản</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4">
                    Khi bạn tạo tài khoản, tải lên video, hoặc sử dụng bất kỳ tính năng nào của nền tảng chia sẻ video của chúng tôi (gọi chung là "Dịch vụ"), bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với các Điều khoản Dịch vụ này cũng như Chính sách Quyền riêng tư của chúng tôi.
                  </p>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Nếu bạn đại diện cho một tổ chức, bạn xác nhận rằng bạn có đủ thẩm quyền để ràng buộc tổ chức đó với các điều khoản này.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-pink-900 to-rose-900 flex items-center justify-center shrink-0 border border-pink-500/20 shadow-inner">
                  <Lock className="w-6 h-6 text-pink-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">2. Tài khoản và Bảo mật</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                        <strong className="text-gray-200">Độ tuổi:</strong> Bạn phải đủ 13 tuổi trở lên để sử dụng Dịch vụ. Nếu bạn dưới 18 tuổi, cần có sự cho phép của cha mẹ hoặc người giám hộ hợp pháp.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                        <strong className="text-gray-200">Bảo mật:</strong> Bạn chịu hoàn toàn trách nhiệm cho việc bảo mật mật khẩu và tài khoản của mình. Bất kỳ hoạt động nào diễn ra dưới tài khoản của bạn (bao gồm bình luận, tải lên video, hoặc mua gói Premium) đều thuộc trách nhiệm của bạn.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                        <strong className="text-gray-200">Thông chính xác:</strong> Bạn đồng ý cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản. Việc sử dụng danh tính giả hoặc thông tin sai lệch có thể dẫn đến việc tài khoản bị đình chỉ ngay lập tức.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6 mb-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                  <FileText className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">3. Quyền sở hữu nội dung và Giấy phép</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Bạn vẫn giữ toàn bộ quyền sở hữu đối với các video, âm thanh, văn bản và các tài liệu khác mà bạn tải lên nền tảng ("Nội dung của bạn"). Tuy nhiên, bằng việc tải Nội dung lên, bạn cấp cho chúng tôi một giấy phép:
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:pl-18 mb-6">
                <div className="bg-[#1F1F23] p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 text-blue-400"><GlobeIcon /></div>
                    <h4 className="text-blue-400 font-semibold text-sm">Toàn cầu</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Để sử dụng, phân phối, sao chép, hiển thị công khai.</p>
                </div>
                <div className="bg-[#1F1F23] p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 text-blue-400"><CopyrightIcon /></div>
                    <h4 className="text-blue-400 font-semibold text-sm">Không độc quyền</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Cho phép chúng tôi sử dụng Nội dung của bạn trong phạm vi Dịch vụ.</p>
                </div>
                <div className="bg-[#1F1F23] p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 text-blue-400"><TagIcon /></div>
                    <h4 className="text-blue-400 font-semibold text-sm">Không thu phí bản quyền</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Chúng tôi không phải trả tiền cho việc sử dụng Nội dung.</p>
                </div>
                <div className="bg-[#1F1F23] p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 text-blue-400"><ClockIcon /></div>
                    <h4 className="text-blue-400 font-semibold text-sm">Có thể chuyển nhượng</h4>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Có thể cấp phép lại cho các đối tác trong phạm vi Dịch vụ.</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm md:pl-18">
                Giấy phép này sẽ kết thúc khi bạn xóa Nội dung của mình khỏi hệ thống của chúng tôi.
              </p>
            </div>

            {/* Section 4 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6 mb-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-emerald-900 to-green-900 flex items-center justify-center shrink-0 border border-green-500/20 shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">4. Các hành vi bị nghiêm cấm</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Khi sử dụng Dịch vụ, bạn đồng ý KHÔNG thực hiện các hành vi sau:
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 md:pl-18">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-sm leading-relaxed">Sử dụng Dịch vụ cho bất kỳ mục đích bất hợp pháp nào hoặc vi phạm luật pháp địa phương, quốc gia hoặc quốc tế.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-sm leading-relaxed">Sử dụng các công cụ tự động (bot, spider, scraper) để thu thập dữ liệu hoặc tăng lượt xem, lượt thích, người đăng ký một cách giả tạo.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-sm leading-relaxed">Đăng tải nội dung vi phạm bản quyền, nhãn hiệu hoặc các quyền sở hữu trí tuệ khác của bên thứ ba.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-sm leading-relaxed">Can thiệp hoặc làm gián đoạn tính toàn vẹn hoặc hiệu suất của Dịch vụ.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-sm leading-relaxed">Phân tán virus, phần mềm độc hại, hoặc bất kỳ đoạn mã nào có tính chất phá hoại.</p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-amber-900 to-orange-900 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-inner">
                  <X className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">5. Chấm dứt dịch vụ</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4">
                    Chúng tôi có quyền (nhưng không có nghĩa vụ) đình chỉ hoặc chấm dứt tài khoản của bạn, xóa Nội dung của bạn, hoặc từ chối cung cấp Dịch vụ vào bất kỳ lúc nào nếu bạn vi phạm các Điều khoản này, vi phạm Nguyên tắc Cộng đồng, hoặc tạo ra rủi ro pháp lý cho chúng tôi.
                  </p>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Bạn cũng có thể chấm dứt thỏa thuận này bất kỳ lúc nào bằng cách xóa tài khoản của mình.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="p-6 md:p-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-1xl bg-gradient-to-br from-purple-900 to-fuchsia-900 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <Scale className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">6. Giới hạn trách nhiệm</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-4">
                    Dịch vụ được cung cấp trên cơ sở "NGUYÊN TRẠNG" (As Is) và "NHƯ HIỆN CÓ" (As Available). Chúng tôi không đảm bảo rằng Dịch vụ sẽ không bị gián đoạn, không có lỗi, hoặc hoàn toàn an toàn.
                  </p>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Trong phạm vi tối đa được pháp luật cho phép, chúng tôi sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, hoặc mang tính hậu quả nào phát sinh từ việc bạn sử dụng hoặc không thể sử dụng Dịch vụ.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Quyền riêng tư',
      icon: Shield,
      content: (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out font-sans space-y-6">
          {/* Header Banner */}
          <div className="relative mb-8 min-h-[240px] flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-1/2 h-full z-0">
                 <img src="./Chính sách Quyền riêng tư.png" alt="" className="w-full h-full object-contain object-right" />
             </div>
             <div className="relative z-10 w-full max-w-[55%]">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Chính sách Quyền riêng tư</h2>
                 <p className="text-gray-400 mb-6 text-sm md:text-base leading-relaxed">VideoSharing cam kết bảo vệ thông tin cá nhân của bạn.<br/>Chúng tôi minh bạch về cách thu thập, sử dụng và bảo vệ dữ liệu của bạn.</p>
                 <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 font-medium">
                     <ClockIcon /> Cập nhật lần cuối: 08/05/2025
                 </div>
             </div>
          </div>

          {/* Sections Container */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg flex flex-col divide-y divide-white/5">
            
            {/* Section 01 */}
            <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <Database className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-purple-500">01</span>
                    <h3 className="text-xl font-bold text-white">Dữ liệu chúng tôi thu thập</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Chúng tôi thu thập những thông tin sau để cung cấp và cải thiện dịch vụ.</p>
                </div>
              </div>
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left col */}
              <div className="border border-white/5 rounded-xl p-6 bg-[#1F1F23]">
                <h4 className="text-white font-semibold mb-6">Thông tin bạn cung cấp</h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Thông tin hồ sơ:</span> Tên hiển thị, email, số điện thoại, mật khẩu.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Thông tin thanh toán:</span> Khi mua gói Premium, Donate hoặc Mua Coin.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Nội dung bạn tạo:</span> Video, bình luận, tin nhắn, bài đăng.</p>
                  </li>
                </ul>
              </div>

              {/* Right col */}
              <div className="border border-white/5 rounded-xl p-6 bg-[#1F1F23]">
                <h4 className="text-purple-400 font-semibold mb-6">Thông tin thu thập tự động</h4>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Dữ liệu hành vi:</span> Lịch sử xem, thời gian xem, video đã xem.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Dữ liệu kỹ thuật:</span> IP, loại thiết bị, hệ điều hành, trình duyệt.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300 leading-relaxed"><span className="text-gray-100 font-medium">Cookie & công nghệ tương tự:</span> Giúp tối ưu trải nghiệm.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

            {/* Section 02 */}
            <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-purple-500">02</span>
                    <h3 className="text-xl font-bold text-white">Cách chúng tôi sử dụng dữ liệu</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Chúng tôi sử dụng dữ liệu của bạn với các mục đích sau.</p>
                </div>
              </div>
              <ChevronUp className="w-5 h-5 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1F1F23] rounded-xl p-5 border border-white/5 text-center hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 border border-pink-500/20 shadow-inner">
                  <Star className="w-6 h-6 text-pink-400" />
                </div>
                <h5 className="text-white font-semibold text-sm mb-2">Cung cấp dịch vụ</h5>
                <p className="text-gray-400 text-xs leading-relaxed">Duy trì hoạt động ổn định và các tính năng.</p>
              </div>
              <div className="bg-[#1F1F23] rounded-xl p-5 border border-white/5 text-center hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 shadow-inner">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <h5 className="text-white font-semibold text-sm mb-2">Cá nhân hóa trải nghiệm</h5>
                <p className="text-gray-400 text-xs leading-relaxed">Đề xuất nội dung phù hợp với sở thích của bạn.</p>
              </div>
              <div className="bg-[#1F1F23] rounded-xl p-5 border border-white/5 text-center hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner">
                  <BarChart2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h5 className="text-white font-semibold text-sm mb-2">Quảng cáo & phân tích</h5>
                <p className="text-gray-400 text-xs leading-relaxed">Hiển thị quảng cáo phù hợp & phân tích hiệu quả.</p>
              </div>
              <div className="bg-[#1F1F23] rounded-xl p-5 border border-white/5 text-center hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 shadow-inner">
                  <Lock className="w-6 h-6 text-purple-400" />
                </div>
                <h5 className="text-white font-semibold text-sm mb-2">Bảo mật & an toàn</h5>
                <p className="text-gray-400 text-xs leading-relaxed">Phát hiện, ngăn chặn và xử lý hành vi vi phạm.</p>
              </div>
            </div>
          </div>

            {/* Section 03 */}
            <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <Share2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-purple-500">03</span>
                    <h3 className="text-xl font-bold text-white">Chia sẻ thông tin của bạn</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Chúng tôi không bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp sau:</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>

            <div className="space-y-5 md:pl-16 mt-2">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pt-2.5"><strong className="text-gray-100">Với nhà cung cấp dịch vụ:</strong> Hỗ trợ vận hành dịch vụ (ví dụ: thanh toán, lưu trữ dữ liệu, CDN...).</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                  <Scale className="w-5 h-5 text-pink-400" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pt-2.5"><strong className="text-gray-100">Vì lý do pháp lý:</strong> Khi được yêu cầu bởi cơ quan chức năng hoặc để bảo vệ quyền lợi hợp pháp.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pt-2.5"><strong className="text-gray-100">Dữ liệu công khai:</strong> Một số nội dung bạn đăng (video, bình luận công khai) có thể hiển thị cho mọi người.</p>
              </div>
            </div>
          </div>

            {/* Section 04 */}
            <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                  <UserCheck className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-purple-500">04</span>
                    <h3 className="text-xl font-bold text-white">Quyền kiểm soát của bạn</h3>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Bạn có toàn quyền kiểm soát dữ liệu cá nhân của mình.</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-8 md:pl-16 mt-4">
              <div className="flex-1 space-y-5">
                <div className="flex gap-4 items-center">
                  <User className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-300">Xem, chỉnh sửa hoặc xóa thông tin cá nhân của bạn bất kỳ lúc nào.</p>
                </div>
                <div className="flex gap-4 items-center">
                  <Download className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-300">Tải xuống dữ liệu của bạn dưới dạng tệp (Data Export).</p>
                </div>
                <div className="flex gap-4 items-center">
                  <Settings className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-300">Quản lý cài đặt quyền riêng tư và tùy chọn hiển thị.</p>
                </div>
                <div className="flex gap-4 items-center">
                  <Trash2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-300">Yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.</p>
                </div>
              </div>
              <div className="w-full md:w-1/3 flex justify-center items-center">
                <img src="./Quyền kiểm soát của bạn.png" alt="Privacy Controls" className="w-full max-w-[200px] object-contain opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            </div>

          </div>

          {/* Footer Commitment & Feedback */}
          <div className="bg-[#1A1A1D] border border-white/5 rounded-1xl p-6">
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div className="pt-2">
                <h4 className="text-white font-bold mb-1">Cam kết của chúng tôi</h4>
                <p className="text-sm text-gray-400 leading-relaxed">Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu của bạn khỏi truy cập, sử dụng hoặc tiết lộ trái phép.</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-white font-semibold text-sm">Thông tin này có hữu ích với bạn không?</h5>
                <p className="text-xs text-gray-500 mt-1">Phản hồi của bạn giúp chúng tôi cải thiện tài liệu.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-colors">
                  <ThumbsUp className="w-4 h-4" /> Rất hữu ích
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm font-medium transition-colors">
                  <ThumbsDown className="w-4 h-4" /> Cần cải thiện
                </button>
              </div>
            </div>
          </div>

        </div>
      )
    },
    {
      id: 'community',
      title: 'Nguyên tắc cộng đồng',
      icon: Users,
      content: (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out font-sans space-y-0">
          
          {/* Header Banner */}
          <div className="relative mb-8 min-h-[240px] flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-1/2 h-full z-0">
                 <img src="./Nguyên tắc Cộng đồng.png" alt="" className="w-full h-full object-contain object-right" />
             </div>
             <div className="relative z-10 w-full max-w-[55%]">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Nguyên tắc Cộng đồng</h2>
                 <p className="text-gray-400 w-[530px] text-sm md:text-base leading-relaxed">Nền tảng của chúng tôi là nơi mọi người kết nối, chia sẻ và sáng tạo nội dung.<br/>Để bảo vệ cộng đồng an toàn, tôn trọng và tích cực, vui lòng tuân thủ các nguyên tắc dưới đây.</p>
             </div>
          </div>

          {/* Zero Tolerance */}
          <div className="bg-[#1A1111] border border-red-500/30 rounded-1xl p-6 md:p-8 mb-8 shadow-lg shadow-red-500/5">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-red-500">KHÔNG DUNG THỨ <span className="text-red-400/80 text-base font-medium ml-1">(Cấm vĩnh viễn ngay vi phạm đầu tiên)</span></h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#241315] border border-red-500/20 rounded-xl p-5 flex gap-4 items-center hover:border-red-500/40 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <Monitor className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-red-200/90 leading-relaxed font-medium">Hình ảnh lạm dụng tình dục hoặc bóc lột trẻ em dưới mọi hình thức.</p>
              </div>
              <div className="bg-[#241315] border border-red-500/20 rounded-xl p-5 flex gap-4 items-center hover:border-red-500/40 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <Plane className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-red-200/90 leading-relaxed font-medium">Nội dung mô tả hoặc khuyến khích các hoạt động khủng bố.</p>
              </div>
              <div className="bg-[#241315] border border-red-500/20 rounded-xl p-5 flex gap-4 items-center hover:border-red-500/40 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-red-200/90 leading-relaxed font-medium">Hành vi đe dọa, đe dọa phát tán thông tin nhạy cảm của người khác (doxxing).</p>
              </div>
            </div>
          </div>

          {/* Rules Container */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg flex flex-col divide-y divide-white/5 mb-8">
            
            {/* 01 */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.02] transition-colors">
               <div className="lg:w-1/3 flex gap-4">
                  <div className="w-14 h-14 rounded-1xl bg-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    <ShieldAlert className="w-7 h-7 text-white" />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-black text-purple-400 leading-none">01</span>
                      <h4 className="text-lg font-bold text-white leading-tight">Nội dung bạo lực<br/>và đẫm máu</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">Không đăng tải nội dung nhằm mục đích gây sốc, gây phẫn nộ hoặc mang tính bạo lực vô cớ.</p>
                  </div>
               </div>
               <div className="lg:w-2/3 flex items-center">
                  <ul className="space-y-4 w-full">
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Cảnh quay bạo lực thực tế, tai nạn nghiêm trọng, hoặc hướng dẫn hành động nguy hiểm.</p>
                    </li>
                    <li className="flex justify-between gap-3">
                       <div className="flex gap-3">
                         <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-gray-300">Hành vi ngược đãi, hành hạ hoặc giết hại động vật vô cớ.</p>
                       </div>
                       <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Nội dung xúc phạm, khuyến khích hoặc thể hiện bạo lực, tự tử, hoặc tự gây thương tích.</p>
                    </li>
                  </ul>
               </div>
            </div>

            {/* 02 */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.02] transition-colors">
               <div className="lg:w-1/3 flex gap-4">
                  <div className="w-14 h-14 rounded-1xl bg-pink-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(219,39,119,0.3)]">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-black text-pink-400 leading-none">02</span>
                      <h4 className="text-lg font-bold text-white leading-tight">Nội dung tình dục<br/>và ảnh khỏa thân</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">Nền tảng không dành cho các nội dung khiêu dâm hoặc nhằm mục đích thỏa mãn tình dục.</p>
                  </div>
               </div>
               <div className="lg:w-2/3 flex items-center">
                  <ul className="space-y-4 w-full">
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Cấm hoàn toàn các video, hình ảnh mô tả hành vi tình dục rõ ràng.</p>
                    </li>
                    <li className="flex justify-between gap-3">
                       <div className="flex gap-3">
                         <CheckCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-gray-300">Hình ảnh khỏa thân với mục đích khiêu dâm hoặc gợi dục.</p>
                       </div>
                       <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Ngoại lệ: Ảnh nghệ thuật, giáo dục về sức khỏe (có cảnh báo) hoặc khoa học, y tế.</p>
                    </li>
                  </ul>
               </div>
            </div>

            {/* 03 */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.02] transition-colors">
               <div className="lg:w-1/3 flex gap-4">
                  <div className="w-14 h-14 rounded-1xl bg-orange-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                    <Frown className="w-7 h-7 text-white" />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-black text-orange-400 leading-none">03</span>
                      <h4 className="text-lg font-bold text-white leading-tight">Quấy rối và Bắt nạt</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">Chúng tôi không cho phép hành vi lăng mạ, đe dọa hoặc quấy rối cá nhân liên tục.</p>
                  </div>
               </div>
               <div className="lg:w-2/3 flex items-center">
                  <ul className="space-y-4 w-full">
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Nội dung lăng mạ, xúc phạm hoặc nhằm vào cá nhân hoặc nhóm người.</p>
                    </li>
                    <li className="flex justify-between gap-3">
                       <div className="flex gap-3">
                         <CheckCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-gray-300">Kích động người xem tấn công, quấy rối hoặc report hàng loạt.</p>
                       </div>
                       <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Phát tán thông tin cá nhân (địa chỉ nhà, số điện thoại) của người khác.</p>
                    </li>
                  </ul>
               </div>
            </div>

            {/* 04 */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.02] transition-colors">
               <div className="lg:w-1/3 flex gap-4">
                  <div className="w-14 h-14 rounded-1xl bg-yellow-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(202,138,4,0.3)]">
                    <Megaphone className="w-7 h-7 text-white" />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-black text-yellow-400 leading-none">04</span>
                      <h4 className="text-lg font-bold text-white leading-tight">Ngôn từ kích động<br/>thù địch</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">Cấm mọi nội dung có lời lẽ hoặc hành động nhằm vào cá nhân hoặc nhóm người dựa trên:</p>
                  </div>
               </div>
               <div className="lg:w-2/3 flex items-center relative">
                  <div className="flex flex-wrap gap-3">
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Globe className="w-4 h-4 text-yellow-500"/> Chủng tộc, dân tộc</span>
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Users className="w-4 h-4 text-yellow-500"/> Giới tính, bản dạng giới</span>
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Clock className="w-4 h-4 text-yellow-500"/> Độ tuổi</span>
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Users className="w-4 h-4 text-yellow-500"/> Tôn giáo</span>
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Heart className="w-4 h-4 text-yellow-500"/> Xu hướng tình dục</span>
                     <span className="px-4 py-2.5 bg-black/40 border border-yellow-500/20 text-gray-300 rounded-full text-sm flex items-center gap-2 font-medium"><Activity className="w-4 h-4 text-yellow-500"/> Khuyết tật / Bệnh tật</span>
                  </div>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 hidden md:block" />
               </div>
            </div>

            {/* 05 */}
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-white/[0.02] transition-colors">
               <div className="lg:w-1/3 flex gap-4">
                  <div className="w-14 h-14 rounded-1xl bg-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(13,148,136,0.3)]">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div className="pt-1">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-black text-teal-400 leading-none">05</span>
                      <h4 className="text-lg font-bold text-white leading-tight">Spam, Lừa đảo và Câu<br/>view trái phép</h4>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">Để giữ cho trải nghiệm người xem tích cực, hãy tránh các hành vi làm nhiễu hệ thống.</p>
                  </div>
               </div>
               <div className="lg:w-2/3 flex items-center">
                  <ul className="space-y-4 w-full">
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Đăng nội dung lặp lại vô nghĩa, spam bình luận, hoặc quảng cáo trái phép.</p>
                    </li>
                    <li className="flex justify-between gap-3">
                       <div className="flex gap-3">
                         <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-gray-300">Sử dụng tiêu đề, hình thu nhỏ (thumbnail) sai lệch, lừa dối hoàn toàn nội dung.</p>
                       </div>
                       <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Bán lượt xem, lượt thích, hoặc người đăng ký nhân tạo.</p>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">Lừa đảo tài chính, tiền điện tử, hoặc hứa hẹn tặng quà giá trị.</p>
                    </li>
                  </ul>
               </div>
            </div>
          </div>

          {/* Violations System */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8">
            <div className="flex gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-bold text-white mb-1">Hệ thống xử lý vi phạm (Cảnh cáo)</h3>
                <p className="text-gray-400 text-sm">Nếu Nội dung của bạn vi phạm, chúng tôi sẽ áp dụng hệ thống cảnh cáo:</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 pl-2">
               <div className="flex gap-4 items-start relative">
                 <div className="w-12 h-12 rounded-full border border-indigo-500/30 flex items-center justify-center shrink-0 bg-indigo-500/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    <ClipboardList className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div className="pt-1">
                   <h4 className="text-white font-medium mb-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold shadow-sm shadow-indigo-500/50">1</span> Cảnh cáo lần 1</h4>
                   <p className="text-sm text-gray-400 leading-relaxed">Xóa video vi phạm. Cấm đăng video, livestream hoặc bài viết cộng đồng trong vòng 1 tuần.</p>
                 </div>
               </div>
               
               <div className="flex gap-4 items-start relative">
                 <div className="w-12 h-12 rounded-full border border-indigo-500/30 flex items-center justify-center shrink-0 bg-indigo-500/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    <Clock className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div className="pt-1">
                   <h4 className="text-white font-medium mb-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold shadow-sm shadow-indigo-500/50">2</span> Cảnh cáo lần 2</h4>
                   <p className="text-sm text-gray-400 leading-relaxed">Nếu nhận cảnh cáo thứ 2 trong vòng 90 ngày kể từ lần 1. Cấm đăng tải nội dung trong 2 tuần.</p>
                 </div>
               </div>

               <div className="flex gap-4 items-start relative">
                 <div className="w-12 h-12 rounded-full border border-pink-500/30 flex items-center justify-center shrink-0 bg-pink-500/5 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                    <UserX className="w-6 h-6 text-pink-400" />
                 </div>
                 <div className="pt-1">
                   <h4 className="text-white font-medium mb-2 flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-bold shadow-sm shadow-pink-500/50">3</span> Cảnh cáo lần 3</h4>
                   <p className="text-sm text-gray-400 leading-relaxed">Kênh của bạn sẽ bị đóng vĩnh viễn nếu nhận 3 cảnh cáo trong khoảng thời gian 90 ngày.</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Footer Commitment */}
          <div className="bg-[#1A1A1D] border border-white/5 rounded-1xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
              <div className="pt-1">
                <h4 className="text-white font-bold mb-1">Cùng xây dựng cộng đồng văn minh và tích cực</h4>
                <p className="text-sm text-gray-400 leading-relaxed">Hãy báo cáo những nội dung hoặc hành vi vi phạm để chúng tôi có thể xử lý kịp thời.</p>
              </div>
            </div>
            
            <div className="flex gap-3 shrink-0">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-purple-500/20">
                <Flag className="w-4 h-4" /> Báo cáo vi phạm
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm font-medium transition-colors">
                <MessageSquare className="w-4 h-4" /> Gửi phản hồi
              </button>
            </div>
          </div>

        </div>
      )
    },
    {
      id: 'copyright',
      title: 'Chính sách bản quyền',
      icon: Copyright,
      content: (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out font-sans space-y-0">
          
          {/* Header Banner */}
          <div className="relative mb-8 min-h-[240px] flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-1/2 h-full z-0">
                 <img src="./Bản quyền & DMCA.png" alt="" className="w-full h-full object-contain object-right" />
             </div>
             <div className="relative z-10 w-full max-w-[55%]">
                 <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-6">Bản quyền & DMCA</h2>
                 <p className="text-gray-400 text-sm md:text-base leading-relaxed">Chúng tôi tôn trọng quyền sở hữu trí tuệ của người khác và yêu cầu cộng đồng tuân thủ Luật Bản quyền Thiên niên kỷ kỹ thuật số (DMCA) và luật bản quyền quốc tế.</p>
             </div>
          </div>

          {/* Commitment */}
          <div className="bg-[#18181B] border border-purple-500/20 rounded-1xl p-6 flex items-center gap-6 mb-8 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
            <div className="w-14 h-14 rounded-1xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Scale className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Cam kết của chúng tôi</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Bảo vệ quyền tác giả, đồng thời đảm bảo một môi trường sáng tạo công bằng cho tất cả mọi người.</p>
            </div>
          </div>

          {/* Rule 01 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 flex flex-col lg:flex-row gap-8 mb-8 hover:border-pink-500/20 transition-colors">
            <div className="lg:w-1/2 flex gap-4">
              <div className="w-14 h-14 rounded-1xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20 shadow-inner">
                <span className="text-2xl font-black text-pink-400">01</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Quy tắc cơ bản về Bản quyền</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">Người sáng tạo chỉ nên tải lên những nội dung mà họ có quyền sở hữu hoặc được phép sử dụng.</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">Điều này giúp bảo vệ công việc của người khác và duy trì môi trường sáng tạo lành mạnh.</p>
                <div className="w-16 h-16 rounded-1xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 relative">
                   <ClipboardList className="w-8 h-8 text-pink-400" />
                   <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <Shield className="w-3 h-3 text-white" />
                   </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 bg-[#1A1111] border border-red-500/20 rounded-1xl p-6">
              <h4 className="text-red-400 font-bold mb-4">Không được phép:</h4>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                  <p className="text-sm text-red-200/80 leading-relaxed">Tải lên nội dung sao chép trái phép</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                  <p className="text-sm text-red-200/80 leading-relaxed">Sử dụng nhạc, video, hình ảnh, phần mềm khi chưa được cấp phép</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                  <p className="text-sm text-red-200/80 leading-relaxed">Xóa hoặc thay đổi thông tin bản quyền gốc</p>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                  <p className="text-sm text-red-200/80 leading-relaxed">Đăng tải nội dung không thuộc quyền sở hữu của bạn</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Rule 02 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8 hover:border-purple-500/20 transition-colors">
            <div className="flex justify-between items-start mb-8">
               <div className="flex gap-4 max-w-2xl">
                 <div className="w-14 h-14 rounded-1xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                   <span className="text-2xl font-black text-purple-400">02</span>
                 </div>
                 <div className="pt-1">
                   <h3 className="text-xl font-bold text-white mb-2">Cách gửi Yêu cầu Gỡ bỏ do Vi phạm Bản quyền</h3>
                   <p className="text-sm text-gray-400 leading-relaxed">Nếu bạn là chủ sở hữu bản quyền và tin rằng tác phẩm của mình bị sử dụng trái phép, vui lòng gửi yêu cầu gỡ bỏ theo hướng dẫn sau:</p>
                 </div>
               </div>
               <div className="hidden md:block w-52 h-32 relative overflow-hidden flex items-center justify-center -mt-2">
                  <img src="./Cách gửi Yêu cầu Gỡ bỏ do Vi phạm Bản quyền.png" alt="" className="w-full h-full object-contain" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative px-4">
              {/* Process Flow */}
              <div className="hidden md:block absolute top-6 left-12 right-12 h-[2px] bg-gradient-to-r from-purple-500/20 via-purple-500/20 to-transparent" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#1F1F23] border border-purple-500/30 flex items-center justify-center mb-4 z-10 relative shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                   <span className="text-purple-400 font-bold">1</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-2">Chuẩn bị thông tin</h4>
                <p className="text-xs text-gray-400 leading-relaxed pr-4">Tên thật, Email, mô tả tác phẩm và bằng chứng bản quyền của bạn.</p>
              </div>

              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#1F1F23] border border-purple-500/30 flex items-center justify-center mb-4 z-10 relative shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                   <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-white font-bold text-sm mb-2">Điền biểu mẫu</h4>
                <p className="text-xs text-gray-400 leading-relaxed pr-4">Cung cấp URL nội dung vi phạm và mô tả chi tiết vi phạm.</p>
              </div>

              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#1F1F23] border border-purple-500/30 flex items-center justify-center mb-4 z-10 relative shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                   <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-white font-bold text-sm mb-2">Gửi yêu cầu</h4>
                <p className="text-xs text-gray-400 leading-relaxed pr-4">Chúng tôi sẽ xem xét và phản hồi theo quy trình DMCA.</p>
              </div>

              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#1F1F23] border border-purple-500/30 flex items-center justify-center mb-4 z-10 relative shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                   <span className="text-purple-400 font-bold">4</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-2">Thông báo kết quả</h4>
                <p className="text-xs text-gray-400 leading-relaxed pr-4">Bạn sẽ nhận được thông báo kết quả qua email trong vòng 2-7 ngày làm việc.</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-400">Yêu cầu xin gửi về email pháp lý: <span className="text-pink-500 font-bold ml-1">copyright@videosharing.com</span></p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Rule 03 */}
            <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 hover:border-blue-500/20 transition-colors">
              <div className="flex gap-4 mb-6">
                 <div className="w-14 h-14 rounded-1xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner">
                   <span className="text-2xl font-black text-blue-400">03</span>
                 </div>
                 <div className="pt-2">
                   <h3 className="text-lg font-bold text-white mb-2">Cảnh báo Bản quyền & Hậu quả</h3>
                 </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Khi nhận được yêu cầu hợp lệ, video sẽ bị gỡ bỏ và tài khoản có thể nhận 1 cảnh cáo bản quyền.</p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">3 cảnh cáo sẽ dẫn đến việc khóa tài khoản.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Nội dung vi phạm có thể bị xóa mà không cần thông báo trước.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Vi phạm nghiêm trọng có thể dẫn đến khóa vĩnh viễn.</p>
                </li>
              </ul>
            </div>

            {/* Rule 04 */}
            <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 hover:border-teal-500/20 transition-colors">
              <div className="flex gap-4 mb-6">
                 <div className="w-14 h-14 rounded-1xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20 shadow-inner">
                   <span className="text-2xl font-black text-teal-400">04</span>
                 </div>
                 <div className="pt-2">
                   <h3 className="text-lg font-bold text-white mb-2">Thông báo Phản đối (Counter-Notice)</h3>
                 </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Nếu bạn tin rằng nội dung bị gỡ bỏ là nhầm lẫn hoặc do nhận dạng sai, bạn có thể gửi thông báo phản đối.</p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Chúng tôi sẽ xem xét và có thể khôi phục nội dung nếu phản đối hợp lệ.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Bạn có thể phải đối mặt với hành động pháp lý nếu khai báo sai sự thật.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Rule 05 */}
          <div className="bg-[#1A1811] rounded-1xl border border-yellow-500/30 shadow-lg p-6 md:p-8 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] transition-shadow">
            <div className="flex gap-4 mb-6">
               <div className="w-14 h-14 rounded-1xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 shadow-inner">
                 <span className="text-2xl font-black text-yellow-500">05</span>
               </div>
               <div className="pt-1">
                 <h3 className="text-xl font-bold text-white mb-2">Sử dụng hợp lý (Fair Use)</h3>
                 <p className="text-sm text-yellow-200/70 leading-relaxed max-w-4xl">“Sử dụng hợp lý” là một ngoại lệ của luật bản quyền, cho phép sử dụng một số nội dung có bản quyền mà không cần xin phép trong các trường hợp như:</p>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#242013] border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                 <Scale className="w-5 h-5 text-yellow-600 shrink-0" />
                 <span className="text-xs text-yellow-100/80 font-medium leading-tight">Bình luận, chỉ trích, phê bình</span>
              </div>
              <div className="bg-[#242013] border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                 <FileText className="w-5 h-5 text-yellow-600 shrink-0" />
                 <span className="text-xs text-yellow-100/80 font-medium leading-tight">Báo cáo tin tức</span>
              </div>
              <div className="bg-[#242013] border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                 <Book className="w-5 h-5 text-yellow-600 shrink-0" />
                 <span className="text-xs text-yellow-100/80 font-medium leading-tight">Giáo dục, nghiên cứu</span>
              </div>
              <div className="bg-[#242013] border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                 <Smile className="w-5 h-5 text-yellow-600 shrink-0" />
                 <span className="text-xs text-yellow-100/80 font-medium leading-tight">Parody (Chế giễu, hài hước)</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
               <span className="text-yellow-500 font-bold italic">Lưu ý:</span> Việc ghi nguồn hoặc nói "Không cố ý vi phạm bản quyền" không đảm bảo nội dung của bạn được coi là sử dụng hợp lý.
            </p>
          </div>

        </div>
      )
    },
    {
      id: 'monetization',
      title: 'Chính sách kiếm tiền',
      icon: DollarSign,
      content: (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out font-sans space-y-0">
          
          {/* Header Banner */}
          <div className="relative mb-8 min-h-[240px] flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-1/2 h-full z-0">
                 <img src="./Chính sách Kiếm tiền.png" alt="" className="w-full h-full object-contain object-right" />
             </div>
             <div className="relative z-10 w-full max-w-[60%]">
                 <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">Chính sách Kiếm tiền</h2>
                 <p className="text-gray-400 text-sm md:text-base leading-relaxed">Chương trình Đối tác cho phép nhà sáng tạo kiếm tiền từ nội dung của họ. Vui lòng đọc kỹ các điều kiện và nguyên tắc dưới đây để đảm bảo tài khoản của bạn được xét duyệt và duy trì trạng thái kiếm tiền.</p>
             </div>
          </div>

          {/* Conditions Block */}
          <div className="bg-[#18181B] border border-white/5 rounded-1xl p-6 md:p-8 mb-8 shadow-lg hover:border-white/10 transition-colors">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">ĐIỀU KIỆN THAM GIA CHƯƠNG TRÌNH ĐỐI TÁC</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                
                <div className="bg-[#1F1F23] rounded-xl p-4 flex gap-4 border border-white/5 hover:border-purple-500/30 transition-colors group">
                   <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                      <Users className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                      <div className="text-2xl font-black text-purple-400 mb-1 leading-none mt-1">1,000</div>
                      <p className="text-sm text-gray-300 font-bold mb-1">Người đăng ký</p>
                      <p className="text-xs text-gray-500">Số lượng người đăng ký tối thiểu</p>
                   </div>
                </div>

                <div className="bg-[#1F1F23] rounded-xl p-4 flex gap-4 border border-white/5 hover:border-blue-500/30 transition-colors group">
                   <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <PlayCircle className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                      <div className="text-2xl font-black text-blue-400 mb-1 leading-none mt-1">4,000</div>
                      <p className="text-sm text-gray-300 font-bold mb-1">Giờ xem công khai</p>
                      <p className="text-xs text-gray-500">Trong 365 ngày gần nhất</p>
                   </div>
                </div>

                <div className="bg-[#1F1F23] rounded-xl p-4 flex gap-4 border border-white/5 hover:border-green-500/30 transition-colors group">
                   <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                   </div>
                   <div>
                      <div className="text-2xl font-black text-green-400 mb-1 leading-none mt-1">Hoàn tất</div>
                      <p className="text-sm text-gray-300 font-bold mb-1">Xác minh 2 bước</p>
                      <p className="text-xs text-gray-500">Bảo vệ tài khoản của bạn</p>
                   </div>
                </div>

                <div className="bg-[#1F1F23] rounded-xl p-4 flex gap-4 border border-white/5 hover:border-yellow-500/30 transition-colors group">
                   <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                      <ShieldAlert className="w-5 h-5 text-yellow-500" />
                   </div>
                   <div>
                      <div className="text-2xl font-black text-yellow-500 mb-1 leading-none mt-1">Không có</div>
                      <p className="text-sm text-gray-300 font-bold mb-1">Cảnh cáo vi phạm</p>
                      <p className="text-xs text-gray-500">Nguyên tắc cộng đồng</p>
                   </div>
                </div>

             </div>
             
             <div className="flex items-center justify-between pt-5 border-t border-white/5">
                <p className="text-xs text-gray-400 flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" /> Các yêu cầu có thể thay đổi tùy theo khu vực và chính sách của nền tảng.</p>
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">Xem chi tiết</a>
             </div>
          </div>

          {/* Section 1 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8 hover:border-purple-500/20 transition-colors">
            <div className="flex gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-inner">
                 <span className="text-xl font-black text-purple-400">1</span>
               </div>
               <div className="pt-1">
                 <h3 className="text-xl font-bold text-white mb-2">1. Yêu cầu về Chất lượng Nội dung</h3>
                 <p className="text-sm text-gray-400">Chúng tôi khuyến khích nội dung sáng tạo, nguyên gốc và mang lại giá trị tích cực cho cộng đồng.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-[#1F1F23] border border-white/5 rounded-xl p-5 hover:border-pink-500/30 transition-colors relative overflow-hidden group">
                  <div className="flex gap-3 mb-3 relative z-10">
                     <RefreshCw className="w-5 h-5 text-pink-400 shrink-0" />
                     <h4 className="text-sm font-bold text-pink-200">Nội dung sử dụng lại<br/><span className="text-xs font-normal text-pink-300/70">(Reused Content)</span></h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 relative z-10">Không đăng tải nội dung đăng lại, cắt ghép từ nguồn khác mà không thêm giá trị sáng tạo đáng kể.</p>
                  <RefreshCw className="w-12 h-12 text-red-500/20 absolute bottom-3 left-3 group-hover:scale-110 transition-transform" />
               </div>
               
               <div className="bg-[#1F1F23] border border-white/5 rounded-xl p-5 hover:border-red-500/30 transition-colors relative overflow-hidden group">
                  <div className="flex gap-3 mb-3 relative z-10">
                     <Copy className="w-5 h-5 text-red-400 shrink-0" />
                     <h4 className="text-sm font-bold text-red-200">Nội dung lặp lại<br/><span className="text-xs font-normal text-red-300/70">(Repetitious Content)</span></h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 relative z-10">Không đăng tải nội dung hàng loạt, giống nhau hoặc chỉ thay đổi nhỏ mà không có sự khác biệt rõ rệt.</p>
                  <Copy className="w-12 h-12 text-red-500/20 absolute bottom-3 left-3 group-hover:scale-110 transition-transform" />
               </div>

               <div className="bg-[#1F1F23] border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-colors relative overflow-hidden group">
                  <div className="flex gap-3 mb-3 relative z-10">
                     <Film className="w-5 h-5 text-blue-400 shrink-0" />
                     <h4 className="text-sm font-bold text-blue-200">Video tổng hợp<br/><span className="text-xs font-normal text-blue-300/70">(Compilation)</span></h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 relative z-10">Chỉ đăng tải video tổng hợp khi có bình luận, phân tích hoặc giá trị biên tập rõ ràng cho người xem.</p>
                  <Film className="w-12 h-12 text-green-500/20 absolute bottom-3 left-3 group-hover:scale-110 transition-transform" />
               </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8 hover:border-green-500/20 transition-colors">
            <div className="flex gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 shadow-inner">
                 <span className="text-xl font-black text-green-400">2</span>
               </div>
               <div className="pt-1">
                 <h3 className="text-xl font-bold text-white mb-2">2. Nguyên tắc Thân thiện với Nhà Quảng cáo</h3>
                 <p className="text-sm text-gray-400">Nội dung của bạn cần phù hợp với môi trường quảng cáo và không gây ảnh hưởng tiêu cực đến người xem.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-[#1A1F1C] border border-green-500/10 rounded-xl p-5 hover:border-green-500/30 transition-colors">
                  <div className="flex gap-3 mb-2 items-center">
                     <UserCheck className="w-5 h-5 text-green-400 shrink-0" />
                     <h4 className="text-sm font-bold text-white">Nội dung phù hợp</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Không chứa nội dung bạo lực, khiêu dâm, thù ghét, hoặc gây sốc.</p>
               </div>
               <div className="bg-[#1A2222] border border-teal-500/10 rounded-xl p-5 hover:border-teal-500/30 transition-colors">
                  <div className="flex gap-3 mb-2 items-center">
                     <MessageSquare className="w-5 h-5 text-teal-400 shrink-0" />
                     <h4 className="text-sm font-bold text-white">Ngôn từ tích cực</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Sử dụng ngôn ngữ văn minh, tích cực và tôn trọng cộng đồng.</p>
               </div>
               <div className="bg-[#1A1F24] border border-blue-500/10 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                  <div className="flex gap-3 mb-2 items-center">
                     <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
                     <h4 className="text-sm font-bold text-white">Không lừa đảo</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Không đăng nội dung gây hiểu lầm, lừa đảo hoặc quảng cáo sai sự thật.</p>
               </div>
               <div className="bg-[#1A221C] border border-emerald-500/10 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex gap-3 mb-2 items-center">
                     <Scale className="w-5 h-5 text-emerald-400 shrink-0" />
                     <h4 className="text-sm font-bold text-white">Tuân thủ pháp luật</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Tuân thủ tất cả quy định pháp luật và chính sách của nền tảng.</p>
               </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8 hover:border-red-500/20 transition-colors">
            <div className="flex gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 shadow-inner">
                 <Ban className="w-6 h-6 text-red-500" />
               </div>
               <div className="pt-1">
                 <h3 className="text-xl font-bold text-white mb-2">3. Các hành vi bị cấm</h3>
                 <p className="text-sm text-gray-400">Các hành vi dưới đây có thể dẫn đến việc tạm dừng hoặc chấm dứt quyền kiếm tiền.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               <div className="bg-[#241515] border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-colors text-center flex flex-col items-center justify-center group">
                  <Activity className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-red-200/80 leading-relaxed">Sử dụng phần mềm tự động, bot để tăng lượt xem, lượt thích hoặc đăng ký.</p>
               </div>
               <div className="bg-[#241515] border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-colors text-center flex flex-col items-center justify-center group">
                  <UserX className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-red-200/80 leading-relaxed">Mua bán, trao đổi tài khoản hoặc thông tin đối tác.</p>
               </div>
               <div className="bg-[#241515] border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-colors text-center flex flex-col items-center justify-center group">
                  <RefreshCw className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-red-200/80 leading-relaxed">Chia sẻ lại nội dung có bản quyền mà chưa được cấp phép.</p>
               </div>
               <div className="bg-[#241515] border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-colors text-center flex flex-col items-center justify-center group">
                  <Copyright className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-red-200/80 leading-relaxed">Vi phạm bản quyền hoặc sử dụng nội dung không thuộc quyền sở hữu.</p>
               </div>
               <div className="bg-[#241515] border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-colors text-center flex flex-col items-center justify-center group">
                  <Monitor className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-xs text-red-200/80 leading-relaxed">Tạo nhiều kênh để né tránh hình phạt hoặc chính sách.</p>
               </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-[#18181B] rounded-1xl border border-white/5 shadow-lg p-6 md:p-8 mb-8 hover:border-yellow-500/20 transition-colors">
            <div className="flex gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 shadow-inner">
                 <span className="text-xl font-black text-yellow-500">4</span>
               </div>
               <div className="pt-1">
                 <h3 className="text-xl font-bold text-white mb-2">4. Phần thưởng & Thanh toán</h3>
                 <p className="text-sm text-gray-400">Doanh thu của bạn sẽ được tính toán và thanh toán theo chính sách hiện hành.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                     <BarChart2 className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-yellow-100 mb-1">Tỷ lệ chia sẻ doanh thu</h4>
                     <p className="text-xs text-gray-400 leading-relaxed">Theo mức chia sẻ hiện tại của chương trình Đối tác.</p>
                  </div>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                     <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-yellow-100 mb-1">Thanh toán định kỳ</h4>
                     <p className="text-xs text-gray-400 leading-relaxed">Thanh toán hàng tháng khi đạt mức tối thiểu.</p>
                  </div>
               </div>
               <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                     <CreditCard className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-yellow-100 mb-1">Phương thức thanh toán</h4>
                     <p className="text-xs text-gray-400 leading-relaxed">Chuyển khoản ngân hàng hoặc các phương thức được hỗ trợ.</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-[#15121B] rounded-1xl border border-purple-500/20 shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <HelpCircle className="w-6 h-6 text-purple-400" />
               </div>
               <div>
                  <h4 className="text-lg font-bold text-white mb-1">Cần hỗ trợ?</h4>
                  <p className="text-sm text-gray-400">Nếu bạn có bất kỳ câu hỏi nào về chính sách kiếm tiền, hãy liên hệ với chúng tôi.</p>
               </div>
            </div>
            <button className="px-6 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 font-bold text-sm hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors shrink-0">
               Liên hệ hỗ trợ
            </button>
          </div>

        </div>
      )
    }
  ];

  const activeContent = policies.find(p => p.id === activeTab)?.content;

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 shadow-lg relative overflow-hidden">

           <div className="md:w-3/5 relative z-10 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                Trung tâm
              </h1>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6 tracking-tight">
                Chính sách & Quy định
              </h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
                Khám phá các nguyên tắc, chính sách và tiêu chuẩn cộng đồng giúp định hình nên một môi trường an toàn, công bằng và tôn trọng cho tất cả mọi người.
              </p>
           </div>
           
           <div className="md:w-2/5 relative z-10 flex justify-center md:justify-end">
              <img src="./Policies.png" alt="Policies & Regulations" className="w-full max-w-[320px] object-contain drop-shadow-2xl" />
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden w-full flex items-center justify-between p-4 bg-[#151515] border border-white/10 rounded-1xl text-white font-bold shadow-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="flex items-center gap-3">
              {React.createElement(policies.find(p => p.id === activeTab)?.icon || Menu, { className: "w-6 h-6 text-purple-400" })}
              <span className="text-lg">{policies.find(p => p.id === activeTab)?.title}</span>
            </span>
            {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-400" /> : <Menu className="w-6 h-6 text-gray-400" />}
          </button>

          {/* Sidebar / Tabs */}
          <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[320px] shrink-0 bg-[#151515] rounded-1xl border border-white/5 overflow-hidden sticky top-24 shadow-2xl`}>
            <div className="p-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-[#111]">
              Danh mục
            </div>
            <div className="p-3 space-y-2">
              {policies.map((policy) => {
                const Icon = policy.icon;
                const isActive = activeTab === policy.id;
                
                return (
                  <button
                    key={policy.id}
                    onClick={() => {
                      setActiveTab(policy.id);
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-1xl text-left transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? 'bg-purple-500/10 text-white' 
                        : 'bg-transparent text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-purple-500 rounded-r-full" />}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-black/50 text-gray-500 group-hover:bg-black group-hover:text-gray-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-bold text-[15px] ${isActive ? 'text-white' : ''}`}>{policy.title}</span>
                    </div>
                    {isActive && <ChevronRight className="w-5 h-5 text-purple-400 opacity-70 relative z-10" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full min-h-[600px]">
            {activeContent}
            
            {/* Feedback footer */}
            <div className="mt-12 bg-[#151515] rounded-3xl border border-white/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-lg font-bold text-white mb-1">Thông tin này có hữu ích không?</span>
                <span className="text-sm text-gray-400">Phản hồi của bạn giúp chúng tôi cải thiện bộ quy tắc.</span>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold text-sm transition-all hover:scale-105 active:scale-95">
                  Rất hữu ích
                </button>
                <button className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 font-bold text-sm transition-all hover:scale-105 active:scale-95">
                  Cần cải thiện
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

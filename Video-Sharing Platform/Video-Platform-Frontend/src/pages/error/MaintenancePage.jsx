import { Settings, Clock, Server, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] relative overflow-hidden flex flex-col justify-between">
      {/* Background FX */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF5722]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-8 lg:px-16 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Side: Typography & Info */}
          <div className="space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-2 shadow-2xl">
              <Settings className="w-10 h-10 text-[#FF5722] animate-[spin_4s_linear_infinite]" />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Đang nâng cấp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5722] to-[#FF8A65]">
                Hệ thống
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg lg:text-xl max-w-lg leading-relaxed font-light">
              Chúng tôi đang thực hiện một số nâng cấp quan trọng về máy chủ và tính năng mới để mang lại cho bạn trải nghiệm mượt mà, chất lượng và ổn định hơn bao giờ hết.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <Server className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="text-white font-medium text-sm mb-1">Tối ưu máy chủ</h3>
                <p className="text-xs text-gray-500">Đang triển khai hệ thống lưu trữ mới và tăng cường băng thông.</p>
              </div>
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <Clock className="w-6 h-6 text-green-400 mb-3" />
                <h3 className="text-white font-medium text-sm mb-1">Thời gian dự kiến</h3>
                <p className="text-xs text-gray-500">Quá trình này thường mất khoảng 15 đến 30 phút để hoàn thành.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Features / Changelog */}
          <div className="relative">
            <div className="absolute inset-0 "></div>
            <div className="relative p-8 space-y-6">
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white tracking-wide">Điểm nổi bật trong bản cập nhật</h3>
                <span className="px-2.5 py-1 bg-[#FF5722]/20 text-[#FF5722] text-xs font-bold rounded-lg">v2.4.0</span>
              </div>

              <div className="space-y-4">
                {/* Feature 1 */}
                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">Tốc độ siêu tốc</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Tối ưu hóa luồng tải video, giảm 30% thời gian chờ đệm (buffering) ngay cả khi mạng yếu.</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xl">✨</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">Trải nghiệm Studio Mới</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Giao diện quản lý kênh hoàn toàn mới với các công cụ phân tích dữ liệu trực quan hơn.</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">Bảo mật nâng cao</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">Nâng cấp hệ thống phát hiện spam và bảo vệ bản quyền nội dung tự động bằng AI.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>support@videosharing.com</span>
                </div>
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-colors text-xs font-medium group">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Admin Login
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 lg:px-16 py-6 border-t border-white/5 text-center flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Video Sharing Platform. All rights reserved.
        </p>
        <div className="flex gap-4">
          <a href="https://facebook.com" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
             <span className="text-gray-400 text-xs font-bold">f</span>
          </a>
          <a href="https://youtube.com" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
             <span className="text-gray-400 text-[10px] font-bold">YT</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

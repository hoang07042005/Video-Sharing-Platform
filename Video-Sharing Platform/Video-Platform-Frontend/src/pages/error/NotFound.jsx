import { Link } from "react-router-dom";
import { Home, Search, AlertCircle, LayoutDashboard } from "lucide-react";

export default function NotFound({ isAdmin = false }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 w-full h-full">
      {/* 404 Icon / Graphic */}
      <div className="flex items-center justify-center mb-8 select-none">
        <span className="text-[110px] md:text-[130px] font-black text-[#2a2d36] leading-none tracking-tighter">
          4
        </span>
        <div className="mx-2 md:mx-4 flex items-center justify-center mt-2">
          <AlertCircle
            className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] text-red-500 animate-pulse"
            strokeWidth={2.5}
          />
        </div>
        <span className="text-[110px] md:text-[130px] font-black text-[#2a2d36] leading-none tracking-tighter">
          4
        </span>
      </div>

      {/* Text Content */}
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Trang này không tồn tại.
      </h1>
      <p className="text-gray-400 mb-10 max-w-md mx-auto">
        Có vẻ như bạn đã truy cập vào một liên kết bị hỏng hoặc trang đã bị xóa.
        Vui lòng thử tìm kiếm nội dung khác hoặc quay về{" "}
        {isAdmin ? "trang tổng quan" : "trang chủ"}.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {isAdmin ? (
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Về Trang Tổng Quan
          </Link>
        ) : (
          <>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              Về Trang Chủ
            </Link>
            <Link
              to="/explore"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2a2d36] hover:bg-[#3f4350] text-white rounded-full font-semibold transition-colors"
            >
              <Search className="w-5 h-5" />
              Khám Phá Video
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

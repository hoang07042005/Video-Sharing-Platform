import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  AtSign,
  Tv,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    password: "",
    fullName: "",
    channelName: "",
    handle: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col md:flex-row">
      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto md:mx-0">
          {/* Header row: Logo + Title */}
          <div className="flex items-center gap-6 mb-10">
            <Link to="/" className="block shrink-0">
              <img
                src="/logotrang.png"
                alt="Video Sharing Platform"
                className="h-22 object-contain object-left"
              />
            </Link>
            <h2 className="text-[23px] font-medium text-white tracking-tight">
              Đăng ký{" "}
              <span className="text-[#FF5722] font-semibold">tài khoản</span>
            </h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    placeholder="nhap@email.com"
                    required
                    className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="0987654321"
                    required
                    className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Channel & Handle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">Tên Kênh</label>
                <div className="relative">
                  <Tv className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    name="channelName"
                    placeholder="Kênh của tôi"
                    required
                    className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                    value={formData.channelName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">
                  Tên định danh (Handle)
                </label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    name="handle"
                    placeholder="@user"
                    required
                    className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                    value={formData.handle}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength="6"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#FF7043] hover:to-[#D84315] text-white font-bold text-base rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5722]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Đăng ký ngay <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>


          <p className="text-center text-gray-400 mt-8 text-sm">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-[#FF8A65] hover:text-[#FFCC80] font-medium transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image & Glassmorphism */}
      <div className="hidden md:block w-1/2 lg:w-[55%] relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=1600&h=1200"
          alt="Creator Studio"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />

        {/* Top Right Tags */}
        <div className="absolute top-10 right-10 z-20 flex gap-4">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-center">
            <div className="text-white font-bold text-xl leading-none mb-1">
              PRO
            </div>
            <div className="text-[10px] text-gray-300 tracking-widest uppercase font-medium">
              Creator
            </div>
          </div>
          <div className="bg-black/30 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-center">
            <div className="text-white font-bold text-xl leading-none mb-1">
              UNLTD
            </div>
            <div className="text-[10px] text-gray-300 tracking-widest uppercase font-medium">
              Access
            </div>
          </div>
        </div>

        {/* Bottom Glass Card */}
        <div className="absolute bottom-16 left-12 right-12 z-20">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 bg-[#FF3B30] rounded-full animate-pulse shadow-[0_0_10px_#FF3B30]"></span>
              <span className="text-white text-xs font-bold tracking-widest uppercase">
                Join Us
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              Bắt đầu hành trình, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB7A1] to-[#FF5722]">
                Sáng tạo không giới hạn
              </span>
            </h1>
            <p className="text-gray-300 text-sm lg:text-base max-w-md leading-relaxed font-light">
              Gia nhập mạng lưới hàng triệu nhà sáng tạo nội dung hàng đầu. Chia
              sẻ video, kết nối cộng đồng và xây dựng thương hiệu cá nhân của
              riêng bạn ngay hôm nay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

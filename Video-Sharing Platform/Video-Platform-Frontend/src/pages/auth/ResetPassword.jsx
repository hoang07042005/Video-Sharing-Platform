import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [logoUrl, setLogoUrl] = useState("/logotrang.png");

  useEffect(() => {
    axios
      .get("/api/admin/settings/public")
      .then((res) => {
        if (res.data && res.data.logoUrl) {
          setLogoUrl(res.data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/reset-password", { email, otp, newPassword });
      setSuccess(true);

      // Chuyển hướng tới trang đăng nhập sau 2s
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại hoặc yêu cầu mã OTP mới.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col md:flex-row">
      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10">
        <div className="w-full max-w-md mx-auto md:mx-0">
          {/* Header row: Logo + Title */}
          <div className="flex items-center gap-6 mb-10">
            <Link to="/" className="block shrink-0">
              <img
                src={logoUrl}
                alt="Video Sharing Platform"
                className="h-22 object-contain object-left"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-medium text-white tracking-tight mb-2">
              Đặt lại mật khẩu
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Mã xác thực đã được gửi đến{" "}
              <span className="text-white font-medium">
                {email || "email của bạn"}
              </span>
              .
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-lg mb-6">
              Đặt lại mật khẩu thành công. Đang chuyển hướng đến trang đăng
              nhập...
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Mã OTP</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nhập mã 6 chữ số"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
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

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Nhập lại mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    setError(
                      "Vui lòng tự nhập lại mật khẩu, không sử dụng copy-paste.",
                    );
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#FF7043] hover:to-[#D84315] text-white font-bold text-base rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5722]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Đặt lại mật khẩu <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel - Image & Glassmorphism */}
      <div className="hidden md:block w-1/2 lg:w-[55%] relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=1600&h=1200"
          alt="Code"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />

        {/* Bottom Glass Card */}
        <div className="absolute bottom-16 left-12 right-12 z-20">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              An toàn là <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB7A1] to-[#FF5722]">
                Trách nhiệm hàng đầu
              </span>
            </h1>
            <p className="text-gray-300 text-sm lg:text-base max-w-md leading-relaxed font-light">
              Mật khẩu mạnh mẽ giúp bảo vệ tài khoản và mọi dữ liệu quan trọng
              của bạn trên nền tảng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

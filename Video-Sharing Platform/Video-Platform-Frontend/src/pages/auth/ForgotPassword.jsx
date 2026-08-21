import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess(true);
      
      // Chuyển hướng tới trang đặt lại mật khẩu sau 2s, truyền email qua state
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
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
              <img src="/logotrang.png" alt="Video Sharing Platform" className="h-22 object-contain object-left" />
            </Link>
          </div>
          
          <div className="mb-8">
            <h2 className="text-[28px] font-medium text-white tracking-tight mb-2">
              Quên mật khẩu?
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-lg mb-6">
              Mã OTP đã được gửi đến email của bạn. Đang chuyển hướng...
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="email" 
                  placeholder="nhap@email.com"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#FF7043] hover:to-[#D84315] text-white font-bold text-base rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5722]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Gửi mã OTP <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-10 text-sm">
            Nhớ mật khẩu rồi?{' '}
            <Link to="/login" className="text-[#FF8A65] hover:text-[#FFCC80] font-medium transition-colors">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image & Glassmorphism */}
      <div className="hidden md:block w-1/2 lg:w-[55%] relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=1600&h=1200" 
          alt="Security" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        
        {/* Bottom Glass Card */}
        <div className="absolute bottom-16 left-12 right-12 z-20">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              Bảo mật tuyệt đối, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB7A1] to-[#FF5722]">
                Khôi phục dễ dàng
              </span>
            </h1>
            <p className="text-gray-300 text-sm lg:text-base max-w-md leading-relaxed font-light">
              Chúng tôi luôn đảm bảo an toàn cho tài khoản của bạn với hệ thống xác thực đa lớp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

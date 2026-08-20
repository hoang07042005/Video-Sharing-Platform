import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/auth/login', { emailOrPhone, password });
      const { token, roles, handle, avatarUrl, userId } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('roles', JSON.stringify(roles || []));
      if (userId) localStorage.setItem('userId', userId);
      if (handle) localStorage.setItem('handle', handle);
      if (avatarUrl) localStorage.setItem('avatar', avatarUrl);
      
      if (roles && (roles.includes('Admin') || roles.includes('Moderator'))) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const tokenToSend = credentialResponse.access_token || credentialResponse.credential || credentialResponse.code;
      console.log('Google login response:', credentialResponse);
      const response = await axios.post('/api/auth/google-login', { token: tokenToSend });
      const { token, roles, handle, avatarUrl, userId, isNewUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('roles', JSON.stringify(roles || []));
      if (userId) localStorage.setItem('userId', userId);
      if (handle) localStorage.setItem('handle', handle);
      if (avatarUrl) localStorage.setItem('avatar', avatarUrl);
      if (isNewUser) localStorage.setItem('showUpdateProfilePopup', 'true');
      
      if (roles && (roles.includes('Admin') || roles.includes('Moderator'))) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Đăng nhập Google thất bại.'),
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col md:flex-row">
      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10">
        
        <div className="w-full max-w-md mx-auto md:mx-0">
          {/* Header row: Logo + Title */}
          <div className="flex items-center gap-6 mb-10">
            <Link to="/" className="block shrink-0">
              <img src="/logotrang.png" alt="VividStream" className="h-22 object-contain object-left" />
            </Link>
            <h2 className="text-[23px] font-medium text-white tracking-tight">
              Đăng nhập <span className="text-[#FF5722] font-semibold">để tiếp tục</span>
            </h2>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="nhap@email.com"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-300">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs text-[#FF8A65] hover:text-white transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-[#202020] border border-transparent rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]/50 focus:bg-[#2A2A2A] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#E64A19] hover:from-[#FF7043] hover:to-[#D84315] text-white font-bold text-base rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5722]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Đăng nhập <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-xs text-gray-600">hoặc tiếp tục với</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button 
              type="button"
              onClick={() => googleLogin()}
              className="flex items-center justify-center gap-3 py-2.5 bg-transparent border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-sm text-gray-300">Google</span>
            </button>
            
            <button className="flex items-center justify-center gap-3 py-2.5 bg-transparent border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                <path fill="#ffffff" d="M16.671 15.542l.532-3.469h-3.328V9.823c0-.949.465-1.874 1.956-1.874h1.514V5.008s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.63H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z"/>
              </svg>
              <span className="font-medium text-sm text-gray-300">Facebook</span>
            </button>
          </div>

          <p className="text-center text-gray-400 mt-10 text-sm">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#FF8A65] hover:text-[#FFCC80] font-medium transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image & Glassmorphism */}
      <div className="hidden md:block w-1/2 lg:w-[55%] relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1600&h=1200" 
          alt="Esports Arena" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        
        {/* Top Right Tags */}
        <div className="absolute top-10 right-10 z-20 flex gap-4">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-center">
            <div className="text-white font-bold text-xl leading-none mb-1">2M+</div>
            <div className="text-[10px] text-gray-300 tracking-widest uppercase font-medium">Viewers</div>
          </div>
          <div className="bg-black/30 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-center">
            <div className="text-white font-bold text-xl leading-none mb-1">4K</div>
            <div className="text-[10px] text-gray-300 tracking-widest uppercase font-medium">Quality</div>
          </div>
        </div>

        {/* Bottom Glass Card */}
        <div className="absolute bottom-16 left-12 right-12 z-20">
          <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 bg-[#FF3B30] rounded-full animate-pulse shadow-[0_0_10px_#FF3B30]"></span>
              <span className="text-white text-xs font-bold tracking-widest uppercase">Live Now</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              Kết nối đam mê, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB7A1] to-[#FF5722]">
                Lan tỏa sức sống
              </span>
            </h1>
            <p className="text-gray-300 text-sm lg:text-base max-w-md leading-relaxed font-light">
              Trải nghiệm nền tảng phát trực tiếp đẳng cấp với chất lượng hình ảnh tuyệt đỉnh và cộng đồng sôi động nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

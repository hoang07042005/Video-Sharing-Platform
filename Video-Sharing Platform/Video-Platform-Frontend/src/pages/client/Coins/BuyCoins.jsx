import { useState, useEffect } from 'react';
import { Coins, Zap, ShieldCheck, CheckCircle2, Crown, Flame, Play, Ban, Download, Tv, Headphones, Gift, Award, Star } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PACKAGES = [
  { id: 1, amount: 10000, coins: 100, popular: false, title: "KHỞI ĐẦU", icon: <Star className="w-5 h-5" />, color: "text-blue-400", bgGradient: "from-[#111A2B] to-[#111111]", border: "border-blue-500/30", btnGradient: "from-blue-600 to-cyan-500", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  { id: 2, amount: 20000, coins: 200, popular: false, title: "CƠ BẢN", icon: <Gift className="w-5 h-5" />, color: "text-green-400", bgGradient: "from-[#112B1A] to-[#111111]", border: "border-green-500/30", btnGradient: "from-green-600 to-emerald-500", shadow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]" },
  { id: 3, amount: 50000, coins: 500, popular: true, title: "PHỔ BIẾN", icon: <Flame className="w-5 h-5" />, color: "text-[#FF9800]", bgGradient: "from-[#3A2214] to-[#111111]", border: "border-[#FF9800]/50", btnGradient: "from-[#FF5722] to-[#FF9800]", shadow: "shadow-[0_0_20px_rgba(255,152,0,0.4)]" },
  { id: 4, amount: 100000, coins: 1000, popular: false, title: "NÂNG CAO", icon: <Award className="w-5 h-5" />, color: "text-[#E91E63]", bgGradient: "from-[#3A1428] to-[#111111]", border: "border-[#E91E63]/30", btnGradient: "from-[#E91E63] to-pink-500", shadow: "shadow-[0_0_15px_rgba(233,30,99,0.3)]" },
  { id: 5, amount: 500000, coins: 5000, popular: false, title: "CAO CẤP", icon: <Crown className="w-5 h-5" />, color: "text-purple-400", bgGradient: "from-[#1E112B] to-[#111111]", border: "border-[#9C27B0]/30", btnGradient: "from-[#7E57C2] to-[#5E35B1]", shadow: "shadow-[0_0_15px_rgba(156,39,176,0.3)]" },
];

export default function BuyCoins() {
  const [loadingPkgId, setLoadingPkgId] = useState(null);
  const [coins, setCoins] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      axios.get('/api/payment/current-plan', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data && res.data.coins !== undefined) {
          setCoins(res.data.coins);
        }
      }).catch(err => console.error(err));
    }
    
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      sessionStorage.setItem('returnUrl', returnTo);
    }
  }, [location, token]);

  const handleBuy = async (pkg) => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để nạp xu');
      return;
    }
    
    setLoadingPkgId(pkg.id);
    try {
      const response = await axios.post('/api/payment/create-payment-url', {
        plan: 'BuyCoins',
        cycle: 'OneTime',
        amount: pkg.amount,
        frontendUrl: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoadingPkgId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24 pt-12">
      {/* Header */}
      <div className="max-w-[800px] mx-auto px-4 text-center mb-16 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight flex items-center justify-center gap-3">
          <Coins className="w-10 h-10 md:w-12 md:h-12 text-[#FF5722]" />
          <span className="bg-gradient-to-r from-[#FF5722] to-[#E91E63] bg-clip-text text-transparent">Nạp Xu</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl">
          Nạp Xu để ủng hộ nhà sáng tạo, tặng quà livestream và trải nghiệm các tính năng độc quyền trên hệ thống.
        </p>
      </div>

      {isLoggedIn && (
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 mb-12">
           <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-gradient-to-br from-[#FF5722]/20 to-[#E91E63]/20 rounded-full flex items-center justify-center border border-[#FF5722]/30">
                 <Coins className="w-7 h-7 text-[#FF5722]" />
               </div>
               <div>
                 <p className="text-gray-400 text-sm font-medium mb-1">Số dư hiện tại của bạn</p>
                 <div className="text-3xl font-bold text-white flex items-baseline gap-2">
                   {coins.toLocaleString()} <span className="text-xl text-[#FF5722]">Xu</span>
                 </div>
               </div>
             </div>
             <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full font-medium border border-green-500/20">
               <ShieldCheck className="w-5 h-5" /> Thanh toán an toàn qua VNPay
             </div>
           </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className={`bg-gradient-to-b ${pkg.bgGradient} rounded-3xl p-6 border ${pkg.border} flex flex-col h-full hover:${pkg.border.replace('/30', '/60')} transition-all relative ${pkg.popular ? `shadow-[0_0_30px_rgba(255,152,0,0.15)] hover:${pkg.shadow}` : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9800] text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Khuyên dùng
                </div>
              )}
              
              <div className="text-center mb-6 mt-2">
                <h3 className={`text-lg font-bold ${pkg.color} mb-1 flex items-center justify-center gap-2`}>
                  {pkg.icon}
                  {pkg.title}
                </h3>
                <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">Gói nhận được</p>
              </div>
              
              <div className="text-center mb-8">
                <span className="text-4xl font-bold text-white">{pkg.coins.toLocaleString()}</span>
                <span className="text-xl text-white ml-1">Xu</span>
              </div>
              
              <button 
                onClick={() => handleBuy(pkg)}
                disabled={loadingPkgId !== null}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${pkg.btnGradient} text-white font-bold mb-8 hover:opacity-90 transition-opacity ${pkg.shadow} disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loadingPkgId === pkg.id ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   `Mua: ${pkg.amount.toLocaleString('vi-VN')} đ`
                )}
              </button>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


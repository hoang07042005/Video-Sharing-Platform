import { useState, useEffect } from 'react';
import { Coins, Zap, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PACKAGES = [
  { id: 1, amount: 10000, coins: 100, popular: false, color: 'from-blue-500 to-cyan-400' },
  { id: 2, amount: 20000, coins: 200, popular: false, color: 'from-green-500 to-emerald-400' },
  { id: 3, amount: 50000, coins: 500, popular: true, color: 'from-orange-500 to-yellow-400' },
  { id: 4, amount: 100000, coins: 1000, popular: false, color: 'from-purple-500 to-pink-500' },
  { id: 5, amount: 500000, coins: 5000, popular: false, color: 'from-red-500 to-rose-400' },
];

export default function BuyCoins() {
  const [selectedPackage, setSelectedPackage] = useState(3);
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      // Fetch user coins via current-plan endpoint
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

  const handleBuy = async () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để nạp xu');
      return;
    }
    
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 mb-6 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
            <Coins className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Nạp Xu</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Sử dụng Xu để tặng quà cho các streamer yêu thích của bạn. Nạp an toàn, nhanh chóng và bảo mật 100%.
          </p>
        </div>

        {/* Current Balance */}
        {isLoggedIn && (
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Số dư hiện tại</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <Coins className="w-6 h-6 text-yellow-500" />
                {coins.toLocaleString()} Xu
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full font-medium border border-green-400/20">
              <ShieldCheck className="w-4 h-4" /> Thanh toán an toàn
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative bg-[#121212] border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                selectedPackage === pkg.id 
                  ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.15)] scale-[1.02]' 
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3" /> PHỔ BIẾN
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4 shadow-lg`}>
                <Coins className="w-6 h-6 text-white" />
              </div>
              
              <div className="text-3xl font-bold text-white mb-1">{pkg.coins.toLocaleString()} Xu</div>
              <div className="text-gray-400 text-sm mb-4">Gói tiện ích</div>
              
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Thanh toán</span>
                <span className="text-lg font-bold text-yellow-500">{pkg.amount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-lg font-bold text-white mb-1">
              Tổng thanh toán: <span className="text-yellow-500 text-2xl ml-2">{PACKAGES.find(p => p.id === selectedPackage)?.amount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="text-sm text-gray-400">
              Bạn sẽ nhận được {PACKAGES.find(p => p.id === selectedPackage)?.coins.toLocaleString()} Xu sau khi thanh toán thành công
            </div>
          </div>
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Nạp ngay bằng VNPay <Zap className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

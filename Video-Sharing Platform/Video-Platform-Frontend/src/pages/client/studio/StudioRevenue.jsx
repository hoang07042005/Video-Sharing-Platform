import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, Landmark, DollarSign, History, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudioRevenue() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalDonatedMoney: 0, totalGiftedCoins: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const BANK_OPTIONS = [
    { name: "Ví MoMo", value: "MoMo", logo: "/public/images/bank-logos/Icon-Momo.png" },
    { name: "Ví ZaloPay", value: "ZaloPay", logo: "/public/images/bank-logos/Icon-ZaloPay.png" },
    { name: "Ví VNPay", value: "VNPay", logo: "/public/images/bank-logos/Icon-VnPay.png" },
    { name: "Vietcombank", value: "Vietcombank", logo: "/public/images/bank-logos/Icon-Vietcombank.png" },
    { name: "Techcombank", value: "Techcombank", logo: "/public/images/bank-logos/Icon-Techcombank-TCB.png" },
    { name: "MB Bank", value: "MB Bank", logo: "/public/images/bank-logos/Icon-MB-Bank-MBB.png" },
    { name: "VietinBank", value: "VietinBank", logo: "/public/images/bank-logos/Icon-VietinBank-CTG.png" },
    { name: "BIDV", value: "BIDV", logo: "/public/images/bank-logos/Icon-BIDV.png" },
    { name: "Agribank", value: "Agribank", logo: "/public/images/bank-logos/Icon-Agribank.png" },
    { name: "TPBank", value: "TPBank", logo: "/public/images/bank-logos/Icon-TPBank.png" },
    { name: "VPBank", value: "VPBank", logo: "/public/images/bank-logos/Icon-VPBank.png" },
    { name: "Sacombank", value: "Sacombank", logo: "/public/images/bank-logos/Icon-Sacombank.png" },
  ];

  const [formData, setFormData] = useState({
    amountVnd: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    note: ''
  });

  const COIN_RATE = 100; // 1 Coin = 100 VND
  
  // Phí nền tảng
  const FEE_COIN_OWN = 0.05; // 5% cho xu mua
  const FEE_COIN_GIFT = 0.30; // 30% cho xu được tặng
  const FEE_DONATE = 0.10; // 10% cho tiền donate
  const FEE_MEMBERSHIP = 0.30; // 30% cho tiền hội viên

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [planRes, historyRes, statsRes] = await Promise.all([
        axios.get('/api/payment/current-plan', { headers }),
        axios.get('/api/withdrawal/history', { headers }),
        axios.get('/api/withdrawal/stats', { headers })
      ]);
      setProfile({ coins: planRes.data.coins || 0 });
      setWithdrawals(historyRes.data);
      setStats({
        totalDonatedMoney: statsRes.data.totalDonatedMoney || 0,
        totalGiftedCoins: statsRes.data.totalGiftedCoins || 0,
        totalMembershipRevenue: statsRes.data.totalMembershipRevenue || 0
      });
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRemainingVirtualBuckets = () => {
    if (!stats || !withdrawals) return { giftVND: 0, donateVND: 0, membershipVND: 0 };
    
    let giftCoins = Math.floor(stats.totalGiftedCoins * (1 - FEE_COIN_GIFT));
    let donateCoins = Math.floor((stats.totalDonatedMoney / COIN_RATE) * (1 - FEE_DONATE));
    let membershipCoins = Math.floor(((stats.totalMembershipRevenue || 0) / COIN_RATE) * (1 - FEE_MEMBERSHIP));

    const totalWithdrawnCoins = withdrawals
      .filter(w => w.status !== 'Rejected')
      .reduce((sum, w) => sum + w.coins, 0);

    let remainingWithdrawn = totalWithdrawnCoins;

    if (remainingWithdrawn >= giftCoins) { remainingWithdrawn -= giftCoins; giftCoins = 0; }
    else { giftCoins -= remainingWithdrawn; remainingWithdrawn = 0; }

    if (remainingWithdrawn >= donateCoins) { remainingWithdrawn -= donateCoins; donateCoins = 0; }
    else { donateCoins -= remainingWithdrawn; remainingWithdrawn = 0; }

    if (remainingWithdrawn >= membershipCoins) { remainingWithdrawn -= membershipCoins; membershipCoins = 0; }
    else { membershipCoins -= remainingWithdrawn; remainingWithdrawn = 0; }

    return {
      giftVND: giftCoins * COIN_RATE,
      donateVND: donateCoins * COIN_RATE,
      membershipVND: membershipCoins * COIN_RATE,
      rawGiftCoins: Math.floor(giftCoins / (1 - FEE_COIN_GIFT)),
      rawDonateVND: Math.floor((donateCoins / (1 - FEE_DONATE)) * COIN_RATE),
      rawMembershipVND: Math.floor((membershipCoins / (1 - FEE_MEMBERSHIP)) * COIN_RATE)
    };
  };

  const getActualTotalAvailableVND = () => {
    if (!stats || !withdrawals) return 0;
    
    const virtualBalanceCoins = 
      Math.floor(stats.totalGiftedCoins * (1 - FEE_COIN_GIFT)) +
      Math.floor((stats.totalDonatedMoney / COIN_RATE) * (1 - FEE_DONATE)) +
      Math.floor(((stats.totalMembershipRevenue || 0) / COIN_RATE) * (1 - FEE_MEMBERSHIP));
    
    const totalWithdrawnCoins = withdrawals
      .filter(w => w.status !== 'Rejected')
      .reduce((sum, w) => sum + w.coins, 0);

    let remainingVirtualBalance = virtualBalanceCoins - totalWithdrawnCoins;
    if (remainingVirtualBalance < 0) remainingVirtualBalance = 0;

    const remainingVirtualVND = remainingVirtualBalance * COIN_RATE;
    const currentOwnCoinsVND = (profile?.coins || 0) * COIN_RATE * (1 - FEE_COIN_OWN);
    
    return Math.floor(remainingVirtualVND + currentOwnCoinsVND);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amountVnd || !formData.bankName || !formData.bankAccountNumber || !formData.bankAccountName) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const amountToWithdraw = parseInt(formData.amountVnd.replace(/[^0-9]/g, ''));
    if (amountToWithdraw <= 0 || isNaN(amountToWithdraw)) {
      toast.error('Số tiền rút không hợp lệ');
      return;
    }

    const totalAvailableVND = getActualTotalAvailableVND();

    if (amountToWithdraw > totalAvailableVND) {
      toast.error('Số dư không đủ');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('/api/withdrawal/request', {
        amountVnd: amountToWithdraw,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountName: formData.bankAccountName
      }, { headers });
      
      toast.success('Đã gửi yêu cầu rút tiền thành công');
      setFormData({
        amountVnd: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: ''
      });
      fetchData(); // reload data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500">Chờ duyệt</span>;
      case 'Completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">Thành công</span>;
      case 'Rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">Từ chối</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 p-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Doanh thu & Rút tiền</h1>
          <p className="text-sm text-gray-400">Quản lý số dư và tạo lệnh rút tiền về tài khoản ngân hàng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Số dư Xu hiện có */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-300 font-medium">Số dư Xu hiện có</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-bold text-white">{profile?.coins?.toLocaleString()}</span>
              <span className="text-gray-400 font-medium">Xu</span>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/5 relative">
            <div className="text-xs text-gray-400 mb-1">Xu được nhận (Tặng quà):</div>
            <div className="text-purple-400 font-medium text-sm">{getRemainingVirtualBuckets().rawGiftCoins.toLocaleString()} Xu</div>
            {/* Coins decoration */}
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.7 13.8l-2.7-2.7"/></svg>
            </div>
          </div>
        </div>

        {/* Card 2: Tiền Donate */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-300 font-medium">Tiền Donate nhận được</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-bold text-white">{getRemainingVirtualBuckets().rawDonateVND.toLocaleString()}</span>
              <span className="text-gray-400 font-medium">VNĐ</span>
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="text-xs text-gray-500">* Tiền donate qua VNPay.</div>
          </div>
          {/* Chart decoration */}
          <div className="absolute bottom-0 left-0 w-full h-24 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-green-500 fill-transparent stroke-current stroke-2">
              <path d="M0,30 Q20,40 40,20 T80,10 T100,20" />
            </svg>
          </div>
        </div>

        {/* Card 3: Số dư có thể rút */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gray-300 font-medium">Số dư có thể rút</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-bold text-white">{getActualTotalAvailableVND().toLocaleString()}</span>
              <span className="text-gray-400 font-medium">VNĐ</span>
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <button className="px-4 py-1.5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/5 transition-colors">
              Chi tiết &gt;
            </button>
          </div>
          {/* Bank decoration */}
          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
            <Landmark className="w-20 h-20 text-white" />
          </div>
        </div>

        {/* Card 4: Tổng quan doanh thu */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Tổng quan doanh thu</h3>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <History className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span className="text-gray-400">Tiền quy đổi Xu:</span>
                </div>
                <div className="text-gray-300 font-medium">
                  {Math.floor(((profile?.coins || 0) * COIN_RATE) * (1 - FEE_COIN_OWN)).toLocaleString()} VNĐ <span className="text-red-400 ml-1">(-5%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-gray-400">Quỹ đổi Xu nhận:</span>
                </div>
                <div className="text-gray-300 font-medium">
                  {getRemainingVirtualBuckets().giftVND.toLocaleString()} VNĐ <span className="text-red-400 ml-1">(-30%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  <span className="text-gray-400">Tiền Donate:</span>
                </div>
                <div className="text-gray-300 font-medium">
                  {getRemainingVirtualBuckets().donateVND.toLocaleString()} VNĐ <span className="text-red-400 ml-1">(-10%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <span className="text-gray-400">Tiền hội viên:</span>
                </div>
                <div className="text-gray-300 font-medium">
                  {getRemainingVirtualBuckets().membershipVND.toLocaleString()} VNĐ <span className="text-red-400 ml-1">(-30%)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between cursor-pointer group">
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Xem chi tiết doanh thu</span>
            <span className="text-gray-500 group-hover:text-white transition-colors">&gt;</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-10 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
              </div>
              Quy định rút tiền
            </h3>
            <ul className="space-y-8 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>Tỷ giá quy đổi mặc định: <b>1 Xu = 100 VNĐ</b></span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>Số dư Xu sẽ bị trừ ngay sau khi bạn tạo lệnh rút.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>Nếu lệnh bị từ chối, số Xu sẽ được hoàn lại vào tài khoản.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span>Thời gian xử lý giao dịch thường từ 1 - 3 ngày làm việc.</span>
              </li>
            </ul>
          </div>
          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-[#ffe5e5] to-[#fff4e5] rounded-2xl p-8 relative overflow-hidden flex items-center">
          <img src="/StudioRevenue.png" alt="" className="w-full h-full object-cover absolute top-0 left-0" />
          <div className="relative z-10 max-w-[60%]">
            <h3 className="text-[28px] font-bold text-gray-900 mb-3">Tăng thu nhập của bạn</h3>
            <p className="text-gray-700 w-50 text-sm mb-6 leading-relaxed">
              Nhận nhiều quà tặng từ người xem để tăng thu nhập và xây dựng cộng đồng mạnh mẽ.
            </p>
            <button className="bg-gradient-to-r from-[#ff6b00] to-[#ff9900] text-white font-medium px-6 py-2 rounded-full text-sm hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/30">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdraw Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-[#141418] border border-white/5 rounded-2xl p-6 sticky top-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Tạo lệnh rút tiền
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Số tiền muốn rút (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="amountVnd"
                    value={formData.amountVnd}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : '';
                      setFormData(prev => ({...prev, amountVnd: formattedValue}));
                    }}
                    placeholder="Nhập số tiền"
                    className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all text-sm"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center text-xs text-gray-400 font-medium">
                    VNĐ
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Số dư có thể rút: <span className="text-orange-400 font-semibold">{getActualTotalAvailableVND().toLocaleString()} VNĐ</span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ngân hàng thụ hưởng</label>
                <div 
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white flex items-center justify-between cursor-pointer transition-colors hover:border-purple-500/50"
                >
                  {formData.bankName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white rounded-md p-0.5 flex shrink-0">
                        <img 
                          src={BANK_OPTIONS.find(b => b.value === formData.bankName)?.logo} 
                          alt={formData.bankName} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-sm">{BANK_OPTIONS.find(b => b.value === formData.bankName)?.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Chọn ngân hàng</span>
                  )}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isBankDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Danh sách thả xuống (Menu Dropdown) */}
                {isBankDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsBankDropdownOpen(false)}
                    ></div>
                    
                    <div className="absolute z-50 w-full mt-2 bg-[#141418] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#141418] [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4b5563] [scrollbar-width:thin] [scrollbar-color:#374151_#141418]">
                      {BANK_OPTIONS.map((bank) => (
                        <div
                          key={bank.value}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, bankName: bank.value }));
                            setIsBankDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${formData.bankName === bank.value ? 'bg-purple-500/10 text-purple-400' : 'text-gray-300'}`}
                        >
                          <div className="w-8 h-8 bg-white rounded-md flex shrink-0">
                            <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-sm font-medium">{bank.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Số tài khoản</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                  placeholder="Nhập số tài khoản"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tên chủ tài khoản</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={handleChange}
                  className="w-full bg-[#0F0F13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors uppercase text-sm"
                  placeholder="Nhập tên chủ tài khoản"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || (profile?.coins || 0) === 0}
                className="w-full bg-gradient-to-r from-[#b14cff] to-[#ff6b00] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : (
                  'Rút tiền'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-[#141418] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                Lịch sử rút tiền
              </h3>
              <div className="text-xs text-gray-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1">
                Xem tất cả &gt;
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#1A1A20] text-gray-300">
                  <tr>
                    <th className="px-6 py-4 font-medium">Thời gian</th>
                    <th className="px-6 py-4 font-medium">Số tiền (VNĐ)</th>
                    <th className="px-6 py-4 font-medium">Ngân hàng</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        Bạn chưa có giao dịch rút tiền nào
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-green-400 font-medium whitespace-nowrap">
                          {item.amountFiat.toLocaleString()} VNĐ
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-300">{item.bankName}</div>
                          <div className="text-xs">{item.bankAccountNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(item.status)}
                          {item.adminNote && (
                            <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={item.adminNote}>
                              Ghi chú: {item.adminNote}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

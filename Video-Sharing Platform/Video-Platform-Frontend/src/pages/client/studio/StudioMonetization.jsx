import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Trophy, CheckCircle2, Clock, Users, PlaySquare, AlertCircle,
  Shield, Zap, Headphones, DollarSign, TrendingUp, Star, Rocket, HelpCircle,
  Video, Eye, ArrowUpRight, ShieldX, ClipboardList, UploadCloud, BarChart2, Scale, Info, Calendar, XCircle, AlertTriangle, ArrowRight,
  FileSearch, Wrench, ShieldAlert, ClipboardCheck, FileText, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const CircleProgress = ({ percent, size = 56, strokeWidth = 5, color }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff10" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
};

export default function StudioMonetization() {
  const [status, setStatus] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [statusRes, earningsRes] = await Promise.allSettled([
        axios.get('/api/monetization/status', { headers }),
        axios.get('/api/monetization/earnings', { headers })
      ]);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data);
      else setError(statusRes.reason?.response?.data?.message || 'Lỗi tải dữ liệu');
      if (earningsRes.status === 'fulfilled') setEarnings(earningsRes.value.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      await axios.post('/api/monetization/apply', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-16 text-center text-gray-400">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-16 text-center text-red-400">{error}</div>;
  if (!status) return null;

  const { isMonetized, monetizationStatus, currentStats, requirements, isEligible, application } = status;
  const evidenceUrls = application?.evidenceUrl ? application.evidenceUrl.split(',') : [];
  const subPercent = Math.min(100, (currentStats.subscribers / requirements.subscribers) * 100);
  const watchPercent = Math.min(100, (currentStats.watchHours / requirements.watchHours) * 100);

  const benefits = [
    { icon: DollarSign, title: 'Kiếm tiền linh hoạt', desc: 'Nhiều hình thức kiếm tiền phù hợp với nội dung của bạn.' },
    { icon: TrendingUp, title: 'Phát triển bền vững', desc: 'Công cụ hỗ trợ giúp bạn phát triển kênh hiệu quả hơn.' },
    { icon: Users, title: 'Cộng đồng sáng tạo', desc: 'Kết nối với hàng triệu nhà sáng tạo trên nền tảng.' },
    { icon: Headphones, title: 'Hỗ trợ tận tâm', desc: 'Đội ngũ hỗ trợ luôn đồng hành cùng bạn 24/7.' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded mt-6 mb-8 flex flex-col justify-center"
        style={{
          backgroundImage: 'url(/monetization-hero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          minHeight: '300px',
        }}>
        {/* Subtle left fade so text stays legible */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(13,11,34,0.55) 0%, rgba(13,11,34,0.2) 50%, transparent 100%)' }} />
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
          {/* Stars */}
          {[...Array(14)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                top: `${10 + (i * 31) % 80}%`, left: `${5 + (i * 47) % 60}%`,
                opacity: 0.25 + (i % 4) * 0.12
              }} />
          ))}
        </div>

        <div className="relative pl-30 pt-10 pb-10 flex flex-col justify-center" style={{ minHeight: '300px' }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 rounded-full px-3 py-1 mb-4 w-fit">
            <Star className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">Chương trình Đối tác Creator</span>
          </div>

          <h1 className="text-4xl font-black mb-3 leading-tight max-w-xl">
            Kiếm tiền từ nội dung<br />
            <span style={{ background: 'linear-gradient(90deg, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bạn tạo ra
            </span>
          </h1>

          <p className="text-gray-300 text-sm mb-5 leading-relaxed max-w-md">
            Tham gia Chương trình Đối tác để kiếm tiền từ lượt xem, quảng cáo và hội viên.
            Xây dựng kênh bền vững và phát triển thu nhập cùng nền tảng.
          </p>

          {/* Stats row */}
          <div className="flex gap-5 mb-6">
            {[
              { value: '1,000+', label: 'Creator đang kiếm tiền' },
              { value: '4,000h', label: 'Ngưỡng giờ xem tối thiểu' },
              { value: '70%', label: 'Doanh thu chia sẻ cho Creator' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-lg font-black text-white leading-none">{value}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-full max-w-sm h-px bg-white/10 mb-5" />

          {/* Feature icons */}
          <div className="flex gap-6">
            {[
              { icon: Shield, label: 'Minh bạch', sub: 'Doanh thu rõ ràng' },
              { icon: Zap, label: 'Nhanh chóng', sub: 'Xử duyệt nhanh' },
              { icon: Headphones, label: 'Hỗ trợ 24/7', sub: 'Đội ngũ luôn sẵn sàng' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-none">{label}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-10">

        {/* ── Status views ── */}
        {(monetizationStatus === 'Pending' || monetizationStatus === 'Checking') && (
          <div className="rounded-2xl border border-blue-500/20 bg-[#0a1526] p-6 md:p-8 flex flex-col gap-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_4fr_3fr] gap-6 md:gap-8">
              {/* Col 1: Icon */}
              <div className="flex justify-center items-center h-full">
                <div className="w-32 h-32 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
                  <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center relative z-10">
                    <Clock className="w-12 h-12 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Col 2: Title and Desc */}
              <div className="flex flex-col items-start justify-center h-full">
                <h2 className="text-2xl xl:text-3xl font-bold text-blue-400 mb-4 leading-tight">
                  {monetizationStatus === 'Checking' ? 'Đơn của bạn đang được kiểm tra' : 'Đơn của bạn đang chờ duyệt'}
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {monetizationStatus === 'Checking' 
                    ? 'Đội ngũ của chúng tôi hiện đang xem xét kênh của bạn để đảm bảo kênh tuân thủ các chính sách và nguyên tắc cộng đồng. Vui lòng kiên nhẫn chờ đợi.' 
                    : 'Yêu cầu bật kiếm tiền của bạn đã được gửi thành công. Chúng tôi sẽ sớm tiến hành kiểm tra kênh của bạn.'}
                </p>
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Ngày gửi: {new Date(application?.appliedAt || new Date()).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Col 3: Status */}
              <div className="flex flex-col justify-center h-full">
                <div className="bg-[#111c33] rounded-xl p-6 border border-blue-500/10 flex flex-col justify-center items-center text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    {monetizationStatus === 'Checking' ? <FileSearch className="w-6 h-6 text-blue-400" /> : <Clock className="w-6 h-6 text-blue-400" />}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Trạng thái hiện tại</div>
                  <div className="text-lg font-bold text-blue-400">
                    {monetizationStatus === 'Checking' ? 'Đang kiểm tra' : 'Chờ duyệt'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(isMonetized || monetizationStatus === 'Approved') && (
          <div className="rounded-2xl border border-green-500/20 bg-[#0a1f11] overflow-hidden flex flex-col mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_3fr_3fr_2fr] gap-6 md:gap-8 p-6 md:p-8">
              {/* Col 1: Icon */}
              <div className="flex justify-center items-center h-full">
                <div className="w-32 h-32 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse" />
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center relative z-10">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </div>
                </div>
              </div>

              {/* Col 2: Title and Desc */}
              <div className="flex flex-col items-start justify-start h-full">
                <h2 className="text-2xl xl:text-3xl font-bold text-green-400 mb-4 leading-tight">
                  Kênh của bạn đã<br/>được bật kiếm tiền
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Chúc mừng! Kênh của bạn đã đáp ứng đầy đủ các chính sách và nguyên tắc của chúng tôi. Bạn hiện có thể bắt đầu kiếm tiền từ nội dung của mình.
                </p>
                <div className="mt-auto flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/20 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Ngày bật kiếm tiền: {new Date(application?.reviewedAt || application?.appliedAt || new Date()).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Col 3: Features */}
              <div className="flex flex-col justify-start h-full">
                <div className="flex items-center gap-2 text-green-400 font-semibold mb-4">
                  <CheckCircle2 className="w-5 h-5" /> Bạn có thể:
                </div>
                <div className="space-y-3">
                  {[
                    'Hiển thị quảng cáo trên video',
                    'Nhận doanh thu từ lượt xem',
                    'Sử dụng Super Chat, Hội viên kênh',
                    'Nhận doanh thu từ YouTube Premium',
                    'Tham gia các chương trình kiếm tiền khác'
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 4: Revenue */}
              <div className="flex flex-col justify-start h-full">
                <div className="bg-[#0f2e1a] rounded-xl p-4 border border-green-500/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Trạng thái hiện tại</div>
                      <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Đang kiếm tiền
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="bg-green-500/5 border-t border-green-500/10 p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-green-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-white">Lưu ý quan trọng:</span> <span className="text-gray-300">Hãy tiếp tục tuân thủ Chính sách của chúng tôi. Nếu có vi phạm, quyền kiếm tiền có thể bị tạm dừng hoặc thu hồi.</span>
                </div>
              </div>
              <button className="text-green-400 hover:text-green-300 text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {monetizationStatus === 'Rejected' && (
          <div className="rounded-2xl border border-red-500/20 bg-[#160a0a] p-6 md:p-8 flex flex-col gap-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_3fr_2fr_2fr_2fr] gap-6 md:gap-8">
              {/* Col 1: Icon */}
              <div className="flex justify-center items-center h-full">
                <div className="w-32 h-32 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-full" />
                  <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center relative z-10">
                    <ShieldX className="w-12 h-12 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Col 2: Title and Desc */}
              <div className="flex flex-col items-start justify-start h-full">
                <h2 className="text-2xl xl:text-3xl font-bold text-red-500 mb-4 leading-tight">
                  Kênh của bạn đã bị<br/>từ chối bật kiếm tiền
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Rất tiếc, kênh của bạn chưa đủ điều kiện để bật kiếm tiền. Vui lòng xem lý do từ chối và thực hiện các điều chỉnh cần thiết trước khi gửi yêu cầu lại.
                </p>
                <div className="mt-auto flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 text-sm font-medium">
                  <Calendar className="w-4 h-4" /> Ngày từ chối: {new Date(application?.reviewedAt || application?.appliedAt || new Date()).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Middle 1 */}
              <div className="flex flex-col justify-start gap-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                  <AlertCircle className="w-5 h-5" /> Lý do từ chối
                </div>
                {application?.adminNote ? (
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                    <span className="text-gray-300 text-sm whitespace-pre-wrap">{application.adminNote}</span>
                  </div>
                ) : (
                  <>
                    {[
                      'Nội dung lặp lại hoặc tái sử dụng nhiều',
                      'Nội dung không tuân thủ chính sách nhà quảng cáo',
                      'Nội dung ít giá trị hoặc không mang tính nguyên bản'
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                        <span className="text-gray-300 text-sm">{text}</span>
                      </div>
                    ))}
                  </>
                )}
                {evidenceUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-red-400/80 mb-2 font-medium">Bằng chứng đính kèm:</div>
                    <div className="flex flex-wrap gap-3">
                      {evidenceUrls.map((url, idx) => (
                        <div 
                          key={idx} 
                          className="w-16 h-16 rounded-lg overflow-hidden border border-red-500/20 cursor-pointer hover:border-red-500/50 transition-colors shadow-lg"
                          onClick={() => setSelectedImageIndex(idx)}
                        >
                          <img src={url} className="w-full h-full object-cover" alt="Bằng chứng" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle 2 */}
              <div className="flex flex-col justify-start gap-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                  <ClipboardList className="w-5 h-5" /> Bạn nên làm gì?
                </div>
                {[
                  'Xem lại Chính sách kiếm tiền của chúng tôi',
                  'Chỉnh sửa và cải thiện nội dung kênh',
                  'Xóa các nội dung vi phạm (nếu có)',
                  'Gửi lại yêu cầu sau khi đã khắc phục'
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <ClipboardCheck className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>

              {/* Right */}
              <div className="flex flex-col justify-start h-full">
                <div className="flex items-center gap-2 text-white font-semibold mb-4">
                  <UploadCloud className="w-5 h-5 text-red-400" /> Gửi yêu cầu lại
                </div>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  Bạn có thể gửi lại yêu cầu sau khi đã khắc phục các vấn đề được nêu ở bên.
                </p>
                <button 
                  onClick={handleApply}
                  disabled={!isEligible || applying}
                  className="mt-auto w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                >
                  {applying ? 'Đang gửi...' : 'Gửi yêu cầu lại'}
                </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="bg-[#240f0f] border border-red-500/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-red-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-semibold text-white">Lưu ý:</span> <span className="text-gray-300">Nếu kênh của bạn tiếp tục vi phạm các chính sách, bạn có thể bị hạn chế hoặc không đủ điều kiện tham gia chương trình kiếm tiền trong tương lai.</span>
                </div>
              </div>
              <button className="text-red-400 hover:text-red-300 text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {monetizationStatus === 'Revoked' && (
          <div className="rounded-2xl border border-yellow-500/20 bg-[#181105] p-6 md:p-8 flex flex-col gap-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_3fr_2fr_2fr_2fr] gap-4 md:gap-4">
              {/* Col 1: Icon */}
              <div className="flex justify-center items-center h-full">
                <div className="w-32 h-32 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-full" />
                  <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center relative z-10">
                    <DollarSign className="w-12 h-12 text-yellow-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-1 bg-yellow-500 rotate-45 rounded-full" />
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500 absolute bottom-3 left-3 z-30 drop-shadow-md" />
                </div>
              </div>

              {/* Col 2: Title and Desc */}
              <div className="flex flex-col items-start justify-start h-full">
                <h2 className="text-1xl xl:text-2xl font-bold text-yellow-500 mb-4 leading-tight">
                  Kênh của bạn đã bị<br/>tắt kiếm tiền
                </h2>
                <p className="text-gray-300 text-xs leading-relaxed mb-6">
                  Quyền kiếm tiền trên kênh của bạn đã bị tạm dừng do vi phạm chính sách hoặc nguyên tắc cộng đồng. Bạn có thể kháng nghị nếu cho rằng đây là nhầm lẫn.
                </p>
                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg border border-yellow-500/20 text-xs font-medium">
                  <Calendar className="w-4 h-4" /> Ngày tắt kiếm tiền: {new Date(application?.reviewedAt || application?.appliedAt || new Date()).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Middle 1 */}
              <div className="flex flex-col justify-start gap-4">
                <div className="flex items-center gap-2 text-yellow-500 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" /> Lý do tắt kiếm tiền
                </div>
                {application?.adminNote ? (
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-2" />
                    <span className="text-gray-300 text-xs whitespace-pre-wrap">{application.adminNote}</span>
                  </div>
                ) : (
                  <>
                    {[
                      'Nội dung vi phạm Nguyên tắc cộng đồng',
                      'Nội dung vi phạm chính sách bản quyền',
                      'Hành vi gian lận hoặc lừa đảo',
                      'Nội dung gây hại hoặc nguy hiểm'
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-2" />
                        <span className="text-gray-300 text-sm">{text}</span>
                      </div>
                    ))}
                  </>
                )}
                {evidenceUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-yellow-500/80 mb-2 font-medium">Bằng chứng đính kèm:</div>
                    <div className="flex flex-wrap gap-3">
                      {evidenceUrls.map((url, idx) => (
                        <div 
                          key={idx} 
                          className="w-16 h-16 rounded-lg overflow-hidden border border-yellow-500/20 cursor-pointer hover:border-yellow-500/50 transition-colors shadow-lg"
                          onClick={() => setSelectedImageIndex(idx)}
                        >
                          <img src={url} className="w-full h-full object-cover" alt="Bằng chứng" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle 2 */}
              <div className="flex flex-col justify-start gap-4">
                <div className="flex items-center gap-2 text-yellow-500 font-semibold mb-2">
                  <BarChart2 className="w-5 h-5" /> Ảnh hưởng hiện tại
                </div>
                {[
                  'Quảng cáo đã bị tắt trên tất cả video',
                  'Không nhận doanh thu từ nội dung',
                  'Không thể sử dụng Super Chat và Hội viên kênh',
                  'Không đủ điều kiện tham gia các chương trình kiếm tiền khác'
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs">{text}</span>
                  </div>
                ))}
              </div>

              {/* Right */}
              <div className="flex flex-col justify-start h-full">
                <div className="flex items-center gap-2 text-yellow-500 font-semibold mb-4">
                  <Scale className="w-5 h-5" /> Bạn có thể làm gì?
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { text: 'Xem chi tiết vi phạm và chính sách', icon: FileText },
                    { text: 'Khắc phục các vấn đề trên kênh', icon: ClipboardCheck },
                    { text: 'Gửi kháng nghị nếu bạn cho rằng đây là nhầm lẫn', icon: ShieldAlert }
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-xs leading-relaxed">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
                <button 
                  onClick={() => alert('Tính năng gửi kháng nghị đang được phát triển')}
                  className="mt-auto w-full bg-yellow-500 hover:bg-yellow-400 text-[#1f160a] font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                  Gửi kháng nghị
                </button>
              </div>
            </div>

            {/* Bottom info */}
            <div className="bg-[#2a1a05] border border-yellow-500/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-white">Lưu ý:</span> <span className="text-gray-300">Trong thời gian bị tắt kiếm tiền, hãy tập trung cải thiện nội dung và đảm bảo tuân thủ tất cả chính sách của chúng tôi để sớm khôi phục quyền kiếm tiền.</span>
                </div>
              </div>
              <button className="text-yellow-500 hover:text-yellow-400 text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors">
                Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!(isMonetized || monetizationStatus === 'Approved' || monetizationStatus === 'Pending' || monetizationStatus === 'Checking') && (
          <>
            {/* ── Progress Section & Execution Mechanism ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
              {/* Left Column: Progress */}
              <div className="rounded-2xl bg-[#15151d] border border-white/5 p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[25px] font-bold">Tiến trình đạt điều kiện</h2>
                </div>

                <div className="space-y-4 mt-8">
                  {[
                    {
                      icon: Users,
                      current: currentStats.subscribers,
                      required: requirements.subscribers,
                      percent: subPercent,
                      label: 'Người đăng ký',
                      desc: 'Số lượt đăng ký kênh trong 12 tháng gần nhất. Mỗi người đăng ký mới giúp kênh của bạn đủ điều kiện bật kiếm tiền nhanh hơn.',
                      color: '#22c55e',
                      trackColor: 'rgba(34,197,94,0.15)',
                      iconBg: 'rgba(34,197,94,0.12)',
                      barGradient: 'linear-gradient(90deg, #16a34a, #22c55e)',
                      barGlow: 'rgba(34,197,94,0.45)',
                      scaleSteps: [0, Math.round(requirements.subscribers * 0.5), Math.round(requirements.subscribers * 0.75), requirements.subscribers],
                    },
                    {
                      icon: PlaySquare,
                      current: currentStats.watchHours,
                      required: requirements.watchHours,
                      percent: watchPercent,
                      label: 'Giờ xem công khai (365 ngày qua)',
                      desc: 'Tổng số giờ xem video công khai trong 365 ngày qua. Chỉ tính các video ở chế độ công khai, không tính video riêng tư hoặc không công khai.',
                      color: '#3b82f6',
                      trackColor: 'rgba(59,130,246,0.15)',
                      iconBg: 'rgba(59,130,246,0.12)',
                      barGradient: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                      barGlow: 'rgba(59,130,246,0.45)',
                      scaleSteps: [0, Math.round(requirements.watchHours * 0.5), Math.round(requirements.watchHours * 0.75), requirements.watchHours],
                    },
                  ].map(({ icon: Icon, current, required, percent, label, desc, color, trackColor, iconBg, barGradient, barGlow, scaleSteps }) => (
                    <div key={label} className="rounded-2xl border border-white/5 flex items-center gap-8 px-8 py-7"
                      style={{ background: '#0e0e16' }}>

                      {/* ── Circle Icon ── */}
                      <div className="shrink-0 relative" style={{ width: 96, height: 96 }}>
                        <svg width={96} height={96} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                          <circle cx={48} cy={48} r={42} fill="none" stroke={trackColor} strokeWidth={8} />
                          <circle
                            cx={48} cy={48} r={42} fill="none"
                            stroke={color} strokeWidth={8}
                            strokeDasharray={2 * Math.PI * 42}
                            strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(percent, 100) / 100)}
                            strokeLinecap="round"
                            style={{
                              transition: 'stroke-dashoffset 1.2s ease',
                              filter: `drop-shadow(0 0 8px ${color})`
                            }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: iconBg, border: `1.5px solid ${color}33` }}>
                            <Icon style={{ width: 26, height: 26, color }} />
                          </div>
                        </div>
                      </div>

                      {/* ── Middle: label + number + bar + scale ── */}
                      <div className="flex-1 min-w-0">

                        <div className='flex items-center w-full'>
                            {/* Label */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-sm font-medium text-gray-400">{label}</span>
                              <HelpCircle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                            </div>

                            {/* Number */}
                            <div className="ml-8 mb-2">
                              <span className="font-black leading-none" style={{ fontSize: '2.25rem', color }}>
                                {current.toLocaleString()}
                              </span>
                              <span className="text-gray-500 font-bold text-xl ml-1"> / {required.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Note */}
                        <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-lg">{desc}</p>

                        {/* Progress bar */}
                        <div className="w-full rounded-full overflow-hidden mb-2"
                          style={{ height: 10, background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              background: barGradient,
                              boxShadow: `0 0 12px ${barGlow}`,
                            }}
                          />
                        </div>

                        {/* Scale markers */}
                        <div className="flex justify-between px-0.5">
                          {scaleSteps.map((v) => (
                            <span key={v} className="text-[10px] text-gray-600">{v.toLocaleString()}</span>
                          ))}
                        </div>
                      </div>

                      {/* ── Right: badge ── */}
                      <div className="shrink-0 flex flex-col items-center gap-2" style={{ minWidth: 110 }}>
                        {percent >= 100 ? (
                          <>
                            <div className="flex items-center gap-1.5 rounded-full px-4 py-2"
                              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                              <CheckCircle2 style={{ width: 15, height: 15, color: '#22c55e' }} />
                              <span className="text-sm font-bold" style={{ color: '#22c55e' }}>Đã đạt</span>
                            </div>
                            <span className="text-[11px] text-gray-500 text-center">Yêu cầu tối thiểu: {required.toLocaleString()}</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-2"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <Clock style={{ width: 13, height: 13, color: '#9ca3af' }} />
                              <span className="text-xs font-semibold text-gray-400">Chưa đạt</span>
                            </div>
                            <span className="text-[11px] text-gray-500 text-center">Cần thêm: {(required - current).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Execution Mechanism */}
              <div className="rounded-2xl bg-[#15151d] border border-white/5 p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold">Cơ chế để thực hiện</h2>
                </div>
                
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {[
                    {
                      icon: Shield,
                      title: 'Xác minh 2 bước',
                      desc: 'Tăng cường bảo mật cho tài khoản của bạn để ngăn chặn truy cập trái phép. Đây là yêu cầu bắt buộc trước khi bật kiếm tiền.',
                      status: 'Đã bảo vệ',
                      statusColor: '#22c55e',
                      iconColor: '#3b82f6',
                      bg: 'rgba(59,130,246,0.1)'
                    },
                    {
                      icon: FileText,
                      title: 'Tuân thủ Nguyên tắc cộng đồng',
                      desc: 'Đảm bảo nội dung của bạn luôn thân thiện, an toàn và không vi phạm bản quyền hay các nguyên tắc của nền tảng.',
                      status: 'Đủ điều kiện',
                      statusColor: '#22c55e',
                      iconColor: '#a78bfa',
                      bg: 'rgba(167,139,250,0.1)'
                    },
                    {
                      icon: FileSearch,
                      title: 'Vượt qua vòng xét duyệt',
                      desc: 'Sau khi gửi đơn đăng ký, đội ngũ của chúng tôi sẽ kiểm tra kỹ lưỡng kênh của bạn. Thông thường sẽ mất vài ngày.',
                      status: 'Bước cuối',
                      statusColor: '#fbbf24',
                      iconColor: '#fbbf24',
                      bg: 'rgba(251,191,36,0.1)'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/5 p-5 flex flex-col hover:bg-white/[0.02] transition-colors" style={{ background: '#0e0e16' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                          <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
                        </div>
                        <h3 className="font-semibold text-gray-200 text-sm flex-1">{item.title}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap shrink-0 ml-2" 
                          style={{ 
                            background: `${item.statusColor}15`, 
                            color: item.statusColor,
                            border: `1px solid ${item.statusColor}30` 
                          }}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CTA Banner ── */}
            <div className="rounded-2xl p-6 flex items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/25 flex items-center justify-center shrink-0">
                  <Rocket className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <div className="font-bold text-white text-base">Sẵn sàng bắt đầu kiếm tiền?</div>
                  <div className="text-xs text-gray-400 mt-0.5">Đăng ký ngay để mở khóa các tính năng kiếm tiền cho kênh của bạn.</div>
                </div>
              </div>
              <button
                onClick={handleApply}
                disabled={!isEligible || applying}
                className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                  isEligible
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                {applying ? 'Đang gửi...' : 'Đăng ký bật kiếm tiền'} {isEligible && !applying && '→'}
              </button>
            </div>
            {!isEligible && (
              <p className="text-center text-xs text-gray-500">Nút đăng ký sẽ mở khi bạn đạt đủ điều kiện.</p>
            )}

            {/* ── Benefits ── */}
            <div>
              <h3 className="text-center text-base font-semibold text-gray-300 mb-5">Vì sao nên tham gia?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {benefits.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl bg-[#15151d] border border-white/5 p-4 text-center hover:border-purple-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="font-semibold text-sm text-white mb-1">{title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── VIDEO EARNINGS SECTION (chỉ hiện khi đã được duyệt) ── */}
        {(isMonetized || monetizationStatus === 'Approved') && earnings && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Tiền kiếm được từ video
              </h2>
              <span className="text-xs text-gray-500">Dựa trên dữ liệu lượt xem được tính toán mỗi ngày</span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Số dư khả dụng',
                  value: `${earnings.availableBalanceVnd?.toLocaleString('vi-VN') || 0} ₫`,
                  icon: DollarSign,
                  color: '#fbbf24',
                  bg: 'rgba(251,191,36,0.08)',
                  border: 'rgba(251,191,36,0.2)',
                },
                {
                  label: 'Tổng doanh thu',
                  value: `${earnings.totalEarnings?.toLocaleString('vi-VN') || 0} ₫`,
                  icon: DollarSign,
                  color: '#22c55e',
                  bg: 'rgba(34,197,94,0.08)',
                  border: 'rgba(34,197,94,0.2)',
                },
                {
                  label: 'Tháng này',
                  value: `${earnings.thisMonthEarnings?.toLocaleString('vi-VN') || 0} ₫`,
                  icon: TrendingUp,
                  color: '#3b82f6',
                  bg: 'rgba(59,130,246,0.08)',
                  border: 'rgba(59,130,246,0.2)',
                },
                {
                  label: '30 ngày qua',
                  value: `${earnings.last30DaysEarnings?.toLocaleString('vi-VN') || 0} ₫`,
                  icon: ArrowUpRight,
                  color: '#a78bfa',
                  bg: 'rgba(167,139,250,0.08)',
                  border: 'rgba(167,139,250,0.2)',
                },
              ].map(({ label, value, icon: Icon, color, bg, border }) => (
                <div key={label} className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon style={{ width: 20, height: 20, color }} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className="text-xl font-black" style={{ color }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top videos table */}
            {earnings.topVideos?.length > 0 && (
              <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: '#0e0e16' }}>
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-gray-200">Top video kiếm nhiều nhất</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {earnings.topVideos.map((v, idx) => (
                    <div key={v.videoId} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      {/* Rank */}
                      <div className="w-6 text-center text-sm font-black shrink-0"
                        style={{ color: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7c3a' : '#4b5563' }}>
                        {idx + 1}
                      </div>
                      {/* Thumbnail */}
                      <div className="shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-white/5">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200 truncate">{v.title}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Eye className="w-3 h-3 text-gray-600" />
                          <span className="text-[11px] text-gray-500">{(v.totalViews || 0).toLocaleString()} lượt xem</span>
                        </div>
                      </div>
                      {/* Earned */}
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-green-400">{v.totalEarned?.toLocaleString('vi-VN')} ₫</div>
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          {new Date(v.lastEarned).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {earnings.topVideos?.length === 0 && (
              <div className="rounded-2xl border border-white/5 p-8 text-center" style={{ background: '#0e0e16' }}>
                <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chưa có dữ liệu doanh thu video. Hệ thống tính toán mỗi ngày.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && evidenceUrls.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImageIndex(null)}>
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }}
          >
            <X className="w-8 h-8" />
          </button>
          
          {selectedImageIndex > 0 && (
            <button 
              className="absolute left-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 transition-colors z-50"
              onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(selectedImageIndex - 1); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={evidenceUrls[selectedImageIndex]} 
              alt="Full size evidence" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/10 shadow-2xl"
            />
          </div>

          {selectedImageIndex < evidenceUrls.length - 1 && (
            <button 
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 transition-colors z-50"
              onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(selectedImageIndex + 1); }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 px-5 py-2.5 rounded-full text-sm font-medium border border-white/10 backdrop-blur-md shadow-xl">
            {selectedImageIndex + 1} / {evidenceUrls.length}
          </div>
        </div>
      )}
    </div>
  );
}

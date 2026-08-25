import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Trophy, CheckCircle2, Clock, Users, PlaySquare, AlertCircle,
  Shield, Zap, Headphones, DollarSign, TrendingUp, Star, Rocket, HelpCircle,
  Video, Eye, ArrowUpRight
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

      <div className="px-6  pl-25 pr-25 space-y-6 pb-10">

        {/* ── Status views ── */}
        {isMonetized || monetizationStatus === 'Approved' ? (
          <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-600/5 p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Trophy className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-3">Chúc mừng! Bạn đã là Đối tác</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-sm leading-relaxed">
              Kênh của bạn đã được bật kiếm tiền. Bạn có thể theo dõi doanh thu chi tiết tại tab <strong className="text-white">Doanh Thu</strong>.
            </p>
          </div>

        ) : monetizationStatus === 'Pending' ? (
          <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-600/5 p-8 text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-3">Đơn đăng ký đang được xét duyệt</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-sm leading-relaxed mb-3">
              Chúng tôi đang kiểm tra nội dung trên kênh của bạn để đảm bảo tuân thủ các chính sách cộng đồng.
            </p>
            <p className="text-xs text-gray-500">Ngày nộp đơn: {new Date(application?.appliedAt).toLocaleDateString('vi-VN')}</p>
          </div>

        ) : monetizationStatus === 'Rejected' ? (
          <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-600/5 p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-3">Đơn đăng ký bị từ chối</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-sm leading-relaxed mb-4">
              Rất tiếc, kênh của bạn chưa đáp ứng đủ tiêu chuẩn cộng đồng để tham gia Chương trình Đối tác.
            </p>
            {application?.adminNote && (
              <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 text-sm text-red-300 text-left max-w-md">
                <span className="font-semibold block mb-1 text-red-200">Lý do từ chối:</span>
                {application.adminNote}
              </div>
            )}
          </div>

        ) : (
          <>
            {/* ── Progress Section ── */}
            <div className="rounded-2xl bg-[#15151d] border border-white/5 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold">Tiến trình đạt điều kiện</h2>
                {/* <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" /> Tìm hiểu thêm <span className="ml-0.5">›</span>
                </button> */}
              </div>

              <div className="space-y-4">
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
                      {/* Label */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm font-medium text-gray-400">{label}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      </div>

                      {/* Number */}
                      <div className="mb-2">
                        <span className="font-black leading-none" style={{ fontSize: '2.25rem', color }}>
                          {current.toLocaleString()}
                        </span>
                        <span className="text-gray-500 font-bold text-xl ml-1"> / {required.toLocaleString()}</span>
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
                          <div className="flex items-center gap-1.5 rounded-full px-4 py-2"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Clock style={{ width: 15, height: 15, color: '#9ca3af' }} />
                            <span className="text-sm font-semibold text-gray-400">Chưa đạt</span>
                          </div>
                          <span className="text-[11px] text-gray-500 text-center">Cần thêm: {(required - current).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: 'Tổng doanh thu',
                  value: `${earnings.totalEarnings?.toLocaleString('vi-VN')} ₫`,
                  icon: DollarSign,
                  color: '#22c55e',
                  bg: 'rgba(34,197,94,0.08)',
                  border: 'rgba(34,197,94,0.2)',
                },
                {
                  label: 'Tháng này',
                  value: `${earnings.thisMonthEarnings?.toLocaleString('vi-VN')} ₫`,
                  icon: TrendingUp,
                  color: '#3b82f6',
                  bg: 'rgba(59,130,246,0.08)',
                  border: 'rgba(59,130,246,0.2)',
                },
                {
                  label: '30 ngày qua',
                  value: `${earnings.last30DaysEarnings?.toLocaleString('vi-VN')} ₫`,
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
    </div>
  );
}

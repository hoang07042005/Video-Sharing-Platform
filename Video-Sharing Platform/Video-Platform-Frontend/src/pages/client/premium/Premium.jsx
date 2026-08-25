import React, { useState } from "react";
import {
  Check,
  X,
  Ban,
  Download,
  Tv,
  Headphones,
  Crown,
  Play,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function Premium() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentCycle, setCurrentCycle] = useState("Monthly");
  const [premiumUntil, setPremiumUntil] = useState(null);

  React.useEffect(() => {
    const fetchPlan = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("/api/payment/current-plan", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data && res.data.plan) {
            setCurrentPlan(res.data.plan);
            if (res.data.cycle) {
              setCurrentCycle(res.data.cycle);
            }
            if (res.data.premiumUntil) {
              setPremiumUntil(new Date(res.data.premiumUntil));
            }
          }
        } catch (err) {
          console.error("Failed to fetch plan:", err);
        }
      }
    };
    fetchPlan();
  }, []);

  const getPlanStatus = (targetPlan, targetIsYearly) => {
    if (currentPlan === "Free" && targetPlan !== "Free") return "upgrade";
    if (currentPlan === "Free" && targetPlan === "Free") return "current";

    const ranks = { Free: 0, Pro: 1, Premium: 2 };
    const currentRank = ranks[currentPlan] || 0;
    const targetRank = ranks[targetPlan] || 0;

    if (currentRank > targetRank) return "downgrade";
    if (currentRank < targetRank) return "upgrade";

    const currentCycleRank = currentCycle === "Yearly" ? 1 : 0;
    const targetCycleRank = targetIsYearly ? 1 : 0;

    if (currentCycleRank > targetCycleRank) return "downgrade";
    if (currentCycleRank < targetCycleRank) return "upgrade";

    return "current";
  };

  const handlePayment = async (plan, amount) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để thực hiện thanh toán.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        "/api/payment/create-payment-url",
        {
          plan,
          cycle: isYearly ? "Yearly" : "Monthly",
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi tạo giao dịch thanh toán.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-20 font-sans overflow-x-hidden">
      {/* Header Section */}
      <div
        className="relative pt-16 pb-24 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/premium-hero.png)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10">
          {/* Left Text */}
          <div className="max-w-[600px]">
            <h2 className="text-[#E91E63] font-bold text-sm tracking-widest uppercase mb-4">
              Nâng cấp tài khoản
            </h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Trải nghiệm VideoX <br />
              theo cách <span className="text-[#9C27B0]">của bạn</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-[500px]">
              Chọn gói phù hợp để tận hưởng kho nội dung khổng lồ, chất lượng
              cao và nhiều tính năng độc quyền.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Ban className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">
                    Không quảng cáo
                  </p>
                  <p className="text-gray-500 text-[10px]">
                    Xem video liền mạch
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Download className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Tải video</p>
                  <p className="text-gray-500 text-[10px]">
                    Xem mọi lúc, mọi nơi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Tv className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Chất lượng cao</p>
                  <p className="text-gray-500 text-[10px]">Tối đa 4K UHD</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Gradient Fade out */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0B] to-transparent pointer-events-none" />
      </div>

      {/* Pricing Section */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-4 py-4 relative z-10 mt-5">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
          Chọn gói phù hợp với bạn
        </h2>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#1A1A1A] p-1 rounded-full inline-flex border border-white/10">
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${!isYearly ? "bg-gradient-to-r from-[#5E35B1] to-[#8E24AA] text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
              onClick={() => setIsYearly(false)}
            >
              Thanh toán hàng tháng
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isYearly ? "bg-gradient-to-r from-[#5E35B1] to-[#8E24AA] text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
              onClick={() => setIsYearly(true)}
            >
              Thanh toán hàng năm
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Free Card */}
          <div
            className={`bg-[#111111] rounded-3xl p-8 border border-white/5 flex flex-col h-full hover:border-white/20 transition-all ${getPlanStatus("Free", isYearly) === "downgrade" ? "opacity-50 pointer-events-none grayscale" : ""}`}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1">FREE</h3>
              <p className="text-gray-500 text-xs">
                Dành cho người mới bắt đầu
              </p>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-white">Miễn phí</span>
              <span className="text-gray-500 text-sm block mt-2">
                Không giới hạn thời gian
              </span>
            </div>
            <button
              disabled
              className="w-full py-3 rounded-xl bg-[#222222] text-gray-300 font-bold mb-8 transition-colors"
            >
              {currentPlan === "Free" ? "Gói hiện tại" : "Không khả dụng"}
            </button>
            <div className="space-y-4 flex-1">
              <FeatureItem text="Xem video với quảng cáo" active={true} />
              <FeatureItem text="Chất lượng tối đa 720p" active={true} />
              <FeatureItem text="Tải video" active={false} />
              <FeatureItem text="Xem trên nhiều thiết bị" active={false} />
              <FeatureItem text="Phát trong nền" active={false} />
              <FeatureItem text="Video độc quyền" active={false} />
              <FeatureItem text="Hỗ trợ ưu tiên" active={false} />
            </div>
            <div className="mt-8 flex justify-center opacity-30">
              <div className="w-20 h-20 bg-gray-800 rounded-3xl transform rotate-12 flex items-center justify-center shadow-inner">
                <Play className="w-8 h-8 text-gray-600" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Plus Card */}
          <div
            className={`bg-gradient-to-b from-[#1E112B] to-[#111111] rounded-3xl p-8 border border-[#9C27B0]/30 flex flex-col h-full hover:border-[#9C27B0]/60 transition-all relative ${getPlanStatus("Plus", isYearly) === "downgrade" ? "opacity-50 pointer-events-none grayscale" : ""}`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9C27B0] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Phổ biến
            </div>
            <div className="text-center mb-6 mt-2">
              <h3 className="text-xl font-bold text-white mb-1">PLUS</h3>
              <p className="text-gray-400 text-xs">Dành cho mọt phim</p>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-white">
                {isYearly ? "470.000" : "49.000"}
              </span>
              <span className="text-xl text-white">đ</span>
              <span className="text-gray-400 text-sm">
                {isYearly ? " / năm" : " / tháng"}
              </span>
            </div>
            <button
              onClick={() => handlePayment("Plus", isYearly ? 470000 : 49000)}
              disabled={
                isLoading || getPlanStatus("Plus", isYearly) !== "upgrade"
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7E57C2] to-[#5E35B1] text-white font-bold mb-8 hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(94,53,177,0.4)] disabled:opacity-50"
            >
              {getPlanStatus("Plus", isYearly) === "current"
                ? premiumUntil
                  ? `HSD: ${premiumUntil.toLocaleDateString("vi-VN")}`
                  : "Gói hiện tại"
                : getPlanStatus("Plus", isYearly) === "upgrade" &&
                    currentPlan === "Plus"
                  ? "Nâng cấp lên Năm"
                  : "Nâng cấp ngay"}
            </button>
            <div className="space-y-4 flex-1">
              <FeatureItem
                text="Không quảng cáo"
                active={true}
                color="text-purple-400"
              />
              <FeatureItem
                text="Chất lượng tối đa 1080p"
                active={true}
                color="text-purple-400"
              />
              <FeatureItem
                text="Tải video xem offline"
                active={true}
                color="text-purple-400"
              />
              <FeatureItem
                text="Huy hiệu PLUS"
                active={true}
                color="text-purple-400"
              />
              <FeatureItem
                text="Tăng dung lượng Upload (2GB/file)"
                active={true}
                color="text-purple-400"
              />
              <FeatureItem text="Video độc quyền" active={false} />
              <FeatureItem text="Hỗ trợ ưu tiên" active={false} />
            </div>
          </div>

          {/* Premium Card */}
          <div
            className={`bg-gradient-to-b from-[#3A1414] via-[#2A111A] to-[#111111] rounded-3xl p-8 border border-[#FF9800]/50 shadow-[0_0_30px_rgba(255,152,0,0.15)] flex flex-col h-full hover:shadow-[0_0_40px_rgba(255,152,0,0.3)] transition-all relative ${getPlanStatus("Premium", isYearly) === "downgrade" ? "opacity-50 pointer-events-none grayscale" : ""}`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9800] text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Tốt nhất
            </div>
            <div className="text-center mb-6 mt-2">
              <h3 className="text-xl font-bold text-[#FF9800] mb-1 flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" fill="currentColor" />
                PREMIUM
              </h3>
              <p className="text-gray-400 text-xs">
                Trải nghiệm đỉnh cao, không giới hạn
              </p>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-white">
                {isYearly ? "1.238.000" : "129.000"}
              </span>
              <span className="text-xl text-white">đ</span>
              <span className="text-gray-400 text-sm">
                {isYearly ? " / năm" : " / tháng"}
              </span>
            </div>
            <button
              onClick={() =>
                handlePayment("Premium", isYearly ? 1238000 : 129000)
              }
              disabled={
                isLoading || getPlanStatus("Premium", isYearly) !== "upgrade"
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF5722] via-[#E91E63] to-[#9C27B0] text-white font-bold mb-8 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(233,30,99,0.5)] disabled:opacity-50"
            >
              {getPlanStatus("Premium", isYearly) === "current"
                ? premiumUntil
                  ? `HSD: ${premiumUntil.toLocaleDateString("vi-VN")}`
                  : "Gói hiện tại"
                : getPlanStatus("Premium", isYearly) === "upgrade" &&
                    currentPlan === "Premium"
                  ? "Nâng cấp lên Năm"
                  : "Dùng thử 7 ngày"}
            </button>
            <div className="space-y-4 flex-1">
              <FeatureItem
                text="Không quảng cáo"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Chất lượng tối đa 4K UHD"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Tải video xem offline"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Huy hiệu PREMIUM 👑 và Tên nổi bật"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Bình luận ưu tiên (Ghim lên đầu)"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Tăng dung lượng Upload Khổng lồ (10GB)"
                active={true}
                color="text-[#FF9800]"
              />
              <FeatureItem
                text="Hỗ trợ ưu tiên 24/7 (Khẩn cấp)"
                active={true}
                color="text-[#FF9800]"
              />
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-gray-400 text-xs leading-snug">
                Trải nghiệm tốt nhất cho người yêu video
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Detail Section */}
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-12">
          Vì sao nên nâng cấp lên{" "}
          <span className="text-[#FF9800]">Premium?</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <FeatureIcon
            icon={<Ban />}
            title="Không quảng cáo"
            desc="Tận hưởng video mượt mà, không bị gián đoạn"
            color="text-red-500"
          />
          <FeatureIcon
            icon={<Download />}
            title="Tải video offline"
            desc="Lưu video yêu thích và xem mọi lúc, mọi nơi"
            color="text-purple-400"
          />
          <FeatureIcon
            icon={<div className="font-black text-xl">4K</div>}
            title="Chất lượng vượt trội"
            desc="Hình ảnh sắc nét đến từng chi tiết"
            color="text-pink-500"
          />
          <FeatureIcon
            icon={<Tv />}
            title="Đa thiết bị"
            desc="Xem trên TV, điện thoại, máy tính, tablet"
            color="text-blue-400"
          />
          <FeatureIcon
            icon={<Headphones />}
            title="Hỗ trợ ưu tiên"
            desc="Được hỗ trợ nhanh chóng mọi lúc, mọi nơi"
            color="text-green-400"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-12">
        <div className="bg-gradient-to-r from-[#4A148C] via-[#880E4F] to-[#E65100] rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Decorative graphics */}
          <div className="absolute left-[-20px] bottom-[-20px] opacity-60">
            <div className="w-40 h-40 bg-pink-500 rounded-full blur-[60px]" />
          </div>

          <div className="flex-1 text-center md:text-left relative z-10 md:ml-20">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Nâng cấp ngay – Trải{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-pink-300">
                nghiệm ngay!
              </span>
            </h2>
            <p className="text-gray-200 text-sm md:text-base max-w-[500px] mx-auto md:mx-0">
              Hàng triệu video hấp dẫn đang chờ bạn khám phá cùng VideoX
              Premium.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={() =>
                handlePayment("Premium", isYearly ? 1238000 : 129000)
              }
              disabled={
                isLoading || getPlanStatus("Premium", isYearly) !== "upgrade"
              }
              className="bg-gradient-to-r from-[#FFB74D] to-[#FF5252] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(255,82,82,0.5)] hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
            >
              <Crown className="w-6 h-6" fill="currentColor" />
              {getPlanStatus("Premium", isYearly) === "current"
                ? premiumUntil
                  ? `Đã kích hoạt (HSD: ${premiumUntil.toLocaleDateString("vi-VN")})`
                  : "Đã kích hoạt"
                : getPlanStatus("Premium", isYearly) === "upgrade" &&
                    currentPlan === "Premium"
                  ? "Nâng cấp lên Năm"
                  : "Nâng cấp ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, active, color = "text-green-500" }) {
  return (
    <div className="flex items-start gap-3">
      {active ? (
        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
      ) : (
        <X className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
      )}
      <span
        className={
          active ? "text-gray-300 text-[13px]" : "text-gray-600 text-[13px]"
        }
      >
        {text}
      </span>
    </div>
  );
}

function FeatureIcon({ icon, title, desc, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center mb-4 shadow-lg">
        <div className={color}>{icon}</div>
      </div>
      <h4 className="text-white font-bold text-[13px] mb-2">{title}</h4>
      <p className="text-gray-500 text-[10px] leading-relaxed px-2">{desc}</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Video } from "lucide-react";
import { toast } from "react-toastify";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [amount, setAmount] = useState(0);
  const [paymentType, setPaymentType] = useState("Premium");

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const paymentAmount = searchParams.get("amount");
    const code = searchParams.get("code");
    const type = searchParams.get("type") || "Premium";

    if (paymentStatus === "success") {
      setStatus("success");
      setAmount(Number(paymentAmount));
      setPaymentType(type);
      toast.success(
        type === "Membership"
          ? "Thanh toán hội viên thành công!"
          : "Thanh toán thành công! Tài khoản của bạn đã được nâng cấp.",
      );
    } else {
      setStatus("failed");
      if (code === "24") {
        toast.error("Giao dịch đã bị huỷ.");
      } else {
        toast.error("Giao dịch thất bại hoặc có lỗi xảy ra.");
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#0A0A0B] px-4">
      <div className="max-w-md w-full bg-[#1A1A1A] rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
        {status === "loading" && (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-700 rounded-full mb-6"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-400 mb-6">
              Cảm ơn bạn. Số tiền {amount.toLocaleString("vi-VN")}đ đã được
              thanh toán.
              {paymentType === "Membership"
                ? " Bạn đã trở thành hội viên của kênh và có thể tận hưởng các đặc quyền."
                : paymentType === "BuyCoins"
                  ? ` Bạn đã nạp thành công ${amount / 100} Xu vào tài khoản.`
                  : " Tài khoản của bạn đã được nâng cấp lên Premium."}
            </p>
            <Link
              to={sessionStorage.getItem("returnUrl") || "/"}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF5722] to-[#E91E63] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <Video className="w-5 h-5" />
              {sessionStorage.getItem("returnUrl")
                ? "Quay lại xem Live"
                : "Bắt đầu xem video"}
            </Link>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Giao dịch không thành công
            </h1>
            <p className="text-gray-400 mb-6">
              Rất tiếc, quá trình thanh toán đã bị huỷ hoặc xảy ra lỗi. Vui lòng
              thử lại sau.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                to="/premium"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Thử lại
              </Link>
              <Link
                to="/"
                className="text-gray-400 hover:text-white text-sm font-semibold transition-colors mt-2 flex items-center justify-center gap-1"
              >
                Về trang chủ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

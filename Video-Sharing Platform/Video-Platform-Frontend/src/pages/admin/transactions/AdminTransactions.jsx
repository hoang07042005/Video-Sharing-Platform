import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Search,
  Calendar,
  Crown,
  MonitorPlay,
  RefreshCw,
  ArrowUp,
  Star,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import moment from "moment";
import "moment/locale/vi";

export default function AdminTransactions() {
  const [premiumData, setPremiumData] = useState([]);
  const [membershipData, setMembershipData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters for Premium
  const [premiumSearch, setPremiumSearch] = useState("");
  const [premiumDateFilter, setPremiumDateFilter] = useState(""); // YYYY-MM

  // Filters for Membership
  const [membershipSearch, setMembershipSearch] = useState("");
  const [membershipDateFilter, setMembershipDateFilter] = useState(""); // YYYY-MM

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [premiumRes, membershipRes] = await Promise.all([
        axios.get("/api/admin/transactions/premium", { headers }),
        axios.get("/api/admin/transactions/membership", { headers }),
      ]);

      console.log("Premium TX:", premiumRes.data[0]);
      console.log("Membership TX:", membershipRes.data[0]);

      setPremiumData(premiumRes.data);
      setMembershipData(membershipRes.data);
    } catch (err) {
      console.error("Error fetching transactions", err);
      toast.error("Lỗi khi tải dữ liệu giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPremiumPlan = (transactionType) => {
    const plan = transactionType?.split("_")[1];
    if (plan === "Pro" || plan === "Plus") return "Plus";
    return plan === "Premium" ? "Premium" : "Premium";
  };

  const getPremiumPlanLabel = (transactionType) => {
    const plan = getPremiumPlan(transactionType);
    return plan === "Plus" ? "PLUS" : plan;
  };

  const getPremiumPlanColor = (transactionType) => {
    const plan = getPremiumPlan(transactionType);
    return plan === "Plus" ? "text-[#9C27B0]" : "text-[#FF9800]";
  };

  const getPremiumPlanBg = (transactionType) => {
    const plan = getPremiumPlan(transactionType);
    return plan === "Plus" ? "bg-[#9C27B0]/10 text-[#9C27B0] border-[#9C27B0]/20" : "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20";
  };

  const getPremiumCycleLabel = (transactionType) =>
    transactionType?.includes("Yearly") ? "1 năm" : "1 tháng";

  const filteredPremium = premiumData.filter((t) => {
    const matchSearch =
      t.user?.fullName?.toLowerCase().includes(premiumSearch.toLowerCase()) ||
      t.user?.email?.toLowerCase().includes(premiumSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(premiumSearch.toLowerCase());

    let matchDate = true;
    if (premiumDateFilter && t.createdAt) {
      const txMonth = moment(t.createdAt).format("YYYY-MM");
      matchDate = txMonth === premiumDateFilter;
    }

    return matchSearch && matchDate;
  });

  const filteredMembership = membershipData.filter((t) => {
    const matchSearch =
      t.user?.fullName
        ?.toLowerCase()
        .includes(membershipSearch.toLowerCase()) ||
      t.user?.email?.toLowerCase().includes(membershipSearch.toLowerCase()) ||
      t.channel?.channelName
        ?.toLowerCase()
        .includes(membershipSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(membershipSearch.toLowerCase());

    let matchDate = true;
    if (membershipDateFilter && t.createdAt) {
      const txMonth = moment(t.createdAt).format("YYYY-MM");
      matchDate = txMonth === membershipDateFilter;
    }

    return matchSearch && matchDate;
  });
  return (
    <div className="min-h-screen p-2 md:p-2">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Premium Transactions */}
        <div className="bg-[#141418] rounded-2xl border border-[#FF4E00]/30 overflow-hidden shadow-[0_0_20px_rgba(255,78,0,0.05)]">
          {/* Header & Filters */}
          <div className="p-6 border-b border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-r from-[#FF4E00]/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF3300] flex items-center justify-center shadow-[0_0_15px_rgba(255,78,0,0.3)]">
                <ArrowUp className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Lịch sử nâng cấp tài khoản
                </h2>
                <p className="text-sm text-gray-400">
                  Các giao dịch nâng cấp lên tài khoản Premium
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-gray-300 w-44 cursor-pointer hover:bg-white/5 transition-colors">
                <span>Tất cả trạng thái</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-sm text-gray-300 w-48 cursor-pointer hover:bg-white/5 transition-colors">
                <span>Tất cả phương thức</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <button className="p-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[#141418]/50">
                  <th className="px-6 py-5 whitespace-nowrap">Người dùng</th>
                  <th className="px-6 py-5 whitespace-nowrap">Gói nâng cấp</th>
                  <th className="px-6 py-5 whitespace-nowrap">Thời hạn</th>
                  <th className="px-1 py-1 whitespace-nowrap">
                    Thời gian bắt đầu
                  </th>
                  <th className="px-1 py-1 whitespace-nowrap">
                    Thời gian kết thúc
                  </th>
                  <th className="px-1 py-1 whitespace-nowrap">Số tiền</th>
                  <th className="px-1 py-1 whitespace-nowrap">Phương thức</th>
                  <th className="px-1 py-1 whitespace-nowrap">
                    Ngày giao dịch
                  </th>
                  <th className="px-1 py-1 whitespace-nowrap">Trạng thái</th>
                  {/* <th className="px-1 py-1 whitespace-nowrap text-right">Thao tác</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-[#FF4E00] rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPremium.length > 0 ? (
                  filteredPremium.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              tx.user?.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${tx.user?.fullName}`
                            }
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                            alt="avatar"
                          />
                          <div>
                            <div className="font-semibold text-white text-[13px] mb-0.5">
                              {tx.user?.fullName}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {tx.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="flex items-center gap-1.5">
                            <Crown
                              className={`w-4 h-4 ${getPremiumPlanColor(tx.transactionType)}`}
                              fill="currentColor"
                            />
                            <span className="font-semibold text-white text-[13px]">
                              {getPremiumPlanLabel(tx.transactionType)}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getPremiumPlanBg(tx.transactionType)}`}>
                            {getPremiumCycleLabel(tx.transactionType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-[13px]">
                        {getPremiumCycleLabel(tx.transactionType)}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-[13px]">
                        {tx.startDate
                          ? moment(tx.startDate).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-[13px]">
                        {tx.endDate
                          ? moment(tx.endDate).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#FF4E00] text-[13px]">
                        {new Intl.NumberFormat("vi-VN").format(tx.amount)} đ
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 text-[13px]">
                            {tx.paymentMethod || "VNPay"}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex flex-col">
                          <span className="text-gray-300 text-[13px] mb-0.5">
                            {moment(tx.createdAt).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            {moment(tx.createdAt).format("HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1">
                        {tx.status === "Completed" || tx.status === "Success" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1  text-[11px] font-medium text-green-500">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1  text-[11px] font-medium text-red-500">
                            <XCircle className="w-3.5 h-3.5" /> Thất bại
                          </span>
                        )}
                      </td>
                      {/* <td className="px-2 py-2 text-right">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-[12px] font-medium">
                          Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-6 py-12 text-center text-gray-500 text-sm"
                    >
                      Không có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Mock */}
          <div className="p-4 border-t border-white/5 flex justify-center bg-[#0f0f0f]/50">
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF4E00] text-white font-medium shadow-[0_0_10px_rgba(255,78,0,0.3)]">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Membership Transactions */}
        <div className="bg-[#141418] rounded-2xl border border-[#9C27B0]/30 overflow-hidden shadow-[0_0_20px_rgba(156,39,176,0.05)] mt-8">
          {/* Header & Filters */}
          <div className="p-6 border-b border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-r from-[#9C27B0]/5 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B027C0] to-[#7E1E99] flex items-center justify-center shadow-[0_0_15px_rgba(156,39,176,0.3)]">
                <Star className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Lịch sử đăng ký hội viên
                </h2>
                <p className="text-sm text-gray-400">
                  Các giao dịch đăng ký trở thành hội viên của kênh
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border border-white/10 rounded-lg text-sm text-gray-300 w-44 cursor-pointer hover:bg-white/5 transition-colors">
                <span>Tất cả trạng thái</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border border-white/10 rounded-lg text-sm text-gray-300 w-48 cursor-pointer hover:bg-white/5 transition-colors">
                <span>Tất cả phương thức</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border border-white/10 rounded-lg text-sm text-gray-300 w-48 cursor-pointer hover:bg-white/5 transition-colors">
                <span>Tất cả kênh đăng ký</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <button className="p-2.5 bg-[#141418] border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[#141418]/50">
                  <th className="px-6 py-3 whitespace-nowrap text-center">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    Gói hội viên
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    TG bắt đầu
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    TG kết thúc
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    Phương thức
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    Kênh đăng ký
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-center">
                    Thời gian
                  </th>
                  <th className="px-5 py-3 whitespace-nowrap text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 whitespace-nowrap text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-[#9C27B0] rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredMembership.length > 0 ? (
                  filteredMembership.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-1 w-60 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={
                              tx.user?.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${tx.user?.fullName}`
                            }
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                            alt="avatar"
                          />
                          <div className="w-40">
                            <div className="text-white text-[13px] mb-0.5 truncate">
                              {tx.user?.fullName}
                            </div>
                            <div className="text-gray-500 text-[11px]">
                              {tx.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-1 w-30 text-center">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="flex items-center gap-1.5">
                            <Crown
                              className="w-4 h-4 text-[#9C27B0]"
                              fill="currentColor"
                            />
                            <span className="font-semibold text-white text-[13px]">
                              Hội viên kênh
                            </span>
                          </div>
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-[#9C27B0]/10 text-[#9C27B0] border border-[#9C27B0]/20">
                            1 tháng
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1 text-center text-gray-300 text-[13px] w-20">
                        {tx.startDate
                          ? moment(tx.startDate).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td className="px-1 py-1 text-center text-gray-300 text-[13px] w-20">
                        {tx.endDate
                          ? moment(tx.endDate).format("DD/MM/YYYY")
                          : "-"}
                      </td>
                      <td className="px-1 py-1 text-center font-bold text-[#9C27B0] text-[13px] w-20">
                        {new Intl.NumberFormat("vi-VN").format(tx.amount)} đ
                      </td>
                      <td className="px-1 py-1 text-center w-20">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-300 text-[13px]">
                            {tx.paymentMethod || "VNPay"}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1 w-40">
                        {tx.channel ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={
                                tx.channel.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${tx.channel.channelName}`
                              }
                              className="w-7 h-7 rounded-full object-cover border border-white/10"
                              alt="channel avatar"
                            />
                            <span className="font-medium text-gray-300 text-[10px] truncate max-w-36">
                              {tx.channel.channelName}
                            </span>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 italic text-[10px]">
                            Kênh không khả dụng
                          </div>
                        )}
                      </td>
                      <td className="px-1 py-1 text-center">
                        <div className="flex flex-col">
                          <span className="text-gray-300 text-[13px] mb-0.5">
                            {moment(tx.createdAt).format("DD/MM/YYYY")}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            {moment(tx.createdAt).format("HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1 w-25 text-center">
                        {tx.status === "Completed" || tx.status === "Success" ? (
                          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-medium text-green-500">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-medium text-red-500">
                            <XCircle className="w-3.5 h-3.5" /> Thất bại
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-2 text-center">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-[12px] font-medium">
                          Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-12 text-center text-gray-500 text-sm"
                    >
                      Không có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Mock */}
          <div className="p-4 border-t border-white/5 flex justify-center bg-[#0f0f0f]/50">
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#9C27B0] text-white font-medium shadow-[0_0_10px_rgba(156,39,176,0.3)]">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

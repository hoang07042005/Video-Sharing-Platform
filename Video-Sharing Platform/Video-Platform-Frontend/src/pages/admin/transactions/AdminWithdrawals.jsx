import { useState, useEffect } from "react";
import axios from "axios";
import {
  Landmark,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AdminWithdrawals() {
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null,
    id: null,
  });
  const [rejectNote, setRejectNote] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const uniqueBanks = Array.from(
    new Set(allWithdrawals.map((w) => w.bankName).filter(Boolean)),
  );

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/admin/withdrawals?status=all`, {
        headers,
      });
      setAllWithdrawals(res.data);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  };

  const withdrawals = allWithdrawals.filter((w) => {
    const matchStatus = filter === "all" || w.status === filter;
    const matchBank = bankFilter === "all" || w.bankName === bankFilter;
    return matchStatus && matchBank;
  });

  // Calculate Stats
  const totalRequests = allWithdrawals.length;
  const pendingRequests = allWithdrawals.filter(
    (w) => w.status === "Pending",
  ).length;
  const completedRequests = allWithdrawals.filter(
    (w) => w.status === "Completed",
  ).length;
  const rejectedRequests = allWithdrawals.filter(
    (w) => w.status === "Rejected",
  ).length;
  const totalApprovedMoney = allWithdrawals
    .filter((w) => w.status === "Completed")
    .reduce((sum, w) => sum + w.amountFiat, 0);

  const getPercentage = (count) => {
    if (totalRequests === 0) return 0;
    return ((count / totalRequests) * 100).toFixed(2);
  };

  const submitAction = async () => {
    try {
      const { id, type } = actionModal;
      setProcessingId(id);

      let finalReceiptUrl = null;
      if (type === "approve" && receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        const uploadRes = await axios.post("/api/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalReceiptUrl = uploadRes.data.url;
      }

      const status = type === "approve" ? "Completed" : "Rejected";
      const note = type === "reject" ? rejectNote : approveNote;

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `/api/admin/withdrawals/${id}`,
        { status, note, receiptUrl: finalReceiptUrl },
        { headers },
      );
      toast.success(
        status === "Completed"
          ? "Đã duyệt yêu cầu rút tiền"
          : "Đã từ chối yêu cầu",
      );
      setActionModal({ isOpen: false, type: null, id: null });
      setRejectNote("");
      setApproveNote("");
      setReceiptFile(null);
      setReceiptPreview("");
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
            Chờ duyệt
          </span>
        );
      case "Completed":
        return (
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
            Hoàn tất
          </span>
        );
      case "Rejected":
        return (
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            Từ chối
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
            {status}
          </span>
        );
    }
  };

  const getBankLogo = (bankName) => {
    if (!bankName) return null;
    const name = bankName.toLowerCase();

    // 1. Xử lý riêng các Ví điện tử (Do link ảnh khác thư mục)
    if (name.includes("momo")) return "/public/images/bank-logos/Icon-Momo.png";
    if (name.includes("zalo"))
      return "/public/images/bank-logos/Icon-ZaloPay.png";
    if (name.includes("vnpay"))
      return "/public/images/bank-logos/Icon-VnPay.png";

    // 2. Danh sách map từ khóa ngân hàng với tên file Logo
    const bankLogos = {
      vietcombank: "Icon-Vietcombank.png",
      vcb: "Icon-Vietcombank.png",
      techcombank: "Icon-Techcombank-TCB.png",
      tcb: "Icon-Techcombank-TCB.png",
      mb: "Icon-MB-Bank-MBB.png",
      mbbank: "Icon-MB-Bank-MBB.png",
      vietinbank: "Icon-VietinBank-CTG.png",
      ctg: "Icon-VietinBank-CTG.png",
      bidv: "Icon-BIDV.png",
      agribank: "Icon-Agribank.png",
      vib: "Icon-VIB.png",
      tpbank: "Icon-TPBank.png",
      tpb: "Icon-TPBank.png",
      vpbank: "Icon-VPBank.png",
      vpb: "Icon-VPBank.png",
      sacombank: "Icon-Sacombank.png",
      stb: "Icon-Sacombank.png",
    };

    for (const [key, filename] of Object.entries(bankLogos)) {
      if (name.includes(key)) {
        // Trả về đường dẫn trỏ tới thư mục public của bạn
        return `/public/images/bank-logos/${filename}`;
      }
    }

    return null;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Yêu cầu rút tiền
          </h1>
          <p className="text-sm text-gray-400">
            Quản lý và duyệt các yêu cầu rút tiền từ Streamer
          </p>
        </div>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng yêu cầu */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Tổng yêu cầu
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {totalRequests}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Yêu cầu
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500">Toàn bộ thời gian</div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Chờ duyệt
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {pendingRequests}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Yêu cầu
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400">
                {getPercentage(pendingRequests)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full"
                style={{ width: `${getPercentage(pendingRequests)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Đã hoàn tất */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Đã hoàn tất
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {completedRequests}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Yêu cầu
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-400">
                {getPercentage(completedRequests)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full"
                style={{ width: `${getPercentage(completedRequests)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: Từ chối */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Từ chối
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {rejectedRequests}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Yêu cầu
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-orange-400">
                {getPercentage(rejectedRequests)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div
                className="bg-orange-500 h-1 rounded-full"
                style={{ width: `${getPercentage(rejectedRequests)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 5: Tổng tiền (đã duyệt) */}
        <div className="bg-[#141418] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Tổng tiền (đã duyệt)
              </h3>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl font-bold text-white">
                  {totalApprovedMoney.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium mt-1">
                  VNĐ
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-6 text-xs text-gray-500">Toàn bộ thời gian</div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-[#141418] border border-white/5 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            {["all", "Pending", "Completed", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-[#3C1671] text-white"
                    : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {status === "all"
                  ? "Tất cả"
                  : status === "Pending"
                    ? "Chờ duyệt"
                    : status === "Completed"
                      ? "Hoàn tất"
                      : "Từ chối"}
              </button>
            ))}
          </div>

          {/* Right Tools (Placeholder) */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-transparent border border-white/10 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-400">
                01/08/2026 - 20/08/2026
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="relative">
              <select
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="appearance-none flex items-center bg-transparent border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-400 outline-none focus:border-purple-500 cursor-pointer min-w-[150px]"
              >
                <option value="all" className="bg-[#141418]">
                  Tất cả ngân hàng
                </option>
                {uniqueBanks.map((bank, index) => (
                  <option key={index} value={bank} className="bg-[#141418]">
                    {bank}
                  </option>
                ))}
              </select>
              <svg
                className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#141418] text-gray-400 border-b border-white/5">
              <tr>
                <th className="px-2 py-2  font-medium font-semibold cursor-pointer whitespace-nowrap">
                  Thời gian
                </th>
                <th className="px-2 py-2 font-medium font-semibold cursor-pointer whitespace-nowrap">
                  Streamer
                </th>
                <th className="px-2 py-2 font-medium font-semibold cursor-pointer whitespace-nowrap">
                  Số tiền rút
                </th>
                <th className="px-2 py-2 font-medium font-semibold whitespace-nowrap">
                  Chi tiết nguồn tiền
                </th>
                <th className="px-2 py-2 font-medium font-semibold cursor-pointer whitespace-nowrap">
                  Ngân hàng / Tài khoản
                </th>
                <th className="px-2 py-2 font-medium font-semibold cursor-pointer whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="px-2 py-2 font-medium font-semibold whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                withdrawals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-2 py-2 whitespace-nowrap align-middle ">
                      <div className="font-medium text-white mb-1">
                        {(() => {
                          try {
                            const dateStr = item.createdAt;
                            if (
                              typeof dateStr === "string" &&
                              !dateStr.includes("T")
                            ) {
                              return dateStr;
                            }
                            const d = new Date(
                              dateStr.endsWith("Z") ? dateStr : dateStr + "Z",
                            );
                            if (isNaN(d.getTime())) return dateStr;
                            return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
                          } catch (e) {
                            return item.createdAt;
                          }
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: #WD{item.id.toString().substring(0, 4)}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <img
                            src={
                              item.user.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.email}`
                            }
                            alt=""
                            className="w-10 h-10 rounded-full bg-[#1A1A20]"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-sm p-0.5">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {item.user.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.user.email}
                          </div>
                          <div className="inline-block mt-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">
                            Streamer
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="text-sm font-bold text-green-400">
                        {item.amountFiat.toLocaleString()} VNĐ
                      </div>
                    </td>
                    <td className="px-0 py-2 align-middle">
                      {item.breakdownData ? (
                        <div className="border border-white/10 rounded-lg p-3 bg-[#1A1A20] w-[260px] mx-auto text-xs">
                          {(() => {
                            try {
                              const bd = JSON.parse(item.breakdownData);
                              const total =
                                bd.OwnCoinsVND +
                                bd.GiftVND +
                                bd.DonateVND +
                                bd.MembershipVND;
                              const getPct = (val) =>
                                total ? ((val / total) * 100).toFixed(2) : 0;
                              return (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                      <span className="text-gray-400">
                                        Từ Xu cá nhân:
                                      </span>
                                    </div>{" "}
                                    <div>
                                      <span className="text-white font-medium">
                                        {bd.OwnCoinsVND.toLocaleString()}đ
                                      </span>{" "}
                                      <span className="text-gray-500 ml-1">
                                        ({getPct(bd.OwnCoinsVND)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                      <span className="text-gray-400">
                                        Từ Tặng quà:
                                      </span>
                                    </div>{" "}
                                    <div>
                                      <span className="text-white font-medium">
                                        {bd.GiftVND.toLocaleString()}đ
                                      </span>{" "}
                                      <span className="text-gray-500 ml-1">
                                        ({getPct(bd.GiftVND)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                      <span className="text-gray-400">
                                        Từ Donate:
                                      </span>
                                    </div>{" "}
                                    <div>
                                      <span className="text-white font-medium">
                                        {bd.DonateVND.toLocaleString()}đ
                                      </span>{" "}
                                      <span className="text-gray-500 ml-1">
                                        ({getPct(bd.DonateVND)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                    <div className="flex gap-2 items-center">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                      <span className="text-gray-400">
                                        Từ Hội viên:
                                      </span>
                                    </div>{" "}
                                    <div>
                                      <span className="text-white font-medium">
                                        {bd.MembershipVND.toLocaleString()}đ
                                      </span>{" "}
                                      <span className="text-gray-500 ml-1">
                                        ({getPct(bd.MembershipVND)}%)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="text-white font-semibold">
                                      Tổng cộng:
                                    </span>{" "}
                                    <span className="text-white font-semibold">
                                      {total.toLocaleString()}đ
                                    </span>
                                  </div>
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 text-xs">
                          Không có chi tiết
                        </div>
                      )}
                    </td>
                    <td className="px-0 py-0 align-middle">
                      <div className="flex items-start gap-3">
                        {getBankLogo(item.bankName) ? (
                          <div className="w-10 h-10 mt-0.5 bg-white rounded-lg flex items-center justify-center shrink-0 ">
                            <img
                              src={getBankLogo(item.bankName)}
                              alt={item.bankName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-7 h-7 mt-0.5 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                            <Landmark className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-300 font-medium">
                            {item.bankName}
                          </div>
                          <div className="font-mono text-white text-sm tracking-widest mt-1">
                            {item.bankAccountNumber}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 uppercase">
                            {item.bankAccountName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 align-middle text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-center justify-end gap-3">
                        {item.status === "Pending" ? (
                          <>
                            <button
                              onClick={() =>
                                setActionModal({
                                  isOpen: true,
                                  type: "approve",
                                  id: item.id,
                                })
                              }
                              disabled={processingId === item.id}
                              className="w-8 h-8 flex items-center justify-center border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors group relative"
                              title="Duyệt"
                            >
                              {processingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setRejectNote("");
                                setActionModal({
                                  isOpen: true,
                                  type: "reject",
                                  id: item.id,
                                });
                              }}
                              disabled={processingId === item.id}
                              className="w-8 h-8 flex items-center justify-center border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                              title="Từ chối"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                            {item.receiptUrl && (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 flex items-center justify-center border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white rounded transition-colors group relative"
                                title="Xem biên lai"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="flex gap-3 items-center">
                            {item.receiptUrl && (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 flex items-center justify-center border border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white rounded transition-colors group relative"
                                title="Xem biên lai"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            Hiển thị
            <select className="bg-transparent border border-white/10 rounded px-2 py-1 outline-none focus:border-purple-500">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            trên mỗi trang
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-purple-600 text-white font-medium">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5">
              3
            </button>
            <span className="px-1">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5">
              13
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#141418] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">
              {actionModal.type === "approve"
                ? "Xác nhận duyệt"
                : "Từ chối rút tiền"}
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              {actionModal.type === "approve"
                ? "Bạn có chắc chắn muốn duyệt yêu cầu rút tiền này? Vui lòng tải lên biên lai chuyển khoản thành công."
                : "Bạn có chắc chắn muốn từ chối? Vui lòng nhập lý do để thông báo cho người dùng."}
            </p>

            {actionModal.type === "approve" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mã giao dịch / Ghi chú
                  </label>
                  <input
                    type="text"
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="VD: GD123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tải lên Biên lai chuyển khoản{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-[#0A0A0C] hover:bg-white/5 relative overflow-hidden">
                      {receiptPreview ? (
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-4 text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-400">
                            <span className="font-semibold">
                              Nhấn để tải lên
                            </span>{" "}
                            hoặc kéo thả
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG or JPEG (MAX. 5MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setReceiptFile(file);
                            setReceiptPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {actionModal.type === "reject" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  rows="3"
                  placeholder="Nhập lý do chi tiết..."
                  autoFocus
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setActionModal({ isOpen: false, type: null, id: null });
                  setReceiptFile(null);
                  setReceiptPreview("");
                }}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                disabled={processingId === actionModal.id}
              >
                Hủy
              </button>
              <button
                onClick={submitAction}
                disabled={
                  processingId === actionModal.id ||
                  (actionModal.type === "reject" && !rejectNote.trim()) ||
                  (actionModal.type === "approve" && !receiptFile)
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  actionModal.type === "approve"
                    ? "bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    : "bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                }`}
              >
                {processingId === actionModal.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {actionModal.type === "approve" ? "Xác nhận duyệt" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

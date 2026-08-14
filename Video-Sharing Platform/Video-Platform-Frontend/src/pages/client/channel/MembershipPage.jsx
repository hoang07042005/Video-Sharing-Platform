import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Crown,
  Check,
  Star,
  Play,
  Search,
  MoreHorizontal,
  Lock,
  Shield,
} from "lucide-react";
import moment from "moment";

export default function MembershipPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(30000);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch channel profile
        const channelRes = await axios.get(`/api/channels/${handle}`, {
          headers,
        });
        setChannel(channelRes.data);
        const fetchedChannel = channelRes.data;
        if (fetchedChannel.membershipFee) {
          setNewPrice(fetchedChannel.membershipFee);
        }

        // Check if user is owner
        const userHandle = localStorage.getItem("handle");
        if (userHandle && userHandle === fetchedChannel.handle) {
          setIsOwner(true);
          try {
            const revRes = await axios.get(
              `/api/channels/${fetchedChannel.id}/membership-revenue`,
              { headers },
            );
            setTotalRevenue(revRes.data.totalRevenue || 0);
          } catch (e) {
            console.error("Lỗi khi lấy doanh thu", e);
          }
        }

        // 2. Fetch membership status if logged in
        if (token) {
          const statusRes = await axios.get(
            `/api/channels/${fetchedChannel.id}/membership`,
            { headers },
          );
          setIsMember(statusRes.data.isMember);
        }

        // 3. Fetch members list
        setIsLoadingMembers(true);
        const membersRes = await axios.get(
          `/api/channels/${fetchedChannel.id}/members`,
        );
        setMembers(membersRes.data);
        setIsLoadingMembers(false);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        toast.error("Không tìm thấy kênh hoặc có lỗi xảy ra.");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [handle, navigate]);

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tham gia hội viên!");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await axios.post(
        "/api/payment/create-payment-url",
        {
          plan: "Membership",
          cycle: "Basic", // Hardcoded tier for now
          amount: channel.membershipFee || 30000,
          targetChannelId: channel.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Lỗi tạo URL thanh toán:", err);
      toast.error("Có lỗi xảy ra khi xử lý thanh toán.");
      setIsProcessing(false);
    }
  };

  const handleSavePrice = async () => {
    if (newPrice < 10000) {
      toast.error("Giá tối thiểu là 10.000đ");
      return;
    }

    setIsSavingPrice(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/channels/${channel.id}`,
        {
          channelName: channel.channelName,
          handle: channel.handle,
          description: channel.description,
          bannerUrl: channel.bannerUrl,
          avatarUrl: channel.avatarUrl,
          contactEmail: channel.contactEmail,
          country: channel.country,
          socialLinks: channel.socialLinks,
          membershipFee: newPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setChannel((prev) => ({ ...prev, membershipFee: newPrice }));
      setIsEditingPrice(false);
      toast.success("Đã cập nhật giá hội viên thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật giá:", err);
      toast.error("Có lỗi xảy ra khi cập nhật giá.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#0f0f0f]">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#FF4E00] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f0f0f] text-white">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-[#9C27B0]/20 to-[#E91E63]/20">
        {channel.bannerUrl ? (
          <img
            src={channel.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>

        {/* Channel Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex items-end gap-6 max-w-7xl mx-auto">
          <img
            src={channel.avatarUrl || "https://via.placeholder.com/150"}
            alt={channel.channelName}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0f0f0f] object-cover bg-[#1A1A1A]"
          />
          <div className="pb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {channel.channelName}
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#9C27B0]" />
              Trang Hội viên
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Members List */}
          <div className="flex-1 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="bg-[#9C27B0]/20 p-2 rounded-lg">
                <Crown className="w-5 h-5 text-[#9C27B0]" fill="currentColor" />
              </div>
              Cộng đồng hội viên ({members.length})
            </h2>

            {isOwner && (
              <div className="mb-6 bg-gradient-to-r from-[#9C27B0]/10 to-transparent border border-[#9C27B0]/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Tổng doanh thu hội viên (đã cộng dồn gia hạn)
                  </div>
                  <div className="text-2xl font-bold text-[#9C27B0]">
                    {new Intl.NumberFormat("vi-VN").format(totalRevenue)} đ
                  </div>
                </div>
              </div>
            )}

            <div className="relative mb-6 w-[50%]">
              <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm thành viên..."
                className="w-full bg-[#0f0f0f] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#9C27B0]/50 transition-colors"
              />
            </div>

            <div className="overflow-x-auto">
              {isLoadingMembers ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-[#9C27B0] rounded-full animate-spin"></div>
                </div>
              ) : members.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/5 bg-[#0f0f0f]">
                      <th className="py-2 px-2 font-medium rounded-tl-lg rounded-bl-lg">
                        #
                      </th>
                      <th className="py-2 px-2 font-medium ">Thành viên</th>
                      <th className="py-2 px-2 font-medium">Ngày tham gia</th>
                      <th className="py-2 px-2 font-medium">Ngày kết thúc</th>
                      <th className="py-2 px-2 font-medium">Trạng thái</th>
                      <th className="py-2 px-2 font-medium rounded-tr-lg rounded-br-lg text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, index) => (
                      <tr
                        key={member.userId}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-2 px-2 text-sm text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                member.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${member.fullName}`
                              }
                              alt={member.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                            <span className="text-[13px] font-medium text-white">
                              {member.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[13px] text-gray-400">
                          {moment(member.joinedAt).format("DD/MM/YYYY")}
                        </td>
                        <td className="py-2 px-2 text-[13px] text-gray-400">
                          {member.endDate
                            ? moment(member.endDate).format("DD/MM/YYYY")
                            : "-"}
                        </td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-green-500">
                            Đang hoạt động
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Crown className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-400 mb-1">
                    Chưa có hội viên nào
                  </h3>
                  <p className="text-[13px] text-gray-500 mb-6">
                    Hãy trở thành người đầu tiên ủng hộ kênh này!
                  </p>
                </div>
              )}
            </div>

            {members.length > 0 && (
              <div className="flex items-center justify-between mt-6 text-xs text-gray-500 px-2">
                <span>
                  Hiển thị 1 đến {members.length} trong tổng số {members.length}{" "}
                  thành viên
                </span>
                <div className="flex gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-[#0f0f0f] hover:bg-white/10 border border-white/5">
                    &lt;
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-[#9C27B0] text-white">
                    1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-[#0f0f0f] hover:bg-white/10 border border-white/5">
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Registration Form & Perks */}
          <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-6">
            {/* Registration Card */}
            <div className="bg-gradient-to-b  rounded-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64  rounded-full pointer-events-none"></div>

              <div className="flex items-center gap-2 mb-2  font-bold text-lg relative z-10">
                <Crown className="w-5 h-5" fill="currentColor" />
                Đăng ký hội viên
              </div>
              <p className="text-gray-400 text-sm mb-6 relative z-10">
                Trở thành hội viên để nhận nhiều đặc quyền hấp dẫn
              </p>

              <div className="bg-gradient-to-br from-orange-600/30 to-red-600/10 border border-orange-500/20 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-[0_0_30px_rgba(249,115,22,0.1)] relative overflow-hidden z-10">
                <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] border-2 border-yellow-300/50">
                  <Crown
                    className="w-12 h-12 text-white drop-shadow-md"
                    fill="currentColor"
                  />
                </div>

                <div className="flex-1 w-full text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Hội viên chung
                  </h3>

                  {isEditingPrice ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 justify-center sm:justify-start">
                      <div className="flex items-center bg-[#0f0f0f] rounded-lg overflow-hidden border border-orange-500/50">
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="bg-transparent text-orange-400 px-3 py-1.5 outline-none w-24 text-center text-lg font-bold"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePrice}
                          disabled={isSavingPrice}
                          className="px-3 py-1.5 rounded bg-orange-500 text-xs font-bold text-white hover:opacity-90"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setIsEditingPrice(false)}
                          className="px-3 py-1.5 rounded bg-white/10 text-xs text-white hover:bg-white/20"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-orange-500 font-bold text-2xl mb-4 flex items-center justify-center sm:justify-start gap-2">
                      {new Intl.NumberFormat("vi-VN").format(newPrice)}đ{" "}
                      <span className="text-sm font-normal text-white">
                        / tháng
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => setIsEditingPrice(true)}
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition ml-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500 rounded-full p-1 mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-[13px] mb-0.5">
                          Huy hiệu hội viên
                        </div>
                        <div className="text-[11px] text-gray-400 leading-tight">
                          Hiển thị huy hiệu đặc biệt bên cạnh tên của bạn khi
                          bình luận.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500 rounded-full p-1 mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-[13px] mb-0.5">
                          Biểu tượng cảm xúc độc quyền
                        </div>
                        <div className="text-[11px] text-gray-400 leading-tight">
                          Sử dụng các emoji độc quyền của kênh.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-500 rounded-full p-1 mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-[13px] mb-0.5">
                          Ưu tiên trả lời bình luận
                        </div>
                        <div className="text-[11px] text-gray-400 leading-tight">
                          Bình luận của bạn sẽ được kênh ưu tiên phản hồi.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f0f]/80 border border-white/5 rounded-xl p-4 flex gap-3 mb-6 items-center relative z-10">
                <Lock className="w-5 h-5 text-orange-500/80 shrink-0" />
                <p className="text-[11px] text-gray-400 leading-tight">
                  Khi đăng ký, hệ thống sẽ sử dụng thông tin tài khoản của bạn
                  để liên kết và kích hoạt hội viên.
                </p>
              </div>

              {isOwner ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-white/10 text-gray-400 font-bold transition-colors cursor-not-allowed relative z-10"
                >
                  Bạn là chủ kênh
                </button>
              ) : isMember ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-white/10 text-white font-bold transition-colors relative z-10"
                >
                  Bạn đã là hội viên
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 text-white font-bold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 relative z-10"
                >
                  <Crown className="w-5 h-5" fill="currentColor" />{" "}
                  {isProcessing ? "Đang xử lý..." : "Đăng ký ngay"}
                </button>
              )}
            </div>

            {/* Perks Card */}
            <div className=" p-6">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-6 font-bold text-white">
                <div className="bg-orange-500/20 p-1.5 rounded-full">
                  <Crown
                    className="w-4 h-4 text-orange-500"
                    fill="currentColor"
                  />
                </div>
                Quyền lợi khi trở thành hội viên
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Crown className="w-6 h-6 text-orange-500 mb-3" />
                  <div className="text-[12px] font-bold text-white mb-1">
                    Nội dung độc quyền
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight px-1">
                    Truy cập nội dung chỉ dành riêng cho hội viên.
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <Star className="w-6 h-6 text-orange-500 mb-3" />
                  <div className="text-[12px] font-bold text-white mb-1">
                    Hỗ trợ ưu tiên
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight px-1">
                    Được hỗ trợ nhanh chóng và ưu tiên giải quyết.
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <Shield className="w-6 h-6 text-red-500 mb-3" />
                  <div className="text-[12px] font-bold text-white mb-1">
                    Trải nghiệm tốt hơn
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight px-1">
                    Xem video không quảng cáo và chất lượng cao hơn.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

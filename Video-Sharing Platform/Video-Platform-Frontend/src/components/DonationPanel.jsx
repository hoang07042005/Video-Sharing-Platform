import React, { useEffect, useState } from "react";
import axios from "axios";

const DonationPanel = ({ livestreamId, connRef }) => {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiBase = "";

  // Form state
  const [formData, setFormData] = useState({
    donorName: "",
    message: "",
    amount: 50000, // 50k VND mặc định
    isSuperChat: false,
  });

  useEffect(() => {
    if (!livestreamId) return;
    fetchDonations();
    fetchStats();

    // Refresh donations every 10 seconds
    const interval = setInterval(fetchDonations, 10000);
    return () => clearInterval(interval);
  }, [livestreamId]);

  // Listen for super chat events
  useEffect(() => {
    if (!connRef?.current) return;

    const connection = connRef.current;
    const handler = (donation) => {
      setDonations((prev) => [donation, ...prev.slice(0, 49)]);
    };

    connection.on("ReceiveSuperChat", handler);
    return () => connection.off("ReceiveSuperChat", handler);
  }, [connRef]);

  const fetchDonations = async () => {
    try {
      const res = await axios.get(
        `${apiBase}/api/donations/livestream/${livestreamId}`,
      );
      setDonations(res.data);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${apiBase}/api/donations/livestream/${livestreamId}/stats`,
      );
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch donation stats:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "amount"
            ? parseFloat(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.donorName.trim()) {
      alert("Vui lòng nhập tên của bạn");
      return;
    }
    if (formData.amount < 10000) {
      alert("Số tiền tối thiểu là 10,000 VND");
      return;
    }

    setLoading(true);
    try {
      const createRes = await axios.post(`${apiBase}/api/donations/create`, {
        livestreamId,
        donorName: formData.donorName,
        message: formData.message,
        amount: formData.amount,
        currency: "VND",
        isSuperChat: formData.isSuperChat,
        userId: localStorage.getItem("userId") || null,
      });

      // Broadcast via SignalR
      if (connRef?.current && formData.isSuperChat) {
        const userId = localStorage.getItem("userId")
          ? new Guid(localStorage.getItem("userId"))
          : null;
        await connRef.current.invoke(
          "SendSuperChat",
          livestreamId,
          userId,
          formData.donorName,
          formData.message,
          formData.amount,
        );
      }

      alert("Cảm ơn bạn đã quyên góp!");
      setShowModal(false);
      setFormData({
        donorName: "",
        message: "",
        amount: 50000,
        isSuperChat: false,
      });
      await fetchDonations();
      await fetchStats();
    } catch (err) {
      console.error("Failed to create donation:", err);
      alert("Lỗi: " + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1F1F1F] rounded-lg border border-white/10 p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-2">💝 Quyên góp</h2>
        {stats && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-gray-400">Tổng tiền</div>
              <div className="text-yellow-400 font-semibold">
                {stats.totalAmount?.toLocaleString()} VND
              </div>
            </div>
            <div>
              <div className="text-gray-400">Số lần</div>
              <div className="text-blue-400 font-semibold">
                {stats.totalDonations}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Top</div>
              <div className="text-green-400 font-semibold text-xs truncate">
                {stats.topDonor?.donorName || "-"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Donation List */}
      <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
        {donations.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            Không có quyên góp nào
          </div>
        ) : (
          donations.map((donation) => (
            <div
              key={donation.id}
              className={`p-3 rounded ${
                donation.isSuperChat
                  ? "bg-gradient-to-r from-yellow-600/20 to-red-600/20 border border-yellow-500/30"
                  : "bg-white/5"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white flex items-center gap-1">
                    {donation.isSuperChat && "⭐"} {donation.donorName}
                  </div>
                  {donation.message && (
                    <p className="text-xs text-gray-300 mt-1 break-words">
                      {donation.message}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(donation.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-sm font-bold text-yellow-400">
                    {donation.amount.toLocaleString()} VND
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Donate Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-700 hover:to-red-700 rounded font-semibold text-white text-sm transition"
      >
        + Quyên góp
      </button>

      {/* Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F1F1F] rounded-lg border border-white/10 p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-4">
              💝 Quyên góp cho streamer
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Donor Name */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Tên của bạn
                </label>
                <input
                  type="text"
                  name="donorName"
                  value={formData.donorName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Lời nhắn (tùy chọn)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Gửi lời chúc..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none h-20"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Số tiền (VND)
                </label>
                <select
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={10000}>10,000 VND</option>
                  <option value={20000}>20,000 VND</option>
                  <option value={50000}>50,000 VND</option>
                  <option value={100000}>100,000 VND</option>
                  <option value={200000}>200,000 VND</option>
                  <option value={500000}>500,000 VND</option>
                  <option value={1000000}>1,000,000 VND</option>
                </select>
              </div>

              {/* Super Chat Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSuperChat"
                  checked={formData.isSuperChat}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-yellow-500"
                />
                <span className="text-sm text-gray-300">
                  Super Chat ⭐ (hiển thị nổi bật hơn)
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-700 hover:to-red-700 rounded text-white text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Quyên góp ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationPanel;

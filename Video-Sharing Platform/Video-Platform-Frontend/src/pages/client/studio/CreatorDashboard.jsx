import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const idParam = params.get("id");

  const [livestream, setLivestream] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = "";

  useEffect(() => {
    if (!idParam) {
      navigate("/studio");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch livestream info
        const liveRes = await axios.get(
          `${apiBase}/api/livestreams/${idParam}`,
        );
        setLivestream(liveRes.data);

        // Fetch stats
        const statsRes = await axios.get(
          `${apiBase}/api/streamstatistics/livestream/${idParam}/stats?minutes=120`,
        );
        setStats(statsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh stats every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [idParam, navigate]);

  if (loading) {
    return <div className="p-6 text-white text-center">Đang tải...</div>;
  }

  if (!livestream) {
    return (
      <div className="p-6 text-white text-center">
        Không tìm thấy livestream
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0F0F0F] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {livestream.title}
            </h1>
            <p className="text-gray-400">
              Trạng thái:{" "}
              <span
                className={`font-semibold ${livestream.status === "live" ? "text-red-500" : "text-yellow-500"}`}
              >
                {livestream.status}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white"
          >
            Quay lại
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Current Viewers */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-2">Người xem hiện tại</div>
            <div className="text-4xl font-bold text-blue-400">
              {stats?.currentViewers || 0}
            </div>
          </div>

          {/* Peak Viewers */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-2">Đỉnh cao</div>
            <div className="text-4xl font-bold text-green-400">
              {stats?.peakViewers || 0}
            </div>
          </div>

          {/* Average Viewers */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-2">Trung bình</div>
            <div className="text-4xl font-bold text-yellow-400">
              {stats?.avgViewers || 0}
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10">
            <div className="text-gray-400 text-sm mb-2">Tổng lượt xem</div>
            <div className="text-4xl font-bold text-purple-400">
              {livestream.totalViews || 0}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats && stats.stats.length > 0 && (
          <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Lượt xem theo thời gian
            </h2>

            {/* Simple Text-based Chart */}
            <div className="space-y-2">
              {stats.stats.map((stat, idx) => {
                const maxViewers = Math.max(
                  ...stats.stats.map((s) => s.viewerCount),
                );
                const barWidth = (stat.viewerCount / maxViewers) * 100;
                const time = new Date(stat.recordedAt).toLocaleTimeString();

                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="text-xs text-gray-400 w-12">{time}</div>
                    <div className="flex-1 bg-white/10 h-6 rounded overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="text-sm text-white w-12 text-right">
                      {stat.viewerCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stream Info */}
        <div className="bg-[#1F1F1F] p-6 rounded-lg border border-white/10 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Thông tin livestream
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-2">Mô tả</div>
              <p className="text-white">
                {livestream.description || "Không có mô tả"}
              </p>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Tags</div>
              <p className="text-white">{livestream.tags || "Không có tags"}</p>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">
                Thời gian bắt đầu
              </div>
              <p className="text-white">
                {livestream.actualStartTime
                  ? new Date(livestream.actualStartTime).toLocaleString()
                  : "Chưa bắt đầu"}
              </p>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-2">Stream Key</div>
              <p className="text-white font-mono text-xs break-all">
                {livestream.streamKey}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {livestream.status === "live" && (
            <button className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold">
              Tạm dừng (Pause)
            </button>
          )}
          {livestream.status === "scheduled" && (
            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold">
              Bắt đầu (Start)
            </button>
          )}
          {livestream.status !== "ended" && (
            <button className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold">
              Kết thúc (End)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;

import { useState, useEffect } from 'react';
import { Settings2, Star, Users, Bell, Shield, Palette, MonitorPlay, ChevronRight } from 'lucide-react';

// ----- Custom Toggle Component -----
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
        checked ? 'bg-[#FF5722]' : 'bg-[#3A3A3A]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ----- Settings Item Component -----
function SettingItem({ icon: Icon, iconColor = 'text-gray-400', title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 shrink-0 ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ----- Section Header -----
function SectionHeader({ title }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 pt-6 pb-1">
      {title}
    </p>
  );
}

// ----- Main Settings Page -----
export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('userSettings');
      return saved ? JSON.parse(saved) : {
        showJoinButton: true,
        showCommunityButton: true,
      };
    } catch {
      return { showJoinButton: true, showCommunityButton: true };
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5722] to-[#FA5A5A] flex items-center justify-center shadow-lg">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Cài đặt</h1>
            <p className="text-sm text-gray-500">Tuỳ chỉnh trải nghiệm của bạn</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl">

          {/* ── Section: Hiển thị kênh ── */}
          <SectionHeader title="Hiển thị trang kênh" />

          <SettingItem
            icon={Star}
            iconColor="text-yellow-400"
            title='Nút "Hội viên"'
            description="Hiển thị nút Hội viên trên trang kênh của người khác."
          >
            <Toggle
              checked={settings.showJoinButton}
              onChange={val => updateSetting('showJoinButton', val)}
            />
          </SettingItem>

          <div className="mx-5 border-t border-white/6" />

          <SettingItem
            icon={Users}
            iconColor="text-blue-400"
            title='Nút "Cộng đồng"'
            description="Hiển thị nút Cộng đồng trên trang kênh của người khác."
          >
            <Toggle
              checked={settings.showCommunityButton}
              onChange={val => updateSetting('showCommunityButton', val)}
            />
          </SettingItem>

          {/* Separator between sections */}
          <div className="mx-5 my-1 border-t border-white/6" />

          {/* ── Section: Thông báo ── */}
          <SectionHeader title="Thông báo" />

          <SettingItem
            icon={Bell}
            iconColor="text-purple-400"
            title="Thông báo đăng ký"
            description="Nhận thông báo khi kênh bạn theo dõi đăng video mới."
          >
            <span className="text-xs text-gray-500 italic">Sắp ra mắt</span>
          </SettingItem>

          {/* ── Section: Giao diện ── */}
          <SectionHeader title="Giao diện" />

          <SettingItem
            icon={Palette}
            iconColor="text-pink-400"
            title="Chế độ tối"
            description="Đang sử dụng chế độ tối theo mặc định."
          >
            <span className="text-xs font-medium text-[#FF5722] bg-[#FF5722]/10 px-2.5 py-1 rounded-full">Đang bật</span>
          </SettingItem>

          {/* ── Section: Về ── */}
          <SectionHeader title="Về" />

          <SettingItem
            icon={MonitorPlay}
            iconColor="text-red-400"
            title="Phiên bản ứng dụng"
            description="Video Sharing Platform"
          >
            <span className="text-xs text-gray-500">v1.0.0</span>
          </SettingItem>

        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Cài đặt được lưu tự động trên trình duyệt này.
        </p>
      </div>
    </div>
  );
}

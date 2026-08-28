import { useState, useEffect } from "react";
import {
  Settings2,
  Star,
  Users,
  Bell,
  Shield,
  Palette,
  MonitorPlay,
  ChevronRight,
  User,
  Loader2,
  Key,
  Mail,
  Sparkles,
  PlayCircle,
  FileText,
  ShieldCheck,
  Trash2,
  MonitorSmartphone,
  Eye,
  Globe,
  Maximize,
  History,
  UserX,
  MessageSquareOff,
  Video,
  Crown,
  Phone,
  Calendar,
  AtSign,
  Monitor,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Moon,
  Sun,
  SunMoon,
  CheckCircle2,
  LayoutList,
  LayoutGrid,
  RefreshCcw,
  Plus,
  Lock,
  Clock,
  TriangleAlert,
  X,
  ExternalLink,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

// ----- Custom Toggle Component -----
function Toggle({ checked, onChange, labelOn, labelOff }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer shrink-0 ${
          checked ? "bg-green-500" : "bg-[#2A2A2A]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {(labelOn || labelOff) && (
        <span className="text-[11px] font-medium text-gray-400 w-12 text-left">
          {checked ? labelOn : labelOff}
        </span>
      )}
    </div>
  );
}

// ----- Settings Item Component -----
function SettingItem({
  icon: Icon,
  iconColor = "text-gray-400",
  iconBg = "bg-white/5",
  title,
  description,
  children,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-6 hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div
          className={`w-12 h-12 rounded-[5px] flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white mb-0.5">{title}</p>
          {description && (
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-lg">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ----- Main Settings Page -----
export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("userSettings");
      return saved
        ? JSON.parse(saved)
        : {
            showJoinButton: true,
            showCommunityButton: true,
          };
    } catch {
      return { showJoinButton: true, showCommunityButton: true };
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const [profileData, setProfileData] = useState({
    fullName: "",
    phoneNumber: "",
    bio: "",
    dateOfBirth: "",
    channelName: "",
    handle: "",
    description: "",
    receiveNewVideoNotifications: true,
    receiveCommentNotifications: true,
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // For password change
  const [isPwdLoading, setIsPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data) {
          setProfileData({
            fullName: res.data.fullName || "",
            phoneNumber: res.data.phoneNumber || "",
            bio: res.data.bio || "",
            dateOfBirth: res.data.dateOfBirth
              ? res.data.dateOfBirth.split("T")[0]
              : "",
            channelName: res.data.channelName || "",
            handle: res.data.handle || "",
            description: res.data.description || "",
            receiveNewVideoNotifications: res.data.receiveNewVideoNotifications ?? true,
            receiveCommentNotifications: res.data.receiveCommentNotifications ?? true,
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin tài khoản:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMsg({ type: "", text: "" });
    try {
      await axios.put("/api/auth/profile", profileData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProfileMsg({
        type: "success",
        text: "Cập nhật thông tin thành công!",
      });

      // Update local storage items if needed
      if (profileData.handle)
        localStorage.setItem("handle", profileData.handle);
    } catch (error) {
      setProfileMsg({
        type: "error",
        text: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật.",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const oldPwd = e.target.oldPassword.value;
    const newPwd = e.target.newPassword.value;
    const confirmPwd = e.target.confirmPassword.value;

    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setIsPwdLoading(true);
    setPwdMsg({ type: "", text: "" });
    try {
      await axios.post(
        "/api/auth/change-password",
        { oldPassword: oldPwd, newPassword: newPwd },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPwdMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      e.target.reset();
    } catch (error) {
      setPwdMsg({
        type: "error",
        text: error.response?.data?.message || "Lỗi khi đổi mật khẩu.",
      });
    } finally {
      setIsPwdLoading(false);
    }
  };

  const tabs = [
    {
      id: "account",
      label: "Thông tin tài khoản",
      icon: User,
      color: "text-[#FF5722]",
    },
    {
      id: "channel",
      label: "Hiển thị kênh",
      icon: Star,
      color: "text-yellow-400",
    },
    {
      id: "notifications",
      label: "Thông báo",
      icon: Bell,
      color: "text-purple-400",
    },
    {
      id: "appearance",
      label: "Giao diện",
      icon: Palette,
      color: "text-pink-400",
    },
    { id: "security", label: "Bảo mật", icon: Shield, color: "text-green-400" },
    {
      id: "about",
      label: "Về ứng dụng",
      icon: MonitorPlay,
      color: "text-red-400",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-15">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[5px] bg-[#2A1B38] flex items-center justify-center border border-purple-500/30">
            <Settings2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Cài đặt
            </h1>
            <p className="text-[11px] text-gray-500">
              Tùy chỉnh trải nghiệm của bạn
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] p-2 sticky top-24">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group relative ${
                        isActive ? "bg-gradient-to-r from-purple-900/40 to-transparent text-white" : "hover:bg-white/5 text-gray-400"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-[#F05123] to-purple-500 rounded-r-full" />
                      )}
                      <tab.icon className={`w-4.5 h-4.5 ${isActive ? "text-purple-400" : "group-hover:text-white transition-colors"}`} />
                      <span className={`text-xs font-medium text-left ${isActive ? "" : "group-hover:text-white transition-colors"}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Nâng cấp tài khoản Card */}
              <div className="mt-6 rounded-[5px] bg-gradient-to-b from-[#2A162B] to-[#120D1A] border border-white/5 p-5 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border border-[#F05123]/50 flex items-center justify-center mb-3 bg-[#F05123]/10">
                   <Crown className="w-5 h-5 text-[#F05123]" />
                </div>
                <h3 className="text-white font-bold text-[13px] mb-1">Nâng cấp tài khoản</h3>
                <p className="text-gray-400 text-[10px] mb-4 leading-relaxed">Trải nghiệm nhiều tính năng<br/>cao cấp hơn</p>
                <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#F05123] to-[#8F00FF] text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer">
                   Nâng cấp ngay
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between gap-3 mb-8 pb-6 border-b border-white/10 relative">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        Thông tin tài khoản
                      </h2>
                      <p className="text-xs text-gray-500">
                        Quản lý thông tin cá nhân và chi tiết kênh của bạn
                      </p>
                    </div>
                  </div>
                  {/* Decorative ID Card Graphic */}
                  <div className="hidden sm:block relative w-48 h-24">
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[5px] opacity-20 blur-xl"></div>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-20 bg-gradient-to-br from-purple-500/30 to-purple-900/10 border border-purple-400/30 rounded-[5px] shadow-lg flex items-center justify-center overflow-hidden rotate-[-5deg] transition-transform hover:rotate-0">
                        <div className="w-full flex items-center gap-3 px-4">
                           <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-white" />
                           </div>
                           <div className="flex-1 space-y-2">
                              <div className="h-2 bg-white/30 rounded-full w-3/4"></div>
                              <div className="h-1.5 bg-white/10 rounded-full w-full"></div>
                              <div className="h-1.5 bg-white/10 rounded-full w-5/6"></div>
                           </div>
                           <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center border-2 border-[#110D15]">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-4 bg-[#F05123] rounded-full"></div>
                  <h3 className="text-white font-bold text-[13px]">Thông tin cá nhân</h3>
                </div>

                {profileMsg.text && (
                  <div
                    className={`mb-6 p-4 rounded-[5px] text-xs border flex items-center gap-3 ${profileMsg.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"}`}
                  >
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-gray-400">
                        Họ và tên
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData({ ...profileData, fullName: e.target.value })
                          }
                          className="w-full bg-[#181520] border border-white/5 rounded-[5px] pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                          placeholder="Nhập họ và tên..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-gray-400">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          value={profileData.phoneNumber}
                          onChange={(e) =>
                            setProfileData({ ...profileData, phoneNumber: e.target.value })
                          }
                          className="w-full bg-[#181520] border border-white/5 rounded-[5px] pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                          placeholder="Nhập số điện thoại..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-gray-400">
                        Ngày sinh
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10 pointer-events-none">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) =>
                            setProfileData({ ...profileData, dateOfBirth: e.target.value })
                          }
                          className="w-full bg-[#181520] border border-white/5 rounded-[5px] pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium text-gray-400">
                        Mã định danh (Handle)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <AtSign className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={profileData.handle}
                          onChange={(e) =>
                            setProfileData({ ...profileData, handle: e.target.value })
                          }
                          className="w-full bg-[#181520] border border-white/5 rounded-[5px] pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                          placeholder="Mã định danh..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-gray-400">
                      Tên kênh (Channel Name)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <Monitor className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={profileData.channelName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, channelName: e.target.value })
                        }
                        className="w-full bg-[#181520] border border-white/5 rounded-[5px] pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
                        placeholder="Tên kênh của bạn..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-gray-400">
                      Tiểu sử cá nhân (Bio)
                    </label>
                    <div className="relative">
                      <textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({ ...profileData, bio: e.target.value })
                        }
                        className="w-full bg-[#181520] border border-white/5 rounded-[5px] px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-all resize-none h-24"
                        placeholder="Giới thiệu một chút về bản thân..."
                        maxLength={200}
                      />
                      <span className="absolute bottom-3 right-4 text-[10px] text-gray-500">
                        {(profileData.bio || "").length}/200
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-gray-400">
                      Mô tả kênh (Channel Description)
                    </label>
                    <div className="bg-[#181520] border border-white/5 rounded-[5px] overflow-hidden focus-within:border-purple-500 transition-all relative">
                      <div className="flex items-center gap-3 p-3 border-b border-white/5 text-gray-400 bg-white/[0.02]">
                         <Bold className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <Italic className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <Underline className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <span className="w-[1px] h-3.5 bg-white/10 mx-1"></span>
                         <List className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <ListOrdered className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <LinkIcon className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <div className="flex-1"></div>
                         <ImageIcon className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                         <Video className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                      </div>
                      <textarea
                        value={profileData.description}
                        onChange={(e) =>
                          setProfileData({ ...profileData, description: e.target.value })
                        }
                        className="w-full bg-transparent p-4 pb-8 text-xs text-white focus:outline-none resize-none h-32"
                        placeholder="Mô tả chi tiết về kênh của bạn..."
                        maxLength={1000}
                      />
                      <span className="absolute bottom-3 right-4 text-[10px] text-gray-500">
                        {(profileData.description || "").length}/1000
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isProfileLoading}
                      className="bg-gradient-to-r from-[#F05123] to-[#8F00FF] text-white px-6 py-2.5 rounded-lg font-bold text-xs transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {isProfileLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : <Save className="w-4 h-4" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>

                <div className="mt-8">
                  <div className="bg-[#161115] border border-red-500/20 rounded-[5px] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4.5 h-4.5 text-red-500" />
                      <h3 className="text-red-500 font-bold text-[13px]">Vùng nguy hiểm (Danger Zone)</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1B1418] border border-red-500/10 rounded-lg p-5">
                      <div>
                        <h4 className="text-white text-xs font-medium mb-1">Xóa tài khoản</h4>
                        <p className="text-[10px] text-gray-500 max-w-md leading-relaxed">
                          Xóa vĩnh viễn tài khoản của bạn và mọi dữ liệu liên quan.<br/>Hành động này không thể hoàn tác.
                        </p>
                      </div>
                      <button className="bg-transparent hover:bg-red-500/10 text-gray-400 hover:text-red-500 font-medium px-5 py-2.5 text-xs rounded-lg transition-colors border border-red-500/20 shrink-0 cursor-pointer flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Xóa tài khoản
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Channel Tab */}
            {activeTab === "channel" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-[5px] bg-gradient-to-br from-[#F05123]/20 to-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Star className="w-6 h-6 text-[#F05123]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Hiển thị trang kênh
                    </h2>
                    <p className="text-xs text-gray-500">
                      Quản lý các cài đặt hiển thị và quyền truy cập trên trang kênh của bạn
                    </p>
                  </div>
                </div>

                <div className="border border-white/5 rounded-[5px] bg-[#141418] flex flex-col divide-y divide-white/5 mb-8">
                  <SettingItem
                    icon={Sparkles}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    title='Nút "Hội viên"'
                    description="Hiển thị nút Hội viên trên trang kênh của bạn để khán giả có thể đăng ký hội viên."
                  >
                    <Toggle
                      checked={settings.showJoinButton}
                      onChange={(val) => updateSetting("showJoinButton", val)}
                      labelOn="Hiển thị"
                      labelOff="Ẩn"
                    />
                  </SettingItem>
                  <SettingItem
                    icon={Users}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    title='Nút "Cộng đồng"'
                    description="Hiển thị nút Cộng đồng trên trang kênh giúp khán giả tương tác dễ hơn."
                  >
                    <Toggle
                      checked={settings.showCommunityButton}
                      onChange={(val) => updateSetting("showCommunityButton", val)}
                      labelOn="Hiển thị"
                      labelOff="Ẩn"
                    />
                  </SettingItem>
                  <SettingItem
                    icon={Eye}
                    iconColor="text-teal-400"
                    iconBg="bg-teal-500/10"
                    title="Hiển thị số người đăng ký"
                    description="Cho phép công khai minh bạch tổng số người đăng ký kênh của bạn."
                  >
                    <Toggle 
                      checked={settings.showSubscriberCount ?? true} 
                      onChange={(val) => updateSetting("showSubscriberCount", val)} 
                      labelOn="Hiển thị"
                      labelOff="Ẩn"
                    />
                  </SettingItem>
                  <SettingItem
                    icon={MessageSquareOff}
                    iconColor="text-pink-500"
                    iconBg="bg-pink-500/10"
                    title="Kiểm duyệt bình luận"
                    description="Tự động giữ lại các bình luận có chứa từ khóa nhạy cảm để xem xét."
                  >
                    <Toggle 
                      checked={settings.moderateComments ?? false} 
                      onChange={(val) => updateSetting("moderateComments", val)} 
                      labelOn="Bật"
                      labelOff="Tắt"
                    />
                  </SettingItem>
                </div>

                <div className="bg-gradient-to-r from-purple-900/10 to-transparent border border-purple-500/20 rounded-[5px] p-5 flex items-start gap-4">
                  <Shield className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                     <h4 className="text-white font-bold text-sm mb-1">Lưu ý về hiển thị kênh</h4>
                     <p className="text-xs text-gray-400 leading-relaxed">
                       Các cài đặt này chỉ ảnh hưởng đến trang kênh của bạn. Một số thay đổi có thể mất vài phút để cập nhật.
                     </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[5px] bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                      <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Thông báo</h2>
                      <p className="text-xs text-gray-500">
                        Quản lý cách bạn nhận thông báo
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-[5px] border border-white/10 hover:bg-white/5 transition-colors text-xs text-gray-400 hover:text-white cursor-pointer hidden sm:flex">
                    <Mail className="w-4 h-4" />
                    Xem tất cả thông báo
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-4 px-2 gap-4">
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">Kênh thông báo</h3>
                    <p className="text-[11px] text-gray-500">Chọn kênh bạn muốn nhận thông báo từ nền tảng</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
                      <Bell className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[11px] text-gray-300 font-medium">Trong ứng dụng</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-transparent">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-400 font-medium">Email</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F05123] flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-transparent">
                      <MonitorSmartphone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-400 font-medium">Push</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F05123] flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-white/5 rounded-[5px] bg-[#181520] flex flex-col divide-y divide-white/5 mb-8">
                  <SettingItem
                    icon={PlayCircle}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    title="Thông báo video mới"
                    description="Nhận thông báo khi kênh bạn theo dõi đăng video mới."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-purple-400 fill-purple-400" />
                         <Mail className="w-4 h-4 text-[#F05123]" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle
                        checked={profileData.receiveNewVideoNotifications}
                        onChange={async (val) => {
                          setProfileData({ ...profileData, receiveNewVideoNotifications: val });
                          try {
                            await axios.put("/api/auth/profile", { ...profileData, receiveNewVideoNotifications: val }, {
                              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                            });
                          } catch (e) {
                            console.error("Lỗi cập nhật thông báo:", e);
                          }
                        }}
                      />
                    </div>
                  </SettingItem>
                  <SettingItem
                    icon={MessageSquareOff}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    title="Thông báo bình luận"
                    description="Nhận thông báo khi có người bình luận vào video của bạn."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-purple-400 fill-purple-400" />
                         <Mail className="w-4 h-4 text-[#F05123]" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle
                        checked={profileData.receiveCommentNotifications}
                        onChange={async (val) => {
                          setProfileData({ ...profileData, receiveCommentNotifications: val });
                          try {
                            await axios.put("/api/auth/profile", { ...profileData, receiveCommentNotifications: val }, {
                              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                            });
                          } catch (e) {
                            console.error("Lỗi cập nhật thông báo:", e);
                          }
                        }}
                      />
                    </div>
                  </SettingItem>
                  <SettingItem
                    icon={Mail}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    title="Email hệ thống & cập nhật"
                    description="Nhận các email về cập nhật chính sách và tính năng mới."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-gray-600" />
                         <Mail className="w-4 h-4 text-[#F05123]" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle
                        checked={settings.emailUpdates ?? true}
                        onChange={(val) => updateSetting("emailUpdates", val)}
                      />
                    </div>
                  </SettingItem>
                  <SettingItem
                    icon={Star}
                    iconColor="text-yellow-400"
                    iconBg="bg-yellow-500/10"
                    title="Gợi ý cá nhân hóa"
                    description="Nhận thông báo về các video đề xuất dành riêng cho bạn."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-purple-400 fill-purple-400" />
                         <Mail className="w-4 h-4 text-[#F05123]" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle
                        checked={settings.personalizedRecs ?? true}
                        onChange={(val) => updateSetting("personalizedRecs", val)}
                      />
                    </div>
                  </SettingItem>
                  <SettingItem
                    icon={Video}
                    iconColor="text-red-400"
                    iconBg="bg-red-500/10"
                    title="Thông báo Livestream"
                    description="Nhận thông báo ngay khi kênh bạn theo dõi bắt đầu phát trực tiếp."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-purple-400 fill-purple-400" />
                         <Mail className="w-4 h-4 text-gray-600" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle 
                        checked={settings.liveNotifications ?? true} 
                        onChange={(val) => updateSetting("liveNotifications", val)} 
                      />
                    </div>
                  </SettingItem>
                  <SettingItem
                    icon={Bell}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    title="Nhắc nhở xem tiếp"
                    description="Gửi thông báo nhắc nhở xem các video trong danh sách 'Xem sau'."
                  >
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-6">
                         <Bell className="w-4 h-4 text-purple-400 fill-purple-400" />
                         <Mail className="w-4 h-4 text-[#F05123]" />
                         <MonitorSmartphone className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-2"></div>
                      <Toggle 
                        checked={settings.watchReminders ?? false} 
                        onChange={(val) => updateSetting("watchReminders", val)} 
                      />
                    </div>
                  </SettingItem>
                </div>

                <div className="bg-[#181520] border border-white/5 rounded-[5px] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#F05123] mt-0.5" />
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Quyền riêng tư thông báo</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Chúng tôi cam kết bảo mật thông tin và chỉ gửi những thông báo quan trọng đến bạn.
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-xs text-gray-300 font-medium cursor-pointer shrink-0 flex items-center gap-2">
                    Tìm hiểu thêm
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-[5px] bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Palette className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Giao diện</h2>
                    <p className="text-xs text-gray-500">
                      Thay đổi cách ứng dụng hiển thị theo sở thích của bạn
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Theme Settings */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Chủ đề màu</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Chọn chủ đề phù hợp với phong cách của bạn.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="cursor-pointer group relative bg-[#110D15] border border-purple-500 rounded-[5px] p-3 w-32 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#110D15]">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-full h-10 bg-[#1A1625] rounded-lg flex items-center justify-center relative overflow-hidden">
                              <Moon className="w-4 h-4 text-purple-400" />
                           </div>
                           <div className="text-center">
                             <p className="text-white text-xs font-bold mb-0.5">Tối</p>
                             <p className="text-purple-400 text-[10px]">Hiện tại</p>
                           </div>
                        </div>
                      </div>

                      <div className="cursor-pointer group relative bg-[#181520] border border-white/5 rounded-[5px] p-3 w-32 hover:bg-white/[0.02] transition-all">
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-full h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <Sun className="w-4 h-4 text-gray-400" />
                           </div>
                           <div className="text-center">
                             <p className="text-gray-300 group-hover:text-white text-xs font-bold mb-0.5 transition-colors">Sáng</p>
                             <p className="text-gray-500 text-[10px]">Trải nghiệm sáng</p>
                           </div>
                        </div>
                      </div>

                      <div className="cursor-pointer group relative bg-[#181520] border border-white/5 rounded-[5px] p-3 w-32 hover:bg-white/[0.02] transition-all">
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-full h-10 rounded-lg flex items-center justify-center overflow-hidden relative border border-white/5">
                              <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-100 flex items-center justify-center">
                                 <Sun className="w-3.5 h-3.5 text-gray-400 -mr-3" />
                              </div>
                              <div className="absolute inset-y-0 right-0 w-1/2 bg-[#1A1625] flex items-center justify-center">
                                 <Moon className="w-3.5 h-3.5 text-gray-500 -ml-3" />
                              </div>
                           </div>
                           <div className="text-center">
                             <p className="text-gray-300 group-hover:text-white text-xs font-bold mb-0.5 transition-colors">Tự động</p>
                             <p className="text-gray-500 text-[10px]">Theo hệ thống</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Màu nhấn</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Chọn màu nhấn cho các nút, liên kết và điểm nhấn.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-7 h-7 rounded-full bg-[#F05123] border-2 border-white flex items-center justify-center shadow-[0_0_0_2px_#F05123] cursor-pointer">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                         </div>
                         <div className="w-6 h-6 rounded-full bg-purple-500 cursor-pointer hover:scale-110 transition-transform"></div>
                         <div className="w-6 h-6 rounded-full bg-pink-500 cursor-pointer hover:scale-110 transition-transform"></div>
                         <div className="w-6 h-6 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform"></div>
                         <div className="w-6 h-6 rounded-full bg-green-500 cursor-pointer hover:scale-110 transition-transform"></div>
                         <div className="w-6 h-6 rounded-full bg-yellow-500 cursor-pointer hover:scale-110 transition-transform"></div>
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 cursor-pointer hover:scale-110 transition-transform"></div>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-[11px] text-gray-300">
                        Tùy chỉnh
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500"></div>
                      </button>
                    </div>
                  </div>

                  {/* Display Density */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Kiểu hiển thị</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Điều chỉnh cách hiển thị nội dung trong ứng dụng.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="cursor-pointer flex items-center gap-4 bg-[#110D15] border border-purple-500 rounded-[5px] px-5 py-3 w-48 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                         <LayoutList className="w-6 h-6 text-purple-400" />
                         <div>
                            <p className="text-white text-[13px] font-bold">Thoải mái</p>
                            <p className="text-[10px] text-gray-400">Khoảng cách rộng, dễ nhìn</p>
                         </div>
                      </div>
                      <div className="cursor-pointer flex items-center gap-4 bg-[#181520] border border-white/5 rounded-[5px] px-5 py-3 w-48 hover:bg-white/[0.02] transition-colors">
                         <LayoutGrid className="w-6 h-6 text-gray-500" />
                         <div>
                            <p className="text-gray-300 text-[13px] font-bold">Gọn gàng</p>
                            <p className="text-[10px] text-gray-500">Hiển thị nhiều nội dung hơn</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Kích thước chữ</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Điều chỉnh kích thước chữ để dễ đọc hơn.</p>
                    </div>
                    <div className="flex items-center bg-[#181520] border border-white/5 rounded-[5px] p-1">
                      <button className="px-8 py-2 rounded-lg text-gray-400 hover:text-white transition-colors flex flex-col items-center">
                         <span className="text-xs font-bold mb-0.5">A-</span>
                         <span className="text-[10px]">Nhỏ</span>
                      </button>
                      <button className="px-8 py-2 rounded-lg bg-[#110D15] border border-purple-500 text-white transition-colors flex flex-col items-center shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                         <span className="text-sm font-bold mb-0.5">A</span>
                         <span className="text-[10px] text-purple-400">Trung bình</span>
                      </button>
                      <button className="px-8 py-2 rounded-lg text-gray-400 hover:text-white transition-colors flex flex-col items-center">
                         <span className="text-base font-bold mb-0.5">A+</span>
                         <span className="text-[10px]">Lớn</span>
                      </button>
                    </div>
                  </div>

                  {/* Animations Toggle */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Hiệu ứng chuyển động</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Bật/tắt các hiệu ứng chuyển động trong ứng dụng.</p>
                    </div>
                    <Toggle checked={true} onChange={() => {}} />
                  </div>

                  {/* Background Image */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <div className="max-w-xs">
                      <h3 className="text-white font-bold text-sm mb-1">Hình nền ứng dụng</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Chọn hình nền cho giao diện của bạn.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                       <div className="w-24 h-14 rounded-lg bg-gradient-to-br from-purple-900 to-black border-2 border-purple-500 relative cursor-pointer shadow-lg shadow-purple-500/20 overflow-hidden">
                          <div className="absolute inset-0 bg-purple-500/20 blur-xl"></div>
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#110D15]">
                             <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                       </div>
                       <div className="w-24 h-14 rounded-lg bg-gradient-to-br from-[#1A1A24] to-[#0A0A10] border border-white/10 hover:border-white/20 transition-colors cursor-pointer"></div>
                       <div className="w-24 h-14 rounded-lg bg-gradient-to-br from-indigo-900 to-black border border-white/10 hover:border-white/20 transition-colors cursor-pointer relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-500/30 to-transparent"></div>
                       </div>
                       <div className="w-24 h-14 rounded-lg border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                          <Plus className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[10px] text-gray-400">Tải lên</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="mt-8 bg-[#181520] border border-white/5 rounded-[5px] p-6">
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h4 className="text-white font-bold text-sm mb-1">Xem trước giao diện</h4>
                        <p className="text-[11px] text-gray-500">Đây là cách giao diện sẽ hiển thị với các tùy chỉnh hiện tại của bạn.</p>
                     </div>
                     <button className="flex items-center gap-2 px-4 py-2 rounded-[5px] border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-xs text-gray-300 font-medium cursor-pointer shrink-0">
                        Làm mới xem trước
                        <RefreshCcw className="w-3 h-3" />
                     </button>
                  </div>
                  {/* Mock UI Preview */}
                  <div className="bg-[#0B0910] rounded-[5px] border border-white/5 h-32 p-4 flex flex-col gap-4 overflow-hidden relative shadow-inner">
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                     {/* Header Mock */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 bg-gradient-to-br from-[#F05123] to-purple-600 rounded-md flex items-center justify-center">
                              <PlayCircle className="w-4 h-4 text-white" />
                           </div>
                           <div className="flex flex-col gap-1">
                             <div className="w-12 h-2 bg-white/20 rounded-full"></div>
                             <div className="w-10 h-2 bg-[#F05123]/80 rounded-full"></div>
                           </div>
                        </div>
                        <div className="w-1/3 h-7 bg-white/5 rounded-full border border-white/5 flex items-center px-3">
                           <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-full bg-white/5"></div>
                           <div className="w-7 h-7 rounded-full bg-purple-500/50 border border-purple-400"></div>
                        </div>
                     </div>
                     {/* Content Mock */}
                     <div className="flex gap-4">
                        <div className="w-48 h-20 bg-[#1A1625] rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F05123] to-[#8F00FF] flex items-center justify-center shadow-lg shadow-purple-500/20">
                              <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                           </div>
                        </div>
                        <div className="flex-1 space-y-2.5 py-2">
                           <div className="w-3/4 h-3 bg-white/20 rounded-full"></div>
                           <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
                           <div className="flex gap-2">
                             <div className="w-8 h-8 bg-purple-500/20 rounded-md"></div>
                             <div className="w-24 h-2 bg-white/10 rounded-full mt-1"></div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-[5px] overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-12 h-12 rounded-[5px] bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Bảo mật tài khoản
                    </h2>
                    <p className="text-xs text-gray-500">
                      Bảo vệ tài khoản của bạn bằng các lớp bảo mật mạnh mẽ
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Tăng cường bảo mật */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-white font-bold text-[13px] mb-1">Tăng cường bảo mật</h3>
                      <p className="text-[11px] text-gray-500">Các tính năng giúp bảo vệ tài khoản của bạn tốt hơn</p>
                    </div>
                    <div className="bg-[#141418] border border-white/5 rounded-[5px] flex flex-col divide-y divide-white/5">
                      <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[5px] bg-green-500/10 flex items-center justify-center">
                            <Lock className="w-4.5 h-4.5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white text-[13px] font-bold mb-0.5">Xác thực 2 lớp (2FA)</p>
                            <p className="text-[11px] text-gray-500">Thêm lớp bảo mật bằng mã xác thực từ ứng dụng hoặc SMS.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Đã bật</span>
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[5px] bg-purple-500/10 flex items-center justify-center">
                            <MonitorSmartphone className="w-4.5 h-4.5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white text-[13px] font-bold mb-0.5">Thiết bị đăng nhập</p>
                            <p className="text-[11px] text-gray-500">Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[5px] bg-blue-500/10 flex items-center justify-center">
                            <Clock className="w-4.5 h-4.5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white text-[13px] font-bold mb-0.5">Lịch sử đăng nhập</p>
                            <p className="text-[11px] text-gray-500">Xem các lần đăng nhập gần đây và địa điểm đăng nhập.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <TriangleAlert className="w-4.5 h-4.5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white text-[13px] font-bold mb-0.5">Email đăng nhập & khôi phục</p>
                            <p className="text-[11px] text-gray-500">Quản lý email dùng để đăng nhập và khôi phục tài khoản.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Xóa tài khoản */}
                  <div className="bg-[#181520] border border-white/5 rounded-xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-bold text-[13px] mb-1">Xóa tài khoản</h3>
                      <p className="text-[11px] text-gray-500">Khi xóa tài khoản, mọi dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-xs text-red-400 font-medium cursor-pointer shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                      Yêu cầu xóa tài khoản
                    </button>
                  </div>

                  {/* Mẹo bảo mật */}
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-start gap-4 relative">
                    <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 mt-1">
                      <ShieldCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="pr-8">
                      <h4 className="text-white font-bold text-[13px] mb-1">Mẹo bảo mật</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Không chia sẻ mật khẩu và luôn bật xác thực 2 lớp để bảo vệ tài khoản của bạn tốt hơn.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <MonitorPlay className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Về ứng dụng
                    </h2>
                    <p className="text-xs text-gray-500">
                      Thông tin về phiên bản và bản quyền
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* App Info Card */}
                  <div className="bg-[#181520] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center gap-8">
                    {/* Logo Section */}
                    <div className="flex items-center justify-center bg-black/40 rounded-2xl p-6 w-full md:w-64 border border-white/5 shrink-0">
                      <div className="flex items-center">
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black text-white italic tracking-tighter leading-none">Video-</span>
                          <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F05123] to-[#8F00FF] italic tracking-tighter leading-none">Sharing.</span>
                          <div className="flex gap-2 mt-1.5 opacity-80">
                            <span className="text-[6px] font-bold text-[#F05123] tracking-widest uppercase">Share</span>
                            <span className="text-[6px] font-bold text-gray-400 tracking-widest uppercase">•</span>
                            <span className="text-[6px] font-bold text-white tracking-widest uppercase">Watch</span>
                            <span className="text-[6px] font-bold text-gray-400 tracking-widest uppercase">•</span>
                            <span className="text-[6px] font-bold text-[#8F00FF] tracking-widest uppercase">Connect</span>
                          </div>
                        </div>
                        <div className="ml-2 w-10 h-10 rounded-xl bg-gradient-to-br from-[#F05123] to-[#8F00FF] flex items-center justify-center shadow-lg shadow-[#8F00FF]/20 relative overflow-hidden">
                           <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                           <div className="absolute top-4 left-1 w-1 h-1 bg-blue-400 rounded-full"></div>
                           <div className="absolute bottom-2 right-1 w-1 h-1 bg-green-400 rounded-full"></div>
                           <PlayCircle className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* App Details */}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                             <h3 className="text-white font-bold text-base">Video Sharing Platform</h3>
                             <span className="text-[10px] font-bold text-purple-400 border border-purple-500/50 rounded-full px-2 py-0.5 bg-purple-500/10">PRO</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                             Nền tảng chia sẻ video hiện đại, giúp bạn kết nối, chia sẻ và khám phá những nội dung tuyệt vời nhất.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-medium text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">v1.0.0</span>
                           <span className="text-xs text-gray-500 flex items-center gap-1.5">
                              Phiên bản mới nhất <CheckCircle2 className="w-4 h-4 text-green-500" />
                           </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between shrink-0 md:text-right gap-4 md:gap-0">
                         <div className="flex md:flex-col gap-6 md:gap-4">
                            <div>
                               <p className="text-[10px] text-gray-500 mb-0.5 font-medium">Cập nhật mới nhất</p>
                               <p className="text-xs text-gray-300">15/05/2026</p>
                            </div>
                            <div>
                               <p className="text-[10px] text-gray-500 mb-0.5 font-medium">Kích thước ứng dụng</p>
                               <p className="text-xs text-gray-300">42.6 MB</p>
                            </div>
                         </div>
                         <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-xs text-gray-300 cursor-pointer">
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Kiểm tra cập nhật
                         </button>
                      </div>
                    </div>
                  </div>

                  {/* Link Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#181520] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4.5 h-4.5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-bold mb-0.5">Điều khoản dịch vụ</p>
                          <p className="text-[11px] text-gray-500">Đọc các điều khoản và điều kiện sử dụng nền tảng.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div className="bg-[#181520] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4.5 h-4.5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-bold mb-0.5">Chính sách quyền riêng tư</p>
                          <p className="text-[11px] text-gray-500">Cách chúng tôi bảo vệ và sử dụng dữ liệu của bạn.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>

                    <div className="bg-[#181520] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4.5 h-4.5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-bold mb-0.5">Giấy phép mã nguồn mở</p>
                          <p className="text-[11px] text-gray-500">Thông tin về các thư viện mã nguồn mở được sử dụng.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>

                    <div className="bg-[#181520] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4.5 h-4.5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-bold mb-0.5">Trung tâm trợ giúp</p>
                          <p className="text-[11px] text-gray-500">Câu hỏi thường gặp và hướng dẫn sử dụng.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* Feedback Card */}
                  <div className="bg-[#181520] border border-white/5 rounded-xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                         <MessageSquare className="w-4.5 h-4.5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-[13px] mb-0.5">Gửi phản hồi</h3>
                        <p className="text-[11px] text-gray-500">Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện ứng dụng tốt hơn.</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-xs text-gray-300 font-medium cursor-pointer shrink-0">
                      Gửi phản hồi
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Footer Area */}
                  <div className="border-t border-white/5 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <span className="text-[11px] text-gray-500 font-medium">Theo dõi chúng tôi</span>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                              <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                              <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.32 6.32 0 0 0 6.13-6.23V8.8a8.31 8.31 0 0 0 2.19.34z"/></svg>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FD5949] to-[#D6249F] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                           </div>
                        </div>
                     </div>
                     <div className="text-center md:text-right">
                        <p className="text-[10px] text-gray-500">Bản quyền © 2026 Video Sharing Platform</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Mọi quyền được bảo lưu.</p>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

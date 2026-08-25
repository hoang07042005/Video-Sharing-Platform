import React, { useEffect, useState } from "react";
import axios from "axios";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({});
  const apiBase = "";

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Request push notification permission
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            // Auto-request if not already subscribed
            const newSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                process.env.REACT_APP_VAPID_PUBLIC_KEY || "",
            });

            if (newSubscription) {
              await registerPushSubscription(newSubscription);
            }
          }
        } catch (err) {
          console.error("Push notification error:", err);
        }
      });
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPreferences(res.data);
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    }
  };

  const registerPushSubscription = async (subscription) => {
    try {
      await axios.post(`${apiBase}/api/notifications/subscribe`, subscription, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (err) {
      console.error("Failed to register push subscription:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${apiBase}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${apiBase}/api/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const updatePreferences = async (key, value) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      await axios.put(
        `${apiBase}/api/notifications/preferences`,
        updatedPrefs,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "stream_live":
        return "🔴";
      case "donation":
        return "💝";
      case "comment":
        return "💬";
      case "follow":
        return "👤";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSettings(false);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 hover:bg-white/10 rounded transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#1F1F1F] border border-white/10 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-semibold">Thông báo</h3>
            <div className="flex gap-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white"
                >
                  Đánh dấu tất cả
                </button>
              )}
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  if (!showSettings) fetchPreferences();
                }}
                className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings ? (
            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              <h4 className="text-white font-semibold text-sm mb-3">
                Cài đặt thông báo
              </h4>

              {[
                ["enableStreamNotifications", "Thông báo livestream"],
                ["enableDonationNotifications", "Thông báo quyên góp"],
                ["enableCommentNotifications", "Thông báo bình luận"],
                ["enableFollowNotifications", "Thông báo theo dõi"],
                ["enablePushNotifications", "Thông báo Push"],
                ["enableEmailNotifications", "Thông báo Email"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={preferences[key] || false}
                    onChange={(e) => updatePreferences(key, e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          ) : (
            /* Notifications List */
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Không có thông báo nào
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.targetUrl)
                        window.location.href = notif.targetUrl;
                    }}
                    className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${
                      !notif.isRead ? "bg-blue-500/10" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {notif.imageUrl && (
                        <img
                          src={notif.imageUrl}
                          alt="notification"
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      {!notif.imageUrl && (
                        <span className="text-xl">
                          {getNotificationIcon(notif.type)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && !showSettings && (
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Xem tất cả thông báo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

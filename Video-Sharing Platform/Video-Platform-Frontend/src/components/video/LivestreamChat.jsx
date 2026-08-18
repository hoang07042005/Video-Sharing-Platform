import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useSignalRConnection } from '../../hooks/useSignalRConnection';

// -------------------------------------------------------
//  Helpers
// -------------------------------------------------------
const timeStr = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// -------------------------------------------------------
//  Sub‑components
// -------------------------------------------------------

/** Banner for pinned message */
const PinnedBanner = ({ msg, onUnpin, isChannelOwner }) => {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2 mb-2 shrink-0">
      <span className="text-yellow-400 text-xs">📌</span>
      <div className="flex-1 min-w-0">
        <span className="text-yellow-300 text-xs font-semibold">Tin ghim: </span>
        <span className="text-white/80 text-xs truncate">{msg.content}</span>
      </div>
      {isChannelOwner && (
        <button
          onClick={onUnpin}
          className="text-yellow-400/60 hover:text-yellow-400 text-xs shrink-0 transition"
        >✕</button>
      )}
    </div>
  );
};

/** Popup report dialog */
const ReportDialog = ({ msg, onClose, onSubmit }) => {
  const [reason, setReason] = useState('Spam');
  const [desc, setDesc] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-80 shadow-xl">
        <h3 className="text-white font-semibold mb-4">Báo cáo bình luận</h3>
        <p className="text-white/60 text-xs mb-3 line-clamp-2">"{msg.content}"</p>
        <label className="text-white/70 text-xs block mb-1">Lý do</label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-2 mb-3"
        >
          <option value="Spam">Spam</option>
          <option value="Ngôn từ kích động">Ngôn từ kích động</option>
          <option value="Quấy rối">Quấy rối</option>
          <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
          <option value="Khác">Khác</option>
        </select>
        <label className="text-white/70 text-xs block mb-1">Mô tả thêm (tuỳ chọn)</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2 mb-4 resize-none h-16"
          placeholder="Mô tả chi tiết..."
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(reason, desc)}
            className="flex-1 bg-red-600 hover:bg-red-700 transition text-white text-sm py-2 rounded-lg font-semibold"
          >Gửi báo cáo</button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 transition text-white text-sm py-2 rounded-lg"
          >Huỷ</button>
        </div>
      </div>
    </div>
  );
};

/** Donate Modal */
const DonateModal = ({ onClose, onSend, userName }) => {
  const [amount, setAmount] = useState(10000);
  const [message, setMessage] = useState('');
  const presets = [10000, 20000, 50000, 100000, 200000, 500000];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 w-80 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">💝 Quyên góp cho kênh</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg transition">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`text-xs py-2 rounded-lg border transition font-medium
                ${amount === p ? 'border-pink-500 bg-pink-500/20 text-pink-300' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              {p >= 1000 ? `${p / 1000}K` : p}đ
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1000}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm px-3 py-2 mb-3"
          placeholder="Nhập số tiền (VND)"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={120}
          placeholder="Lời nhắn của bạn..."
          className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2 mb-4 resize-none h-16"
        />
        <button
          onClick={() => onSend(amount, message)}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 transition"
        >
          Gửi {amount.toLocaleString('vi-VN')}đ
        </button>
      </div>
    </div>
  );
};

/** A single chat message row */
const MessageRow = ({ msg, userId, isChannelOwner, onPin, onUnpin, onReport }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Donation / Super Chat style
  if (msg.messageType === 'Donation' || msg.messageType === 'SuperChat') {
    return (
      <div className="rounded-xl p-3 mb-1 bg-gradient-to-r from-pink-600/30 to-rose-600/20 border border-pink-500/40">
        <div className="flex items-center gap-2 mb-1">
          {msg.userAvatar
            ? <img src={msg.userAvatar} alt={msg.userName} className="w-6 h-6 rounded-full object-cover border-2 border-pink-500" />
            : <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-[10px] text-white font-bold border-2 border-pink-500">{(msg.userName || 'A')[0]}</div>
          }
          <span className="text-pink-300 font-bold text-xs">{msg.userName || 'Anonymous'}</span>
          <span className="ml-auto text-yellow-300 font-bold text-xs">💝 {Number(msg.amount || 0).toLocaleString('vi-VN')}đ</span>
        </div>
        <p className="text-white/90 text-sm">{msg.content || msg.message}</p>
      </div>
    );
  }

  // System message style
  if (msg.messageType === 'System') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
          🎉 {msg.content}
        </span>
      </div>
    );
  }

  // Normal message
  const isMine = msg.userId && String(msg.userId) === String(userId);
  return (
    <div
      className={`group flex items-start gap-2 px-2 py-1.5 rounded-xl transition relative
        ${msg.isMember ? 'border border-[#FFD700]/30 bg-[#FFD700]/5' : 'hover:bg-white/5'}`}
    >
      {/* Avatar */}
      {msg.userAvatar
        ? <img src={msg.userAvatar} alt={msg.userName} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
        : <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] text-white font-bold shrink-0 mt-0.5">
            {(msg.userName || 'A')[0].toUpperCase()}
          </div>
      }

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-semibold ${msg.isMember ? 'text-yellow-400' : 'text-blue-400'}`}>
            {msg.userName || 'Anonymous'}
          </span>
          {msg.isMember && (
            <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-1.5 py-0.5 font-bold">
              HỘI VIÊN
            </span>
          )}
          <span className="text-white/30 text-[10px] ml-auto">{timeStr(msg.sentAt)}</span>
        </div>
        <p className="text-white/90 text-sm mt-0.5 break-words">{msg.content}</p>
      </div>

      {/* 3-dot menu */}
      <div className="opacity-0 group-hover:opacity-100 transition shrink-0 relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10 transition text-xs"
        >⋮</button>
        {menuOpen && (
          <div className="absolute right-0 top-7 w-40 bg-[#222] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
            {msg.isMine || isChannelOwner ? (
              <>
                {!msg.isPinned
                  ? <button onClick={() => { onPin(msg.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition">📌 Ghim</button>
                  : <button onClick={() => { onUnpin(msg.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition">📌 Bỏ ghim</button>
                }
              </>
            ) : null}
            <button onClick={() => { onReport(msg); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition">⚑ Báo cáo</button>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------
//  Main LivestreamChat Component
// -------------------------------------------------------
const LivestreamChat = ({ livestreamId, apiBaseUrl = '', userId, isChannelOwner = false, disabled = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [showDonate, setShowDonate] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const connRef = useSignalRConnection(livestreamId, apiBaseUrl);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch initial messages
  useEffect(() => {
    let mounted = true;
    if (!livestreamId) return;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/livemessages/by-livestream/${livestreamId}?page=1&pageSize=100`);
        if (!mounted) return;
        const msgs = res.data.items || [];
        setMessages(msgs);
        // Set pinned if any
        const pinned = msgs.find(m => m.isPinned && m.messageType !== 'System');
        if (pinned) setPinnedMsg(pinned);
      } catch (err) {
        console.warn('Failed to fetch messages', err);
      }
    })();

    return () => { mounted = false; };
  }, [livestreamId, apiBaseUrl]);

  // SignalR real-time listeners
  useEffect(() => {
    if (!connRef.current) return;

    const conn = connRef.current;

    const onMessage = (msg) => {
      const normalizedId = String(livestreamId || '').toLowerCase();
      const msgId = String(msg.livestreamId || '').toLowerCase();
      if (msgId !== normalizedId) return;
      // Filter out deleted messages
      if (msg.isDeleted) return;
      setMessages(prev => [...prev, { ...msg, isMember: msg.isMember || false }]);
    };

    const onSuperChat = (msg) => {
      const normalizedId = String(livestreamId || '').toLowerCase();
      if (String(msg.livestreamId || '').toLowerCase() !== normalizedId) return;
      setMessages(prev => [...prev, {
        id: msg.id,
        livestreamId: msg.livestreamId,
        userId: msg.userId,
        content: msg.message,
        sentAt: msg.createdAt,
        isPinned: false,
        messageType: 'SuperChat',
        userName: msg.donorName,
        userAvatar: null,
        isMember: false,
        amount: msg.amount,
      }]);
    };

    const onMessageDeleted = (data) => {
      // Remove deleted message from display
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    };

    conn.on('ReceiveMessage', onMessage);
    conn.on('ReceiveSuperChat', onSuperChat);
    conn.on('MessageDeleted', onMessageDeleted);
    return () => {
      conn.off('ReceiveMessage', onMessage);
      conn.off('ReceiveSuperChat', onSuperChat);
      conn.off('MessageDeleted', onMessageDeleted);
    };
  }, [connRef, livestreamId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!connRef.current) { showToast('Chưa kết nối chat', 'error'); return; }
    if (!livestreamId || !userId) { showToast('Bạn cần đăng nhập để chat', 'error'); return; }
    setSending(true);
    try {
      await connRef.current.invoke('SendMessage', livestreamId, userId, trimmed);
      setText('');
    } catch (err) {
      showToast('Không gửi được tin nhắn', 'error');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const handlePin = async (msgId) => {
    try {
      await axios.post(`${apiBaseUrl}/api/livemessages/${msgId}/pin`);
      const pinned = messages.find(m => m.id === msgId);
      if (pinned) setPinnedMsg(pinned);
      setMessages(prev => prev.map(m => ({ ...m, isPinned: m.id === msgId })));
      showToast('Đã ghim bình luận', 'success');
    } catch { showToast('Lỗi khi ghim', 'error'); }
  };

  const handleUnpin = async () => {
    if (!pinnedMsg) return;
    try {
      await axios.post(`${apiBaseUrl}/api/livemessages/${pinnedMsg.id}/unpin`);
      setPinnedMsg(null);
      setMessages(prev => prev.map(m => ({ ...m, isPinned: false })));
      showToast('Đã bỏ ghim', 'info');
    } catch { showToast('Lỗi khi bỏ ghim', 'error'); }
  };

  const handleReport = async (reason, desc) => {
    if (!userId || !reportTarget) { showToast('Cần đăng nhập để báo cáo', 'error'); setReportTarget(null); return; }
    try {
      await axios.post(`${apiBaseUrl}/api/livemessages/${reportTarget.id}/report`, {
        reporterId: userId,
        reason,
        description: desc,
      });
      showToast('Đã gửi báo cáo. Cảm ơn!', 'success');
    } catch { showToast('Lỗi khi gửi báo cáo', 'error'); }
    setReportTarget(null);
  };

  const handleDonate = async (amount, message) => {
    if (!connRef.current || !userId) { showToast('Cần đăng nhập để quyên góp', 'error'); return; }
    try {
      await connRef.current.invoke('SendSuperChat', livestreamId, userId, localStorage.getItem('channelName') || 'Anonymous', message || '❤️', amount);
      showToast(`Đã gửi ${amount.toLocaleString('vi-VN')}đ 💝`, 'success');
    } catch (err) { showToast('Lỗi khi quyên góp', 'error'); }
    setShowDonate(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-3 right-3 z-50 text-xs px-3 py-2 rounded-lg shadow-lg
          ${toast.type === 'error' ? 'bg-red-700 text-white' : toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-white/10 text-white'}`}
        >{toast.msg}</div>
      )}

      {/* Pinned Banner */}
      <PinnedBanner msg={pinnedMsg} onUnpin={handleUnpin} isChannelOwner={isChannelOwner} />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
        )}
        {messages.map((msg, idx) => (
          <MessageRow
            key={msg.id || idx}
            msg={msg}
            userId={userId}
            isChannelOwner={isChannelOwner}
            onPin={handlePin}
            onUnpin={handleUnpin}
            onReport={(m) => setReportTarget(m)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-2 shrink-0 border-t border-white/5 pt-3">
        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!userId || disabled}
            placeholder={disabled ? '🚫 Bị cấm chat' : userId ? 'Nhập tin nhắn...' : 'Đăng nhập để chat'}
            maxLength={300}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 disabled:opacity-50"
          />
          <div className="flex items-center gap-3 ml-2 text-gray-500">
            <button className="hover:text-white transition">😀</button>
            <button
              onClick={send}
              disabled={sending || !text.trim() || !userId || disabled}
              className={`transition ${text.trim() ? 'text-white hover:text-blue-400' : 'opacity-50'}`}
            >
              <svg xmlns="http://www.-org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>

        {/* Gift quick actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setAmount(100); setShowDonate(true); }} className="flex flex-col items-center gap-0.5 group">
              <span className="text-xl group-hover:scale-110 transition-transform">🌹</span>
              <span className="text-[10px] text-gray-400">Hoa hồng</span>
              <span className="text-[9px] text-yellow-500 flex items-center gap-0.5 font-semibold">🪙 100</span>
            </button>
            <button onClick={() => { setAmount(50); setShowDonate(true); }} className="flex flex-col items-center gap-0.5 group">
              <span className="text-xl group-hover:scale-110 transition-transform">❤️</span>
              <span className="text-[10px] text-gray-400">Tim</span>
              <span className="text-[9px] text-yellow-500 flex items-center gap-0.5 font-semibold">🪙 50</span>
            </button>
            <button onClick={() => { setAmount(200); setShowDonate(true); }} className="flex flex-col items-center gap-0.5 group">
              <span className="text-xl group-hover:scale-110 transition-transform">🍦</span>
              <span className="text-[10px] text-gray-400">Kem</span>
              <span className="text-[9px] text-yellow-500 flex items-center gap-0.5 font-semibold">🪙 200</span>
            </button>
            <button onClick={() => { setAmount(500); setShowDonate(true); }} className="flex flex-col items-center gap-0.5 group">
              <span className="text-xl group-hover:scale-110 transition-transform">🧸</span>
              <span className="text-[10px] text-gray-400">Gấu bông</span>
              <span className="text-[9px] text-yellow-500 flex items-center gap-0.5 font-semibold">🪙 500</span>
            </button>
          </div>
          
          <button className="bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0">
            Nạp xu
          </button>
        </div>
      </div>

      {/* Modals */}
      {reportTarget && (
        <ReportDialog
          msg={reportTarget}
          onClose={() => setReportTarget(null)}
          onSubmit={handleReport}
        />
      )}
      {showDonate && (
        <DonateModal
          onClose={() => setShowDonate(false)}
          onSend={handleDonate}
        />
      )}
    </div>
  );
};

export default LivestreamChat;

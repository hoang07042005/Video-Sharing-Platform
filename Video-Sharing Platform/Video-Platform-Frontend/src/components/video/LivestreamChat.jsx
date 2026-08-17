import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSignalRConnection } from '../../hooks/useSignalRConnection';

const LivestreamChat = ({ livestreamId, apiBaseUrl = '', userId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const connRef = useSignalRConnection(livestreamId, apiBaseUrl);

  useEffect(() => {
    let mounted = true;

    if (!livestreamId) return;

    (async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/livemessages/by-livestream/${livestreamId}?page=1&pageSize=100`);
        if (!mounted) return;
        setMessages(res.data.items || []);
      } catch (err) {
        console.warn('Failed to fetch messages', err);
      }
    })();

    if (!connRef.current) return;

    connRef.current.on('ReceiveMessage', (msg) => {
      if (msg.livestreamId && (msg.livestreamId === livestreamId || msg.livestreamId.toLowerCase() === livestreamId.toLowerCase())) {
        setMessages((s) => [...s, msg]);
      }
    });

    return () => {
      mounted = false;
    };
  }, [livestreamId, apiBaseUrl, connRef]);

  const send = async () => {
    if (!text || !connRef.current) return;
    
    // Don't send if livestreamId or userId is not available
    if (!livestreamId || !userId) {
      console.warn('Cannot send message: livestreamId or userId is missing');
      return;
    }
    
    try {
      await connRef.current.invoke('SendMessage', livestreamId, userId, text);
      setText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-2 space-y-2" style={{maxHeight: 420}}>
        {messages.map((m) => (
          <div key={m.id} className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center gap-2">
              {m.userAvatar && (
                <img src={m.userAvatar} alt={m.userName} className="w-6 h-6 rounded-full object-cover" />
              )}
              <div className="text-sm font-semibold text-blue-400">{m.userName || "Anonymous"}</div>
              <div className="text-xs text-white/50 ml-auto">{new Date(m.sentAt).toLocaleTimeString()}</div>
            </div>
            <div className="text-white mt-1">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-md p-2 bg-white/5 text-white" placeholder="Nhập tin nhắn" />
        <button onClick={send} className="px-4 py-2 bg-blue-600 rounded-md text-white">Gửi</button>
      </div>
    </div>
  );
};

export default LivestreamChat;

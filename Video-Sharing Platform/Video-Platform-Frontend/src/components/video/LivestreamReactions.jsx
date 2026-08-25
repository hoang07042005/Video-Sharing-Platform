import React, { useState, useRef, useEffect } from "react";

const LivestreamReactions = ({ livestreamId, connRef }) => {
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const reactionCounterRef = useRef({});
  const emojiList = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "💯"];

  useEffect(() => {
    if (!connRef?.current) return;

    const handler = (reactionData) => {
      if (reactionData.livestreamId === livestreamId) {
        addFloatingEmoji(reactionData.emoji);
      }
    };

    connRef.current.on("ReceiveReaction", handler);
    return () => connRef.current?.off("ReceiveReaction", handler);
  }, [livestreamId, connRef]);

  const addFloatingEmoji = (emoji) => {
    const id = Date.now() + Math.random();
    const randomX = Math.random() * 80 + 10; // 10-90% từ trái

    setFloatingEmojis((prev) => [...prev, { id, emoji, x: randomX }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 3000);
  };

  const sendReaction = (emoji) => {
    if (!connRef?.current) return;

    try {
      connRef.current
        .invoke("SendReaction", livestreamId, emoji)
        .catch((err) => {
          console.error("Failed to send reaction:", err);
        });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full">
      {/* Floating Emojis */}
      <div className="absolute top-0 left-0 right-0 h-96 pointer-events-none overflow-hidden rounded-lg">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute text-3xl animate-bounce"
            style={{
              left: `${item.x}%`,
              animation: `float 3s ease-in forwards`,
              top: 0,
            }}
          >
            {item.emoji}
          </div>
        ))}
        <style>{`
          @keyframes float {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(-300px);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LivestreamReactions;

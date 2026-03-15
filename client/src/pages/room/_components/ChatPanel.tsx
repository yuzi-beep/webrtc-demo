import { useEffect, useState } from "react";
import { webrtcEvents } from "../_utils/event-bus/webrtc-events";
import type { WebRTCReceiveMessage } from "../_types";

interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}
export default function ChatPanel({
  currentName,
  token,
}: {
  currentName: string;
  token: string;
}) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const off = webrtcEvents.on("RECEIVE_CHAT_MESSAGE", (message) => {
      const { payload } = message;
      const senderId = "todo";
      setMessages((prev) => [
        ...prev,
        {
          id: `${senderId}-${payload.timestamp}`,
          senderId,
          senderName: payload.senderName,
          text: payload.text,
          timestamp: payload.timestamp,
          isSelf: senderId === token,
        },
      ]);
    });
    return () => off();
  }, [token]);

  const onSend = () => {
    const text = inputValue.trim();
    if (text === "") return;

    const timestamp = Date.now();

    const message:WebRTCReceiveMessage ={
      type: "RECEIVE_CHAT_MESSAGE",
      payload: {
        text,
        senderName: currentName,
        timestamp,
      },
    }
    webrtcEvents.send(message);
    webrtcEvents.emit(message);

    setInputValue("");
  };
  return (
    <aside className="w-[320px] h-full border-l border-border-glass bg-bg-secondary/60 backdrop-blur-[10px] flex flex-col">
      <div className="px-4 py-3 border-b border-border-glass text-sm font-medium text-text-primary">
        Chat
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-text-secondary text-center mt-3">
            No messages yet
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 border ${
                message.isSelf
                  ? "bg-accent/10 border-accent/40"
                  : "bg-bg-glass border-border-glass"
              }`}
            >
              <div className="text-[11px] text-text-secondary mb-1">
                {message.isSelf
                  ? "You"
                  : message.senderName || message.senderId}
              </div>
              <div className="text-sm text-text-primary wrap-break-word">
                {message.text}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-border-glass flex items-center gap-2">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 h-10 rounded-lg px-3 text-sm bg-bg-glass border border-border-glass text-text-primary placeholder:text-text-secondary focus:outline-none"
        />
        <button
          onClick={onSend}
          className="h-10 px-3 rounded-lg text-sm bg-accent/20 border border-accent text-accent hover:opacity-90"
        >
          Send
        </button>
      </div>
    </aside>
  );
}

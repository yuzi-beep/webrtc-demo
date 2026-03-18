import { useEffect, useState } from "react";
import { webrtcEvents } from "../_utils/event-bus/webrtc-events";
import type { WebRTCReceiveMessage } from "../_types";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const off = webrtcEvents.on(
      "RECEIVE_CHAT_MESSAGE",
      (payload, senderToken) => {
        const senderId = senderToken ?? "unknown";
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
      },
    );
    return () => off();
  }, [token]);

  const onSend = () => {
    const text = inputValue.trim();
    if (text === "") return;

    const timestamp = Date.now();

    const message: WebRTCReceiveMessage = {
      type: "RECEIVE_CHAT_MESSAGE",
      payload: {
        text,
        senderName: currentName,
        timestamp,
      },
    };
    webrtcEvents.send(message);
    webrtcEvents.emit(message);

    setInputValue("");
  };
  return (
    <aside className="flex h-56 w-full flex-col border-t border-slate-800 bg-slate-900/60 backdrop-blur lg:h-full lg:w-80 lg:border-l lg:border-t-0">
      <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-100">
        {t("chat.title")}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="mt-3 text-center text-xs text-slate-400">
            {t("chat.empty")}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg px-3 py-2 border ${
                message.isSelf
                  ? "border-indigo-400/40 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-800"
              }`}
            >
              <div className="mb-1 text-[11px] text-slate-400">
                {message.isSelf
                  ? t("chat.self")
                  : message.senderName || message.senderId}
              </div>
              <div className="wrap-break-word text-sm text-slate-100">
                {message.text}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-800 p-3">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSend();
            }
          }}
          placeholder={t("chat.inputPlaceholder")}
          className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={onSend}
          className="h-10 rounded-lg border border-indigo-500/40 bg-indigo-500/20 px-3 text-sm text-indigo-200 hover:opacity-90"
        >
          {t("chat.send")}
        </button>
      </div>
    </aside>
  );
}

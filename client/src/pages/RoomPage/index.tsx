import { useRef, useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type SimplePeer from "simple-peer";
import {
  FlipHorizontal2,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomPreferences } from "./hooks/useRoomPreferences";
import { webrtcEvents } from "../../utils/event-bus/webrtc-events";
import RemoteVideo from "./components/RemoteVideo";
import LocaleVideo from "./components/LocaleVideo";

type ChatMessageItem = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf?: boolean;
};

const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

function ChatPanel({
  messages,
  value,
  onChange,
  onSend,
}: {
  messages: ChatMessageItem[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSend();
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

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // ── Hooks (all logic lives here) ──
  const {
    stream,
    error,
    isMuted,
    isCameraOff,
    stopAll,
    toggleMute,
    toggleCamera,
  } = useMediaStream();
  const { socket, isConnected, sendSignal, disconnect } = useSocket(roomId);
  const {
    peers,
    getPeerStream,
    sendMessage,
    createPeer,
    destroyPeer,
    rebindStream,
  } = useWebRTC(sendSignal);
  const { preferences, setPreferences } = useRoomPreferences();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);

  // ── Handlers ──
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const leaveRoom = useCallback(() => {
    stopAll();
    disconnect();
    navigate("/");
  }, [stopAll, disconnect, navigate]);

  // Attach local stream to video element
  const localVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (localVideoRef.current && stream)
      localVideoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    rebindStream(stream);
  }, [rebindStream, stream]);

  useEffect(() => {
    if (!stream) return;

    if (preferences.isMuted !== isMuted) {
      toggleMute();
    }

    if (preferences.isCameraOff !== isCameraOff) {
      toggleCamera();
    }
  }, [
    stream,
    preferences.isMuted,
    preferences.isCameraOff,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  ]);

  useEffect(() => {
    const handleChatMessage = (
      payload: { text: string; senderName: string; timestamp: number },
      senderId: string,
    ) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${payload.timestamp}-${senderId}-${prev.length}`,
          senderId,
          senderName: payload.senderName,
          text: payload.text,
          timestamp: payload.timestamp,
        },
      ]);
    };

    webrtcEvents.on("CHAT_MESSAGE", handleChatMessage);
    return () => {
      webrtcEvents.off("CHAT_MESSAGE", handleChatMessage);
    };
  }, []);

  const handleSendChatMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;

    const message = {
      type: "CHAT_MESSAGE" as const,
      payload: {
        text,
        senderName: "You",
        timestamp: Date.now(),
      },
    };

    sendMessage(message);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${message.payload.timestamp}-self-${prev.length}`,
        senderId: "self",
        senderName: "You",
        text,
        timestamp: message.payload.timestamp,
        isSelf: true,
      },
    ]);
    setChatInput("");
  }, [chatInput, sendMessage]);

  // Redirect on media error
  useEffect(() => {
    if (error) {
      alert(error);
      navigate("/");
    }
  }, [error, navigate]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleRoomFull = () => {
      leaveRoom();
    };
    const handleSignal = (data: {
      senderId: string;
      signal: SimplePeer.SignalData;
    }) => {
      console.log("Received signal from", data.senderId);
      const { senderId, signal } = data;
      createPeer(senderId, signal);
    };
    const handleUserConnected = (data: string) => {
      console.log("User connected:", data);
    };
    const handleUserDisconnected = (data: string) => {
      console.log("User disconnected:", data);
      destroyPeer(data);
    };
    const handleExistingUsers = (data: string[]) => {
      console.log("Existing users in room:", data);
      data.forEach((userId) => createPeer(userId));
    };
    const handleConnectJoin = () => {
      socket.emit("join-room", roomId);
    };

    socket.on("room-full", handleRoomFull);
    socket.on("signal", handleSignal);
    socket.on("user-connected", handleUserConnected);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("existing-users", handleExistingUsers);
    socket.on("connect", handleConnectJoin);

    return () => {
      socket.off("room-full", handleRoomFull);
      socket.off("signal", handleSignal);
      socket.off("user-connected", handleUserConnected);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("existing-users", handleExistingUsers);
      socket.off("connect", handleConnectJoin);
    };
  }, [socket, roomId, leaveRoom, createPeer, destroyPeer]);

  const totalParticipants = 1 + peers.length;
  const displayRoomId = roomId ? roomId.slice(0, 8) + "..." : "";

  // ── Main UI ──
  return (
    <div className="w-full h-full bg-bg-primary flex flex-col">
      {/* Connecting Overlay */}
      {!isConnected && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-3 border-border-glass border-t-accent rounded-full animate-spin-custom" />
          <p className="text-[15px] text-text-secondary">
            Connecting to room...
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-glass bg-bg-secondary/60 backdrop-blur-[10px]">
        <span className="text-[13px] text-text-secondary font-mono bg-bg-glass py-1.5 px-3.5 rounded-full border border-border-glass">
          Room: {displayRoomId}
        </span>
        <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
          <Users className="w-4 h-4" /> {totalParticipants} / 4
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        {/* Video Grid */}
        <div
          className={`flex-1 min-h-0 grid gap-2 p-2 transition-all duration-300 ${gridClasses[totalParticipants] || "grid-cols-2 grid-rows-2"}`}
          style={{ gridAutoRows: "1fr" }}
        >
          {/* Local Video */}
          <LocaleVideo
            stream={stream}
            isMuted={isMuted}
            isMirror={preferences.isLocalVideoMirrored}
          />

          {peers.map((meta) => {
            const stream = getPeerStream(meta.id);
            return <RemoteVideo key={meta.id} stream={stream} meta={meta} />;
          })}
        </div>

        <ChatPanel
          messages={chatMessages}
          value={chatInput}
          onChange={setChatInput}
          onSend={handleSendChatMessage}
        />
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-border-glass bg-bg-secondary/60 backdrop-blur-[10px]">
        <button
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${isMuted ? "!bg-danger/20 !border-danger !text-danger" : ""}`}
          onClick={() => {
            toggleMute();
            setPreferences((prev) => ({
              ...prev,
              isMuted: !isMuted,
            }));
          }}
          title={isMuted ? "Unmute" : "Mute"}
          id="toggle-mute-btn"
        >
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
        <button
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${isCameraOff ? "!bg-danger/20 !border-danger !text-danger" : ""}`}
          onClick={() => {
            toggleCamera();
            setPreferences((prev) => ({
              ...prev,
              isCameraOff: !isCameraOff,
            }));
          }}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
          id="toggle-camera-btn"
        >
          {isCameraOff ? (
            <VideoOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>
        <button
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${preferences.isLocalVideoMirrored ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
          onClick={() =>
            setPreferences((prev) => ({
              ...prev,
              isLocalVideoMirrored: !preferences.isLocalVideoMirrored,
            }))
          }
          title={
            preferences.isLocalVideoMirrored
              ? "Disable mirror"
              : "Enable mirror"
          }
          id="toggle-mirror-btn"
        >
          <FlipHorizontal2 className="w-5 h-5" />
        </button>
        <button
          className="h-[52px] rounded-full flex items-center justify-center text-sm transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 px-5 gap-1.5 font-medium"
          onClick={copyLink}
          title="Copy meeting link"
          id="copy-link-btn"
        >
          <Link2 className="w-4 h-4" />{" "}
          <span className="text-[13px]">Copy Link</span>
        </button>
        <button
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-danger border border-danger text-white hover:bg-danger-hover hover:scale-110"
          onClick={leaveRoom}
          title="Leave meeting"
          id="leave-room-btn"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

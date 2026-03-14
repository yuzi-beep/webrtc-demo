import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { usePreferences } from "./hooks/useRoomPreferences";
import RemoteVideo from "./components/RemoteVideo";
import LocaleVideo from "./components/LocaleVideo";
import ChatPanel from "./components/ChatPanel";
import UserMetaEditor from "./components/UserMetaEditor";
import ControlBar from "./components/ControlBar";
import { useRoomController } from "./hooks/useRoomController";
import { useEffect } from "react";
const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>() as { roomId: string };

  // ── Hooks (all logic lives here) ──
  const {
    preferences: {
      isMuted,
      isCameraOff,
      name,
      isLocalVideoMirrored,
      allowEcho,
    },
    setPreferences,
  } = usePreferences();
  const { socket, isConnected, sendSignal } = useSocket(roomId);
  const { peers, getPeerStream, createPeer, destroyPeer, rebindStream } =
    useWebRTC(sendSignal);
  const { streamRef, toggleMute, toggleCamera } = useMediaStream(
    isMuted,
    isCameraOff,
    setPreferences,
    rebindStream,
  );
  const { leaveRoom } = useRoomController({
    roomId,
    socket,
    createPeer,
    destroyPeer,
  });

  // ── Handlers ──
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const totalParticipants = 1 + peers.length;
  const displayRoomId = roomId ? roomId.slice(0, 8) + "..." : "";

  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      name,
      isMuted,
      isCameraOff,
    }));
  }, [isMuted, isCameraOff, name, setPreferences]);

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
        <div className="flex items-center gap-3">
          <UserMetaEditor
            name={name}
            onSave={(name) => setPreferences((prev) => ({ ...prev, name }))}
          />
          <span className="text-[13px] text-text-secondary flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {totalParticipants} / 4
          </span>
        </div>
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
            streamRef={streamRef}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isMirror={isLocalVideoMirrored}
            allowEcho={allowEcho}
            name={name}
          />

          {peers.map((meta) => {
            const stream = getPeerStream(meta.token);
            return <RemoteVideo key={meta.token} stream={stream} meta={meta} />;
          })}
        </div>

        <ChatPanel currentName={name} />
      </div>

      <ControlBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isLocalVideoMirrored={isLocalVideoMirrored}
        allowEcho={allowEcho}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleMirror={() =>
          setPreferences((prev) => ({
            ...prev,
            isLocalVideoMirrored: !prev.isLocalVideoMirrored,
          }))
        }
        onToggleEcho={() =>
          setPreferences((prev) => ({
            ...prev,
            allowEcho: !prev.allowEcho,
          }))
        }
        onCopyLink={copyLink}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}

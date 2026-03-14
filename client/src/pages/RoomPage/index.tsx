import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomPreferences } from "./hooks/useRoomPreferences";
import { useUserProfile } from "./hooks/useUserProfile";
import RemoteVideo from "./components/RemoteVideo";
import LocaleVideo from "./components/LocaleVideo";
import ChatPanel from "./components/ChatPanel";
import UserMetaEditor from "./components/UserMetaEditor";
import ControlBar from "./components/ControlBar";
import { useRoomController } from "./hooks/useRoomController";
const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>() as { roomId: string };
  const streamRef = useRef<MediaStream>(new MediaStream());

  // ── Hooks (all logic lives here) ──
  const { preferences, setPreferences } = useRoomPreferences();

  const { socket, isConnected, sendSignal } = useSocket(roomId);

  const { peers, getPeerStream, createPeer, destroyPeer, rebindStream } =
    useWebRTC(sendSignal);
  const { stream, isMuted, isCameraOff, toggleMute, toggleCamera } =
    useMediaStream(
      preferences.isMuted,
      preferences.isCameraOff,
      streamRef,
      rebindStream,
    );
  const { name, setName } = useUserProfile(isMuted, isCameraOff);

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
        <div className="flex items-center gap-3">
          <UserMetaEditor name={name} onSave={setName} />
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
            isMirror={preferences.isLocalVideoMirrored}
            allowEcho={preferences.allowEcho}
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
        isLocalVideoMirrored={preferences.isLocalVideoMirrored}
        allowEcho={preferences.allowEcho}
        onToggleMute={() => {
          toggleMute();
          setPreferences((prev) => ({
            ...prev,
            isMuted: !isMuted,
          }));
        }}
        onToggleCamera={() => {
          toggleCamera();
          setPreferences((prev) => ({
            ...prev,
            isCameraOff: !isCameraOff,
          }));
        }}
        onToggleMirror={() =>
          setPreferences((prev) => ({
            ...prev,
            isLocalVideoMirrored: !preferences.isLocalVideoMirrored,
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

import { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FlipHorizontal2,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import { useRoomPreferences } from "./hooks/useRoomPreferences";
import { useUserProfile } from "./hooks/useUserProfile";
import RemoteVideo from "./components/RemoteVideo";
import LocaleVideo from "./components/LocaleVideo";
import ChatPanel from "./components/ChatPanel";
import UserMetaEditor from "./components/UserMetaEditor";
import { useRoomController } from "./hooks/useRoomController";
const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>() as { roomId: string };

  // ── Hooks (all logic lives here) ──
  const { preferences, setPreferences } = useRoomPreferences();
  const { stream, isMuted, isCameraOff, toggleMute, toggleCamera } =
    useMediaStream({
      isMuted: preferences.isMuted,
      isCameraOff: preferences.isCameraOff,
    });
  const { socket, isConnected, sendSignal } = useSocket(roomId);
  const { name, setName } = useUserProfile(isMuted, isCameraOff);
  const { peers, getPeerStream, createPeer, destroyPeer, rebindStream } =
    useWebRTC(sendSignal);
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
            stream={stream}
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

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-border-glass bg-bg-secondary/60 backdrop-blur-[10px]">
        <button
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${!isMuted ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
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
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${!isCameraOff ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
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
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${preferences.allowEcho ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
          onClick={() =>
            setPreferences((prev) => ({
              ...prev,
              allowEcho: !prev.allowEcho,
            }))
          }
          title={preferences.allowEcho ? "Disable echo" : "Enable echo"}
          id="toggle-echo-btn"
        >
          {preferences.allowEcho ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
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

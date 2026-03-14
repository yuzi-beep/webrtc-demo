import { useRef, useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type SimplePeer from "simple-peer";
import {
  FlipHorizontal2,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  UserRound,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMediaStream } from "../hooks/useMediaStream";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import { useRoomPreferences } from "../hooks/useRoomPreferences";

function hasLiveVideo(stream: MediaStream) {
  const tracks = stream.getVideoTracks();
  if (tracks.length === 0) return false;
  return tracks.some((track) => track.readyState === "live" && !track.muted);
}

function RemoteVideo({
  stream,
  muted,
}: {
  stream: MediaStream;
  muted: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(() => hasLiveVideo(stream));

  useEffect(() => {
    if (ref.current) 
      ref.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const tracks = stream.getVideoTracks();
    const sync = () => setHasVideo(hasLiveVideo(stream));

    sync();
    tracks.forEach((track) => {
      track.addEventListener("mute", sync);
      track.addEventListener("unmute", sync);
      track.addEventListener("ended", sync);
    });

    return () => {
      tracks.forEach((track) => {
        track.removeEventListener("mute", sync);
        track.removeEventListener("unmute", sync);
        track.removeEventListener("ended", sync);
      });
    };
  }, [stream]);

  return (
    <>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover block"
      />
      {!hasVideo && (
        <div className="absolute inset-0 bg-bg-secondary flex flex-col items-center justify-center gap-2 text-text-secondary">
          <UserRound className="w-14 h-14" />
          <span className="text-sm font-medium">Camera Off</span>
        </div>
      )}
    </>
  );
}

const gridClasses: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

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
  const { peers, createPeer, destroyPeer, rebindStream } = useWebRTC(sendSignal);
  const { preferences, setPreferences } = useRoomPreferences();
  const [mutedPeerIds, setMutedPeerIds] = useState<Record<string, boolean>>({});

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
  }, [socket, roomId,leaveRoom,createPeer, destroyPeer]);

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

      {/* Video Grid */}
      <div
        className={`flex-1 min-h-0 grid gap-2 p-2 transition-all duration-300 ${gridClasses[totalParticipants] || "grid-cols-2 grid-rows-2"}`}
        style={{ gridAutoRows: "1fr" }}
      >
        {/* Local Video */}
        <div
          className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover block ${preferences.isLocalVideoMirrored ? "mirror-x" : ""}`}
          />
          <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
            You
          </span>
          {isMuted && (
            <span className="absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
              <MicOff className="w-4 h-4" />
            </span>
          )}
        </div>

        {peers.map((peer) => (
          <div
            key={peer.id}
            className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
          >
            <RemoteVideo
              stream={peer.stream}
              muted={Boolean(mutedPeerIds[peer.id])}
            />
            <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
              {peer.id.slice(0, 6)}
            </span>
            <button
              className={`absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center ${mutedPeerIds[peer.id] ? "text-danger" : "text-white"}`}
              onClick={() =>
                setMutedPeerIds((prev) => ({
                  ...prev,
                  [peer.id]: !prev[peer.id],
                }))
              }
              title={
                mutedPeerIds[peer.id] ? "Unmute this user" : "Mute this user"
              }
              id={`toggle-peer-mute-${peer.id}`}
            >
              {mutedPeerIds[peer.id] ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
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

import {
  FlipHorizontal2,
  Link2,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStore } from "../_stores/useStore";
import { useNavigate } from "react-router-dom";

export default function ControlBar() {
  const navigate = useNavigate();
  const toggleMute = useStore((state) => state.toggleMute);
  const toggleCamera = useStore((state) => state.toggleCamera);
  const toggleScreenShare = useStore((state) => state.toggleScreenShare);
  const toggleEcho = useStore((state) => state.toggleEcho);
  const toggleLocalVideoMirror = useStore(
    (state) => state.toggleLocalVideoMirror,
  );
  const isMuted = useStore((state) => state.isMuted);
  const isCameraOff = useStore((state) => state.isCameraOff);
  const isScreenSharing = useStore((state) => state.isScreenSharing);
  const isLocalVideoMirrored = useStore((state) => state.isLocalVideoMirrored);
  const allowEcho = useStore((state) => state.allowEcho);
  return (
    <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-border-glass bg-bg-secondary/60 backdrop-blur-[10px]">
      <button
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${!isMuted ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
        onClick={() => toggleMute()}
        title={isMuted ? "Unmute" : "Mute"}
        id="toggle-mute-btn"
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <button
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${!isCameraOff ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
        onClick={() => toggleCamera()}
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
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${isScreenSharing ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
        onClick={() => toggleScreenShare()}
        title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        id="toggle-screen-share-btn"
      >
        {isScreenSharing ? (
          <MonitorOff className="w-5 h-5" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
      </button>
      <button
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${isLocalVideoMirrored ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
        onClick={() => toggleLocalVideoMirror()}
        title={isLocalVideoMirrored ? "Disable mirror" : "Enable mirror"}
        id="toggle-mirror-btn"
      >
        <FlipHorizontal2 className="w-5 h-5" />
      </button>
      <button
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 ${allowEcho ? "!bg-accent/20 !border-accent !text-accent" : ""}`}
        onClick={() => toggleEcho()}
        title={allowEcho ? "Disable echo" : "Enable echo"}
        id="toggle-echo-btn"
      >
        {allowEcho ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>
      <button
        className="h-[52px] rounded-full flex items-center justify-center text-sm transition-all duration-300 bg-bg-glass backdrop-blur-[10px] border border-border-glass text-text-primary hover:bg-bg-glass-hover hover:scale-110 px-5 gap-1.5 font-medium"
        onClick={() => navigator.clipboard.writeText(window.location.href)}
        title="Copy meeting link"
        id="copy-link-btn"
      >
        <Link2 className="w-4 h-4" />{" "}
        <span className="text-[13px]">Copy Link</span>
      </button>
      <button
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl transition-all duration-300 bg-danger border border-danger text-white hover:bg-danger-hover hover:scale-110"
        onClick={() => navigate("/")}
        title="Leave meeting"
        id="leave-room-btn"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  );
}

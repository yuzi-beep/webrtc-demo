import { useRef, useEffect, useState } from "react";
import { MicOff, Monitor, Video } from "lucide-react";
import { useStore } from "../_stores/useStore";
import { useShallow } from "zustand/react/shallow";

export default function LocaleVideo() {
  const { name, isMuted, isCameraOff, isMirror, allowEcho } = useStore(
    useShallow((state) => ({
      name: state.name,
      token: state.token,
      isMuted: state.isMuted,
      isCameraOff: state.isCameraOff,
      isMirror: state.isLocalVideoMirrored,
      allowEcho: state.allowEcho,
    })),
  );
  const getStream = useStore.getState().getStream;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const [displayMediaType, setDisplayMediaType] = useState<"camera" | "screen">(
    "camera",
  );

  useEffect(() => {
    const stream = getStream(displayMediaType);
    const videoEl = localVideoRef.current;
    if (!videoEl) return;

    if (displayMediaType === "camera" && isCameraOff) {
      videoEl.srcObject = null;
      videoEl.load();
      return;
    }

    videoEl.srcObject = stream;
  }, [displayMediaType, getStream, isCameraOff]);

  useEffect(() => {
    const stream = getStream("microphone");
    const audioEl = localAudioRef.current;
    if (!audioEl) return;

    if (isMuted) {
      audioEl.srcObject = null;
      audioEl.load();
      return;
    }

    audioEl.srcObject = stream;
  }, [getStream, isMuted]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover block ${isMirror ? "mirror-x" : ""}`}
      />
      <audio ref={localAudioRef} autoPlay muted={!allowEcho} playsInline />
      <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
        {name} (You)
      </span>
      <button
        className="absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white"
        onClick={() =>
          setDisplayMediaType((prev) =>
            prev === "camera" ? "screen" : "camera",
          )
        }
      >
        {displayMediaType === "camera" ? (
          <Monitor className="w-4 h-4" />
        ) : (
          <Video className="w-4 h-4" />
        )}
      </button>
      {isMuted && (
        <span className="absolute top-3 left-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
          <MicOff className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}

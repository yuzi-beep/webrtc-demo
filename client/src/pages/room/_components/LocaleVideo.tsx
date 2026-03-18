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
      className="relative min-h-44 overflow-hidden rounded-xl border border-slate-700 bg-black"
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={`block h-full w-full object-contain ${isMirror ? "-scale-x-100" : ""}`}
      />
      <audio ref={localAudioRef} autoPlay muted={!allowEcho} playsInline />
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
        {name}（你）
      </span>
      <button
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
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
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
          <MicOff className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}

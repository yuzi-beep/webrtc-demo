import { useRef, useEffect, type RefObject } from "react";
import { MicOff } from "lucide-react";

export default function LocaleVideo({
  streamRef,
  isMuted,
  isCameraOff,
  isMirror,
  allowEcho,
  name,
}: {
  streamRef: RefObject<MediaStream>;
  isMuted: boolean;
  isCameraOff: boolean;
  isMirror: boolean;
  allowEcho: boolean;
  name: string;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const stream = streamRef.current;
    const videoEl = localVideoRef.current;
    if (!videoEl) return;

    if (isCameraOff) {
      videoEl.load();
      return;
    }

    videoEl.srcObject = stream;
  }, [streamRef, isCameraOff]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted={!allowEcho}
        playsInline
        className={`w-full h-full object-cover block ${isMirror ? "mirror-x" : ""}`}
      />
      <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
        {name} (You)
      </span>
      {isMuted && (
        <span className="absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
          <MicOff className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}

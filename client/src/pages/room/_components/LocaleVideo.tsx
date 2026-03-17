import { useRef, useEffect, type RefObject } from "react";
import { MicOff } from "lucide-react";

export default function LocaleVideo({
  micphoneMediaRef,
  cameraMediaRef,
  isMuted,
  isCameraOff,
  isMirror,
  allowEcho,
  name,
}: {
  micphoneMediaRef: RefObject<MediaStream>;
  cameraMediaRef: RefObject<MediaStream>;
  isMuted: boolean;
  isCameraOff: boolean;
  isMirror: boolean;
  allowEcho: boolean;
  name: string;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const stream = cameraMediaRef.current;
    const videoEl = localVideoRef.current;
    if (!videoEl) return;

    if (isCameraOff) {
      videoEl.srcObject = null;
      videoEl.load();
      return;
    }

    videoEl.srcObject = stream;
  }, [cameraMediaRef, isCameraOff]);

  useEffect(() => {
    const stream = micphoneMediaRef.current;
    const audioEl = localAudioRef.current;
    if (!audioEl) return;

    if (isMuted) {
      audioEl.srcObject = null;
      audioEl.load();
      return;
    }

    audioEl.srcObject = stream;
  }, [micphoneMediaRef, isMuted]);

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
      {isMuted && (
        <span className="absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
          <MicOff className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}

import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { type MerberMeta } from "../hooks/useWebRTC";

export default function RemoteVideo({
  stream,
  meta,
}: {
  stream: MediaStream | null;
  meta: MerberMeta;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <>
      <div
        className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
      >
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover block"
        />
        <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
          {meta.name}
        </span>
        <button
          className={`absolute top-3 right-3 text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center ${muted ? "text-danger" : "text-white"}`}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </>
  );
}

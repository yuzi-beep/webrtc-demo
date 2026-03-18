import { useRef, useEffect, useState } from "react";
import { MicOff, Monitor, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { type MemberMeta } from "@/pages/room/_types";
import { useStore } from "../_stores/useStore";

export default function RemoteVideo({
  meta,
  token,
}: {
  meta: MemberMeta;
  token: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaybackMuted, setIsPlaybackMuted] = useState(false);
  const [displayMediaType, setDisplayMediaType] = useState<"camera" | "screen">(
    "camera",
  );
  const { name, isMuted, isCameraOff } = meta;

  const remoteCameraStream = useStore(
    (state) => state.streamsMap.get(token)?.camera,
  );
  const remoteMicrophoneStream = useStore(
    (state) => state.streamsMap.get(token)?.microphone,
  );
  const remoteScreenStream = useStore(
    (state) => state.streamsMap.get(token)?.screen,
  );

  const bindMediaStream = (
    element: HTMLVideoElement | HTMLAudioElement,
    stream: MediaStream | null,
  ) => {
    if (element.srcObject !== stream) {
      element.srcObject = stream;
      element.load();
    }
    if (!stream) return;
    element.play().catch(() => {});
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (displayMediaType === "camera" && isCameraOff) {
      bindMediaStream(videoEl, null);
      return;
    }

    bindMediaStream(
      videoEl,
      (displayMediaType === "camera" ? remoteCameraStream : remoteScreenStream) ??
        null,
    );
  }, [displayMediaType, isCameraOff, remoteCameraStream, remoteScreenStream]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isMuted) {
      bindMediaStream(audioEl, null);
      return;
    }

    bindMediaStream(audioEl, remoteMicrophoneStream ?? null);
  }, [isMuted, remoteMicrophoneStream]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || isPlaybackMuted) return;
    audioEl.play().catch(() => {});
  }, [isPlaybackMuted, remoteMicrophoneStream]);

  return (
    <>
      <div
        className="relative min-h-44 overflow-hidden rounded-xl border border-slate-700 bg-black"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="block h-full w-full object-contain"
        />
        <audio ref={audioRef} autoPlay playsInline muted={isPlaybackMuted} />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
          {name}
        </span>
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {isMuted && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
              <MicOff className="w-4 h-4" />
            </span>
          )}
          {isCameraOff && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
              <VideoOff className="w-4 h-4" />
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
            onClick={() =>
              setDisplayMediaType((prev) =>
                prev === "camera" ? "screen" : "camera",
              )
            }
          >
            {displayMediaType === "camera" ? (
              <Monitor size={16} />
            ) : (
              <Video size={16} />
            )}
          </button>
          <button
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/50 ${isPlaybackMuted ? "text-rose-400" : "text-white"}`}
            onClick={() => setIsPlaybackMuted((prev) => !prev)}
          >
            {isPlaybackMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}

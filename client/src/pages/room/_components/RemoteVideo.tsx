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
        className={`relative rounded-xl overflow-hidden bg-bg-secondary border border-border-glass`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover block"
        />
        <audio ref={audioRef} autoPlay playsInline muted={isPlaybackMuted} />
        <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/60 backdrop-blur-lg py-1 px-3 rounded-full tracking-wide">
          {name}
        </span>
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {isMuted && (
            <span className="text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white">
              <MicOff className="w-4 h-4" />
            </span>
          )}
          {isCameraOff && (
            <span className="text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white">
              <VideoOff className="w-4 h-4" />
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            className="text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white"
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
            className={`text-base bg-black/50 rounded-full w-8 h-8 flex items-center justify-center ${isPlaybackMuted ? "text-danger" : "text-white"}`}
            onClick={() => setIsPlaybackMuted((prev) => !prev)}
          >
            {isPlaybackMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Manages local camera/microphone stream and mute/camera toggle controls.
 */
export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        cleanupRef.current = null;
        streamRef.current = s;
        setStream(s);
      } catch {
        setError(
          "Unable to access camera/microphone. Please check permissions.",
        );
      }
    };

    init();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  const stopAll = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  return {
    stream,
    isMuted,
    isCameraOff,
    error,
    toggleMute,
    toggleCamera,
    stopAll,
  };
}

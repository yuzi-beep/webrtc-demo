import { useEffect, useRef, useState, useCallback } from "react";

interface Options {
  isMuted: boolean;
  isCameraOff: boolean;
}

/**
 * Manages local camera/microphone stream and mute/camera toggle controls.
 */
export function useMediaStream(
  options: Options = { isMuted: false, isCameraOff: false },
) {
  const [stream] = useState<MediaStream>(new MediaStream());
  const [isMuted, setIsMuted] = useState(options.isMuted);
  const [isCameraOff, setIsCameraOff] = useState(options.isCameraOff);
  const streamRef = useRef<MediaStream>(stream);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isEffectActive = true;
    const stream = streamRef.current;

    (async () => {
      if (!isMuted) {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          if (!isEffectActive) {
            audioOnlyStream.getTracks().forEach((track) => track.stop());
            return;
          }
          audioStreamRef.current = audioOnlyStream;
          audioOnlyStream
            .getAudioTracks()
            .forEach((track) => stream.addTrack(track));
        } catch {
          setIsMuted(true);
        }
      }
    })();

    return () => {
      isEffectActive = false;
      audioStreamRef.current?.getTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    };
  }, [isMuted]);

  useEffect(() => {
    let isEffectActive = true;
    const stream = streamRef.current;

    (async () => {
      if (!isCameraOff) {
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
          if (!isEffectActive) {
            videoOnlyStream.getTracks().forEach((track) => track.stop());
            return;
          }
          videoStreamRef.current = videoOnlyStream;
          videoOnlyStream
            .getVideoTracks()
            .forEach((track) => stream.addTrack(track));
        } catch {
          setIsCameraOff(true);
        }
      }
    })();

    return () => {
      isEffectActive = false;
      videoStreamRef.current?.getTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
      videoStreamRef.current = null;
    };
  }, [isCameraOff]);

  useEffect(() => {
    const stream = streamRef.current;
    return () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff(!isCameraOff);
  }, [isCameraOff]);

  const stopAll = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current?.getTracks().forEach((track) => track.stop());

    audioStreamRef.current = null;
    videoStreamRef.current = null;

    setIsMuted(true);
    setIsCameraOff(true);
  }, []);

  return {
    stream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    stopAll,
  };
}

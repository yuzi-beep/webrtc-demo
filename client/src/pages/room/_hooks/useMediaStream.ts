import { useEffect, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Preferences } from "./usePreferences";

/**
 * Manages local camera/microphone stream and mute/camera toggle controls.
 */
export function useMediaStream(
  isMuted: boolean,
  isCameraOff: boolean,
  setPreferences: Dispatch<SetStateAction<Preferences>>,
  rebindStream: (stream: MediaStream) => void,
) {
  const streamRef = useRef<MediaStream>(new MediaStream());
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const toggleMute = useCallback(
    (isMuted?: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        isMuted: isMuted !== undefined ? isMuted : !prev.isMuted,
      }));
    },
    [setPreferences],
  );

  const toggleCamera = useCallback(
    (isCameraOff?: boolean) => {
      setPreferences((prev) => ({
        ...prev,
        isCameraOff:
          isCameraOff !== undefined ? isCameraOff : !prev.isCameraOff,
      }));
    },
    [setPreferences],
  );

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
          toggleMute(true);
        } finally {
          rebindStream(stream);
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
  }, [isMuted, streamRef, rebindStream, toggleMute]);

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
          toggleCamera(true);
        } finally {
          rebindStream(stream);
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
  }, [isCameraOff, streamRef, rebindStream, toggleCamera]);

  useEffect(() => {
    const stream = streamRef.current;
    return () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [streamRef]);

  return {
    streamRef,
    toggleMute,
    toggleCamera,
  };
}

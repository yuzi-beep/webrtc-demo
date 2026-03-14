import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type RefObject,
} from "react";

/**
 * Manages local camera/microphone stream and mute/camera toggle controls.
 */
export function useMediaStream(
  initIsMuted: boolean,
  initIsCameraOff: boolean,
  streamRef: RefObject<MediaStream>,
  rebindStream: (stream: MediaStream) => void,
) {
  const [stream] = useState<MediaStream>(new MediaStream());
  const [isMuted, setIsMuted] = useState(initIsMuted);
  const [isCameraOff, setIsCameraOff] = useState(initIsCameraOff);
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
  }, [isMuted, streamRef, rebindStream]);

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
  }, [isCameraOff, streamRef, rebindStream]);

  useEffect(() => {
    const stream = streamRef.current;
    return () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [streamRef]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff(!isCameraOff);
  }, [isCameraOff]);

  return {
    stream,
    streamRef,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
  };
}

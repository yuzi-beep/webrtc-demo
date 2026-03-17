import { useEffect } from "react";
import { webrtcEvents } from "../_utils/event-bus";
import { useStore } from "../_stores/useStore";

/**
 * Manages local camera/microphone stream and mute/camera toggle controls.
 */
export function useMediaStream() {
  const isMuted = useStore((state) => state.isMuted);
  const isCameraOff = useStore((state) => state.isCameraOff);
  const getStream = useStore.getState().getStream;
  const toggleMute = useStore((state) => state.toggleMute);
  const toggleCamera = useStore((state) => state.toggleCamera);

  useEffect(() => {
    webrtcEvents.send({
      type: "MEDIA_STATE",
      payload: { isMuted, isCameraOff },
    });
  }, [isMuted, isCameraOff]);

  useEffect(() => {
    let isEffectActive = true;
    const stream = getStream("microphone");

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
          audioOnlyStream
            .getAudioTracks()
            .forEach((track) => stream.addTrack(track));
        } catch {
          toggleMute(true);
        } finally {
          webrtcEvents.emit({ type: "REBIND_STREAM" });
        }
      }
    })();

    return () => {
      isEffectActive = false;
      stream.getTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    };
  }, [isMuted, getStream, toggleMute]);

  useEffect(() => {
    let isEffectActive = true;
    const stream = getStream("camera");

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
          videoOnlyStream
            .getVideoTracks()
            .forEach((track) => stream.addTrack(track));
        } catch {
          toggleCamera(true);
        } finally {
          webrtcEvents.emit({ type: "REBIND_STREAM" });
        }
      }
    })();

    return () => {
      isEffectActive = false;
      stream.getTracks().forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    };
  }, [isCameraOff, getStream, toggleCamera]);
}

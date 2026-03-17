import { useEffect, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Preferences } from "./usePreferences";
import { webrtcEvents } from "../_utils/event-bus";
import { useRoomPreferencesStore } from "../_stores/useRoomPreferencesStore";

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
  const micphoneMediaRef = useRoomPreferencesStore(
    (state) => state.micphoneMediaRef,
  );
  const cameraMediaRef = useRoomPreferencesStore((state) => state.cameraMediaRef);

  const syncStream = useCallback(() => {
    const micphoneStream = micphoneMediaRef.current;
    const cameraStream = cameraMediaRef.current;
    webrtcEvents.send({
      type: "STREAM_SYNC",
      payload: [
        {
          streamId: micphoneStream.id,
          streamType: "MICROPHONE",
          status: "enabled",
        },
        { streamId: cameraStream.id, streamType: "CAMERA", status: "enabled" },
      ],
    });
  }, [micphoneMediaRef, cameraMediaRef]);

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
    const stream = micphoneMediaRef.current;
    const tracks = stream.getTracks();

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
          syncStream();
        } catch {
          toggleMute(true);
        } finally {
          rebindStream(stream);
        }
      }
    })();

    return () => {
      isEffectActive = false;
      tracks.forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    };
  }, [isMuted, streamRef, micphoneMediaRef, rebindStream, toggleMute, syncStream]);

  useEffect(() => {
    let isEffectActive = true;
    const stream = cameraMediaRef.current;
    const tracks = stream.getTracks();

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
          videoOnlyStream.getVideoTracks().forEach((track) => stream.addTrack(track));
          syncStream();
        } catch {
          toggleCamera(true);
        } finally {
          rebindStream(stream);
        }
      }
    })();

    return () => {
      isEffectActive = false;
      tracks.forEach((track) => {
        stream.removeTrack(track);
        track.stop();
      });
    };
  }, [
    isCameraOff,
    streamRef,
    cameraMediaRef,
    rebindStream,
    toggleCamera,
    syncStream,
  ]);

  useEffect(() => {
    const stream = streamRef.current;
    return () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [streamRef]);

  return {
    streamRef,
    micphoneMediaRef,
    cameraMediaRef,
    toggleMute,
    toggleCamera,
  };
}

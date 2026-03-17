import { webrtcEvents } from "@/pages/room/_utils/event-bus/webrtc-events";
import { useEffect, useMemo } from "react";
import {
  useRoomPreferencesStore,
  type Preferences,
} from "@/pages/room/_stores/useRoomPreferencesStore";

export type { Preferences };

export function usePreferences() {
  const name = useRoomPreferencesStore((state) => state.name);
  const token = useRoomPreferencesStore((state) => state.token);
  const isMuted = useRoomPreferencesStore((state) => state.isMuted);
  const isCameraOff = useRoomPreferencesStore((state) => state.isCameraOff);
  const isLocalVideoMirrored = useRoomPreferencesStore(
    (state) => state.isLocalVideoMirrored,
  );
  const allowEcho = useRoomPreferencesStore((state) => state.allowEcho);
  const micphoneMediaRef = useRoomPreferencesStore(
    (state) => state.micphoneMediaRef,
  );
  const cameraMediaRef = useRoomPreferencesStore((state) => state.cameraMediaRef);
  const setPreferences = useRoomPreferencesStore((state) => state.setPreferences);
  const toggleMute = useRoomPreferencesStore((state) => state.toggleMute);
  const toggleCamera = useRoomPreferencesStore((state) => state.toggleCamera);
  const toggleEcho = useRoomPreferencesStore((state) => state.toggleEcho);
  const toggleLocalVideoMirror = useRoomPreferencesStore(
    (state) => state.toggleLocalVideoMirror,
  );

  const preferences = useMemo(
    () => ({
      name,
      token,
      isMuted,
      isCameraOff,
      isLocalVideoMirrored,
      allowEcho,
    }),
    [name, token, isMuted, isCameraOff, isLocalVideoMirrored, allowEcho],
  );

  useEffect(() => {
    webrtcEvents.send({
      type: "RECEIVE_SYNC_META",
      payload: {
        token,
        name,
        isMuted,
        isCameraOff,
      },
    });
  }, [token, name, isMuted, isCameraOff]);

  return {
    preferences,
    micphoneMediaRef,
    cameraMediaRef,
    setPreferences,
    toggleMute,
    toggleCamera,
    toggleEcho,
    toggleLocalVideoMirror,
  };
}

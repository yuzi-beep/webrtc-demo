import { webrtcEvents } from "@/utils/event-bus/webrtc-events";
import { getOrCreateToken } from "@/utils/token-identity";
import { useEffect, useState } from "react";

export type RoomPreferences = {
  name: string;
  token: string;
  isLocalVideoMirrored: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  allowEcho: boolean;
};

const ROOM_PREFERENCES_STORAGE_KEY = "webrtc.roomPreferences";
const DEFAULT_PREFERENCES: RoomPreferences = {
  isLocalVideoMirrored: true,
  isMuted: false,
  isCameraOff: false,
  allowEcho: false,
  name: `Guest-${Date.now().toString(36).slice(-4)}`,
  token: getOrCreateToken(),
};

function getInitialPreferences(): RoomPreferences {
  const savedPreferences = window.localStorage.getItem(
    ROOM_PREFERENCES_STORAGE_KEY,
  );

  if (!savedPreferences) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(savedPreferences) as Partial<RoomPreferences>;
    return {
      isLocalVideoMirrored:
        parsed.isLocalVideoMirrored ?? DEFAULT_PREFERENCES.isLocalVideoMirrored,
      isMuted: parsed.isMuted ?? DEFAULT_PREFERENCES.isMuted,
      isCameraOff: parsed.isCameraOff ?? DEFAULT_PREFERENCES.isCameraOff,
      allowEcho: parsed.allowEcho ?? DEFAULT_PREFERENCES.allowEcho,
      name: parsed.name ?? DEFAULT_PREFERENCES.name,
      token: parsed.token ?? DEFAULT_PREFERENCES.token,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<RoomPreferences>(() =>
    getInitialPreferences(),
  );

  const { token, name, isMuted, isCameraOff } = preferences;

  useEffect(() => {
    webrtcEvents.emit({
      type: "SYNC_META",
      senderId: token,
      payload: {
        token,
        name,
        isMuted,
        isCameraOff,
      },
    });
  }, [token, name, isMuted, isCameraOff]);

  useEffect(() => {
    window.localStorage.setItem(
      ROOM_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  }, [preferences]);

  return {
    preferences,
    setPreferences,
  };
}

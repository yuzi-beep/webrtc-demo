import { useEffect, useState } from "react";

type RoomPreferences = {
  isLocalVideoMirrored: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
};

const ROOM_PREFERENCES_STORAGE_KEY = "webrtc.roomPreferences";
const DEFAULT_PREFERENCES: RoomPreferences = {
  isLocalVideoMirrored: true,
  isMuted: false,
  isCameraOff: false,
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
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useRoomPreferences() {
  const [preferences, setPreferences] = useState<RoomPreferences>(() =>
    getInitialPreferences(),
  );

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

import { useEffect, useState } from "react";

type RoomPreferences = {
  isLocalVideoMirrored: boolean;
};

const ROOM_PREFERENCES_STORAGE_KEY = "webrtc.roomPreferences";
const DEFAULT_PREFERENCES: RoomPreferences = {
  isLocalVideoMirrored: true,
};

function getInitialPreferences(): RoomPreferences {
  const savedPreferences = window.localStorage.getItem(
    ROOM_PREFERENCES_STORAGE_KEY,
  );

  if (!savedPreferences) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(savedPreferences) as RoomPreferences;
    return parsed;
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

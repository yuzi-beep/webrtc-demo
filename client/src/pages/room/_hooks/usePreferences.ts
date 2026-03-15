import { webrtcEvents } from "@/pages/room/_utils/event-bus/webrtc-events";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type Preferences = {
  name: string;
  token: string;
  isLocalVideoMirrored: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  allowEcho: boolean;
};

const ROOM_PREFERENCES_STORAGE_KEY = "Preferences";
const DEFAULT_PREFERENCES: Preferences = {
  isLocalVideoMirrored: true,
  isMuted: false,
  isCameraOff: false,
  allowEcho: false,
  name: `Guest-${Date.now().toString(36).slice(-4)}`,
  token: uuidv4(),
};

function getInitialPreferences(): Preferences {
  const savedPreferences = window.localStorage.getItem(
    ROOM_PREFERENCES_STORAGE_KEY,
  );

  if (!savedPreferences) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(savedPreferences) as Partial<Preferences>;
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
  const [preferences, setPreferences] = useState<Preferences>(() =>
    getInitialPreferences(),
  );

  const { token, name, isMuted, isCameraOff } = preferences;

  const togglePreference = useCallback((key: keyof Preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

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
    toggleMute: () => togglePreference("isMuted"),
    toggleCamera: () => togglePreference("isCameraOff"),
    toggleEcho: () => togglePreference("allowEcho"),
    toggleLocalVideoMirror: () => togglePreference("isLocalVideoMirrored"),
  };
}

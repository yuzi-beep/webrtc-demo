import { webrtcEvents } from "@/utils/event-bus/webrtc-events";
import { getOrCreateToken } from "@/utils/token-identity";
import { useEffect, useState } from "react";

const USER_NAME_STORAGE_KEY = "webrtc-demo:user-name";

function getInitialName(): string {
  const savedName = window.localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim();
  if (savedName) return savedName;
  return `Guest-${Date.now().toString(36).slice(-4)}`;
}

export function useUserProfile(isMuted: boolean, isCameraOff: boolean) {
  const token = getOrCreateToken();
  const [name, setName] = useState(() => getInitialName());

  useEffect(() => {
    window.localStorage.setItem(USER_NAME_STORAGE_KEY, name);

    const handleSyncMetaRequest = () => {
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
    };

    webrtcEvents.on("SYNC_META_REQUEST", handleSyncMetaRequest);
    webrtcEvents.emit({ type: "SYNC_META_REQUEST" });
    return () => {
      webrtcEvents.off("SYNC_META_REQUEST", handleSyncMetaRequest);
    };
  }, [name, token, isMuted, isCameraOff]);

  return {
    name,
    setName,
  };
}

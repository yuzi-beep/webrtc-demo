import { useEffect, useState } from "react";

const USER_NAME_STORAGE_KEY = "webrtc-demo:user-name";

function getInitialName(token: string): string {
  const savedName = window.localStorage.getItem(USER_NAME_STORAGE_KEY)?.trim();
  if (savedName) return savedName;

  return `Guest-${token.slice(0, 6)}`;
}

export function useUserProfile(token: string) {
  const [name, setName] = useState(() => getInitialName(token));

  useEffect(() => {
    window.localStorage.setItem(USER_NAME_STORAGE_KEY, name);
  }, [name]);

  return {
    name,
    setName,
  };
}

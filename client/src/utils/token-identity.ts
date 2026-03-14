import { v4 as uuidv4 } from "uuid";

const TOKEN_STORAGE_KEY = "webrtc-demo:token";

export function getOrCreateToken(): string {
  const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (existingToken) return existingToken;

  const token = uuidv4();
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

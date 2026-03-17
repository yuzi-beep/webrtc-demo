import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { socketEvents } from "@/pages/room/_utils/event-bus/socket-events";
import type { SocketEventMessage, SocketEventType } from "@/pages/room/_types";
import { useStore } from "../_stores/useStore";

const SIGNALING_SERVER = "http://localhost:3000";

/**
 * Manages the Socket.io connection lifecycle.
 * Connects on mount, joins room, and exposes the socket instance
 * for other hooks to attach listeners to.
 */
export function useSocket() {
  const roomId = useStore((state) => state.roomId);
  const token = useStore((state) => state.token);

  const socket = useMemo(() => {
    if (!roomId || !token) return null;
    return io(SIGNALING_SERVER, {
      autoConnect: false,
      auth: { token },
    });
  }, [roomId, token]);

  useEffect(() => {
    if (!socket) return;
    const listen = (even: string, type: SocketEventType) => {
      const handler = (type: SocketEventType) => {
        return (payload?: unknown) => {
          socketEvents.emit({ type, payload } as SocketEventMessage);
        };
      };
      socket.on(even, handler(type));
      return () => socket.off(even, handler);
    };

    const unsubs = [
      listen("connect", "CONNECTED"),
      listen("disconnect", "DISCONNECTED"),
      listen("ROOM_FULL", "ROOM_FULL"),
      listen("RECEIVE_SIGNAL", "RECEIVE_SIGNAL"),
      listen("EXISTING_TOKENS", "EXISTING_TOKENS"),
    ];

    socket.connect();
    return () => {
      unsubs.forEach((unsub) => unsub());
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const off = socketEvents.on("SEND_TO_SERVER", (message) => {
      socket.emit(message.type, message.payload);
    });
    return () => off();
  }, [socket]);

  return { socket };
}

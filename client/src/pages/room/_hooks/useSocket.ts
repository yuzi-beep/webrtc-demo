import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { socketEvents } from "@/pages/room/_utils/event-bus/socket-events";
import type {
  SocketEventMessage,
  SocketEventType,
  SocketSendMessage,
} from "@/pages/room/_types";

const SIGNALING_SERVER = "http://localhost:3000";

/**
 * Manages the Socket.io connection lifecycle.
 * Connects on mount, joins room, and exposes the socket instance
 * for other hooks to attach listeners to.
 */
export function useSocket(roomId: string | undefined, token: string) {
  const socket = useMemo(() => {
    if (!roomId || !token) return null;
    return io(SIGNALING_SERVER, {
      autoConnect: false,
      auth: { token },
    });
  }, [roomId, token]);

  useEffect(() => {
    if (!socket) return;

    let isDisposed = false;
    const createForwarder = (type: SocketEventType) => {
      return (payload?: unknown) => {
        if (isDisposed) return;
        socketEvents.emit({ type, payload } as SocketEventMessage);
      };
    };

    const handleConnect = createForwarder("CONNECTED");
    const handleDisconnect = createForwarder("DISCONNECTED");
    const handleRoomFull = createForwarder("ROOM_FULL");
    const handleReceiveSignal = createForwarder("RECEIVE_SIGNAL");
    const handleExistingTokens = createForwarder("EXISTING_TOKENS");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("ROOM_FULL", handleRoomFull);
    socket.on("RECEIVE_SIGNAL", handleReceiveSignal);
    socket.on("EXISTING_TOKENS", handleExistingTokens);

    const connectTimer = window.setTimeout(() => {
      if (!isDisposed) socket.connect();
    }, 0);

    return () => {
      isDisposed = true;
      window.clearTimeout(connectTimer);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ROOM_FULL", handleRoomFull);
      socket.off("RECEIVE_SIGNAL", handleReceiveSignal);
      socket.off("EXISTING_TOKENS", handleExistingTokens);
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const off = socketEvents.on(
      "SEND_TO_SERVER",
      (message: SocketSendMessage) => {
        socket.emit(message.type, message.payload);
      },
    );

    return () => off();
  }, [socket]);

  return { socket };
}

import { useEffect, useState, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { socketEvents } from "@/pages/room/_utils/event-bus/socket-events";
import type { SocketEventMessage } from "@/pages/room/_types";

const SIGNALING_SERVER = "http://localhost:3000";

/**
 * Manages the Socket.io connection lifecycle.
 * Connects on mount, joins room, and exposes the socket instance
 * for other hooks to attach listeners to.
 */
export function useSocket(roomId: string | undefined,token: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socket = useMemo(() => {
    if (!roomId) return null;
    return io(SIGNALING_SERVER, {
      autoConnect: false,
      auth: { token },
    });
  }, [roomId, token]);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id ?? null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setSocketId(null);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
      setIsConnected(false);
      setSocketId(null);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const handleSendToServer = ({ message }: Extract<SocketEventMessage, { type: "SEND_TO_SERVER" }>) => {
      socket.emit(message.type, message.payload);
    }

    socketEvents.on("SEND_TO_SERVER", handleSendToServer);

    return () => {
      socketEvents.off("SEND_TO_SERVER", handleSendToServer);
    };
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
    setIsConnected(false);
    setSocketId(null);
  }, [socket]);

  return {
    socket,
    socketId,
    token,
    isConnected,
    disconnect,
  };
}

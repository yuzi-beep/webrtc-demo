import { useEffect, useState, useCallback, useMemo } from "react";
import type SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { getOrCreateToken } from "@/utils/token-identity";

const SIGNALING_SERVER = "http://localhost:3000";

/**
 * Manages the Socket.io connection lifecycle.
 * Connects on mount, joins room, and exposes the socket instance
 * for other hooks to attach listeners to.
 */
export function useSocket(roomId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [token] = useState(() => getOrCreateToken());
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

  const disconnect = useCallback(() => {
    socket?.disconnect();
    setIsConnected(false);
    setSocketId(null);
  }, [socket]);

  const sendSignal = useCallback(
    (targetToken: string, signal: SimplePeer.SignalData) => {
      socket?.emit("signal", { targetToken, signal });
    },
    [socket],
  );

  return {
    socket,
    socketId,
    token,
    isConnected,
    disconnect,
    sendSignal,
  };
}

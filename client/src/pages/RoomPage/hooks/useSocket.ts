import { useEffect, useState, useCallback, useMemo } from "react";
import type SimplePeer from "simple-peer";
import { io } from "socket.io-client";

const SIGNALING_SERVER = "http://localhost:3000";

/**
 * Manages the Socket.io connection lifecycle.
 * Connects on mount, joins room, and exposes the socket instance
 * for other hooks to attach listeners to.
 */
export function useSocket(roomId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useMemo(() => {
    if (!roomId) return null;
    return io(SIGNALING_SERVER, { autoConnect: false });
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
      setIsConnected(false);
    };
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
    setIsConnected(false);
  }, [socket]);

  const sendSignal = useCallback(
    (targetId: string, signal: SimplePeer.SignalData) => {
      socket?.emit("signal", { targetId, signal });
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    disconnect,
    sendSignal,
  };
}

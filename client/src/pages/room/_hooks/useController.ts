import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { socketEvents } from "../_utils/event-bus";
import type SimplePeer from "simple-peer";

export const useController = ({
  roomId,
  createPeer,
}: {
  roomId: string;
  createPeer: (token: string, signal?: SimplePeer.SignalData) => void;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const leaveRoom = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!roomId) return;

    const unsubs = [
      socketEvents.on("CONNECTED", () => {
        console.log("Connected to signaling server, joining room:", roomId);
        socketEvents.send({ type: "JOIN_ROOM", payload: { roomId } });
        setIsConnected(true);
      }),
      socketEvents.on("DISCONNECTED", () => setIsConnected(false)),
      socketEvents.on("ROOM_FULL", leaveRoom),
      socketEvents.on(
        "RECEIVE_SIGNAL",
        (payload) => {
          console.log("Received signal from server:", payload);
          createPeer(payload.senderToken, payload.signal);
        },
      ),
      socketEvents.on(
        "EXISTING_TOKENS",
        (payload) => {
          payload.forEach((token) => createPeer(token));
        },
      ),
    ];
    return () => unsubs.forEach((off) => off());
  }, [createPeer, leaveRoom, roomId]);

  return {
    isConnected,
    leaveRoom,
  };
};

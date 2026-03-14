import type { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import type SimplePeer from "simple-peer";
import { useCallback, useEffect } from "react";

export interface RoomControllerParms {
  roomId: string;
  socket: Socket | null;
  createPeer: (remoteToken: string, signal?: SimplePeer.SignalData) => void;
  destroyPeer: (targetToken: string) => void;
}

export const useRoomController = ({
  roomId,
  socket,
  createPeer,
  destroyPeer,
}: RoomControllerParms) => {
  const navigate = useNavigate();
  const leaveRoom = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!socket || !roomId) return;
    const handleRoomFull = () => leaveRoom();
    const handleSignal = ({
      senderToken,
      signal,
    }: {
      senderToken: string;
      signal: SimplePeer.SignalData;
    }) => createPeer(senderToken, signal);
    const handleTokenConnected = (data: string) =>
      console.log("Token connected:", data);
    const handleTokenDisconnected = (data: string) => destroyPeer(data);
    const handleExistingTokens = (data: string[]) =>
      data.forEach((peerToken) => createPeer(peerToken));
    const handleConnectJoin = () => socket.emit("join-room", roomId);

    socket.on("room-full", handleRoomFull);
    socket.on("signal", handleSignal);
    socket.on("token-connected", handleTokenConnected);
    socket.on("token-disconnected", handleTokenDisconnected);
    socket.on("existing-tokens", handleExistingTokens);
    socket.on("connect", handleConnectJoin);

    return () => {
      socket.off("room-full", handleRoomFull);
      socket.off("signal", handleSignal);
      socket.off("token-connected", handleTokenConnected);
      socket.off("token-disconnected", handleTokenDisconnected);
      socket.off("existing-tokens", handleExistingTokens);
      socket.off("connect", handleConnectJoin);
    };
  }, [socket, roomId, leaveRoom, createPeer, destroyPeer]);

  return {
    leaveRoom,
  };
};

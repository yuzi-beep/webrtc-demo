import type SimplePeer from "simple-peer";
import type { Socket } from "socket.io-client";
export * from "./socket-events";
export * from "./webrtc-events";

export type MediaType = "camera" | "microphone" | "screen";

export interface MemberMeta {
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  status?: "connected" | "connecting";
}

export interface RoomControllerParms {
  roomId: string;
  socket: Socket | null;
  createPeer: (remoteToken: string, signal?: SimplePeer.SignalData) => void;
  destroyPeer: (targetToken: string) => void;
}

export type SignalEventPayload = {
  senderToken: string;
  signal: SimplePeer.SignalData;
};


import type SimplePeer from "simple-peer";
import type { Socket } from "socket.io-client";
export * from "./socket-events";

export type WebRTCTransportMessage =
  | {
      type: "MEDIA_STATE";
      senderId: string;
      payload: { isMuted: boolean; isCameraOff: boolean };
    }
  | {
      type: "CHAT_MESSAGE";
      senderId: string;
      payload: { text: string; senderName: string; timestamp: number };
    }
  | {
      type: "SYNC_META";
      senderId: string;
      payload: {
        token: string;
        name: string;
        isMuted: boolean;
        isCameraOff: boolean;
      };
    };

export type WebRTCInternalMessage =
  | {
      type: "CHAT_SEND";
      senderId: string;
      payload: { text: string; senderName: string; timestamp: number };
    }
  | {
      type: "SYNC_META_REQUEST";
    };

export type WebRTCEventMessage = WebRTCTransportMessage | WebRTCInternalMessage;

export type WebRTCMessage = WebRTCTransportMessage;

export interface MerberMeta {
  token: string;
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


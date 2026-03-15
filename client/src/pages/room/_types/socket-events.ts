import type SimplePeer from "simple-peer";

export type SocketSystemEventMessage =
  | {
      type: "CONNECTED";
    }
  | {
      type: "DISCONNECTED";
    };

export type SocketReceiveMessage =
  | {
      type: "RECEIVE_SIGNAL";
      payload: { senderToken: string; signal: SimplePeer.SignalData };
    }
  | {
      type: "ROOM_FULL";
    }
  | {
      type: "EXISTING_TOKENS";
      payload: string[];
    };

export type SocketSendMessage =
  | {
      type: "SEND_SIGNAL";
      payload: { targetToken: string; signal: SimplePeer.SignalData };
    }
  | {
      type: "JOIN_ROOM";
      payload: { roomId: string };
    };

export type SocketInternalMessage = {
  type: "SEND_TO_SERVER";
  payload: SocketSendMessage;
};

export type SocketEventMessage =
  | SocketSystemEventMessage
  | SocketReceiveMessage
  | SocketSendMessage
  | SocketInternalMessage;

export type SocketEventType = SocketEventMessage["type"];

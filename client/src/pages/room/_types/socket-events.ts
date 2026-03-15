import type SimplePeer from "simple-peer";

export type SocketReceiveMessage = {
  type: "RECEIVE_SIGNAL";
  payload: { senderToken: string; signal: SimplePeer.SignalData };
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
  message: SocketSendMessage;
};

export type SocketEventMessage =
  | SocketReceiveMessage
  | SocketSendMessage
  | SocketInternalMessage;

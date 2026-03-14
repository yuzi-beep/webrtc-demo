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
    };

export type WebRTCInternalMessage = {
  type: "CHAT_SEND";
  senderId: string;
  payload: { text: string; senderName: string; timestamp: number };
};

export type WebRTCEventMessage = WebRTCTransportMessage | WebRTCInternalMessage;

export type WebRTCMessage = WebRTCTransportMessage;

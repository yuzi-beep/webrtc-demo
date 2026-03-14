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

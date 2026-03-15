export type WebRTCReceiveMessage =
  | {
      type: "MEDIA_STATE";
      senderToken?: string;
      payload: { isMuted: boolean; isCameraOff: boolean };
    }
  | {
      type: "RECEIVE_CHAT_MESSAGE";
      senderToken?: string;
      payload: { text: string; senderName: string; timestamp: number };
    }
  | {
      type: "RECEIVE_SYNC_META";
      senderToken?: string;
      payload: {
        token: string;
        name: string;
        isMuted: boolean;
        isCameraOff: boolean;
      };
    };

export type WebRTCInternalMessage = {
  type: "SEND";
  payload: WebRTCReceiveMessage;
};

export type WebRTCEventMessage = WebRTCReceiveMessage | WebRTCInternalMessage;

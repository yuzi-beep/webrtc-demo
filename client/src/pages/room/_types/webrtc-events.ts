export type WebRTCReceiveMessage =
  | {
      type: "MEDIA_STATE";
      payload: { isMuted: boolean; isCameraOff: boolean };
    }
  | {
      type: "RECEIVE_CHAT_MESSAGE";
      payload: { text: string; senderName: string; timestamp: number };
    }
  | {
      type: "RECEIVE_SYNC_META";
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

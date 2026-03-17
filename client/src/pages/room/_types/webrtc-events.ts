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
    }
  | {
      type: "STREAM_SYNC";
      payload: Record<"camera" | "microphone", string> & {
        screen?: string;
      };
    };

export type WebRTCInternalMessage =
  | {
      type: "SEND";
      payload: WebRTCReceiveMessage;
    }
  | { type: "REBIND_STREAM"; payload?: never };

export type WebRTCEventMessage = WebRTCReceiveMessage | WebRTCInternalMessage;

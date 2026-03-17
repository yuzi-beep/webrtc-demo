export type StreamType = "MICROPHONE" | "CAMERA" | "SCREEN" | "SCREEN_AUDIO";
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
      payload: {
        streamId: string;
        streamType: StreamType;
        status: "enabled" | "disabled";
      }[];
    };

export type WebRTCInternalMessage = {
  type: "SEND";
  payload: WebRTCReceiveMessage;
};

export type WebRTCEventMessage = WebRTCReceiveMessage | WebRTCInternalMessage;

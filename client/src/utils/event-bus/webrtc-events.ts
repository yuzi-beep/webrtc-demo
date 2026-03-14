import type { WebRTCMessage } from "../../hooks/useWebRTC";

type MessageType = WebRTCMessage["type"];
type MessagePayload<T extends MessageType> = Extract<
  WebRTCMessage,
  { type: T }
>["payload"];
type Listener<T> = (payload: T, senderId: string) => void;
type AnyListener = (payload: unknown, senderId: string) => void;

class WebRTCEventBus {
  private listeners: Partial<Record<MessageType, Set<AnyListener>>> = {};

  on<T extends MessageType>(type: T, callback: Listener<MessagePayload<T>>) {
    if (!this.listeners[type])
      this.listeners[type] = new Set<AnyListener>();
    this.listeners[type].add(callback as AnyListener);
  }

  off<T extends MessageType>(type: T, callback: Listener<MessagePayload<T>>) {
    const typeListeners = this.listeners[type];
    if (typeListeners) {
      typeListeners.delete(callback as AnyListener);
    }
  }

  emit<T extends MessageType>(
    type: T,
    payload: MessagePayload<T>,
    senderId: string,
  ) {
    const typeListeners = this.listeners[type];
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        (callback as Listener<MessagePayload<T>>)(payload, senderId);
      });
    }
  }
}

export const webrtcEvents = new WebRTCEventBus();

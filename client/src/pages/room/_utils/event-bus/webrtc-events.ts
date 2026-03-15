import type { WebRTCEventMessage } from "@/pages/room/_types";

type MessageType = WebRTCEventMessage["type"];
type AnyListener = (message: WebRTCEventMessage) => void;
type Listener<T extends MessageType> = (
  message: Extract<WebRTCEventMessage, { type: T }>,
) => void;

class WebRTCEventBus {
  private listeners: Partial<Record<MessageType, Set<AnyListener>>> = {};

  on<T extends MessageType>(type: T, callback: Listener<T>) {
    if (!this.listeners[type]) this.listeners[type] = new Set<AnyListener>();
    this.listeners[type].add(callback as AnyListener);
    return () => this.off(type, callback);
  }

  off<T extends MessageType>(type: T, callback: Listener<T>) {
    const typeListeners = this.listeners[type];
    if (typeListeners) {
      typeListeners.delete(callback as AnyListener);
    }
  }

  emit(message: WebRTCEventMessage) {
    const typeListeners = this.listeners[message.type];
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        (callback as AnyListener)(message);
      });
    }
  }
}

export const webrtcEvents = new WebRTCEventBus();

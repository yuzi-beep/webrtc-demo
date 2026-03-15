import type {
  WebRTCEventMessage,
  WebRTCReceiveMessage,
} from "@/pages/room/_types";

type MessageType = WebRTCEventMessage["type"];
type EventByType<T extends MessageType> = Extract<
  WebRTCEventMessage,
  { type: T }
>;
type EventPayload<T extends MessageType> = EventByType<T>["payload"];
type AnyListener = (payload: unknown, senderToken?: string) => void;
type Listener<T extends MessageType> = (
  payload: EventPayload<T>,
  senderToken?: string,
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

  send(message: WebRTCReceiveMessage) {
    this.emit({ type: "SEND", payload: message });
  }

  emit(message: WebRTCEventMessage, senderToken?: string) {
    const typeListeners = this.listeners[message.type];
    if (typeListeners) {
      const payload = message.payload;
      typeListeners.forEach((callback) => {
        (callback as AnyListener)(payload, senderToken);
      });
    }
  }

  offAny() {
    this.listeners = {};
  }
}

export const webrtcEvents = new WebRTCEventBus();

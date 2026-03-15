import type {
  SocketEventMessage,
  SocketSendMessage,
} from "@/pages/room/_types";

type MessageType = SocketEventMessage["type"];
type AnyListener = (message: SocketEventMessage) => void;
type Listener<T extends MessageType> = (
  message: Extract<SocketEventMessage, { type: T }>,
) => void;

class SocketEventBus {
  private listeners: Partial<Record<MessageType, Set<AnyListener>>> = {};

  on<T extends MessageType>(type: T, callback: Listener<T>) {
    if (!this.listeners[type]) this.listeners[type] = new Set<AnyListener>();
    this.listeners[type].add(callback as AnyListener);
    return () => this.off(type, callback);
  }

  off<T extends MessageType>(type: T, callback?: Listener<T>) {
    if (!callback) {
      this.listeners[type] = undefined;
      return;
    }
    const typeListeners = this.listeners[type];
    if (typeListeners) 
      typeListeners.delete(callback as AnyListener);
  }

  send(message: SocketSendMessage) {
    this.emit({
      type: "SEND_TO_SERVER",
      message,
    });
  }

  emit(message: SocketEventMessage) {
    const typeListeners = this.listeners[message.type];
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        (callback as AnyListener)(message);
      });
    }
  }

  offAny() {
    this.listeners = {};
  }
}

export const socketEvents = new SocketEventBus();

import type {
  SocketEventMessage,
  SocketSendMessage,
} from "@/pages/room/_types";

type MessageType = SocketEventMessage["type"];
type EventByType<T extends MessageType> = Extract<
  SocketEventMessage,
  { type: T }
>;
type EventData<T extends MessageType> =
  EventByType<T> extends { payload: infer P }
    ? P
    : EventByType<T> extends { message: infer M }
      ? M
      : void;
type AnyListener = (data: unknown) => void;
type Listener<T extends MessageType> =
  EventData<T> extends void ? () => void : (data: EventData<T>) => void;

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
    if (typeListeners) typeListeners.delete(callback as AnyListener);
  }

  send(message: SocketSendMessage) {
    this.emit({
      type: "SEND_TO_SERVER",
      payload: message,
    });
  }

  emit(message: SocketEventMessage) {
    const typeListeners = this.listeners[message.type];
    if (typeListeners) {
      const data = "payload" in message ? message.payload : undefined;
      typeListeners.forEach((callback) => {
        (callback as AnyListener)(data);
      });
    }
  }

  offAny() {
    this.listeners = {};
  }
}

export const socketEvents = new SocketEventBus();

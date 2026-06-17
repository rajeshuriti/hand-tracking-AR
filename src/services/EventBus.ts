import type { EventName, EventPayload, EventHandler } from '../types/events';

type Listener = {
  handler: EventHandler<EventName>;
  once: boolean;
};

class EventBus {
  private listeners = new Map<EventName, Set<Listener>>();
  private history = new Map<EventName, EventPayload<EventName>>();

  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    const listener: Listener = { handler: handler as EventHandler<EventName>, once: false };
    this.getListeners(event).add(listener);
    return () => this.getListeners(event).delete(listener);
  }

  once<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    const listener: Listener = { handler: handler as EventHandler<EventName>, once: true };
    this.getListeners(event).add(listener);
    return () => this.getListeners(event).delete(listener);
  }

  emit<T extends EventName>(event: T, payload: EventPayload<T>): void {
    this.history.set(event, payload as EventPayload<EventName>);
    const listeners = this.getListeners(event);
    for (const listener of listeners) {
      listener.handler(payload as EventPayload<EventName>);
      if (listener.once) {
        listeners.delete(listener);
      }
    }
  }

  lastPayload<T extends EventName>(event: T): EventPayload<T> | undefined {
    return this.history.get(event) as EventPayload<T> | undefined;
  }

  off<T extends EventName>(event: T): void {
    this.listeners.delete(event);
  }

  clear(): void {
    this.listeners.clear();
    this.history.clear();
  }

  private getListeners(event: EventName): Set<Listener> {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    return set;
  }
}

export const eventBus = new EventBus();

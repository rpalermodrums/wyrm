import type { EventBus, GameEvent, GameEventType, EventHandler } from '../types';

export class Events implements EventBus {
  private handlers: Map<GameEventType, Set<EventHandler>> = new Map();

  emit<T extends GameEvent>(event: T): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        (handler as EventHandler<T>)(event);
      });
    }
  }

  on<T extends GameEventType>(
    type: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlers = this.handlers.get(type)!;
    handlers.add(handler as EventHandler);

    return () => this.off(type, handler as EventHandler);
  }

  off(type: GameEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  once<T extends GameEventType>(
    type: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>
  ): void {
    const wrappedHandler = (event: GameEvent) => {
      this.off(type, wrappedHandler as EventHandler);
      (handler as EventHandler)(event);
    };
    this.on(type, wrappedHandler as EventHandler<Extract<GameEvent, { type: T }>>);
  }

  hasListeners(type: GameEventType): boolean {
    const handlers = this.handlers.get(type);
    return handlers !== undefined && handlers.size > 0;
  }

  getListenerCount(type: GameEventType): number {
    const handlers = this.handlers.get(type);
    return handlers ? handlers.size : 0;
  }
}

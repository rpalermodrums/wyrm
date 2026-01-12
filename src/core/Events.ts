/**
 * EventBus - Decoupled event-driven communication
 *
 * Systems emit events, other systems listen.
 * Prevents tight coupling between systems.
 */

import type { GameEvent, EventBus as IEventBus } from '../types';

type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

export class EventBus implements IEventBus {
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();

  emit(event: GameEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        handler(event);
      }
    }
  }

  on<T extends GameEvent['type']>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): void {
    let typeHandlers = this.handlers.get(type);
    if (!typeHandlers) {
      typeHandlers = new Set();
      this.handlers.set(type, typeHandlers);
    }
    typeHandlers.add(handler as EventHandler);
  }

  off<T extends GameEvent['type']>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): void {
    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      typeHandlers.delete(handler as EventHandler);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

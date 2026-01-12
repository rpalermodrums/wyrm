/**
 * Entity - Container for components in the ECS pattern
 *
 * Entities are just IDs with a collection of components.
 * All game logic lives in Systems.
 */

import type { Component, Entity as IEntity } from '../types';

let entityIdCounter = 0;

export function resetEntityIdCounter(): void {
  entityIdCounter = 0;
}

export class Entity implements IEntity {
  public readonly id: string;
  public readonly components: Map<string, Component>;

  constructor() {
    this.id = `entity_${entityIdCounter++}`;
    this.components = new Map();
  }

  addComponent<T extends Component>(component: T): void {
    this.components.set(component.type, component);
  }

  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  removeComponent(type: string): void {
    this.components.delete(type);
  }

  hasComponents(types: readonly string[]): boolean {
    return types.every((type) => this.components.has(type));
  }
}

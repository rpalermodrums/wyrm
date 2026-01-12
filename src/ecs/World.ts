/**
 * World - ECS World container
 *
 * Manages entities and systems, runs the update loop.
 * Systems are sorted by priority and run in order.
 */

import type { Entity as IEntity, System, World as IWorld } from '../types';
import { Entity } from './Entity';

export class World implements IWorld {
  private readonly entities: Map<string, IEntity> = new Map();
  private readonly systems: System[] = [];
  private readonly entitiesToDestroy: Set<string> = new Set();

  createEntity(): IEntity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    // Note: onEntityAdded is NOT called here because entity has no components yet.
    // Call notifyEntityReady() after adding components to trigger system hooks.
    return entity;
  }

  /**
   * Notify systems that an entity is fully configured and ready.
   * Call this after adding all components to a new entity.
   */
  notifyEntityReady(entity: IEntity): void {
    for (const system of this.systems) {
      if (system.onEntityAdded && entity.hasComponents(system.requiredComponents)) {
        system.onEntityAdded(entity);
      }
    }
  }

  destroyEntity(id: string): void {
    this.entitiesToDestroy.add(id);
  }

  /**
   * Process all queued entity destructions immediately.
   * Call this after unloadLevel() to ensure entities are removed
   * before loading new ones (prevents one-frame overlap).
   */
  processDestructions(): void {
    for (const id of this.entitiesToDestroy) {
      const entity = this.entities.get(id);
      if (entity) {
        // Notify systems before removal
        for (const system of this.systems) {
          if (system.onEntityRemoved && entity.hasComponents(system.requiredComponents)) {
            system.onEntityRemoved(entity);
          }
        }
        this.entities.delete(id);
      }
    }
    this.entitiesToDestroy.clear();
  }

  getEntity(id: string): IEntity | undefined {
    return this.entities.get(id);
  }

  query(componentTypes: readonly string[]): IEntity[] {
    const results: IEntity[] = [];

    for (const entity of this.entities.values()) {
      if (entity.hasComponents(componentTypes)) {
        results.push(entity);
      }
    }

    return results;
  }

  queryOne(componentTypes: readonly string[]): IEntity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.hasComponents(componentTypes)) {
        return entity;
      }
    }
    return undefined;
  }

  addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  removeSystem(name: string): void {
    const index = this.systems.findIndex((s) => s.name === name);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  getSystem(name: string): System | undefined {
    return this.systems.find((s) => s.name === name);
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      const entities = this.query(system.requiredComponents);
      system.update(entities, deltaTime);
    }

    this.processDestructions();
  }

  clear(): void {
    this.entities.clear();
    this.entitiesToDestroy.clear();
  }

  getAllEntities(): IEntity[] {
    return Array.from(this.entities.values());
  }

  get entityCount(): number {
    return this.entities.size;
  }
}

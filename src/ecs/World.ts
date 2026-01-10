import type { Entity as IEntity, System, World as IWorld } from '../types';
import { Entity } from './Entity';

export class World implements IWorld {
  private entities: Map<string, IEntity> = new Map();
  private systems: System[] = [];
  private entitiesToDestroy: Set<string> = new Set();

  createEntity(): IEntity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    
    this.systems.forEach((system) => {
      if (system.onEntityAdded && entity.hasComponents(system.requiredComponents as string[])) {
        system.onEntityAdded(entity);
      }
    });

    return entity;
  }

  destroyEntity(id: string): void {
    this.entitiesToDestroy.add(id);
  }

  private processDestructions(): void {
    this.entitiesToDestroy.forEach((id) => {
      const entity = this.entities.get(id);
      if (entity) {
        this.systems.forEach((system) => {
          if (system.onEntityRemoved && entity.hasComponents(system.requiredComponents as string[])) {
            system.onEntityRemoved(entity);
          }
        });
        this.entities.delete(id);
      }
    });
    this.entitiesToDestroy.clear();
  }

  getEntity(id: string): IEntity | undefined {
    return this.entities.get(id);
  }

  query(componentTypes: string[]): IEntity[] {
    const results: IEntity[] = [];
    
    for (const entity of this.entities.values()) {
      if (entity.hasComponents(componentTypes)) {
        results.push(entity);
      }
    }

    return results;
  }

  queryOne(componentTypes: string[]): IEntity | undefined {
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

  update(deltaTime: number): void {
    for (const system of this.systems) {
      const entities = this.query(system.requiredComponents as string[]);
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

/**
 * HazardSystem - Detects player contact with hazards (pits/spikes)
 *
 * Emits playerDeath when the player intersects a hazard volume.
 */

import type {
  System,
  Entity,
  World,
  TransformComponent,
  ColliderComponent,
  HazardComponent,
} from '../types';
import type { EventBus } from '../types';
import { SYSTEM_PRIORITY } from '../constants';

interface AABB {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export class HazardSystem implements System {
  readonly name = 'HazardSystem';
  readonly requiredComponents = ['hazard', 'transform', 'collider'] as const;
  readonly priority = SYSTEM_PRIORITY.Hazard;

  private world: World | null = null;

  constructor(private readonly events: EventBus) {}

  setWorld(world: World): void {
    this.world = world;
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    if (!this.world) return;

    const player = this.world.queryOne(['playerControlled', 'transform', 'collider']);
    if (!player) return;

    const playerTransform = player.getComponent<TransformComponent>('transform');
    const playerCollider = player.getComponent<ColliderComponent>('collider');
    if (!playerTransform || !playerCollider) return;

    const playerAABB = this.getAABB(playerTransform, playerCollider);

    for (const hazardEntity of entities) {
      const hazard = hazardEntity.getComponent<HazardComponent>('hazard');
      const hazardTransform = hazardEntity.getComponent<TransformComponent>('transform');
      const hazardCollider = hazardEntity.getComponent<ColliderComponent>('collider');
      if (!hazard || !hazardTransform || !hazardCollider) continue;

      const hazardAABB = this.getAABB(hazardTransform, hazardCollider);
      if (!this.intersects(playerAABB, hazardAABB)) continue;

      this.events.emit({ type: 'playerDeath', cause: 'pit' });
      break;
    }
  }

  private getAABB(transform: TransformComponent, collider: ColliderComponent): AABB {
    const centerX = transform.x + collider.offsetX;
    const centerY = transform.y + collider.offsetY;

    return {
      minX: centerX - collider.width / 2,
      maxX: centerX + collider.width / 2,
      minY: centerY - collider.height / 2,
      maxY: centerY + collider.height / 2,
    };
  }

  private intersects(a: AABB, b: AABB): boolean {
    return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
  }
}

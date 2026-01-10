import type { System, Entity, TransformComponent, ColliderComponent, VelocityComponent, PlayerControlledComponent } from '../types';
import { COLLISION_MATRIX, CollisionLayer } from '../constants';
import { AABB, aabbIntersects } from '../utils/AABB';

const CELL_SIZE = 100;

interface CollisionPair {
  a: Entity;
  b: Entity;
  aCollider: ColliderComponent;
  bCollider: ColliderComponent;
  aTransform: TransformComponent;
  bTransform: TransformComponent;
}

export class CollisionSystem implements System {
  readonly name = 'collision';
  readonly requiredComponents = [] as const;
  readonly priority = 20;

  private spatialGrid: Map<string, Entity[]> = new Map();

  update(entities: Entity[], _deltaTime: number): void {
    this.buildSpatialGrid(entities);
    const pairs = this.broadPhase(entities);
    this.narrowPhase(pairs);
    this.spatialGrid.clear();
  }

  private buildSpatialGrid(entities: Entity[]): void {
    entities.forEach((entity) => {
      const transform = entity.getComponent<TransformComponent>('transform');
      const collider = entity.getComponent<ColliderComponent>('collider');

      if (!transform || !collider) return;

      const aabb = this.getAABB(transform, collider);
      const minCellX = Math.floor(aabb.left / CELL_SIZE);
      const maxCellX = Math.floor(aabb.right / CELL_SIZE);
      const minCellY = Math.floor(aabb.top / CELL_SIZE);
      const maxCellY = Math.floor(aabb.bottom / CELL_SIZE);

      for (let cy = minCellY; cy <= maxCellY; cy++) {
        for (let cx = minCellX; cx <= maxCellX; cx++) {
          const key = `${cx},${cy}`;
          if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, []);
          }
          this.spatialGrid.get(key)!.push(entity);
        }
      }
    });
  }

  private broadPhase(entities: Entity[]): CollisionPair[] {
    const pairs: CollisionPair[] = [];
    const checked = new Set<string>();

    entities.forEach((entityA) => {
      const transformA = entityA.getComponent<TransformComponent>('transform');
      const colliderA = entityA.getComponent<ColliderComponent>('collider');

      if (!transformA || !colliderA) return;

      const aabbA = this.getAABB(transformA, colliderA);
      const cellX = Math.floor(aabbA.centerX / CELL_SIZE);
      const cellY = Math.floor(aabbA.centerY / CELL_SIZE);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const key = `${cellX + dx},${cellY + dy}`;
          const cellEntities = this.spatialGrid.get(key);

          if (!cellEntities) continue;

          cellEntities.forEach((entityB) => {
            if (entityA.id === entityB.id) return;

            const pairKey =
              entityA.id < entityB.id
                ? `${entityA.id}-${entityB.id}`
                : `${entityB.id}-${entityA.id}`;

            if (checked.has(pairKey)) return;
            checked.add(pairKey);

            const transformB = entityB.getComponent<TransformComponent>('transform');
            const colliderB = entityB.getComponent<ColliderComponent>('collider');

            if (!transformB || !colliderB) return;

            if (!this.shouldCollide(colliderA.layer, colliderB.layer)) return;

            const aabbB = this.getAABB(transformB, colliderB);
            if (aabbIntersects(aabbA.toObject(), aabbB.toObject())) {
              pairs.push({
                a: entityA,
                b: entityB,
                aCollider: colliderA,
                bCollider: colliderB,
                aTransform: transformA,
                bTransform: transformB,
              });
            }
          });
        }
      }
    });

    return pairs;
  }

  private narrowPhase(pairs: CollisionPair[]): void {
    pairs.forEach((pair) => {
      this.resolveCollision(
        pair.a,
        pair.b,
        pair.aTransform,
        pair.bTransform,
        pair.aCollider,
        pair.bCollider
      );
    });
  }

  private resolveCollision(
    a: Entity,
    b: Entity,
    aTransform: TransformComponent,
    bTransform: TransformComponent,
    aCollider: ColliderComponent,
    bCollider: ColliderComponent
  ): void {
    const isPlayerA = a.hasComponent('playerControlled');
    const isPlayerB = b.hasComponent('playerControlled');
    const isPlatformA = a.hasComponent('platform');
    const isPlatformB = b.hasComponent('platform');
    const isHazardA = a.hasComponent('hazard');
    const isHazardB = b.hasComponent('hazard');
    const isWyrmA = a.hasComponent('wyrm');
    const isWyrmB = b.hasComponent('wyrm');

    if ((isPlayerA && isPlatformB) || (isPlayerB && isPlatformA)) {
      const player = isPlayerA ? a : b;
      const playerTransform = isPlayerA ? aTransform : bTransform;
      const platformTransform = isPlatformA ? aTransform : bTransform;
      const playerCollider = isPlayerA ? aCollider : bCollider;
      const platformCollider = isPlatformA ? aCollider : bCollider;
      
      this.resolvePlayerPlatform(
        player,
        playerTransform,
        playerCollider,
        platformTransform,
        platformCollider
      );
    }

    if ((isPlayerA && isHazardB) || (isPlayerB && isHazardA)) {
      const player = isPlayerA ? a : b;
      const eventBus = (player as any).eventBus;
      if (eventBus) {
        eventBus.emit({ type: 'playerDeath', cause: 'hazard' });
      }
    }

    if ((isPlayerA && isWyrmB) || (isPlayerB && isWyrmA)) {
      const player = isPlayerA ? a : b;
      const eventBus = (player as any).eventBus;
      if (eventBus) {
        eventBus.emit({ type: 'playerDeath', cause: 'wyrm' });
      }
    }
  }

  private resolvePlayerPlatform(
    player: Entity,
    playerTransform: TransformComponent,
    playerCollider: ColliderComponent,
    platformTransform: TransformComponent,
    platformCollider: ColliderComponent
  ): void {
    const playerAABB = this.getAABB(playerTransform, playerCollider);
    const platformAABB = this.getAABB(platformTransform, platformCollider);

    const overlapX = Math.min(playerAABB.right, platformAABB.right) - Math.max(playerAABB.left, platformAABB.left);
    const overlapY = Math.min(playerAABB.bottom, platformAABB.bottom) - Math.max(playerAABB.top, platformAABB.top);

    if (overlapX < overlapY) {
      if (playerAABB.centerX < platformAABB.centerX) {
        playerTransform.x -= overlapX;
      } else {
        playerTransform.x += overlapX;
      }
    } else {
      const velocity = player.getComponent<VelocityComponent>('velocity');
      const playerControlled = player.getComponent<PlayerControlledComponent>('playerControlled');

      if (playerAABB.centerY < platformAABB.centerY) {
        playerTransform.y -= overlapY;
        if (velocity) velocity.vy = 0;
        if (playerControlled) playerControlled.grounded = true;
      } else {
        playerTransform.y += overlapY;
        if (velocity) velocity.vy = 0;
      }
    }
  }

  private getAABB(transform: TransformComponent, collider: ColliderComponent): AABB {
    return new AABB(
      transform.x + collider.offsetX,
      transform.y + collider.offsetY,
      collider.width,
      collider.height
    );
  }

  private shouldCollide(layerA: CollisionLayer, layerB: CollisionLayer): boolean {
    return (COLLISION_MATRIX[layerA] & layerB) !== 0;
  }
}

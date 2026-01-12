/**
 * CollisionSystem - AABB collision detection and resolution
 *
 * Detects collisions between entities and resolves platform collisions.
 * Sets isGrounded flag for player entities.
 */

import type {
  System,
  Entity,
  World,
  TransformComponent,
  VelocityComponent,
  ColliderComponent,
  PlayerControlledComponent,
  PlatformComponent,
} from '../types';
import type { EventBus } from '../types';
import { SYSTEM_PRIORITY, COLLISION } from '../constants';

const DEBUG = false; // Set to true for collision debugging
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[CollisionSystem] ${msg}`, ...args);
};

const { ONE_WAY_EPSILON } = COLLISION;

interface AABB {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export class CollisionSystem implements System {
  readonly name = 'CollisionSystem';
  readonly requiredComponents = ['transform', 'collider'] as const;
  readonly priority = SYSTEM_PRIORITY.Collision;

  private world: World | null = null;

  constructor(private readonly events?: EventBus) {}

  setWorld(world: World): void {
    this.world = world;
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    if (!this.world) return;

    // Get all platforms
    const platforms = this.world.query(['transform', 'collider', 'platform']);

    // Check each entity with a collider against platforms
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const collider = entity.getComponent<ColliderComponent>('collider');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const playerCtrl = entity.getComponent<PlayerControlledComponent>('playerControlled');

      if (!transform || !collider) continue;

      // Skip static/non-colliding entities
      if (entity.hasComponent('platform') || entity.hasComponent('hazard')) continue;

      // Reset grounded state - will be set true if we're on a platform
      if (playerCtrl) {
        playerCtrl.isGrounded = false;
      }

      // Check collision with each platform
      for (const platformEntity of platforms) {
        const platformTransform = platformEntity.getComponent<TransformComponent>('transform');
        const platformCollider = platformEntity.getComponent<ColliderComponent>('collider');
        const platform = platformEntity.getComponent<PlatformComponent>('platform');

        if (!platformTransform || !platformCollider || !platform) continue;

        // Check if layers should collide
        if (!this.shouldCollide(collider, platformCollider)) continue;

        // Get AABBs
        const entityAABB = this.getAABB(transform, collider);
        const platformAABB = this.getAABB(platformTransform, platformCollider);

        // Check for intersection
        if (this.intersects(entityAABB, platformAABB)) {
          log(`Collision: entity at (${transform.x.toFixed(1)}, ${transform.y.toFixed(1)}) with platform`);
          // Resolve the collision
          this.resolveCollision(
            entity,
            transform,
            velocity,
            collider,
            playerCtrl,
            platformAABB,
            platform.isOneWay
          );
        }
      }
    }
  }

  private shouldCollide(a: ColliderComponent, b: ColliderComponent): boolean {
    // One-sided collision filtering: collision occurs if EITHER entity's mask includes the other's layer.
    // This is intentional - it allows asymmetric collision relationships like:
    // - Wyrm (mask: PLAYER) can catch Player even though Player's mask doesn't include WYRM
    // - Hazards can affect players without players explicitly opting in
    // For symmetric filtering (both must agree), use: (a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0
    return (a.mask & b.layer) !== 0 || (b.mask & a.layer) !== 0;
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
    return (
      a.minX < b.maxX &&
      a.maxX > b.minX &&
      a.minY < b.maxY &&
      a.maxY > b.minY
    );
  }

  private resolveCollision(
    _entity: Entity,
    transform: TransformComponent,
    velocity: VelocityComponent | undefined,
    collider: ColliderComponent,
    playerCtrl: PlayerControlledComponent | undefined,
    platformAABB: AABB,
    isOneWay: boolean
  ): void {
    const entityAABB = this.getAABB(transform, collider);

    // Calculate overlap on each axis
    const overlapLeft = entityAABB.maxX - platformAABB.minX;
    const overlapRight = platformAABB.maxX - entityAABB.minX;
    const overlapTop = entityAABB.maxY - platformAABB.minY;
    const overlapBottom = platformAABB.maxY - entityAABB.minY;

    // Find minimum overlap direction
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    // For one-way platforms, only resolve if coming from above (falling)
    if (isOneWay) {
      // Only collide if entity's feet are near platform top and falling (vy <= 0 in Y+ up coords)
      // Use small epsilon (0.15 units) to prevent snapping from far below - must be near platform surface
      const feetY = entityAABB.minY;
      const ONE_WAY_EPSILON = 0.15;
      if (velocity && velocity.vy <= 0 && feetY >= platformAABB.maxY - ONE_WAY_EPSILON) {
        // Landing on top of one-way platform
        transform.y = platformAABB.maxY - collider.offsetY + collider.height / 2;
        if (velocity) velocity.vy = 0;
        if (playerCtrl) {
            playerCtrl.isGrounded = true;
            if (this.events) {
                this.events.emit({
                    type: 'entityLand',
                    entityId: _entity.id,
                    x: transform.x,
                    y: transform.y
                });
            }
        }
      }
      return;
    }

    // Resolve by pushing out along the axis with minimum overlap
    if (minOverlapX < minOverlapY) {
      // Resolve horizontally
      if (overlapLeft < overlapRight) {
        transform.x -= overlapLeft;
      } else {
        transform.x += overlapRight;
      }
      if (velocity) velocity.vx = 0;
    } else {
      // Resolve vertically
      // In Y+ up coords: overlapBottom < overlapTop means we're near platform TOP (landing)
      //                  overlapTop < overlapBottom means we're near platform BOTTOM (bonking head)
      if (overlapBottom < overlapTop) {
        // Landing on platform from above (falling down, vy < 0)
        transform.y += overlapBottom;
        if (velocity && velocity.vy < 0) velocity.vy = 0;
        if (playerCtrl) {
            playerCtrl.isGrounded = true;
            if (this.events) {
                this.events.emit({
                    type: 'entityLand',
                    entityId: _entity.id,
                    x: transform.x,
                    y: transform.y
                });
            }
        }
      } else {
        // Bonking head from below (jumping up, vy > 0)
        transform.y -= overlapTop;
        if (velocity && velocity.vy > 0) velocity.vy = 0;
      }
    }
  }
}

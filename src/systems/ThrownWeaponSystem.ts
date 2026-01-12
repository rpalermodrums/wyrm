/**
 * ThrownWeaponSystem - Handle thrown weapon projectiles
 *
 * Spawns projectiles when weapons are thrown, handles flight physics,
 * collision with enemies/ground, and pickup by unarmed players.
 */

import * as THREE from 'three';
import type {
  System,
  Entity,
  World,
  TransformComponent,
  VelocityComponent,
  ColliderComponent,
  ThrownWeaponComponent,
  ThreeObjectComponent,
  HealthComponent,
  WeaponComponent,
  WeaponType,
} from '../types';
import { CollisionLayer } from '../types';
import type { EventBus } from '../core/Events';
import {
  SYSTEM_PRIORITY,
  THROW_SPEED,
  THROW_GRAVITY,
  THROW_ROTATION,
  MAX_THROW_DISTANCE,
  WEAPONS,
  THROWN_WEAPON,
} from '../constants';
import { emitDeathEvents } from '../utils/deathHandler';
import { createLogger } from '../utils/debug';

const log = createLogger('ThrownWeaponSystem');

// Use constants from THROWN_WEAPON for consistency
const {
  GROUND_LEVEL,
  PROJECTILE_HIT_RADIUS,
  VERTICAL_HIT_TOLERANCE,
  PICKUP_RADIUS,
  PLATFORM_COLLISION_TOLERANCE,
  FRAME_TIME_FACTOR,
  STUCK_ANGLE_DOWN,
  STUCK_ANGLE_FLAT,
} = THROWN_WEAPON;

interface AABB {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/**
 * Create a simple sword mesh for the thrown weapon
 */
function createThrownWeaponMesh(weaponType: WeaponType): THREE.Group {
  const group = new THREE.Group();
  const { BLADE, HILT } = THROWN_WEAPON;

  // Blade dimensions based on weapon type
  const bladeLength = weaponType === 'broadsword' ? BLADE.LONG_LENGTH : BLADE.SHORT_LENGTH;
  const bladeWidth = weaponType === 'broadsword' ? BLADE.WIDE_WIDTH : BLADE.NARROW_WIDTH;
  const bladeGeometry = new THREE.BoxGeometry(bladeWidth, bladeLength, BLADE.DEPTH);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.2,
    metalness: 0.8,
  });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.y = bladeLength / 2;
  blade.castShadow = true;
  group.add(blade);

  // Hilt
  const hiltGeometry = new THREE.BoxGeometry(HILT.LENGTH, HILT.WIDTH, HILT.DEPTH);
  const hiltMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.6,
  });
  const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
  hilt.position.y = 0;
  group.add(hilt);

  return group;
}

export class ThrownWeaponSystem implements System {
  readonly name = 'ThrownWeaponSystem';
  readonly requiredComponents = ['thrownWeapon', 'transform', 'velocity'] as const;
  readonly priority = SYSTEM_PRIORITY.ThrownWeapon;

  private world: World | null = null;
  private readonly events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
    this.events.on('weaponThrown', this.spawnThrownWeapon.bind(this));
    log('ThrownWeaponSystem initialized');
  }

  setWorld(world: World): void {
    this.world = world;
    log('World reference set');
  }

  private spawnThrownWeapon(event: {
    entityId: string;
    weapon: WeaponType;
    x: number;
    y: number;
    direction: number;
  }): void {
    if (!this.world) {
      log('Cannot spawn thrown weapon: no world reference');
      return;
    }

    // Don't spawn for 'none' weapon type
    if (event.weapon === 'none') {
      log('Cannot throw weapon type: none');
      return;
    }

    log(`Spawning thrown weapon: ${event.weapon} at (${event.x}, ${event.y}), direction=${event.direction}`);

    const entity = this.world.createEntity();

    // Transform component
    entity.addComponent({
      type: 'transform',
      x: event.x,
      y: event.y,
      z: 0,
      rotation: 0,
      scale: { x: 1, y: 1, z: 1 },
    });

    // Velocity component - initial throw velocity
    // Use direction for horizontal, add slight upward arc
    entity.addComponent({
      type: 'velocity',
      vx: THROW_SPEED * event.direction * FRAME_TIME_FACTOR, // Convert to per-frame (roughly)
      vy: THROW_SPEED * 0.3 * FRAME_TIME_FACTOR, // Slight upward arc
      vz: 0,
    });

    // Collider for hit detection
    entity.addComponent({
      type: 'collider',
      width: 0.4,
      height: 0.8,
      depth: 0.2,
      offsetX: 0,
      offsetY: 0.4,
      layer: CollisionLayer.PROJECTILE,
      mask: CollisionLayer.ENEMY | CollisionLayer.PLAYER | CollisionLayer.PLATFORM,
    });

    // ThrownWeapon component
    entity.addComponent({
      type: 'thrownWeapon',
      weaponType: event.weapon,
      ownerId: event.entityId,
      direction: event.direction,
      traveledDistance: 0,
      rotation: 0,
      canBePickedUp: false,
      stuckIn: null,
    } as ThrownWeaponComponent);

    // Create Three.js mesh
    const mesh = createThrownWeaponMesh(event.weapon);
    mesh.position.set(event.x, event.y, 0);
    entity.addComponent({
      type: 'threeObject',
      object: mesh,
    });

    // Notify systems that entity is ready
    this.world.notifyEntityReady(entity);

    log(`Thrown weapon entity created: ${entity.id}`);
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    if (!this.world) return;

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const thrownWeapon = entity.getComponent<ThrownWeaponComponent>('thrownWeapon');
      const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');

      if (!transform || !velocity || !thrownWeapon || !threeObj) continue;

      // If weapon is stuck, only check for pickup
      if (thrownWeapon.stuckIn !== null) {
        this.checkPickup(entity, transform, thrownWeapon);
        continue;
      }

      // Apply gravity to velocity
      velocity.vy -= THROW_GRAVITY * FRAME_TIME_FACTOR; // Per-frame gravity

      // Track distance traveled (horizontal only)
      const distanceThisFrame = Math.abs(velocity.vx);
      thrownWeapon.traveledDistance += distanceThisFrame;

      // Update visual rotation (spinning weapon)
      thrownWeapon.rotation += THROW_ROTATION * thrownWeapon.direction;
      threeObj.object.rotation.z = thrownWeapon.rotation;

      // Check if exceeded max distance
      if (thrownWeapon.traveledDistance >= MAX_THROW_DISTANCE * FRAME_TIME_FACTOR) {
        log(`Thrown weapon exceeded max distance, destroying: ${entity.id}`);
        this.destroyThrownWeapon(entity);
        continue;
      }

      // Check collision with enemies
      if (this.checkEnemyCollision(entity, transform, thrownWeapon)) {
        continue; // Weapon was destroyed after hitting enemy
      }

      // Check ground collision
      if (transform.y <= GROUND_LEVEL) {
        log(`Thrown weapon hit ground at y=${transform.y}`);
        this.stickWeapon(entity, transform, velocity, thrownWeapon, 'ground');
        continue;
      }

      // Check platform collision (walls would need separate check)
      if (this.checkPlatformCollision(entity, transform, velocity, thrownWeapon)) {
        continue; // Weapon is now stuck
      }
    }
  }

  private checkEnemyCollision(
    projectile: Entity,
    projectileTransform: TransformComponent,
    thrownWeapon: ThrownWeaponComponent
  ): boolean {
    if (!this.world) return false;

    // Query all entities with health (potential targets)
    const targets = this.world.query(['transform', 'health']);

    for (const target of targets) {
      // Skip self and owner
      if (target.id === projectile.id) continue;
      if (target.id === thrownWeapon.ownerId) continue;

      const targetTransform = target.getComponent<TransformComponent>('transform');
      const targetHealth = target.getComponent<HealthComponent>('health');

      if (!targetTransform || !targetHealth) continue;
      if (targetHealth.invincibilityFrames > 0) continue;

      // Calculate distance
      const dx = targetTransform.x - projectileTransform.x;
      const dy = targetTransform.y - projectileTransform.y;
      const horizontalDistance = Math.abs(dx);
      const verticalDistance = Math.abs(dy);

      // Check if hit
      if (horizontalDistance <= PROJECTILE_HIT_RADIUS && verticalDistance <= VERTICAL_HIT_TOLERANCE) {
        // Get weapon damage
        const weaponData = WEAPONS[thrownWeapon.weaponType as Exclude<WeaponType, 'none'>];
        const damage = weaponData?.damage ?? 1;

        log(`Thrown weapon hit target ${target.id}, damage=${damage}`);

        // Apply damage
        targetHealth.current -= damage;

        // Emit hit event
        this.events.emit({
          type: 'entityHit',
          entityId: target.id,
          damage,
        });

        // Screen shake
        this.events.emit({ type: 'screenShake', intensity: 5, duration: 100 });

        // Check for death
        if (targetHealth.current <= 0) {
          emitDeathEvents(target, this.events, 'enemy');
        }

        // Destroy the projectile after hitting
        this.destroyThrownWeapon(projectile);
        return true;
      }
    }

    return false;
  }

  private checkPlatformCollision(
    projectile: Entity,
    transform: TransformComponent,
    velocity: VelocityComponent,
    thrownWeapon: ThrownWeaponComponent
  ): boolean {
    if (!this.world) return false;

    const projectileCollider = projectile.getComponent<ColliderComponent>('collider');
    if (!projectileCollider) return false;

    const projectileAABB = this.getAABB(transform, projectileCollider, PLATFORM_COLLISION_TOLERANCE);

    // Query platforms
    const platforms = this.world.query(['transform', 'platform', 'collider']);

    for (const platform of platforms) {
      const platTransform = platform.getComponent<TransformComponent>('transform');
      const platCollider = platform.getComponent<ColliderComponent>('collider');
      if (!platTransform || !platCollider) continue;

      const platformAABB = this.getAABB(platTransform, platCollider);

      if (!this.intersects(projectileAABB, platformAABB)) continue;

      log(`Thrown weapon hit platform`);
      this.stickWeapon(projectile, transform, velocity, thrownWeapon, 'wall');
      return true;
    }

    return false;
  }

  private stickWeapon(
    entity: Entity,
    transform: TransformComponent,
    velocity: VelocityComponent,
    thrownWeapon: ThrownWeaponComponent,
    stuckIn: 'ground' | 'wall'
  ): void {
    // Stop movement
    velocity.vx = 0;
    velocity.vy = 0;

    // Clamp to ground if stuck in ground
    if (stuckIn === 'ground') {
      transform.y = GROUND_LEVEL;
    }

    // Update component state
    thrownWeapon.stuckIn = stuckIn;
    thrownWeapon.canBePickedUp = true;

    // Set final rotation for stuck weapon (pointing into surface)
    const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
    if (threeObj) {
      if (stuckIn === 'ground') {
        // Point downward into ground
        threeObj.object.rotation.z = thrownWeapon.direction > 0 ? -STUCK_ANGLE_DOWN : STUCK_ANGLE_DOWN;
      } else {
        // Point into wall
        threeObj.object.rotation.z = thrownWeapon.direction > 0 ? -STUCK_ANGLE_FLAT : STUCK_ANGLE_FLAT;
      }
    }

    log(`Weapon stuck in ${stuckIn} at (${transform.x.toFixed(2)}, ${transform.y.toFixed(2)})`);
  }

  private checkPickup(
    weaponEntity: Entity,
    weaponTransform: TransformComponent,
    thrownWeapon: ThrownWeaponComponent
  ): void {
    if (!this.world || !thrownWeapon.canBePickedUp) return;

    // Find player
    const player = this.world.queryOne(['playerControlled', 'transform', 'weapon']);
    if (!player) return;

    const playerTransform = player.getComponent<TransformComponent>('transform');
    const playerWeapon = player.getComponent<WeaponComponent>('weapon');

    if (!playerTransform || !playerWeapon) return;

    // Only pick up if player is unarmed
    if (playerWeapon.weaponType !== 'none') return;

    // Check distance
    const dx = Math.abs(playerTransform.x - weaponTransform.x);
    const dy = Math.abs(playerTransform.y - weaponTransform.y);

    if (dx <= PICKUP_RADIUS && dy <= PICKUP_RADIUS) {
      log(`Player picked up ${thrownWeapon.weaponType}`);

      // Restore player's weapon
      playerWeapon.weaponType = thrownWeapon.weaponType;
      playerWeapon.attackCooldown = 0;
      playerWeapon.isAttacking = false;
      playerWeapon.attackPhase = 'idle';
      playerWeapon.attackFrame = 0;

      // Show sword mesh on player
      const playerThreeObj = player.getComponent<ThreeObjectComponent>('threeObject');
      if (playerThreeObj) {
        const sword = playerThreeObj.object.getObjectByName('sword');
        if (sword) {
          sword.visible = true;
        }
      }

      // Destroy the thrown weapon entity
      this.destroyThrownWeapon(weaponEntity);
    }
  }

  private destroyThrownWeapon(entity: Entity): void {
    if (!this.world) return;

    log(`Destroying thrown weapon entity: ${entity.id}`);
    this.world.destroyEntity(entity.id);
  }

  private getAABB(
    transform: TransformComponent,
    collider: ColliderComponent,
    padding: number = 0
  ): AABB {
    const centerX = transform.x + collider.offsetX;
    const centerY = transform.y + collider.offsetY;
    const halfWidth = collider.width / 2 + padding;
    const halfHeight = collider.height / 2 + padding;

    return {
      minX: centerX - halfWidth,
      maxX: centerX + halfWidth,
      minY: centerY - halfHeight,
      maxY: centerY + halfHeight,
    };
  }

  private intersects(a: AABB, b: AABB): boolean {
    return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
  }

  onEntityRemoved(entity: Entity): void {
    // Cleanup is handled by RenderSystem which removes Three.js objects
    log(`Thrown weapon entity removed: ${entity.id}`);
  }
}

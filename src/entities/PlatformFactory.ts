/**
 * PlatformFactory - Create platform entities
 *
 * Creates platforms with collision and Three.js mesh rendering.
 */

import * as THREE from 'three';
import type { World, Entity, PlatformData } from '../types';
import { CollisionLayer } from '../types';
import { COLORS } from '../constants';

const DEBUG = false; // Set to true for platform debugging
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[PlatformFactory] ${msg}`, ...args);
};

/**
 * Creates a platform mesh
 */
function createPlatformMesh(
  width: number,
  height: number,
  depth: number = 2
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  // Create a material with edge highlights
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.platform,
    roughness: 0.8,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return mesh;
}

/**
 * Create a platform entity from platform data
 */
export function createPlatform(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number,
  isOneWay: boolean = false
): Entity {
  const entity = world.createEntity();

  // Transform component - position in 3D space
  // Platform position is at center, so adjust for bottom-left origin in level data
  entity.addComponent({
    type: 'transform',
    x: x + width / 2,
    y: y + height / 2,
    z: 0,
    rotation: 0,
    scale: { x: 1, y: 1, z: 1 },
  });

  // Collider component - hitbox matching the platform size
  entity.addComponent({
    type: 'collider',
    width,
    height,
    depth: 2,
    offsetX: 0,
    offsetY: 0,
    layer: CollisionLayer.PLATFORM,
    mask: CollisionLayer.PLAYER | CollisionLayer.ENEMY | CollisionLayer.PROJECTILE,
  });

  // Platform component - platform-specific data
  entity.addComponent({
    type: 'platform',
    isOneWay,
  });

  // ThreeObject component - Three.js mesh
  const mesh = createPlatformMesh(width, height);
  mesh.position.set(x + width / 2, y + height / 2, 0);
  entity.addComponent({
    type: 'threeObject',
    object: mesh,
  });

  // Notify systems that entity is fully configured
  world.notifyEntityReady(entity);

  log(`Created platform at (${x}, ${y}), size=${width}x${height}, oneWay=${isOneWay}`);

  return entity;
}

/**
 * Create a platform entity from PlatformData
 */
export function createPlatformFromData(
  world: World,
  data: PlatformData
): Entity {
  return createPlatform(
    world,
    data.x,
    data.y,
    data.width,
    data.height,
    data.isOneWay ?? false
  );
}

/**
 * Create the ground platform spanning the screen
 */
export function createGround(
  world: World,
  x: number,
  width: number,
  height: number = 1
): Entity {
  return createPlatform(world, x, -height, width, height, false);
}

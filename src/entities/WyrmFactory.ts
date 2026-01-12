/**
 * WyrmFactory - Create the wyrm entity
 *
 * Creates a segmented wyrm (dragon) with a head and body segments.
 * The wyrm chases the player from the left side of the screen.
 */

import * as THREE from 'three';
import type { World, Entity, WyrmComponent, TransformComponent, ColliderComponent, ThreeObjectComponent } from '../types';
import { CollisionLayer } from '../types';
import { WYRM_SEGMENT_COUNT, WYRM_BASE_SPEED, COLORS } from '../constants';

const DEBUG = true;

/**
 * Creates the wyrm mesh - a head sphere followed by body segment spheres
 */
function createWyrmMesh(segmentCount: number): THREE.Group {
  const group = new THREE.Group();

  const material = new THREE.MeshStandardMaterial({
    color: COLORS.wyrm,
    roughness: 0.4,
    metalness: 0.3,
    emissive: COLORS.wyrmGlow,
    emissiveIntensity: 0.2,
  });

  // Head sphere (larger)
  const headGeometry = new THREE.SphereGeometry(0.8, 24, 24);
  const head = new THREE.Mesh(headGeometry, material);
  head.name = 'wyrmHead';
  head.position.set(0, 0, 0);
  head.castShadow = true;
  group.add(head);

  // Body segments (smaller spheres trailing behind)
  const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  for (let i = 0; i < segmentCount; i++) {
    const segment = new THREE.Mesh(bodyGeometry, material);
    segment.name = `wyrmSegment${i}`;
    // Segments trail behind the head along -X axis
    segment.position.set(-1.2 * (i + 1), 0, 0);
    segment.castShadow = true;
    group.add(segment);
  }

  if (DEBUG) {
    console.log(`[WyrmFactory] Created wyrm mesh with ${segmentCount} body segments`);
  }

  return group;
}

/**
 * Create the wyrm entity with all required components
 * @param world - The ECS world
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param speed - Optional wyrm speed (defaults to WYRM_BASE_SPEED)
 */
export function createWyrm(world: World, x: number, y: number, speed?: number): Entity {
  const entity = world.createEntity();
  const wyrmSpeed = speed ?? WYRM_BASE_SPEED;

  if (DEBUG) {
    console.log(`[WyrmFactory] Creating wyrm at (${x}, ${y}) with speed ${wyrmSpeed.toFixed(4)}`);
  }

  // Transform component - position in 3D space (head position)
  entity.addComponent<TransformComponent>({
    type: 'transform',
    x,
    y,
    z: 0,
    rotation: 0,
    scale: { x: 1, y: 1, z: 1 },
  });

  // Initialize segment positions trailing behind the head
  const segments: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < WYRM_SEGMENT_COUNT; i++) {
    segments.push({
      x: x - 1.2 * (i + 1),
      y,
      z: 0,
    });
  }

  // Wyrm component - wyrm-specific state
  entity.addComponent<WyrmComponent>({
    type: 'wyrm',
    segments,
    baseSpeed: wyrmSpeed,
    currentSpeed: wyrmSpeed,
    targetY: y,
  });

  // Collider component - hitbox (for the head)
  entity.addComponent<ColliderComponent>({
    type: 'collider',
    width: 1.6,
    height: 1.6,
    depth: 1.6,
    offsetX: 0,
    offsetY: 0,
    layer: CollisionLayer.WYRM,
    mask: CollisionLayer.PLAYER,
  });

  // ThreeObject component - Three.js mesh
  const mesh = createWyrmMesh(WYRM_SEGMENT_COUNT);
  mesh.position.set(x, y, 0);
  entity.addComponent<ThreeObjectComponent>({
    type: 'threeObject',
    object: mesh,
  });

  // Notify systems that entity is fully configured
  world.notifyEntityReady(entity);

  if (DEBUG) {
    console.log(`[WyrmFactory] Wyrm entity created with id: ${entity.id}`);
  }

  return entity;
}

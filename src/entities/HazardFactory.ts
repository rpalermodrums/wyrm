/**
 * HazardFactory - Create hazard entities
 *
 * Hazards are lethal zones (pits/spikes) that kill the player on contact.
 */

import * as THREE from 'three';
import type { World, Entity, HazardData, HazardType } from '../types';
import { CollisionLayer } from '../types';
import { COLORS } from '../constants';

function createHazardMesh(width: number, height: number, hazardType: HazardType): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, 1);
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.hazard,
    roughness: 0.8,
    metalness: 0.1,
    transparent: hazardType === 'pit',
    opacity: hazardType === 'pit' ? 0.7 : 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

export function createHazard(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number,
  hazardType: HazardType
): Entity {
  const entity = world.createEntity();

  // Position is at center, so adjust from bottom-left origin in level data
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  entity.addComponent({
    type: 'transform',
    x: centerX,
    y: centerY,
    z: 0,
    rotation: 0,
    scale: { x: 1, y: 1, z: 1 },
  });

  entity.addComponent({
    type: 'collider',
    width,
    height,
    depth: 1,
    offsetX: 0,
    offsetY: 0,
    layer: CollisionLayer.HAZARD,
    mask: CollisionLayer.PLAYER,
  });

  entity.addComponent({
    type: 'hazard',
    hazardType,
  });

  const mesh = createHazardMesh(width, height, hazardType);
  mesh.position.set(centerX, centerY, 0);
  entity.addComponent({
    type: 'threeObject',
    object: mesh,
  });

  world.notifyEntityReady(entity);

  return entity;
}

export function createHazardFromData(world: World, data: HazardData): Entity {
  return createHazard(world, data.x, data.y, data.width, data.height, data.type);
}

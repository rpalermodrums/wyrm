/**
 * EnemyFactory - Create enemy entities
 *
 * Creates enemies with all required components and a stick figure mesh.
 */

import * as THREE from 'three';
import type { World, Entity, EnemyType } from '../types';
import { CollisionLayer } from '../types';
import { COLORS, ENEMIES } from '../constants';

const DEBUG = true;
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[EnemyFactory] ${msg}`, ...args);
};

/**
 * Creates a stick figure mesh for enemies
 */
function createEnemyMesh(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: COLORS.enemy,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Body (thin box)
  const bodyGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.15);
  const body = new THREE.Mesh(bodyGeometry, material);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  // Head (sphere)
  const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const head = new THREE.Mesh(headGeometry, material);
  head.position.y = 1.3;
  head.castShadow = true;
  group.add(head);

  // Left leg
  const legGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.1);
  const leftLeg = new THREE.Mesh(legGeometry, material);
  leftLeg.position.set(-0.08, 0.25, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry, material);
  rightLeg.position.set(0.08, 0.25, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Left arm
  const armGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.08);
  const leftArm = new THREE.Mesh(armGeometry, material);
  leftArm.position.set(-0.25, 0.85, 0);
  leftArm.rotation.z = 0.3;
  leftArm.castShadow = true;
  group.add(leftArm);

  // Right arm (sword arm - will be animated)
  const rightArm = new THREE.Mesh(armGeometry, material);
  rightArm.position.set(0.25, 0.85, 0);
  rightArm.rotation.z = -0.3;
  rightArm.castShadow = true;
  rightArm.name = 'swordArm';
  group.add(rightArm);

  // Sword (attached to right arm)
  const swordGroup = new THREE.Group();
  swordGroup.name = 'sword';

  // Blade
  const bladeGeometry = new THREE.BoxGeometry(0.04, 0.7, 0.02);
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.2,
    metalness: 0.8,
  });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.y = 0.35;
  blade.castShadow = true;
  swordGroup.add(blade);

  // Hilt
  const hiltGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.04);
  const hiltMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.6,
  });
  const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
  hilt.position.y = 0;
  swordGroup.add(hilt);

  swordGroup.position.set(0.4, 0.7, 0);
  group.add(swordGroup);

  return group;
}

/**
 * Create an enemy entity with all required components
 */
export function createEnemy(
  world: World,
  x: number,
  y: number,
  type: EnemyType,
  facingRight: boolean
): Entity {
  const entity = world.createEntity();
  const enemyData = ENEMIES[type];

  // Transform component - position in 3D space
  entity.addComponent({
    type: 'transform',
    x,
    y,
    z: 0,
    rotation: 0,
    scale: { x: 1, y: 1, z: 1 },
  });

  // Velocity component - physics movement
  entity.addComponent({
    type: 'velocity',
    vx: 0,
    vy: 0,
    vz: 0,
  });

  // Collider component - hitbox
  entity.addComponent({
    type: 'collider',
    width: 0.6,
    height: 1.5,
    depth: 0.3,
    offsetX: 0,
    offsetY: 0.75,
    layer: CollisionLayer.ENEMY,
    mask: CollisionLayer.PLATFORM | CollisionLayer.PLAYER | CollisionLayer.HAZARD,
  });

  // Fencer component - fencing combat state
  entity.addComponent({
    type: 'fencer',
    swordPosition: 'mid',
    isLunging: false,
    lungeFrame: 0,
    canParry: true,
    disarmWindow: 0,
    facingRight,
  });

  // Weapon component - currently held weapon
  entity.addComponent({
    type: 'weapon',
    weaponType: enemyData.weapon,
    attackCooldown: 0,
    isAttacking: false,
    attackPhase: 'idle',
    attackFrame: 0,
  });

  // Health component
  entity.addComponent({
    type: 'health',
    current: enemyData.hp,
    max: enemyData.hp,
    invincibilityFrames: 0,
    isKnockedDown: false,
    knockdownFrames: 0,
  });

  // AI component - enemy behavior
  entity.addComponent({
    type: 'ai',
    aiType: type,
    state: 'idle',
    targetEntityId: null,
    detectionRange: enemyData.detectionRange,
    attackRange: enemyData.attackRange,
    decisionCooldown: 0,
  });

  // ThreeObject component - Three.js mesh
  const mesh = createEnemyMesh();
  mesh.position.set(x, y, 0);
  if (!facingRight) {
    mesh.scale.x = -1;
  }
  entity.addComponent({
    type: 'threeObject',
    object: mesh,
  });

  // Notify systems that entity is fully configured
  world.notifyEntityReady(entity);

  log(`Created enemy: type=${type}, pos=(${x}, ${y}), facingRight=${facingRight}, hp=${enemyData.hp}, id=${entity.id}`);

  return entity;
}

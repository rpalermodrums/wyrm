/**
 * GhostSystem - Creates and manages ghost trails for dash/roll
 *
 * Spawns ghost entities when player is rolling.
 * Fades out and destroys ghost entities over time.
 */

import * as THREE from 'three';
import type {
  System,
  Entity,
  World,
  TransformComponent,
  PlayerControlledComponent,
  ThreeObjectComponent,
  GhostComponent,
} from '../types';
import { SYSTEM_PRIORITY } from '../constants';

const GHOST_SPAWN_INTERVAL = 3; // Frames between ghost spawns
const GHOST_DURATION = 15; // Frames to fade out
const GHOST_START_OPACITY = 0.5;

export class GhostSystem implements System {
  readonly name = 'GhostSystem';
  // We need to query players to spawn ghosts, and ghosts to update them
  // Since we can't express "OR" in requiredComponents easily for the main update loop if we rely on the World to pass filtered entities,
  // we will query manually inside update.
  // But standard ECS pattern in this codebase seems to pass entities.
  // However, World.update() passes `query(system.requiredComponents)`.
  // If we set requiredComponents to [], we get all entities? No, we get entities that have ALL components.
  // If we set it to [], we get all entities?
  // Let's look at World.ts: `if (entity.hasComponents(componentTypes))`
  // If componentTypes is empty, `hasComponents` returns true (every entity has "no components" subset).
  // So we can set requiredComponents to [] and filter inside.
  readonly requiredComponents = [] as const;
  readonly priority = SYSTEM_PRIORITY.Animation;

  private world: World | null = null;
  private frameCount = 0;

  setWorld(world: World): void {
    this.world = world;
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    if (!this.world) return;

    this.frameCount++;

    // 1. Handle Ghost Spawning (from players)
    // Filter for players explicitly
    const players = entities.filter(e => e.hasComponent('playerControlled'));
    
    for (const player of players) {
      const playerCtrl = player.getComponent<PlayerControlledComponent>('playerControlled');
      const transform = player.getComponent<TransformComponent>('transform');
      const threeObj = player.getComponent<ThreeObjectComponent>('threeObject');

      if (!playerCtrl || !transform || !threeObj) continue;

      // Only spawn ghosts when rolling
      if (playerCtrl.isRolling) {
        if (this.frameCount % GHOST_SPAWN_INTERVAL === 0) {
          this.spawnGhost(transform, threeObj.object);
        }
      }
    }

    // 2. Handle Ghost Updates (fading)
    // Filter for ghosts explicitly
    const ghosts = entities.filter(e => e.hasComponent('ghost'));
    
    for (const ghost of ghosts) {
      this.updateGhost(ghost);
    }
  }

  private spawnGhost(transform: TransformComponent, originalMesh: THREE.Object3D): void {
    if (!this.world) return;

    const ghostEntity = this.world.createEntity();

    // Clone the mesh
    // We need to clone materials to modify opacity independently
    const ghostMesh = originalMesh.clone();
    
    ghostMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone material
        if (Array.isArray(child.material)) {
            child.material = child.material.map(m => m.clone());
            child.material.forEach((m: THREE.Material) => {
                m.transparent = true;
                m.opacity = GHOST_START_OPACITY;
            });
        } else {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = GHOST_START_OPACITY;
        }
      }
    });

    // Add components
    // Use originalMesh.scale which has the correct facing direction baked in
    // (transform.scale doesn't include the fencer facing flip)
    ghostEntity.addComponent({
      type: 'transform',
      x: transform.x,
      y: transform.y,
      z: transform.z,
      rotation: transform.rotation,
      scale: {
        x: originalMesh.scale.x,
        y: originalMesh.scale.y,
        z: originalMesh.scale.z
      },
    });

    ghostEntity.addComponent({
      type: 'threeObject',
      object: ghostMesh,
    });

    ghostEntity.addComponent({
      type: 'ghost',
      life: GHOST_DURATION,
      maxLife: GHOST_DURATION,
      opacity: GHOST_START_OPACITY,
    });

    this.world.notifyEntityReady(ghostEntity);
  }

  private updateGhost(entity: Entity): void {
    const ghost = entity.getComponent<GhostComponent>('ghost');
    const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');

    if (!ghost || !threeObj) return;

    ghost.life--;

    if (ghost.life <= 0) {
      if (this.world) {
        this.world.destroyEntity(entity.id);
      }
      return;
    }

    // Update opacity
    const ratio = ghost.life / ghost.maxLife;
    const newOpacity = ghost.opacity * ratio;

    threeObj.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.opacity = newOpacity);
        } else {
            child.material.opacity = newOpacity;
        }
      }
    });
  }
}

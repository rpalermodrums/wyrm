/**
 * RenderSystem - Syncs Three.js objects with transform components
 *
 * Updates Three.js object positions from entity transforms.
 * Handles animation mixer updates.
 */

import type {
  System,
  Entity,
  TransformComponent,
  ThreeObjectComponent,
  FencerComponent,
} from '../types';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import type { EventBus } from '../core/Events';
import { SYSTEM_PRIORITY } from '../constants';
import * as THREE from 'three';

const DEBUG = true;
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[RenderSystem] ${msg}`, ...args);
};

export class RenderSystem implements System {
  readonly name = 'RenderSystem';
  readonly requiredComponents = ['transform', 'threeObject'] as const;
  readonly priority = SYSTEM_PRIORITY.Render;

  private flashMap = new Map<string, number>();
  private squashMap = new Map<string, { current: number, duration: number }>();
  private originalMaterials = new Map<string, THREE.Material | THREE.Material[]>();
  private flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  constructor(
    private readonly renderer: ThreeRenderer,
    private readonly events: EventBus
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on('entityHit', (event) => {
      this.triggerFlash(event.entityId);
    });

    this.events.on('entityLand', (event) => {
      this.triggerSquash(event.entityId);
    });
  }

  private triggerFlash(entityId: string): void {
    this.flashMap.set(entityId, 5);
  }

  private triggerSquash(entityId: string): void {
    this.squashMap.set(entityId, { current: 0, duration: 10 });
  }

  update(entities: readonly Entity[], deltaTime: number): void {
    // Handle flashes
    this.updateFlashes(entities);
    
    // Handle squash
    this.updateSquash(entities);

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
      if (!transform || !threeObj) continue;

      // Update Three.js object position from transform
      threeObj.object.position.set(transform.x, transform.y, transform.z);

      // Handle facing direction for entities with fencer component
      const fencer = entity.getComponent<FencerComponent>('fencer');
      
      // Apply squash scale if active
      const squash = this.squashMap.get(entity.id);
      let squashScaleX = 1;
      let squashScaleY = 1;
      
      if (squash) {
          // Squash animation: Squash down (Y < 1, X > 1) then stretch up (Y > 1, X < 1) then settle
          const t = squash.current / squash.duration; // 0 to 1
          // Simple sin wave for bounce
          const strength = 0.3 * (1 - t);
          squashScaleY = 1 - Math.sin(t * Math.PI * 2) * strength;
          squashScaleX = 1 + Math.sin(t * Math.PI * 2) * strength;
      }

      if (fencer) {
        threeObj.object.scale.x = (fencer.facingRight ? 1 : -1) * squashScaleX;
        threeObj.object.scale.y = squashScaleY;
      } else {
        threeObj.object.scale.set(
          transform.scale.x * squashScaleX,
          transform.scale.y * squashScaleY,
          transform.scale.z
        );
      }

      // Update rotation
      threeObj.object.rotation.y = transform.rotation;

      // Update animation mixer if present
      if (threeObj.mixer) {
        threeObj.mixer.update(deltaTime / 1000);
      }
    }
  }

  private updateSquash(_entities: readonly Entity[]): void {
      for (const [entityId, data] of this.squashMap.entries()) {
          data.current++;
          if (data.current >= data.duration) {
              this.squashMap.delete(entityId);
          }
      }
  }

  private updateFlashes(entities: readonly Entity[]): void {
    for (const [entityId, frames] of this.flashMap.entries()) {
      if (frames <= 0) {
        this.flashMap.delete(entityId);
        const entity = entities.find(e => e.id === entityId);
        if (entity) {
          const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
          if (threeObj && threeObj.object instanceof THREE.Mesh) {
            // Use object.uuid to match how materials are stored (not entityId)
            const original = this.originalMaterials.get(threeObj.object.uuid);
            if (original) {
              threeObj.object.material = original;
              this.originalMaterials.delete(threeObj.object.uuid);
            }
          } else if (threeObj) {
             threeObj.object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const original = this.originalMaterials.get(child.uuid);
                    if (original) {
                        child.material = original;
                        this.originalMaterials.delete(child.uuid);
                    }
                }
             });
          }
        }
        continue;
      }

      const entity = entities.find(e => e.id === entityId);
      if (entity) {
        const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
        if (threeObj) {
            threeObj.object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (!this.originalMaterials.has(child.uuid)) {
                        this.originalMaterials.set(child.uuid, child.material);
                        child.material = this.flashMaterial;
                    }
                }
            });
        }
      }

      this.flashMap.set(entityId, frames - 1);
    }
  }

  onEntityAdded(entity: Entity): void {
    const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
    log(`onEntityAdded called for entity ${entity.id}, hasThreeObj=${!!threeObj}`);
    if (threeObj) {
      this.renderer.add(threeObj.object);
      log(`Added object to scene for entity ${entity.id}`);
    }
  }

  onEntityRemoved(entity: Entity): void {
    const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
    if (threeObj) {
      // Stop any animations
      if (threeObj.mixer) {
        threeObj.mixer.stopAllAction();
      }
      // Remove from scene
      this.renderer.remove(threeObj.object);
    }
  }
}

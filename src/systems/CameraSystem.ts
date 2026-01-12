/**
 * CameraSystem - Camera following with deadzone
 *
 * Smoothly follows the player with a deadzone to avoid jittery movement.
 */

import type {
  System,
  Entity,
  TransformComponent,
  VelocityComponent,
} from '../types';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { SYSTEM_PRIORITY, CAMERA_DEADZONE_LEFT, CAMERA_DEADZONE_RIGHT } from '../constants';

const DEBUG = false; // Set to true for camera debugging
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[CameraSystem] ${msg}`, ...args);
};

export class CameraSystem implements System {
  readonly name = 'CameraSystem';
  readonly requiredComponents = ['transform', 'playerControlled', 'velocity'] as const;
  readonly priority = SYSTEM_PRIORITY.Camera;

  private cameraX = 0;
  private cameraY = 0;
  private targetCameraX: number | null = null;
  private targetCameraY: number | null = null;
  private readonly panSpeed = 0.05;
  private lookAheadOffset = 0;

  constructor(private readonly renderer: ThreeRenderer) {}

  update(entities: readonly Entity[], _deltaTime: number): void {
    // Handle panning if a target is set
    if (this.targetCameraX !== null && this.targetCameraY !== null) {
      const dx = this.targetCameraX - this.cameraX;
      const dy = this.targetCameraY - this.cameraY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 0.1) {
        // Close enough, snap to target and clear
        this.cameraX = this.targetCameraX;
        this.cameraY = this.targetCameraY;
        this.targetCameraX = null;
        this.targetCameraY = null;
      } else {
        // Smoothly pan toward target
        this.cameraX += dx * this.panSpeed;
        this.cameraY += dy * this.panSpeed;
      }

      this.renderer.setCameraTarget(this.cameraX, this.cameraY);
      return; // Skip normal follow during pan
    }

    // Find the player
    const player = entities[0]; // Should only be one player
    if (!player) return;

    const transform = player.getComponent<TransformComponent>('transform');
    const velocity = player.getComponent<VelocityComponent>('velocity');
    if (!transform) return;

    // Calculate camera position with deadzone
    // Deadzone keeps player in a certain range on screen before camera moves
    const viewWidth = 20; // Approximate visible width in world units
    const leftBound = this.cameraX - viewWidth * (0.5 - CAMERA_DEADZONE_LEFT);
    const rightBound = this.cameraX + viewWidth * (CAMERA_DEADZONE_RIGHT - 0.5);

    // Move camera if player exits deadzone
    if (transform.x < leftBound) {
      this.cameraX = transform.x + viewWidth * (0.5 - CAMERA_DEADZONE_LEFT);
    } else if (transform.x > rightBound) {
      this.cameraX = transform.x - viewWidth * (CAMERA_DEADZONE_RIGHT - 0.5);
    }

    // Apply look-ahead
    if (velocity) {
      const targetOffset = velocity.vx * 15; // Scale velocity to offset
      this.lookAheadOffset += (targetOffset - this.lookAheadOffset) * 0.05;
    }

    // Smooth vertical follow
    const targetY = transform.y;
    this.cameraY += (targetY - this.cameraY) * 0.1;

    // Update renderer camera
    this.renderer.setCameraTarget(this.cameraX + this.lookAheadOffset, this.cameraY);
  }

  /**
   * Immediately snap camera to a position (for level transitions, etc.)
   */
  snapTo(x: number, y: number): void {
    log(`Snapping to (${x.toFixed(2)}, ${y.toFixed(2)})`);
    this.cameraX = x;
    this.cameraY = y;
    this.targetCameraX = null;
    this.targetCameraY = null;
    this.renderer.setCameraTarget(this.cameraX, this.cameraY);
  }

  /**
   * Smoothly pan camera to a target position (for screen transitions)
   */
  panTo(x: number, y: number): void {
    log(`Panning to (${x.toFixed(2)}, ${y.toFixed(2)})`);
    this.targetCameraX = x;
    this.targetCameraY = y;
  }
}

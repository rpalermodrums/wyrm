/**
 * FencingSystem - Sword position tracking and visual updates
 *
 * Handles sword position changes based on input (high/mid/low)
 * and animates the sword mesh rotation to match.
 */

import type {
  System,
  Entity,
  FencerComponent,
  WeaponComponent,
  ThreeObjectComponent,
} from '../types';
import { SYSTEM_PRIORITY } from '../constants';
import { InputManager } from '../input/InputManager';

const DEBUG = false; // Set to true for fencing debugging
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[FencingSystem] ${msg}`, ...args);
};

/**
 * Sword rotation angles in radians for each position
 */
const SWORD_ANGLES = {
  high: -0.7,
  mid: 0,
  low: 0.7,
} as const;

export class FencingSystem implements System {
  readonly name = 'FencingSystem';
  readonly requiredComponents = ['fencer', 'weapon', 'threeObject'] as const;
  readonly priority = SYSTEM_PRIORITY.Fencing;

  private readonly input = InputManager.getInstance();

  update(entities: readonly Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const fencer = entity.getComponent<FencerComponent>('fencer');
      const weapon = entity.getComponent<WeaponComponent>('weapon');
      const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');

      if (!fencer || !weapon || !threeObj) continue;

      // Only update input-driven sword position for player-controlled entities
      if (entity.hasComponent('playerControlled')) {
        this.updateSwordPositionFromInput(fencer);
        this.updateFacingDirection(fencer);
      }

      // Animate sword visual for all fencers
      this.animateSwordMesh(threeObj, fencer);
    }
  }

  /**
   * Determine sword position based on held input keys.
   * Up held = high, Down held = low, neither = mid.
   */
  private updateSwordPositionFromInput(fencer: FencerComponent): void {
    const swordUpHeld = this.input.isDown('swordUp');
    const swordDownHeld = this.input.isDown('swordDown');
    const previousPosition = fencer.swordPosition;

    if (swordUpHeld && !swordDownHeld) {
      fencer.swordPosition = 'high';
    } else if (swordDownHeld && !swordUpHeld) {
      fencer.swordPosition = 'low';
    } else {
      fencer.swordPosition = 'mid';
    }

    if (fencer.swordPosition !== previousPosition) {
      log(`Sword position changed: ${previousPosition} -> ${fencer.swordPosition}`);
    }
  }

  /**
   * Update facing direction based on horizontal movement input.
   */
  private updateFacingDirection(fencer: FencerComponent): void {
    const horizontal = this.input.getHorizontalAxis();

    if (horizontal > 0) {
      fencer.facingRight = true;
    } else if (horizontal < 0) {
      fencer.facingRight = false;
    }
    // If horizontal === 0, keep current facing direction
  }

  /**
   * Rotate the sword mesh to match the fencer's sword position.
   * Looks for child objects named 'sword' and 'swordArm'.
   */
  private animateSwordMesh(
    threeObj: ThreeObjectComponent,
    fencer: FencerComponent
  ): void {
    const targetAngle = SWORD_ANGLES[fencer.swordPosition];

    // Find sword mesh by name
    const sword = threeObj.object.getObjectByName('sword');
    if (sword) {
      sword.rotation.z = targetAngle;
    }

    // Find sword arm mesh by name (may also need rotation)
    const swordArm = threeObj.object.getObjectByName('swordArm');
    if (swordArm) {
      swordArm.rotation.z = targetAngle;
    }
  }
}

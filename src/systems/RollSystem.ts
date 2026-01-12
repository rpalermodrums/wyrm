/**
 * RollSystem - Player dodge/roll mechanics
 *
 * Handles roll input detection and state management.
 * Roll grants brief invincibility and allows dodging through attacks.
 * GhostSystem handles spawning ghost trails when isRolling is true.
 */

import type {
  System,
  Entity,
  PlayerControlledComponent,
  VelocityComponent,
  HealthComponent,
} from '../types';
import { ROLL_DURATION, ROLL_INVINCIBILITY } from '../constants';
import { InputManager } from '../input/InputManager';

const DEBUG = true;
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[RollSystem] ${msg}`, ...args);
};

export class RollSystem implements System {
  readonly name = 'RollSystem';
  readonly requiredComponents = ['playerControlled', 'velocity', 'health'] as const;
  readonly priority = 15;

  private readonly input = InputManager.getInstance();

  update(entities: readonly Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const playerControlled = entity.getComponent<PlayerControlledComponent>('playerControlled');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const health = entity.getComponent<HealthComponent>('health');

      if (!playerControlled || !velocity || !health) continue;

      if (health.invincibilityFrames > 0) {
        health.invincibilityFrames = Math.max(0, health.invincibilityFrames - 1);
      }

      // Handle active roll countdown
      if (playerControlled.isRolling) {
        playerControlled.rollFrames -= 1;

        if (playerControlled.rollFrames <= 0) {
          playerControlled.isRolling = false;
          playerControlled.rollFrames = 0;
          log(`Roll ended for entity ${entity.id}`);
        }
        continue;
      }

      // Check for new roll input
      if (this.input.justPressed('roll')) {
        const isMovingHorizontally = velocity.vx !== 0;
        const canRoll = playerControlled.isGrounded && isMovingHorizontally && !playerControlled.isRolling;

        if (canRoll) {
          playerControlled.isRolling = true;
          playerControlled.rollFrames = ROLL_DURATION;
          health.invincibilityFrames = ROLL_INVINCIBILITY;
          log(`Roll started for entity ${entity.id} - duration: ${ROLL_DURATION}, invincibility: ${ROLL_INVINCIBILITY}`);
        }
      }
    }
  }
}

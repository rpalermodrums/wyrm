/**
 * MovementSystem - Handles physics and player movement
 *
 * Applies gravity to entities with velocity and handles player-specific
 * movement including jumping with coyote time and jump buffer.
 */

import type {
  System,
  Entity,
  TransformComponent,
  VelocityComponent,
  PlayerControlledComponent,
  FencerComponent,
} from '../types';
import { InputManager } from '../input/InputManager';
import type { EventBus } from '../types';
import {
  GRAVITY,
  MAX_FALL_SPEED,
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  COYOTE_TIME,
  JUMP_BUFFER,
  SYSTEM_PRIORITY,
} from '../constants';

const DEBUG = false; // Set to true for movement debugging
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[MovementSystem] ${msg}`, ...args);
};

export class MovementSystem implements System {
  readonly name = 'MovementSystem';
  readonly requiredComponents = ['transform', 'velocity'] as const;
  readonly priority = SYSTEM_PRIORITY.Movement;

  private readonly input = InputManager.getInstance();

  constructor(private readonly events?: EventBus) {}

  update(entities: readonly Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      if (!transform || !velocity) continue;

      const isThrownWeapon = entity.hasComponent('thrownWeapon');

      // Check if this is a player-controlled entity
      const playerCtrl = entity.getComponent<PlayerControlledComponent>('playerControlled');
      if (playerCtrl) {
        this.handlePlayerMovement(entity, velocity, playerCtrl);
      }

      // Apply gravity to all entities with velocity (except grounded players)
      if (!playerCtrl?.isGrounded && !isThrownWeapon) {
        velocity.vy += GRAVITY;
        // Cap fall speed to prevent tunneling through platforms
        if (velocity.vy < MAX_FALL_SPEED) {
          velocity.vy = MAX_FALL_SPEED;
        }
      }

      // Apply velocity to position
      transform.x += velocity.vx;
      transform.y += velocity.vy;
    }
  }

  private handlePlayerMovement(
    entity: Entity,
    velocity: VelocityComponent,
    player: PlayerControlledComponent
  ): void {
    const fencer = entity.getComponent<FencerComponent>('fencer');

    // Horizontal movement with roll speed
    const horizontal = this.input.getHorizontalAxis();
    const rollMultiplier = player.isRolling ? 1.5 : 1.0;
    velocity.vx = horizontal * PLAYER_SPEED * rollMultiplier;

    // Update facing direction
    if (fencer && horizontal !== 0) {
      fencer.facingRight = horizontal > 0;
    }

    // Coyote time - grace period after leaving ground
    if (player.isGrounded) {
      player.coyoteFrames = COYOTE_TIME;
    } else if (player.coyoteFrames > 0) {
      player.coyoteFrames--;
    }

    // Jump buffer - remember jump input for a few frames
    if (this.input.justPressed('jump')) {
      player.jumpBufferFrames = JUMP_BUFFER;
    } else if (player.jumpBufferFrames > 0) {
      player.jumpBufferFrames--;
    }

    // Jump - execute if we have buffered jump and are in coyote time
    if (player.jumpBufferFrames > 0 && player.coyoteFrames > 0) {
      velocity.vy = PLAYER_JUMP_FORCE;
      player.jumpBufferFrames = 0;
      player.coyoteFrames = 0;
      player.isGrounded = false;
      log('Player jumped');

      // Emit jump event
      if (this.events) {
        const transform = entity.getComponent<TransformComponent>('transform');
        if (transform) {
          this.events.emit({
            type: 'entityJump',
            entityId: entity.id,
            x: transform.x,
            y: transform.y,
          });
        }
      }
    }

    // Variable jump height - release jump early for lower jump
    // Note: With Y+ up, positive vy means going up
    if (this.input.justReleased('jump') && velocity.vy > 0) {
      velocity.vy *= 0.5;
    }
  }
}

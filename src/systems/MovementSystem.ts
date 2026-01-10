import type { System, Entity, TransformComponent, VelocityComponent, PlayerControlledComponent, CombatComponent, EventBus } from '../types';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, COYOTE_TIME, PIT_DEATH_Y } from '../constants';
import { KeyboardInput } from '../input/KeyboardInput';
import { GamepadInput } from '../input/GamepadInput';

export class MovementSystem implements System {
  readonly name = 'MovementSystem';
  readonly requiredComponents = ['transform', 'velocity'] as const;
  readonly priority = 10;

  private keyboard = new KeyboardInput();
  private gamepad = new GamepadInput();

  constructor(private eventBus: EventBus) {}

  update(entities: Entity[]): void {
    this.keyboard.update();
    this.gamepad.update();

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');

      if (!transform || !velocity) continue;

      transform.prevX = transform.x;
      transform.prevY = transform.y;

      const playerControlled = entity.getComponent<PlayerControlledComponent>('playerControlled');
      const combat = entity.getComponent<CombatComponent>('combat');

      if (playerControlled) {
        this.handlePlayerMovement(entity, transform, velocity, playerControlled, combat);
      }

      velocity.vy += GRAVITY;

      transform.x += velocity.vx;
      transform.y += velocity.vy;

      if (transform.y > PIT_DEATH_Y && playerControlled) {
        this.eventBus.emit({ type: 'playerDeath', cause: 'pit' });
      }
    }
  }

  private handlePlayerMovement(
    entity: Entity,
    _transform: TransformComponent,
    velocity: VelocityComponent,
    playerControlled: PlayerControlledComponent,
    combat: CombatComponent | undefined
  ): void {
    const wasGrounded = playerControlled.grounded;
    playerControlled.grounded = this.checkGrounded(entity);

    if (!wasGrounded && playerControlled.grounded) {
      playerControlled.coyoteTime = 0;
    } else if (wasGrounded && !playerControlled.grounded) {
      playerControlled.coyoteTime = COYOTE_TIME;
    } else if (playerControlled.coyoteTime > 0) {
      playerControlled.coyoteTime--;
    }

    const canJump = (playerControlled.grounded || playerControlled.coyoteTime > 0) && playerControlled.jumpBuffer > 0;
    if (canJump) {
      velocity.vy = PLAYER_JUMP_FORCE;
      playerControlled.jumpBuffer = 0;
      playerControlled.coyoteTime = 0;
    }

    const canMove = !combat || combat.hitStun === 0;
    if (canMove) {
      const moveX = this.keyboard.getAxis('horizontal') || this.gamepad.getAxis('horizontal');
      velocity.vx = moveX * PLAYER_SPEED;
    }

    if (playerControlled.grounded && velocity.vy > 0) {
      velocity.vy = 0;
    }
  }

  private checkGrounded(_entity: Entity): boolean {
    return false;
  }

  destroy(): void {
    this.keyboard.destroy();
    this.gamepad.destroy();
  }
}

import type {
  System,
  Entity,
  PlayerControlledComponent,
  EnhancedCombatComponent,
  EnhancedWeaponComponent,
  TransformComponent,
  EventBus,
} from '../types';
import { KeyboardInput } from '../input/KeyboardInput';
import { GamepadInput } from '../input/GamepadInput';
import { JUMP_BUFFER } from '../constants';
import { canAttack, startAttack } from '../components/player/EnhancedWeapon';

export class EnhancedInputSystem implements System {
  readonly name = 'EnhancedInputSystem';
  readonly requiredComponents = ['playerControlled', 'enhancedCombat', 'enhancedWeapon'] as const;
  readonly priority = 0;

  private keyboard = new KeyboardInput();
  private gamepad = new GamepadInput();
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  update(entities: Entity[]): void {
    this.keyboard.update();
    this.gamepad.update();

    for (const entity of entities) {
      const playerControlled = entity.getComponent<PlayerControlledComponent>('playerControlled');
      const combat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');
      const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
      const transform = entity.getComponent<TransformComponent>('transform');

      if (!playerControlled || !combat || !weapon || !transform) continue;

      this.handleMovementInput(combat);
      this.handleJumpInput(playerControlled);
      this.handleAttackInput(entity, combat, weapon, transform);
      this.handleThrowInput(combat, weapon, transform);
    }
  }

  private handleMovementInput(combat: EnhancedCombatComponent): void {
    const left = this.keyboard.isDown('left') || this.gamepad.isDown('left');
    const right = this.keyboard.isDown('right') || this.gamepad.isDown('right');

    if (left && !right) {
      combat.facing = -1;
    } else if (right && !left) {
      combat.facing = 1;
    }
  }

  private handleJumpInput(playerControlled: PlayerControlledComponent): void {
    const jumpPressed = this.keyboard.isPressed('jump') || this.gamepad.isPressed('jump');

    if (jumpPressed) {
      playerControlled.jumpBuffer = JUMP_BUFFER;
    } else if (playerControlled.jumpBuffer > 0) {
      playerControlled.jumpBuffer--;
    }
  }

  private handleAttackInput(
    _entity: Entity,
    combat: EnhancedCombatComponent,
    weapon: EnhancedWeaponComponent,
    transform: TransformComponent
  ): void {
    const attackPressed = this.keyboard.isPressed('attack') || this.gamepad.isPressed('attack');
    const attackHeld = this.keyboard.isDown('attack') || this.gamepad.isDown('attack');

    if (combat.hitStun > 0 || combat.hitPauseFrames > 0) return;

    if (weapon.weaponType === 'bow' && weapon.phase === 'action') {
      if (attackHeld) {
        weapon.holdTime++;
      } else {
        weapon.holdTime = Math.max(weapon.holdTime, 1);
      }
    }

    if (attackPressed) {
      if (weapon.weaponType === null) {
        combat.attacking = true;
      } else if (canAttack(weapon)) {
        startAttack(weapon);

        if (weapon.weaponType === 'bow') {
          weapon.holdTime = 0;
        }
      }
    }

    if (weapon.weaponType === 'bow' && weapon.phase === 'impact') {
      this.events.emit({
        type: 'shootProjectile',
        x: transform.x + combat.facing * 20,
        y: transform.y,
        direction: combat.facing,
        owner: 'player',
        weapon: 'bow',
      });
    }
  }

  private handleThrowInput(
    combat: EnhancedCombatComponent,
    weapon: EnhancedWeaponComponent,
    transform: TransformComponent
  ): void {
    const throwPressed = this.keyboard.isPressed('throw') || this.gamepad.isPressed('throw');

    if (!throwPressed || weapon.weaponType === null || weapon.phase !== 'idle') return;

    const thrownType = weapon.weaponType;
    weapon.weaponType = null;
    combat.isUnarmed = true;

    this.events.emit({
      type: 'throwWeapon',
      x: transform.x + combat.facing * 15,
      y: transform.y - 5,
      direction: combat.facing,
      owner: 'player',
      weapon: thrownType,
    });
  }

  getMovementInput(): { left: boolean; right: boolean } {
    return {
      left: this.keyboard.isDown('left') || this.gamepad.isDown('left'),
      right: this.keyboard.isDown('right') || this.gamepad.isDown('right'),
    };
  }

  isPausePressed(): boolean {
    return this.keyboard.isPressed('pause') || this.gamepad.isPressed('pause');
  }

  destroy(): void {
    this.keyboard.destroy();
    this.gamepad.destroy();
  }
}

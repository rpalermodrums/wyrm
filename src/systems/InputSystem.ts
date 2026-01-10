import type { System, Entity, PlayerControlledComponent, CombatComponent, WeaponComponent } from '../types';
import { KeyboardInput } from '../input/KeyboardInput';
import { GamepadInput } from '../input/GamepadInput';
import { JUMP_BUFFER } from '../constants';

export class InputSystem implements System {
  readonly name = 'InputSystem';
  readonly requiredComponents = ['playerControlled', 'combat', 'weapon'] as const;
  readonly priority = 0;

  private keyboard = new KeyboardInput();
  private gamepad = new GamepadInput();

  update(entities: Entity[]): void {
    this.keyboard.update();
    this.gamepad.update();

    for (const entity of entities) {
      const playerControlled = entity.getComponent<PlayerControlledComponent>('playerControlled');
      const combat = entity.getComponent<CombatComponent>('combat');
      const weapon = entity.getComponent<WeaponComponent>('weapon');

      if (!playerControlled || !combat || !weapon) continue;

      const left = this.keyboard.isDown('left') || this.gamepad.isDown('left');
      const right = this.keyboard.isDown('right') || this.gamepad.isDown('right');
      const jumpPressed = this.keyboard.isPressed('jump') || this.gamepad.isPressed('jump');
      const attackPressed = this.keyboard.isPressed('attack') || this.gamepad.isPressed('attack');

      if (left && !right) {
        combat.facing = -1;
      } else if (right && !left) {
        combat.facing = 1;
      }

      if (jumpPressed) {
        playerControlled.jumpBuffer = JUMP_BUFFER;
      } else if (playerControlled.jumpBuffer > 0) {
        playerControlled.jumpBuffer--;
      }

      if (attackPressed && weapon.cooldown === 0 && combat.hitStun === 0) {
        combat.attacking = true;
        weapon.attackTimer = 0;
      }
    }
  }

  destroy(): void {
    this.keyboard.destroy();
    this.gamepad.destroy();
  }
}

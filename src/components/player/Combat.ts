import type { CombatComponent } from '../../types';

export function createCombat(): CombatComponent {
  return {
    type: 'combat',
    attacking: false,
    facing: 1,
    hitStun: 0,
  };
}

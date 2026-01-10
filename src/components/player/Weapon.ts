import type { WeaponComponent } from '../../types';
import type { WeaponType } from '../../constants';

export function createWeapon(weaponType: WeaponType): WeaponComponent {
  return {
    type: 'weapon',
    weaponType,
    cooldown: 0,
    attackTimer: 0,
  };
}

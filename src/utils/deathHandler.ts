import type { Entity } from '../ecs/Entity';
import type { EventBus } from '../core/Events';
import type { WeaponComponent } from '../types';

/**
 * Emits appropriate death events for an entity.
 * Consolidates death handling logic used by CombatSystem and ThrownWeaponSystem.
 */
export function emitDeathEvents(
  target: Entity,
  events: EventBus,
  cause: 'enemy' | 'wyrm' | 'pit' = 'enemy'
): void {
  const isPlayer = target.hasComponent('playerControlled');

  if (isPlayer) {
    events.emit({ type: 'playerDeath', cause });
  } else {
    const targetWeapon = target.getComponent<WeaponComponent>('weapon');
    const droppedWeapon = targetWeapon?.weaponType ?? 'none';
    events.emit({
      type: 'enemyDeath',
      entityId: target.id,
      droppedWeapon: droppedWeapon === 'none' ? 'rapier' : droppedWeapon,
    });
  }
}

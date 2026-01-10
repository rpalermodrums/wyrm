import type { Entity } from '../types';
import type { WeaponType } from '../constants';
import { createTransform } from '../components/player/Transform';
import { createVelocity } from '../components/player/Velocity';
import { createCollider } from '../components/player/Collider';
import { createHealth } from '../components/player/Health';
import { createEnhancedWeapon } from '../components/player/EnhancedWeapon';
import { createEnhancedCombat } from '../components/player/EnhancedCombat';
import { createPlayerControlled } from '../components/player/PlayerControlled';
import { CollisionLayer } from '../constants';

export function createEnhancedPlayer(
  world: { createEntity: () => Entity },
  x: number,
  y: number,
  weapon: WeaponType = 'rapier',
  lives = 3
): Entity {
  const entity = world.createEntity();

  entity.addComponent(createTransform(x, y));
  entity.addComponent(createVelocity());
  entity.addComponent(createCollider(24, 32, 0, 0, CollisionLayer.PLAYER, true));
  entity.addComponent(createHealth(1, 1, lives));
  entity.addComponent(createEnhancedWeapon(weapon));
  entity.addComponent(createEnhancedCombat());
  entity.addComponent(createPlayerControlled());

  return entity;
}

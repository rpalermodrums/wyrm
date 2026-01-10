import type { Entity } from '../types';
import type { WeaponType } from '../constants';
import { createTransform } from '../components/player/Transform';
import { createVelocity } from '../components/player/Velocity';
import { createCollider } from '../components/player/Collider';
import { createHealth } from '../components/player/Health';
import { createWeapon } from '../components/player/Weapon';
import { createCombat } from '../components/player/Combat';
import { createPlayerControlled } from '../components/player/PlayerControlled';
import { CollisionLayer } from '../constants';

export function createPlayer(
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
  entity.addComponent(createWeapon(weapon));
  entity.addComponent(createCombat());
  entity.addComponent(createPlayerControlled());

  return entity;
}

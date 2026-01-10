import type { Entity, World, EnemyType, WeaponType } from '../types';
import { ENEMY_TYPES, CollisionLayer } from '../constants';
import { createAI } from '../components/ai/AI';
import { createTransform } from '../components/player/Transform';
import { createVelocity } from '../components/player/Velocity';
import { createWeapon } from '../components/player/Weapon';
import { createHealth } from '../components/player/Health';
import { createCombat } from '../components/player/Combat';
import { createCollider } from '../components/player/Collider';
import { createSprite } from '../components/player/Sprite';

export const createEnemy = (
  world: World,
  x: number,
  y: number,
  enemyType: EnemyType,
  weaponOverride?: WeaponType
): Entity => {
  const entity = world.createEntity();
  const enemyData = ENEMY_TYPES[enemyType];
  const weapon = weaponOverride || enemyData.weapon;

  entity.addComponent(createTransform(x, y));
  entity.addComponent(createVelocity(0, 0));
  entity.addComponent(
    createCollider(
      20,
      32,
      0,
      0,
      CollisionLayer.ENEMY,
      true
    )
  );
  entity.addComponent(createHealth(enemyData.hp, enemyData.hp, 0));
  entity.addComponent(createWeapon(weapon));
  entity.addComponent(createCombat());
  entity.addComponent(
    createAI(
      enemyType,
      x,
      enemyData.aggroRange,
      enemyData.attackRange,
      enemyData.shootCooldown || 0
    )
  );
  entity.addComponent(createSprite('idle', '#457B9D'));

  return entity;
};

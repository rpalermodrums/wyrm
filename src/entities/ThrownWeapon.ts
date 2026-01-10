import type { World, ThrownWeaponComponent, TransformComponent, VelocityComponent, ColliderComponent } from '../types';
import type { WeaponType } from '../constants';
import { CollisionLayer, THROWN_WEAPON } from '../constants';

export function createThrownWeaponComponent(
  weaponType: WeaponType,
  owner: 'player' | 'enemy'
): ThrownWeaponComponent {
  return {
    type: 'thrownWeapon',
    weaponType,
    owner,
    distanceTraveled: 0,
    rotation: 0,
    stuck: false,
  };
}

export function createThrownWeapon(
  world: World,
  x: number,
  y: number,
  direction: 1 | -1,
  weaponType: WeaponType,
  owner: 'player' | 'enemy'
): string {
  const entity = world.createEntity();

  const transform: TransformComponent = {
    type: 'transform',
    x,
    y,
    prevX: x,
    prevY: y,
    rotation: 0,
    scale: 1,
  };

  const velocity: VelocityComponent = {
    type: 'velocity',
    vx: THROWN_WEAPON.speed * direction,
    vy: -2,
    maxSpeed: THROWN_WEAPON.speed,
  };

  const collider: ColliderComponent = {
    type: 'collider',
    width: 20,
    height: 8,
    offsetX: -10,
    offsetY: -4,
    layer: CollisionLayer.PROJECTILE,
    solid: false,
  };

  const thrownWeapon = createThrownWeaponComponent(weaponType, owner);

  entity.addComponent(transform);
  entity.addComponent(velocity);
  entity.addComponent(collider);
  entity.addComponent(thrownWeapon);

  return entity.id;
}

export function updateThrownWeapon(
  transform: TransformComponent,
  velocity: VelocityComponent,
  thrown: ThrownWeaponComponent,
  _deltaTime: number
): boolean {
  if (thrown.stuck) {
    velocity.vx = 0;
    velocity.vy = 0;
    return false;
  }

  velocity.vy += THROWN_WEAPON.gravity;

  thrown.rotation += THROWN_WEAPON.rotationSpeed * Math.sign(velocity.vx);

  const distanceThisFrame = Math.abs(velocity.vx);
  thrown.distanceTraveled += distanceThisFrame;

  if (thrown.distanceTraveled >= THROWN_WEAPON.maxDistance) {
    velocity.vx *= 0.8;
    velocity.vy += THROWN_WEAPON.gravity * 2;
  }

  transform.rotation = thrown.rotation;

  return thrown.distanceTraveled < THROWN_WEAPON.maxDistance * 1.5;
}

export function stickWeapon(thrown: ThrownWeaponComponent): void {
  thrown.stuck = true;
}

export function canPickup(thrown: ThrownWeaponComponent): boolean {
  return thrown.stuck || thrown.distanceTraveled >= THROWN_WEAPON.maxDistance;
}

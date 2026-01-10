import type { System, Entity, AIComponent, TransformComponent, VelocityComponent, WeaponComponent, CombatComponent, EventBus } from '../types';
import { ENEMY_TYPES, WEAPONS, type WeaponType } from '../constants';

export class AISystem implements System {
  readonly name = 'AISystem';
  readonly requiredComponents = ['ai', 'transform', 'velocity', 'weapon', 'combat'] as const;
  readonly priority = 20;

  constructor(private readonly eventBus: EventBus) {}

  update(entities: Entity[], _deltaTime: number): void {
    const playerEntity = this.findPlayer(entities);
    if (!playerEntity) return;

    const player = {
      transform: playerEntity.getComponent<TransformComponent>('transform')!,
      velocity: playerEntity.getComponent<VelocityComponent>('velocity')!,
      weapon: playerEntity.getComponent<WeaponComponent>('weapon')!,
    };

    for (const entity of entities) {
      if (!entity.hasComponents(this.requiredComponents as unknown as string[])) continue;

      const ai = entity.getComponent<AIComponent>('ai')!;
      const transform = entity.getComponent<TransformComponent>('transform')!;
      const velocity = entity.getComponent<VelocityComponent>('velocity')!;
      const weapon = entity.getComponent<WeaponComponent>('weapon')!;
      const combat = entity.getComponent<CombatComponent>('combat')!;

      if (combat.hitStun > 0) {
        velocity.vx = 0;
        ai.state = 'stagger';
        continue;
      }

      const enemyData = ENEMY_TYPES[ai.enemyType];
      const distanceToPlayer = Math.abs(player.transform.x - transform.x);
      const playerInRange = distanceToPlayer <= ai.aggroRange;
      const attackInRange = distanceToPlayer <= ai.attackRange;

      if (enemyData.adapts && ai.enemyType === 'elite') {
        this.handleEliteAdaptation(weapon, player.weapon.weaponType);
      }

      switch (ai.state) {
        case 'idle':
        case 'patrol':
          if (playerInRange) {
            ai.state = 'chase';
            ai.stateTimer = 0;
          } else {
            this.handlePatrol(ai, transform, velocity, enemyData);
          }
          break;

        case 'chase':
          if (!playerInRange) {
            ai.state = 'idle';
            velocity.vx = 0;
          } else if (attackInRange) {
            ai.state = 'attack';
            ai.stateTimer = 0;
          } else {
            this.handleChase(ai, transform, velocity, combat, player.transform, enemyData);
          }
          break;

        case 'attack':
          if (!attackInRange) {
            ai.state = 'chase';
            velocity.vx = 0;
          } else {
            this.handleAttack(ai, transform, velocity, weapon, combat, player.transform, this.eventBus);
          }
          break;

        case 'stagger':
          if (combat.hitStun === 0) {
            ai.state = 'idle';
            ai.stateTimer = 0;
          }
          break;
      }

      ai.stateTimer++;
    }
  }

  private findPlayer(entities: Entity[]): Entity | undefined {
    return entities.find(e => e.hasComponent('playerControlled'));
  }

  private handlePatrol(
    ai: AIComponent,
    transform: TransformComponent,
    velocity: VelocityComponent,
    enemyData: { speed: number }
  ): void {
    if (enemyData.speed === 0) {
      velocity.vx = 0;
      return;
    }

    const patrolRange = 100;
    const leftBound = ai.homeX - patrolRange;
    const rightBound = ai.homeX + patrolRange;

    if (transform.x <= leftBound) ai.patrolDir = 1;
    if (transform.x >= rightBound) ai.patrolDir = -1;

    velocity.vx = ai.patrolDir * enemyData.speed * 0.5;
    ai.state = 'patrol';
  }

  private handleChase(
    _ai: AIComponent,
    transform: TransformComponent,
    velocity: VelocityComponent,
    combat: CombatComponent,
    playerTransform: TransformComponent,
    enemyData: { speed: number }
  ): void {
    if (enemyData.speed === 0) {
      velocity.vx = 0;
      return;
    }

    const direction = Math.sign(playerTransform.x - transform.x);
    velocity.vx = direction * enemyData.speed;
    combat.facing = direction as 1 | -1;
  }

  private handleAttack(
    ai: AIComponent,
    transform: TransformComponent,
    velocity: VelocityComponent,
    weapon: WeaponComponent,
    combat: CombatComponent,
    playerTransform: TransformComponent,
    eventBus: EventBus
  ): void {
    velocity.vx = 0;
    const direction = Math.sign(playerTransform.x - transform.x);
    combat.facing = direction as 1 | -1;

    const weaponData = WEAPONS[weapon.weaponType];

    if (ai.enemyType === 'archer') {
      if (ai.shootCooldown === 0 && weapon.cooldown === 0) {
        eventBus.emit({
          type: 'shootProjectile',
          x: transform.x,
          y: transform.y,
          direction: combat.facing,
          owner: 'enemy',
          weapon: weapon.weaponType,
        });
        ai.shootCooldown = ENEMY_TYPES.archer.shootCooldown!;
        weapon.cooldown = weaponData.cooldown;
      }

      if (ai.shootCooldown > 0) ai.shootCooldown--;
      if (weapon.cooldown > 0) weapon.cooldown--;
    } else {
      if (weapon.cooldown === 0) {
        combat.attacking = true;
        weapon.cooldown = weaponData.cooldown;
        weapon.attackTimer = weaponData.speed;
      }

      if (weapon.cooldown > 0) weapon.cooldown--;
      if (weapon.attackTimer > 0) {
        weapon.attackTimer--;
        if (weapon.attackTimer === 0) {
          combat.attacking = false;
        }
      }
    }
  }

  private handleEliteAdaptation(weapon: WeaponComponent, playerWeapon: WeaponType): void {
    const counterWeapon: Record<WeaponType, WeaponType> = {
      rapier: 'broadsword',
      broadsword: 'bow',
      bow: 'rapier',
    };

    const desiredWeapon = counterWeapon[playerWeapon];
    if (weapon.weaponType !== desiredWeapon) {
      weapon.weaponType = desiredWeapon;
      weapon.cooldown = 0;
      weapon.attackTimer = 0;
    }
  }
}

import type { System, Entity, TransformComponent, CombatComponent, WeaponComponent, HealthComponent, VelocityComponent, EventBus } from '../types';
import type { WeaponType } from '../constants';
import { WEAPONS, WEAPON_CYCLE_ORDER } from '../constants';

export class CombatSystem implements System {
  readonly name = 'CombatSystem';
  readonly requiredComponents = ['transform', 'combat', 'weapon', 'health'] as const;
  readonly priority = 20;

  constructor(private eventBus: EventBus) {}

  update(entities: Entity[]): void {
    for (const entity of entities) {
      const combat = entity.getComponent<CombatComponent>('combat');
      const weapon = entity.getComponent<WeaponComponent>('weapon');
      const health = entity.getComponent<HealthComponent>('health');

      if (!combat || !weapon || !health) continue;

      if (combat.hitStun > 0) {
        combat.hitStun--;
      }

      if (weapon.cooldown > 0) {
        weapon.cooldown--;
      }

      if (health.iframes > 0) {
        health.iframes--;
      }

      if (combat.attacking) {
        weapon.attackTimer++;
        const weaponData = WEAPONS[weapon.weaponType];

        if (weaponData.isRanged && weapon.attackTimer === 1) {
          const transform = entity.getComponent<TransformComponent>('transform');
          if (transform) {
            const isPlayer = entity.hasComponent('playerControlled');
            this.eventBus.emit({
              type: 'shootProjectile',
              x: transform.x,
              y: transform.y,
              direction: combat.facing,
              owner: isPlayer ? 'player' : 'enemy',
              weapon: weapon.weaponType,
            });
          }
        }

        if (weapon.attackTimer >= weaponData.speed) {
          combat.attacking = false;
          weapon.attackTimer = 0;
          weapon.cooldown = weaponData.cooldown;
        }
      }
    }

    this.resolveClashes(entities);
  }

  private resolveClashes(entities: Entity[]): void {
    const attacking = entities.filter(e => {
      const combat = e.getComponent<CombatComponent>('combat');
      return combat?.attacking && !WEAPONS[e.getComponent<WeaponComponent>('weapon')!.weaponType].isRanged;
    });

    for (let i = 0; i < attacking.length; i++) {
      for (let j = i + 1; j < attacking.length; j++) {
        const e1 = attacking[i];
        const e2 = attacking[j];
        if (!e1 || !e2) continue;

        if (this.checkMeleeCollision(e1, e2)) {
          this.resolveCombat(e1, e2);
        }
      }
    }
  }

  private checkMeleeCollision(e1: Entity, e2: Entity): boolean {
    const t1 = e1.getComponent<TransformComponent>('transform');
    const t2 = e2.getComponent<TransformComponent>('transform');
    const w1 = e1.getComponent<WeaponComponent>('weapon');
    const w2 = e2.getComponent<WeaponComponent>('weapon');

    if (!t1 || !t2 || !w1 || !w2) return false;

    const range1 = WEAPONS[w1.weaponType].range;
    const range2 = WEAPONS[w2.weaponType].range;

    const dx = Math.abs(t1.x - t2.x);
    const dy = Math.abs(t1.y - t2.y);

    return dx <= Math.max(range1, range2) && dy <= 40;
  }

  private resolveCombat(e1: Entity, e2: Entity): void {
    const w1 = e1.getComponent<WeaponComponent>('weapon')!;
    const w2 = e2.getComponent<WeaponComponent>('weapon')!;

    const winner = this.determineWinner(w1.weaponType, w2.weaponType);

    if (winner === 0) {
      this.applyClash(e1);
      this.applyClash(e2);
      const t1 = e1.getComponent<TransformComponent>('transform');
      if (t1) {
        this.eventBus.emit({ type: 'clash', x: t1.x, y: t1.y });
      }
    } else if (winner === 1) {
      this.applyHit(e1, e2);
    } else {
      this.applyHit(e2, e1);
    }
  }

  private determineWinner(w1: WeaponType, w2: WeaponType): number {
    const p1 = WEAPONS[w1].priority;
    const p2 = WEAPONS[w2].priority;

    if (WEAPONS[w1].losesTo === w2) return -1;
    if (WEAPONS[w2].losesTo === w1) return 1;

    if (p1 === p2) return 0;
    return p1 > p2 ? 1 : -1;
  }

  private applyClash(entity: Entity): void {
    const combat = entity.getComponent<CombatComponent>('combat')!;
    const weapon = entity.getComponent<WeaponComponent>('weapon')!;

    combat.attacking = false;
    weapon.attackTimer = 0;
    combat.hitStun = 15;
    weapon.cooldown = WEAPONS[weapon.weaponType].cooldown;
  }

  private applyHit(attacker: Entity, defender: Entity): void {
    const attackerWeapon = attacker.getComponent<WeaponComponent>('weapon')!;
    const attackerCombat = attacker.getComponent<CombatComponent>('combat')!;
    const attackerTransform = attacker.getComponent<TransformComponent>('transform')!;

    const defenderHealth = defender.getComponent<HealthComponent>('health')!;
    const defenderCombat = defender.getComponent<CombatComponent>('combat')!;
    const defenderVelocity = defender.getComponent<VelocityComponent>('velocity');
    const defenderTransform = defender.getComponent<TransformComponent>('transform')!;

    attackerCombat.attacking = false;
    attackerWeapon.attackTimer = 0;
    attackerWeapon.cooldown = WEAPONS[attackerWeapon.weaponType].cooldown;

    if (defenderHealth.iframes === 0) {
      const weaponData = WEAPONS[attackerWeapon.weaponType];
      defenderHealth.current -= weaponData.damage;
      defenderHealth.iframes = 60;

      defenderCombat.attacking = false;
      defenderCombat.hitStun = 20;

      if (defenderVelocity) {
        const direction = defenderTransform.x > attackerTransform.x ? 1 : -1;
        defenderVelocity.vx = direction * weaponData.knockback;
        defenderVelocity.vy = -weaponData.knockback * 0.5;
      }

      if (defenderHealth.current <= 0) {
        if (defender.hasComponent('playerControlled')) {
          defenderHealth.lives--;
          if (defenderHealth.lives > 0) {
            defenderHealth.current = defenderHealth.max;
            this.eventBus.emit({ type: 'playerDeath', cause: 'hit' });
          } else {
            this.eventBus.emit({ type: 'gameOver' });
          }
        } else {
          this.eventBus.emit({ type: 'enemyDeath', enemyId: defender.id });
          if (attacker.hasComponent('playerControlled')) {
            this.cycleWeapon(attacker);
          }
        }
      }
    }
  }

  private cycleWeapon(entity: Entity): void {
    const weapon = entity.getComponent<WeaponComponent>('weapon');
    if (!weapon) return;

    const currentIndex = WEAPON_CYCLE_ORDER.indexOf(weapon.weaponType);
    const nextIndex = (currentIndex + 1) % WEAPON_CYCLE_ORDER.length;
    const nextWeapon = WEAPON_CYCLE_ORDER[nextIndex];
    if (nextWeapon) {
      weapon.weaponType = nextWeapon;
    }

    this.eventBus.emit({ type: 'weaponCycle', newWeapon: weapon.weaponType });
  }
}

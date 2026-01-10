import type {
  Entity,
  System,
  TransformComponent,
  HealthComponent,
  EnhancedWeaponComponent,
  EnhancedCombatComponent,
  EventBus,
  World,
  ThrownWeaponComponent,
  VelocityComponent,
} from '../types';
import {
  WEAPONS,
  ATTACK_FRAME_DATA,
  WEAPON_CYCLE_ORDER,
  HIT_PAUSE_FRAMES,
} from '../constants';
import type { WeaponType } from '../constants';
import {
  startAttack,
  advancePhase,
  endAttack,
  isInDamagePhase,
  canAttack,
} from '../components/player/EnhancedWeapon';
import { applyHitPause, updateHitPause, setUnarmed } from '../components/player/EnhancedCombat';
import { createThrownWeapon, updateThrownWeapon, canPickup } from '../entities/ThrownWeapon';
import { CombatEffects } from '../effects/CombatEffects';

export class EnhancedCombatSystem implements System {
  readonly name = 'EnhancedCombatSystem';
  readonly requiredComponents = ['transform', 'enhancedCombat', 'enhancedWeapon', 'health'] as const;
  readonly priority = 20;

  private events: EventBus;
  private world: World;
  private combatEffects: CombatEffects;

  constructor(events: EventBus, world: World) {
    this.events = events;
    this.world = world;
    this.combatEffects = new CombatEffects(events);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on('throwWeapon', (event) => {
      createThrownWeapon(
        this.world,
        event.x,
        event.y,
        event.direction,
        event.weapon,
        event.owner
      );
    });

    this.events.on('weaponPickup', (event) => {
      const entity = this.world.getEntity(event.entityId);
      if (!entity) return;

      const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
      const combat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');
      if (weapon && combat) {
        weapon.weaponType = event.weapon;
        weapon.isThrown = false;
        setUnarmed(combat, false);
      }
    });
  }

  update(entities: Entity[], _deltaTime: number): void {
    const isHitPaused = this.combatEffects.update();
    if (isHitPaused) return;

    for (const entity of entities) {
      this.updateEntity(entity);
    }

    this.updateThrownWeapons();
    this.resolveClashes(entities);
    this.checkWeaponPickups(entities);
  }

  private updateEntity(entity: Entity): void {
    const combat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const health = entity.getComponent<HealthComponent>('health');

    if (!combat || !weapon || !health) return;

    if (updateHitPause(combat)) return;

    if (weapon.cooldown > 0) {
      weapon.cooldown--;
    }

    if (combat.hitStun > 0) {
      combat.hitStun--;
      return;
    }

    if (health.iframes > 0) {
      health.iframes--;
    }

    setUnarmed(combat, weapon.weaponType === null);

    this.updateAttackPhase(weapon, combat);
  }

  private updateAttackPhase(weapon: EnhancedWeaponComponent, combat: EnhancedCombatComponent): void {
    if (weapon.phase === 'idle') {
      combat.attacking = false;
      return;
    }

    combat.attacking = true;
    weapon.phaseTimer++;

    if (weapon.weaponType === null) return;

    const frameData = ATTACK_FRAME_DATA[weapon.weaponType];
    const currentPhaseDuration = this.getPhaseDuration(weapon.phase, frameData, weapon);

    if (weapon.phaseTimer >= currentPhaseDuration) {
      this.transitionToNextPhase(weapon, frameData);
    }
  }

  private getPhaseDuration(
    phase: string,
    frameData: typeof ATTACK_FRAME_DATA.rapier,
    weapon: EnhancedWeaponComponent
  ): number {
    switch (phase) {
      case 'anticipation':
        return frameData.anticipation;
      case 'action':
        if (weapon.weaponType === 'bow') {
          return weapon.holdTime > 0 ? weapon.holdTime : 1;
        }
        return frameData.action;
      case 'impact':
        return frameData.impact;
      case 'recovery':
        return frameData.recovery;
      default:
        return 0;
    }
  }

  private transitionToNextPhase(
    weapon: EnhancedWeaponComponent,
    _frameData: typeof ATTACK_FRAME_DATA.rapier
  ): void {
    switch (weapon.phase) {
      case 'anticipation':
        advancePhase(weapon, 'action');
        break;
      case 'action':
        advancePhase(weapon, 'impact');
        break;
      case 'impact':
        advancePhase(weapon, 'recovery');
        break;
      case 'recovery':
        endAttack(weapon, WEAPONS[weapon.weaponType!].cooldown);
        break;
    }
  }

  private updateThrownWeapons(): void {
    const thrownWeapons = this.world.query(['transform', 'velocity', 'thrownWeapon']);

    for (const entity of thrownWeapons) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const thrown = entity.getComponent<ThrownWeaponComponent>('thrownWeapon');

      if (!transform || !velocity || !thrown) continue;

      const stillActive = updateThrownWeapon(transform, velocity, thrown, 1);

      if (!stillActive || transform.y > 500) {
        this.world.destroyEntity(entity.id);
      }
    }
  }

  private resolveClashes(entities: Entity[]): void {
    const combatants = entities.filter((e) => {
      const weapon = e.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
      return weapon && isInDamagePhase(weapon) && weapon.weaponType !== null;
    });

    for (let i = 0; i < combatants.length; i++) {
      for (let j = i + 1; j < combatants.length; j++) {
        const a = combatants[i];
        const b = combatants[j];
        if (!a || !b) continue;

        if (this.checkMeleeCollision(a, b)) {
          this.handleCombatInteraction(a, b);
        }
      }
    }

    this.checkThrownWeaponHits(entities);
  }

  private checkMeleeCollision(a: Entity, b: Entity): boolean {
    const transformA = a.getComponent<TransformComponent>('transform');
    const transformB = b.getComponent<TransformComponent>('transform');
    const weaponA = a.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const weaponB = b.getComponent<EnhancedWeaponComponent>('enhancedWeapon');

    if (!transformA || !transformB || !weaponA || !weaponB) return false;
    if (!weaponA.weaponType || !weaponB.weaponType) return false;

    const rangeA = WEAPONS[weaponA.weaponType].range;
    const rangeB = WEAPONS[weaponB.weaponType].range;
    const distance = Math.abs(transformA.x - transformB.x);

    return distance < rangeA + rangeB;
  }

  private handleCombatInteraction(a: Entity, b: Entity): void {
    const weaponA = a.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const weaponB = b.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const combatA = a.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const combatB = b.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const transformA = a.getComponent<TransformComponent>('transform');
    const transformB = b.getComponent<TransformComponent>('transform');

    if (!weaponA?.weaponType || !weaponB?.weaponType || !combatA || !combatB || !transformA || !transformB) return;

    const winner = this.determineWinner(weaponA.weaponType, weaponB.weaponType);

    const clashX = (transformA.x + transformB.x) / 2;
    const clashY = (transformA.y + transformB.y) / 2;

    if (winner === 0) {
      this.events.emit({ type: 'clash', x: clashX, y: clashY });
      applyHitPause(combatA, HIT_PAUSE_FRAMES.clash);
      applyHitPause(combatB, HIT_PAUSE_FRAMES.clash);
      endAttack(weaponA, 10);
      endAttack(weaponB, 10);
    } else {
      const loser = winner === 1 ? b : a;
      const winnerEntity = winner === 1 ? a : b;
      const winnerWeapon = winner === 1 ? weaponA : weaponB;

      if (winnerWeapon.weaponType) {
        this.applyHit(loser, winnerEntity, winnerWeapon.weaponType);
      }
    }
  }

  private determineWinner(weaponA: WeaponType, weaponB: WeaponType): -1 | 0 | 1 {
    if (weaponA === weaponB) return 0;
    if (WEAPONS[weaponA].losesTo === weaponB) return -1;
    if (WEAPONS[weaponB].losesTo === weaponA) return 1;
    return 0;
  }

  private applyHit(target: Entity, attacker: Entity, weapon: WeaponType): void {
    const health = target.getComponent<HealthComponent>('health');
    const combat = target.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const transform = target.getComponent<TransformComponent>('transform');
    const velocity = target.getComponent<VelocityComponent>('velocity');
    const attackerTransform = attacker.getComponent<TransformComponent>('transform');
    const attackerCombat = attacker.getComponent<EnhancedCombatComponent>('enhancedCombat');

    if (!health || !combat || !transform) return;

    if (health.iframes > 0) return;

    const weaponData = WEAPONS[weapon];
    health.current -= weaponData.damage;
    health.iframes = 60;
    combat.hitStun = 20;

    if (attackerCombat) {
      applyHitPause(attackerCombat, HIT_PAUSE_FRAMES[weapon]);
    }

    if (velocity && attackerTransform) {
      const knockbackDir = transform.x > attackerTransform.x ? 1 : -1;
      velocity.vx = weaponData.knockback * knockbackDir;
      velocity.vy = -3;
    }

    this.events.emit({
      type: 'combatHit',
      attackerId: attacker.id,
      targetId: target.id,
      weapon,
      x: transform.x,
      y: transform.y,
    });

    if (health.current <= 0) {
      this.handleDeath(target, attacker, weapon);
    }
  }

  private handleDeath(target: Entity, attacker: Entity, _weapon: WeaponType): void {
    const isPlayer = target.hasComponent('playerControlled');

    if (isPlayer) {
      const health = target.getComponent<HealthComponent>('health');
      if (health) {
        health.lives--;
        if (health.lives <= 0) {
          this.events.emit({ type: 'gameOver' });
        } else {
          this.events.emit({ type: 'playerDeath', cause: 'hit' });
        }
      }
    } else {
      this.events.emit({ type: 'enemyDeath', enemyId: target.id });
      this.cycleAttackerWeapon(attacker);
      this.world.destroyEntity(target.id);
    }
  }

  private cycleAttackerWeapon(attacker: Entity): void {
    const weapon = attacker.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    if (!weapon || !weapon.weaponType) return;

    const currentIndex = WEAPON_CYCLE_ORDER.indexOf(weapon.weaponType);
    const nextIndex = (currentIndex + 1) % WEAPON_CYCLE_ORDER.length;
    const nextWeapon = WEAPON_CYCLE_ORDER[nextIndex];
    if (nextWeapon) {
      weapon.weaponType = nextWeapon;
      this.events.emit({ type: 'weaponCycle', newWeapon: nextWeapon });
    }
  }

  private checkThrownWeaponHits(entities: Entity[]): void {
    const thrownWeapons = this.world.query(['transform', 'thrownWeapon', 'collider']);

    for (const thrown of thrownWeapons) {
      const thrownTransform = thrown.getComponent<TransformComponent>('transform');
      const thrownComponent = thrown.getComponent<ThrownWeaponComponent>('thrownWeapon');

      if (!thrownTransform || !thrownComponent || thrownComponent.stuck) continue;

      for (const entity of entities) {
        const isPlayer = entity.hasComponent('playerControlled');
        const isValidTarget =
          (thrownComponent.owner === 'player' && !isPlayer) ||
          (thrownComponent.owner === 'enemy' && isPlayer);

        if (!isValidTarget) continue;

        const targetTransform = entity.getComponent<TransformComponent>('transform');
        if (!targetTransform) continue;

        const distance = Math.hypot(
          thrownTransform.x - targetTransform.x,
          thrownTransform.y - targetTransform.y
        );

        if (distance < 30) {
          const dummyAttacker = this.world.createEntity();
          this.applyHit(entity, dummyAttacker, thrownComponent.weaponType);
          this.world.destroyEntity(dummyAttacker.id);
          this.world.destroyEntity(thrown.id);
          break;
        }
      }
    }
  }

  private checkWeaponPickups(entities: Entity[]): void {
    const thrownWeapons = this.world.query(['transform', 'thrownWeapon']);

    for (const entity of entities) {
      const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
      const transform = entity.getComponent<TransformComponent>('transform');

      if (!weapon || !transform || weapon.weaponType !== null) continue;

      for (const thrown of thrownWeapons) {
        const thrownTransform = thrown.getComponent<TransformComponent>('transform');
        const thrownComponent = thrown.getComponent<ThrownWeaponComponent>('thrownWeapon');

        if (!thrownTransform || !thrownComponent || !canPickup(thrownComponent)) continue;

        const distance = Math.hypot(
          transform.x - thrownTransform.x,
          transform.y - thrownTransform.y
        );

        if (distance < 25) {
          this.events.emit({
            type: 'weaponPickup',
            entityId: entity.id,
            weapon: thrownComponent.weaponType,
          });
          this.world.destroyEntity(thrown.id);
          break;
        }
      }
    }
  }

  triggerAttack(entity: Entity): void {
    const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const combat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');

    if (!weapon || !combat) return;

    if (weapon.weaponType === null) {
      this.triggerUnarmedAttack(combat);
      return;
    }

    if (canAttack(weapon)) {
      startAttack(weapon);
    }
  }

  private triggerUnarmedAttack(combat: EnhancedCombatComponent): void {
    if (combat.hitStun > 0) return;
    combat.attacking = true;
  }

  triggerThrow(entity: Entity): void {
    const weapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const combat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const transform = entity.getComponent<TransformComponent>('transform');

    if (!weapon || !combat || !transform || weapon.weaponType === null) return;

    const thrownType = weapon.weaponType;
    weapon.weaponType = null;
    setUnarmed(combat, true);

    this.events.emit({
      type: 'throwWeapon',
      x: transform.x,
      y: transform.y,
      direction: combat.facing,
      owner: entity.hasComponent('playerControlled') ? 'player' : 'enemy',
      weapon: thrownType,
    });
  }

  getCombatEffects(): CombatEffects {
    return this.combatEffects;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.combatEffects.render(ctx);
  }
}

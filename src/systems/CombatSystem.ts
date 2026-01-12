/**
 * CombatSystem - Attack execution, phases, and hit detection
 *
 * Handles the attack state machine: idle -> anticipation -> active -> recovery -> idle
 * Applies lunge movement during attacks and emits combat events.
 */

import type {
  System,
  Entity,
  FencerComponent,
  WeaponComponent,
  TransformComponent,
  HealthComponent,
  AIComponent,
  PlayerControlledComponent,
  VelocityComponent,
  ThreeObjectComponent,
  World,
} from '../types';
import type { EventBus } from '../core/Events';
import { SYSTEM_PRIORITY, WEAPONS, COMBAT_DETECTION, type WeaponData } from '../constants';
import { InputManager } from '../input/InputManager';
import { emitDeathEvents } from '../utils/deathHandler';
import { createLogger } from '../utils/debug';

const log = createLogger('CombatSystem');

const LUNGE_DISTANCE = 0.5;

// Attack type for tracking special attacks
type AttackType = 'normal' | 'diveKick' | 'trip';

// Hit check result types
interface HitCheckContext {
  readonly attacker: Entity;
  readonly attackerFencer: FencerComponent;
  readonly attackerTransform: TransformComponent;
  readonly attackType: AttackType;
  readonly attackRange: number;
}

interface ValidTarget {
  readonly entity: Entity;
  readonly transform: TransformComponent;
  readonly health: HealthComponent;
  readonly fencer: FencerComponent;
  readonly isPlayer: boolean;
}

export class CombatSystem implements System {
  readonly name = 'CombatSystem';
  readonly requiredComponents = ['fencer', 'weapon', 'transform'] as const;
  readonly priority = SYSTEM_PRIORITY.Combat;

  private readonly input = InputManager.getInstance();
  private world: World | null = null;

  // Track which entities have been hit by each attacker during their current attack
  private readonly hitTargetsPerAttack = new Map<string, Set<string>>();

  // Track attack type for each attacking entity (for special attack effects)
  private readonly attackTypePerEntity = new Map<string, AttackType>();

  constructor(private readonly events: EventBus) {}

  setWorld(world: World): void {
    this.world = world;
    log('World reference set');
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    for (const entity of entities) {
      const fencer = entity.getComponent<FencerComponent>('fencer');
      const weapon = entity.getComponent<WeaponComponent>('weapon');
      const transform = entity.getComponent<TransformComponent>('transform');

      if (!fencer || !weapon || !transform) continue;
      if (weapon.weaponType === 'none') continue;

      this.updateAttackState(entity, fencer, weapon, transform);
    }
  }

  private updateAttackState(
    entity: Entity,
    fencer: FencerComponent,
    weapon: WeaponComponent,
    transform: TransformComponent
  ): void {
    const weaponData = WEAPONS[weapon.weaponType as Exclude<typeof weapon.weaponType, 'none'>];

    switch (weapon.attackPhase) {
      case 'idle':
        this.handleIdlePhase(entity, weapon);
        break;
      case 'anticipation':
        this.handleAnticipationPhase(entity, weapon, weaponData.anticipationFrames);
        break;
      case 'active':
        this.handleActivePhase(entity, fencer, weapon, transform, weaponData);
        break;
      case 'recovery':
        this.handleRecoveryPhase(entity, weapon, weaponData.recoveryFrames);
        break;
    }
  }

  private handleIdlePhase(entity: Entity, weapon: WeaponComponent): void {
    const isPlayer = entity.hasComponent('playerControlled');

    // Handle throw input for players
    if (isPlayer && this.input.justPressed('throw')) {
      if (this.tryThrowWeapon(entity, weapon)) {
        return;
      }
    }

    if (isPlayer && this.input.justPressed('attack') && weapon.attackCooldown <= 0) {
      this.startAttack(entity, weapon);
    }

    if (weapon.attackCooldown > 0) {
      weapon.attackCooldown--;
    }
  }

  private startAttack(entity: Entity, weapon: WeaponComponent): void {
    const player = entity.getComponent<PlayerControlledComponent>('playerControlled');
    const holdingDown = this.input.isDown('swordDown');

    const attackType = this.determineAttackType(player, holdingDown);
    this.attackTypePerEntity.set(entity.id, attackType);

    log(`Starting ${attackType} attack - phase: idle -> anticipation`);

    weapon.attackPhase = 'anticipation';
    weapon.attackFrame = 0;
    weapon.isAttacking = true;
  }

  private determineAttackType(
    player: PlayerControlledComponent | undefined,
    holdingDown: boolean
  ): AttackType {
    if (!player) return 'normal';

    if (!player.isGrounded && holdingDown) {
      return 'diveKick';
    }
    if (player.isGrounded && holdingDown) {
      return 'trip';
    }
    return 'normal';
  }

  private handleAnticipationPhase(
    entity: Entity,
    weapon: WeaponComponent,
    anticipationFrames: number
  ): void {
    weapon.attackFrame++;

    if (weapon.attackFrame >= anticipationFrames) {
      weapon.attackPhase = 'active';
      weapon.attackFrame = 0;
      this.hitTargetsPerAttack.set(entity.id, new Set());
    }
  }

  private handleActivePhase(
    attacker: Entity,
    fencer: FencerComponent,
    weapon: WeaponComponent,
    transform: TransformComponent,
    weaponData: WeaponData
  ): void {
    const attackType = this.attackTypePerEntity.get(attacker.id) ?? 'normal';

    if (weapon.attackFrame === 0) {
      this.applyAttackMovement(attacker, fencer, transform, attackType);
    }

    if (attackType === 'diveKick') {
      this.applyDiveKickVelocity(attacker, fencer);
    }

    this.checkHits(attacker, fencer, transform, attackType);

    weapon.attackFrame++;

    if (weapon.attackFrame >= weaponData.activeFrames) {
      weapon.attackPhase = 'recovery';
      weapon.attackFrame = 0;
    }
  }

  private applyAttackMovement(
    attacker: Entity,
    fencer: FencerComponent,
    transform: TransformComponent,
    attackType: AttackType
  ): void {
    if (attackType === 'diveKick') {
      this.applyDiveKickVelocity(attacker, fencer);
      this.events.emit({ type: 'screenShake', intensity: 5, duration: 120 });
    } else {
      const lungeDirection = fencer.facingRight ? LUNGE_DISTANCE : -LUNGE_DISTANCE;
      transform.x += lungeDirection;
      this.events.emit({ type: 'screenShake', intensity: 3, duration: 100 });
    }
  }

  private applyDiveKickVelocity(attacker: Entity, fencer: FencerComponent): void {
    const velocity = attacker.getComponent<VelocityComponent>('velocity');
    if (velocity) {
      const horizontalDir = fencer.facingRight ? 1 : -1;
      velocity.vx = COMBAT_DETECTION.DIVE_KICK_VELOCITY.vx * horizontalDir;
      velocity.vy = COMBAT_DETECTION.DIVE_KICK_VELOCITY.vy;
    }
  }

  private handleRecoveryPhase(
    entity: Entity,
    weapon: WeaponComponent,
    recoveryFrames: number
  ): void {
    weapon.attackFrame++;

    if (weapon.attackFrame >= recoveryFrames) {
      this.transitionToIdle(entity, weapon);
    }
  }

  private transitionToIdle(entity: Entity, weapon: WeaponComponent): void {
    weapon.attackPhase = 'idle';
    weapon.attackFrame = 0;
    weapon.isAttacking = false;
    this.hitTargetsPerAttack.delete(entity.id);
    this.attackTypePerEntity.delete(entity.id);
  }

  private tryThrowWeapon(entity: Entity, weapon: WeaponComponent): boolean {
    const transform = entity.getComponent<TransformComponent>('transform');
    const fencer = entity.getComponent<FencerComponent>('fencer');
    const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');

    if (!transform || !fencer || !threeObj) return false;

    const direction = fencer.facingRight ? 1 : -1;
    log(`Throwing ${weapon.weaponType} ${direction > 0 ? 'right' : 'left'}`);

    this.events.emit({
      type: 'weaponThrown',
      entityId: entity.id,
      weapon: weapon.weaponType,
      x: transform.x,
      y: transform.y,
      direction,
    });

    weapon.weaponType = 'none';

    const sword = threeObj.object.getObjectByName('sword');
    if (sword) {
      sword.visible = false;
    }

    return true;
  }

  // ============================================================================
  // Hit Detection (refactored from 185-line monolith)
  // ============================================================================

  private checkHits(
    attacker: Entity,
    attackerFencer: FencerComponent,
    attackerTransform: TransformComponent,
    attackType: AttackType = 'normal'
  ): void {
    if (!this.world) return;

    const context = this.buildHitCheckContext(attacker, attackerFencer, attackerTransform, attackType);
    const hitTargets = this.hitTargetsPerAttack.get(attacker.id) ?? new Set<string>();
    const targets = this.world.query(['transform', 'health', 'fencer']);

    for (const target of targets) {
      const validTarget = this.validateTarget(attacker, target, hitTargets);
      if (!validTarget) continue;

      if (!this.isInRange(context, validTarget)) continue;

      if (this.tryParry(context, validTarget, hitTargets)) continue;

      hitTargets.add(target.id);
      this.hitTargetsPerAttack.set(attacker.id, hitTargets);

      this.applyHitEffect(context, validTarget);
    }
  }

  private buildHitCheckContext(
    attacker: Entity,
    attackerFencer: FencerComponent,
    attackerTransform: TransformComponent,
    attackType: AttackType
  ): HitCheckContext {
    return {
      attacker,
      attackerFencer,
      attackerTransform,
      attackType,
      attackRange: this.calculateAttackRange(attacker, attackType),
    };
  }

  private calculateAttackRange(attacker: Entity, attackType: AttackType): number {
    if (attackType === 'trip') {
      return COMBAT_DETECTION.TRIP_RANGE;
    }

    const attackerAI = attacker.getComponent<AIComponent>('ai');
    if (attackerAI) {
      return attackerAI.attackRange ?? COMBAT_DETECTION.DEFAULT_MELEE_RANGE;
    }

    const attackerWeapon = attacker.getComponent<WeaponComponent>('weapon');
    if (attackerWeapon && attackerWeapon.weaponType !== 'none') {
      const weaponData = WEAPONS[attackerWeapon.weaponType];
      return weaponData.range / COMBAT_DETECTION.CANVAS_TO_THREEJS_SCALE;
    }

    return COMBAT_DETECTION.DEFAULT_MELEE_RANGE;
  }

  private validateTarget(
    attacker: Entity,
    target: Entity,
    hitTargets: Set<string>
  ): ValidTarget | null {
    if (target.id === attacker.id) return null;
    if (hitTargets.has(target.id)) return null;

    const attackerIsPlayer = attacker.hasComponent('playerControlled');
    const attackerIsEnemy = attacker.hasComponent('ai');
    const targetIsPlayer = target.hasComponent('playerControlled');
    const targetIsEnemy = target.hasComponent('ai');

    // Only hit opposite type
    if (attackerIsPlayer && !targetIsEnemy) return null;
    if (attackerIsEnemy && !targetIsPlayer) return null;

    const transform = target.getComponent<TransformComponent>('transform');
    const health = target.getComponent<HealthComponent>('health');
    const fencer = target.getComponent<FencerComponent>('fencer');

    if (!transform || !health || !fencer) return null;

    return { entity: target, transform, health, fencer, isPlayer: targetIsPlayer };
  }

  private isInRange(context: HitCheckContext, target: ValidTarget): boolean {
    const dx = target.transform.x - context.attackerTransform.x;
    const dy = target.transform.y - context.attackerTransform.y;

    // Horizontal distance check
    if (Math.abs(dx) > context.attackRange) return false;

    // Vertical distance check
    if (Math.abs(dy) > COMBAT_DETECTION.VERTICAL_HIT_TOLERANCE) return false;

    // Facing direction check
    const targetIsToRight = dx > 0;
    if (context.attackerFencer.facingRight !== targetIsToRight) return false;

    return true;
  }

  private tryParry(
    context: HitCheckContext,
    target: ValidTarget,
    hitTargets: Set<string>
  ): boolean {
    // Special attacks bypass parry
    if (context.attackType !== 'normal') return false;

    if (target.fencer.swordPosition !== context.attackerFencer.swordPosition) return false;

    log(`PARRY: attacker=${context.attacker.id}, defender=${target.entity.id}`);

    hitTargets.add(target.entity.id);
    this.hitTargetsPerAttack.set(context.attacker.id, hitTargets);

    const clashX = (context.attackerTransform.x + target.transform.x) / 2;
    const clashY = (context.attackerTransform.y + target.transform.y) / 2;

    this.events.emit({
      type: 'weaponClash',
      entityA: context.attacker.id,
      entityB: target.entity.id,
      x: clashX,
      y: clashY,
    });

    this.events.emit({
      type: 'screenShake',
      intensity: COMBAT_DETECTION.PARRY_SCREEN_SHAKE.intensity,
      duration: COMBAT_DETECTION.PARRY_SCREEN_SHAKE.duration,
    });

    return true;
  }

  private applyHitEffect(context: HitCheckContext, target: ValidTarget): void {
    switch (context.attackType) {
      case 'diveKick':
        this.applyDiveKickDisarm(target);
        break;
      case 'trip':
        this.applyTripKnockdown(target);
        break;
      default:
        this.applyDamage(context, target);
        break;
    }
  }

  private applyDiveKickDisarm(target: ValidTarget): void {
    const targetWeapon = target.entity.getComponent<WeaponComponent>('weapon');
    if (!targetWeapon || targetWeapon.weaponType === 'none') return;

    const disarmedWeapon = targetWeapon.weaponType;
    targetWeapon.weaponType = 'none';

    log(`DIVE KICK DISARM: target=${target.entity.id}, weapon=${disarmedWeapon}`);

    this.events.emit({
      type: 'disarm',
      victimId: target.entity.id,
      weapon: disarmedWeapon,
    });

    const targetThreeObj = target.entity.getComponent<ThreeObjectComponent>('threeObject');
    if (targetThreeObj) {
      const sword = targetThreeObj.object.getObjectByName('sword');
      if (sword) {
        sword.visible = false;
      }
    }

    this.events.emit({
      type: 'screenShake',
      intensity: COMBAT_DETECTION.DAMAGE_SCREEN_SHAKE.intensity,
      duration: COMBAT_DETECTION.DAMAGE_SCREEN_SHAKE.duration,
    });
  }

  private applyTripKnockdown(target: ValidTarget): void {
    target.health.isKnockedDown = true;
    target.health.knockdownFrames = COMBAT_DETECTION.KNOCKDOWN_FRAMES;

    log(`TRIP KNOCKDOWN: target=${target.entity.id}`);

    this.events.emit({ type: 'screenShake', intensity: 4, duration: 100 });
  }

  private applyDamage(context: HitCheckContext, target: ValidTarget): void {
    const attackerWeapon = context.attacker.getComponent<WeaponComponent>('weapon');
    const damage = this.calculateDamage(attackerWeapon);

    target.health.current -= damage;
    log(`HIT: target=${target.entity.id}, damage=${damage}, hp=${target.health.current}`);

    this.events.emit({
      type: 'entityHit',
      entityId: target.entity.id,
      damage,
    });

    this.events.emit({ type: 'screenShake', intensity: 5, duration: 100 });
    this.emitHitPause(attackerWeapon);

    if (target.health.current <= 0) {
      log(`DEATH: entity=${target.entity.id}`);
      emitDeathEvents(target.entity, this.events, 'enemy');
    }
  }

  private calculateDamage(attackerWeapon: WeaponComponent | undefined): number {
    if (attackerWeapon && attackerWeapon.weaponType !== 'none') {
      return WEAPONS[attackerWeapon.weaponType].damage;
    }
    return 1;
  }

  private emitHitPause(attackerWeapon: WeaponComponent | undefined): void {
    const frames = attackerWeapon && attackerWeapon.weaponType !== 'none'
      ? WEAPONS[attackerWeapon.weaponType].hitPauseFrames
      : COMBAT_DETECTION.DEFAULT_HIT_PAUSE_FRAMES;

    this.events.emit({ type: 'hitPause', frames });
  }
}

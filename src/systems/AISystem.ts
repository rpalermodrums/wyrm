import type {
  System,
  Entity,
  World,
  AIComponent,
  TransformComponent,
  VelocityComponent,
  FencerComponent,
  WeaponComponent,
  HealthComponent,
  SwordPosition,
} from '../types';
import { SYSTEM_PRIORITY, ENEMIES, AI_BEHAVIOR } from '../constants';
import { createLogger } from '../utils/debug';

const log = createLogger('AISystem');

// Destructure AI behavior constants
const {
  DECISION_COOLDOWN_FRAMES,
  RETREAT_DISTANCE,
  RETREAT_DURATION_FRAMES,
  DISENGAGE_RANGE_MULTIPLIER,
  COUNTER_PROBABILITY,
  RETREAT_SPEED_MULTIPLIER,
} = AI_BEHAVIOR;

const COUNTER_POSITIONS: Record<SwordPosition, SwordPosition> = {
  high: 'mid',
  mid: 'low',
  low: 'high',
};

export class AISystem implements System {
  readonly name = 'AISystem';
  readonly requiredComponents = ['ai', 'transform', 'velocity', 'fencer', 'weapon'] as const;
  readonly priority = SYSTEM_PRIORITY.AI;

  private world: World | null = null;

  setWorld(world: World): void {
    this.world = world;
    log('World reference set');
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    const player = this.world?.queryOne(['playerControlled', 'transform']);
    if (!player) return;

    const playerTransform = player.getComponent<TransformComponent>('transform');
    const playerFencer = player.getComponent<FencerComponent>('fencer');
    if (!playerTransform) return;

    for (const entity of entities) {
      const ai = entity.getComponent<AIComponent>('ai');
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      const fencer = entity.getComponent<FencerComponent>('fencer');
      const weapon = entity.getComponent<WeaponComponent>('weapon');
      const health = entity.getComponent<HealthComponent>('health');

      if (!ai || !transform || !velocity || !fencer || !weapon || !health) continue;
      if (ai.state === 'dead') continue;

      if (health.isKnockedDown) {
        health.knockdownFrames = Math.max(0, health.knockdownFrames - 1);
        velocity.vx = 0;
        weapon.isAttacking = false;
        weapon.attackPhase = 'idle';
        weapon.attackFrame = 0;

        if (health.knockdownFrames <= 0) {
          health.isKnockedDown = false;
          ai.state = 'idle';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }

        continue;
      }

      const distance = Math.abs(playerTransform.x - transform.x);
      const enemyConfig = ENEMIES[ai.aiType];

      if (ai.decisionCooldown > 0) {
        ai.decisionCooldown -= 1;
      }

      this.updateState(ai, distance, weapon);
      this.executeState(ai, transform, velocity, fencer, weapon, playerTransform, playerFencer, enemyConfig, distance);
    }
  }

  private updateState(
    ai: AIComponent,
    distance: number,
    weapon: WeaponComponent
  ): void {
    if (ai.decisionCooldown > 0) return;

    const enemyConfig = ENEMIES[ai.aiType];
    const previousState = ai.state;

    switch (ai.state) {
      case 'idle':
        if (distance < enemyConfig.detectionRange) {
          ai.state = 'engage';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }
        break;

      case 'patrol':
        if (distance < enemyConfig.detectionRange) {
          ai.state = 'engage';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }
        break;

      case 'engage':
        if (distance > enemyConfig.detectionRange * DISENGAGE_RANGE_MULTIPLIER) {
          ai.state = 'idle';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        } else if (distance < enemyConfig.attackRange && !weapon.isAttacking) {
          ai.state = 'attack';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }
        break;

      case 'attack':
        if (weapon.attackPhase === 'recovery') {
          ai.state = 'retreat';
          ai.decisionCooldown = RETREAT_DURATION_FRAMES;
        } else if (weapon.attackPhase === 'idle' && !weapon.isAttacking) {
          ai.state = 'engage';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }
        break;

      case 'retreat':
        if (ai.decisionCooldown <= 0) {
          ai.state = 'engage';
          ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
        }
        break;
    }

    if (ai.state !== previousState) {
      log(`State transition: ${previousState} -> ${ai.state}, distance: ${distance.toFixed(1)}`);
      // Only set default cooldown if not already set by a specific transition
      // (e.g., retreat transition sets RETREAT_DURATION_FRAMES which should be preserved)
      if (ai.decisionCooldown <= 0) {
        ai.decisionCooldown = DECISION_COOLDOWN_FRAMES;
      }
    }
  }

  private executeState(
    ai: AIComponent,
    transform: TransformComponent,
    velocity: VelocityComponent,
    fencer: FencerComponent,
    weapon: WeaponComponent,
    playerTransform: TransformComponent,
    playerFencer: FencerComponent | undefined,
    enemyConfig: typeof ENEMIES[keyof typeof ENEMIES],
    distance: number
  ): void {
    fencer.facingRight = playerTransform.x > transform.x;

    switch (ai.state) {
      case 'idle':
        velocity.vx = 0;
        break;

      case 'patrol':
        velocity.vx = 0;
        break;

      case 'engage':
        if (distance > enemyConfig.attackRange) {
          const direction = playerTransform.x > transform.x ? 1 : -1;
          velocity.vx = direction * enemyConfig.speed;
        } else {
          velocity.vx = 0;
        }

        if (playerFencer && enemyConfig.adapts) {
          fencer.swordPosition = COUNTER_POSITIONS[playerFencer.swordPosition];
        } else if (playerFencer) {
          const shouldCounter = Math.random() < COUNTER_PROBABILITY;
          if (shouldCounter) {
            fencer.swordPosition = COUNTER_POSITIONS[playerFencer.swordPosition];
          }
        }
        break;

      case 'attack':
        velocity.vx = 0;
        if (!weapon.isAttacking && weapon.attackPhase === 'idle') {
          weapon.isAttacking = true;
          weapon.attackPhase = 'anticipation';
          weapon.attackFrame = 0;
        }
        break;

      case 'retreat':
        const retreatDirection = playerTransform.x > transform.x ? -1 : 1;
        if (distance < RETREAT_DISTANCE) {
          velocity.vx = retreatDirection * enemyConfig.speed * RETREAT_SPEED_MULTIPLIER;
        } else {
          velocity.vx = 0;
        }
        break;
    }
  }
}

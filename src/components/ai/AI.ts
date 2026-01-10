import type { AIComponent, EnemyType } from '../../types';

export const createAI = (
  enemyType: EnemyType,
  homeX: number,
  aggroRange: number,
  attackRange: number,
  shootCooldown: number = 0
): AIComponent => ({
  type: 'ai',
  enemyType,
  state: 'idle',
  stateTimer: 0,
  aggroRange,
  attackRange,
  homeX,
  patrolDir: 1,
  shootCooldown,
});

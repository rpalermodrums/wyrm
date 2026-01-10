import type { EnhancedCombatComponent } from '../../types';
import { UNARMED } from '../../constants';

export function createEnhancedCombat(): EnhancedCombatComponent {
  return {
    type: 'enhancedCombat',
    attacking: false,
    facing: 1,
    hitStun: 0,
    hitPauseFrames: 0,
    isUnarmed: false,
    canDisarm: false,
    disarmWindow: 0,
  };
}

export function isInHitPause(combat: EnhancedCombatComponent): boolean {
  return combat.hitPauseFrames > 0;
}

export function applyHitPause(combat: EnhancedCombatComponent, frames: number): void {
  combat.hitPauseFrames = Math.max(combat.hitPauseFrames, frames);
}

export function updateHitPause(combat: EnhancedCombatComponent): boolean {
  if (combat.hitPauseFrames > 0) {
    combat.hitPauseFrames--;
    return true;
  }
  return false;
}

export function setUnarmed(combat: EnhancedCombatComponent, unarmed: boolean): void {
  combat.isUnarmed = unarmed;
  if (unarmed) {
    combat.canDisarm = true;
    combat.disarmWindow = UNARMED.disarmWindow;
  }
}

export function updateDisarmWindow(combat: EnhancedCombatComponent): void {
  if (combat.disarmWindow > 0) {
    combat.disarmWindow--;
    if (combat.disarmWindow === 0) {
      combat.canDisarm = false;
    }
  }
}

export function canPerformDisarm(combat: EnhancedCombatComponent): boolean {
  return combat.isUnarmed && combat.canDisarm && combat.disarmWindow > 0;
}

export function resetDisarmWindow(combat: EnhancedCombatComponent): void {
  combat.canDisarm = true;
  combat.disarmWindow = UNARMED.disarmWindow;
}

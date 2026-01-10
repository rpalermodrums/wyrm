import type { EnhancedWeaponComponent, AttackPhase } from '../../types';
import type { WeaponType } from '../../constants';

export function createEnhancedWeapon(
  weaponType: WeaponType | null = 'rapier'
): EnhancedWeaponComponent {
  return {
    type: 'enhancedWeapon',
    weaponType,
    phase: 'idle',
    phaseTimer: 0,
    cooldown: 0,
    isThrown: false,
    holdTime: 0,
  };
}

export function isAttacking(weapon: EnhancedWeaponComponent): boolean {
  return weapon.phase !== 'idle';
}

export function canAttack(weapon: EnhancedWeaponComponent): boolean {
  return weapon.phase === 'idle' && weapon.cooldown === 0 && weapon.weaponType !== null;
}

export function isInDamagePhase(weapon: EnhancedWeaponComponent): boolean {
  return weapon.phase === 'action' || weapon.phase === 'impact';
}

export function getPhaseProgress(weapon: EnhancedWeaponComponent, phaseDuration: number): number {
  if (phaseDuration === 0) return 1;
  return Math.min(1, weapon.phaseTimer / phaseDuration);
}

export function startAttack(weapon: EnhancedWeaponComponent): void {
  weapon.phase = 'anticipation';
  weapon.phaseTimer = 0;
}

export function advancePhase(weapon: EnhancedWeaponComponent, nextPhase: AttackPhase): void {
  weapon.phase = nextPhase;
  weapon.phaseTimer = 0;
}

export function endAttack(weapon: EnhancedWeaponComponent, cooldownFrames: number): void {
  weapon.phase = 'idle';
  weapon.phaseTimer = 0;
  weapon.cooldown = cooldownFrames;
  weapon.holdTime = 0;
}

export function throwWeapon(weapon: EnhancedWeaponComponent): WeaponType | null {
  if (weapon.weaponType === null) return null;
  const thrownType = weapon.weaponType;
  weapon.weaponType = null;
  weapon.isThrown = true;
  weapon.phase = 'idle';
  weapon.phaseTimer = 0;
  weapon.cooldown = 0;
  return thrownType;
}

export function pickupWeapon(weapon: EnhancedWeaponComponent, newWeapon: WeaponType): void {
  weapon.weaponType = newWeapon;
  weapon.isThrown = false;
  weapon.phase = 'idle';
  weapon.phaseTimer = 0;
}

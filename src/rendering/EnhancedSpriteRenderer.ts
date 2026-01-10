import type {
  Entity,
  TransformComponent,
  SpriteComponent,
  EnhancedCombatComponent,
  EnhancedWeaponComponent,
  CombatComponent,
  WeaponComponent,
  WyrmComponent,
  ThrownWeaponComponent,
} from '../types';
import { COLORS, WEAPONS, ATTACK_FRAME_DATA } from '../constants';
import { WeaponRenderer, type WeaponRenderState } from './WeaponRenderer';
import { getPhaseProgress, isAttacking } from '../components/player/EnhancedWeapon';

export class EnhancedSpriteRenderer {
  private weaponRenderer: WeaponRenderer;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.weaponRenderer = new WeaponRenderer();
  }

  renderStickFigure(entity: Entity, frame: number): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const sprite = entity.getComponent<SpriteComponent>('sprite');

    if (!transform || !sprite) return;

    const enhancedCombat = entity.getComponent<EnhancedCombatComponent>('enhancedCombat');
    const enhancedWeapon = entity.getComponent<EnhancedWeaponComponent>('enhancedWeapon');
    const legacyCombat = entity.getComponent<CombatComponent>('combat');
    const legacyWeapon = entity.getComponent<WeaponComponent>('weapon');

    const combat = enhancedCombat ?? legacyCombat;
    const facing = combat?.facing ?? 1;
    const hitStun = combat?.hitStun ?? 0;

    const ctx = this.ctx;
    const x = transform.x;
    const y = transform.y;

    ctx.save();
    ctx.translate(x, y);

    if (hitStun > 0) {
      ctx.translate(Math.sin(frame * 0.8) * 2, 0);
    }

    ctx.strokeStyle = sprite.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = sprite.color;
    ctx.beginPath();
    ctx.arc(0, -35, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 5);
    ctx.stroke();

    if (enhancedWeapon && enhancedCombat) {
      this.renderEnhancedArms(ctx, enhancedWeapon, enhancedCombat, sprite.color, frame);
    } else if (legacyWeapon && legacyCombat?.attacking) {
      this.renderLegacyAttackingArms(ctx, legacyWeapon, facing);
    } else {
      this.renderIdleArms(ctx, facing);
    }

    const legOffset = sprite.animation === 'running' ? Math.sin(frame * 0.3) * 8 : 0;

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-8 + legOffset, 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(8 - legOffset, 25);
    ctx.stroke();

    ctx.restore();
  }

  private renderEnhancedArms(
    ctx: CanvasRenderingContext2D,
    weapon: EnhancedWeaponComponent,
    combat: EnhancedCombatComponent,
    armColor: string,
    frame: number
  ): void {
    const facing = combat.facing;

    if (weapon.weaponType === null) {
      if (combat.attacking) {
        const punchProgress = (frame % 12) / 12;
        ctx.strokeStyle = armColor;

        ctx.beginPath();
        ctx.moveTo(0, -15);
        const punchExtend = Math.sin(punchProgress * Math.PI) * 20;
        ctx.lineTo(facing * (12 + punchExtend), -10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-facing * 8, -8);
        ctx.stroke();

        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.arc(facing * (12 + punchExtend + 4), -10, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        this.renderIdleArms(ctx, facing);
      }
      return;
    }

    const frameData = ATTACK_FRAME_DATA[weapon.weaponType];
    const phaseDuration = this.getPhaseDuration(weapon.phase, frameData);
    const phaseProgress = getPhaseProgress(weapon, phaseDuration);

    const state: WeaponRenderState = {
      weaponType: weapon.weaponType,
      phase: weapon.phase,
      phaseProgress,
      facing,
      holdTime: weapon.holdTime,
    };

    ctx.strokeStyle = armColor;
    ctx.lineWidth = 3;

    if (isAttacking(weapon)) {
      const armAngle = this.getArmAngle(weapon.weaponType, weapon.phase, phaseProgress, facing);
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(Math.cos(armAngle) * 15, -15 + Math.sin(armAngle) * 15);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(facing * 12, -10);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-facing * 8, -8);
    ctx.stroke();

    this.weaponRenderer.renderWeapon(ctx, facing * 12, -12, state);
  }

  private getArmAngle(
    weaponType: string,
    phase: string,
    progress: number,
    facing: number
  ): number {
    const baseAngle = facing === 1 ? 0 : Math.PI;

    switch (weaponType) {
      case 'rapier':
        switch (phase) {
          case 'anticipation':
            return baseAngle + facing * (Math.PI / 4 + progress * Math.PI / 4);
          case 'action':
            return baseAngle + facing * (Math.PI / 2 - progress * Math.PI / 3);
          case 'impact':
            return baseAngle + facing * Math.PI / 6;
          case 'recovery':
            return baseAngle + facing * (Math.PI / 6 - progress * Math.PI / 6);
          default:
            return baseAngle;
        }

      case 'broadsword':
        switch (phase) {
          case 'anticipation':
            return baseAngle + facing * (-Math.PI / 4 + progress * Math.PI);
          case 'action':
            return baseAngle + facing * (3 * Math.PI / 4 - progress * Math.PI);
          case 'impact':
            return baseAngle + facing * (-Math.PI / 4);
          case 'recovery':
            return baseAngle + facing * (-Math.PI / 4 + progress * Math.PI / 4);
          default:
            return baseAngle;
        }

      case 'bow':
        return baseAngle + facing * Math.PI / 8;

      default:
        return baseAngle;
    }
  }

  private getPhaseDuration(phase: string, frameData: typeof ATTACK_FRAME_DATA.rapier): number {
    switch (phase) {
      case 'anticipation':
        return frameData.anticipation;
      case 'action':
        return frameData.action || 1;
      case 'impact':
        return frameData.impact;
      case 'recovery':
        return frameData.recovery;
      default:
        return 1;
    }
  }

  private renderLegacyAttackingArms(
    ctx: CanvasRenderingContext2D,
    weapon: WeaponComponent,
    facing: number
  ): void {
    if (weapon.weaponType === null) return;
    const weaponData = WEAPONS[weapon.weaponType];
    const weaponLength = weaponData.range;
    const armX = facing * weaponLength * 0.7;
    const armY = -15;

    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    ctx.strokeStyle = weaponData.color;
    ctx.lineWidth = weaponData.width;
    ctx.beginPath();
    ctx.moveTo(armX, armY);
    ctx.lineTo(facing * weaponLength, armY);
    ctx.stroke();
  }

  private renderIdleArms(ctx: CanvasRenderingContext2D, facing: number): void {
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(facing * 12, -8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-facing * 8, -8);
    ctx.stroke();
  }

  renderWyrm(entity: Entity): void {
    const wyrmComponent = entity.getComponent<WyrmComponent>('wyrm');
    if (!wyrmComponent) return;

    const ctx = this.ctx;
    const segments = wyrmComponent.segments;

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (!segment) continue;

      const radius = i === 0 ? 25 : 15 - (i / segments.length) * 5;

      if (i === 0) {
        ctx.fillStyle = COLORS.wyrm;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(segment.x - 8, segment.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(segment.x + 8, segment.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(segment.x - 8, segment.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(segment.x + 8, segment.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gradient = ctx.createRadialGradient(
          segment.x,
          segment.y,
          0,
          segment.x,
          segment.y,
          radius
        );
        gradient.addColorStop(0, COLORS.wyrmHighlight);
        gradient.addColorStop(1, COLORS.wyrmBody);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderThrownWeapon(entity: Entity): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const thrown = entity.getComponent<ThrownWeaponComponent>('thrownWeapon');

    if (!transform || !thrown) return;

    this.weaponRenderer.renderThrownWeapon(
      this.ctx,
      transform.x,
      transform.y,
      thrown.weaponType,
      thrown.rotation
    );
  }
}

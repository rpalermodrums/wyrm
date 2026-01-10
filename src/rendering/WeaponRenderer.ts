import type { WeaponType, AttackPhase } from '../constants';
import { WEAPONS, COLORS } from '../constants';

export interface WeaponRenderState {
  weaponType: WeaponType;
  phase: AttackPhase;
  phaseProgress: number;
  facing: 1 | -1;
  holdTime: number;
}

export class WeaponRenderer {
  renderWeapon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: WeaponRenderState
  ): { tipX: number; tipY: number } {
    ctx.save();
    ctx.translate(x, y);

    if (state.facing === -1) {
      ctx.scale(-1, 1);
    }

    let tipPosition: { tipX: number; tipY: number };

    switch (state.weaponType) {
      case 'rapier':
        tipPosition = this.renderRapier(ctx, state);
        break;
      case 'broadsword':
        tipPosition = this.renderBroadsword(ctx, state);
        break;
      case 'bow':
        tipPosition = this.renderBow(ctx, state);
        break;
    }

    ctx.restore();

    const worldTipX = state.facing === -1 ? x - tipPosition.tipX : x + tipPosition.tipX;
    return { tipX: worldTipX, tipY: y + tipPosition.tipY };
  }

  private renderRapier(
    ctx: CanvasRenderingContext2D,
    state: WeaponRenderState
  ): { tipX: number; tipY: number } {
    const { phase, phaseProgress } = state;
    const bladeLength = WEAPONS.rapier.range;

    let angle = 0;
    let extension = 0;

    switch (phase) {
      case 'idle':
        angle = Math.PI / 6;
        extension = 0;
        break;
      case 'anticipation':
        angle = Math.PI / 6 + (Math.PI / 4) * phaseProgress;
        extension = -5 * phaseProgress;
        break;
      case 'action':
        angle = Math.PI / 2 - (Math.PI / 2) * phaseProgress;
        extension = -5 + 15 * phaseProgress;
        break;
      case 'impact':
        angle = 0;
        extension = 10;
        break;
      case 'recovery':
        angle = (Math.PI / 6) * phaseProgress;
        extension = 10 * (1 - phaseProgress);
        break;
    }

    ctx.save();
    ctx.translate(8 + extension, 0);
    ctx.rotate(angle);

    ctx.strokeStyle = WEAPONS.rapier.color;
    ctx.lineWidth = WEAPONS.rapier.width;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bladeLength, 0);
    ctx.stroke();

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-2, 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-10, 0);
    ctx.stroke();

    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(-12, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const tipX = (8 + extension) + Math.cos(angle) * bladeLength;
    const tipY = Math.sin(angle) * bladeLength;
    return { tipX, tipY };
  }

  private renderBroadsword(
    ctx: CanvasRenderingContext2D,
    state: WeaponRenderState
  ): { tipX: number; tipY: number } {
    const { phase, phaseProgress } = state;
    const bladeLength = WEAPONS.broadsword.range;
    const bladeWidth = WEAPONS.broadsword.width;

    let angle = 0;
    switch (phase) {
      case 'idle':
        angle = Math.PI / 4;
        break;
      case 'anticipation':
        angle = Math.PI / 4 + (Math.PI / 2) * phaseProgress;
        break;
      case 'action':
        angle = (3 * Math.PI) / 4 - Math.PI * phaseProgress;
        break;
      case 'impact':
        angle = -Math.PI / 4;
        break;
      case 'recovery':
        angle = -Math.PI / 4 + (Math.PI / 2) * phaseProgress;
        break;
    }

    ctx.save();
    ctx.translate(6, -2);
    ctx.rotate(angle);

    ctx.fillStyle = WEAPONS.broadsword.color;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, -bladeWidth / 2);
    ctx.lineTo(bladeLength - 8, -bladeWidth / 2);
    ctx.lineTo(bladeLength, 0);
    ctx.lineTo(bladeLength - 8, bladeWidth / 2);
    ctx.lineTo(0, bladeWidth / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(bladeLength - 12, 0);
    ctx.stroke();

    ctx.fillStyle = COLORS.line;
    ctx.fillRect(-2, -8, 4, 16);

    ctx.fillRect(-8, -2, 6, 4);

    ctx.restore();

    const tipX = 6 + Math.cos(angle) * bladeLength;
    const tipY = -2 + Math.sin(angle) * bladeLength;
    return { tipX, tipY };
  }

  private renderBow(
    ctx: CanvasRenderingContext2D,
    state: WeaponRenderState
  ): { tipX: number; tipY: number } {
    const { phase, phaseProgress, holdTime } = state;
    const bowHeight = 40;

    let drawBack = 0;
    let bowBend = 0;

    switch (phase) {
      case 'idle':
        drawBack = 0;
        bowBend = 0;
        break;
      case 'anticipation':
        drawBack = 15 * phaseProgress;
        bowBend = 0.15 * phaseProgress;
        break;
      case 'action': {
        const maxHold = 60;
        const holdProgress = Math.min(holdTime / maxHold, 1);
        drawBack = 15 + 10 * holdProgress;
        bowBend = 0.15 + 0.1 * holdProgress;
        break;
      }
      case 'impact':
        drawBack = 0;
        bowBend = -0.1 * (1 - phaseProgress);
        break;
      case 'recovery':
        drawBack = 0;
        bowBend = 0;
        break;
    }

    ctx.save();
    ctx.translate(5, 0);

    ctx.strokeStyle = WEAPONS.bow.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const bendOffset = bowBend * 10;
    ctx.beginPath();
    ctx.moveTo(0, -bowHeight / 2);
    ctx.quadraticCurveTo(-8 - bendOffset, 0, 0, bowHeight / 2);
    ctx.stroke();

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -bowHeight / 2);
    ctx.lineTo(-drawBack, 0);
    ctx.lineTo(0, bowHeight / 2);
    ctx.stroke();

    if (phase === 'anticipation' || phase === 'action') {
      this.renderArrowNocked(ctx, -drawBack, 0);
    }

    ctx.restore();

    return { tipX: 5, tipY: 0 };
  }

  private renderArrowNocked(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();

    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(30, -3);
    ctx.lineTo(30, 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -3);
    ctx.lineTo(2, 0);
    ctx.lineTo(-2, 3);
    ctx.stroke();

    ctx.restore();
  }

  renderThrownWeapon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    weaponType: WeaponType,
    rotation: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    switch (weaponType) {
      case 'rapier':
        this.renderThrownRapier(ctx);
        break;
      case 'broadsword':
        this.renderThrownBroadsword(ctx);
        break;
      case 'bow':
        this.renderThrownBow(ctx);
        break;
    }

    ctx.restore();
  }

  private renderThrownRapier(ctx: CanvasRenderingContext2D): void {
    const length = WEAPONS.rapier.range;

    ctx.strokeStyle = WEAPONS.rapier.color;
    ctx.lineWidth = WEAPONS.rapier.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2, 0);
    ctx.stroke();

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-length / 2 - 5, -3);
    ctx.lineTo(-length / 2 - 5, 3);
    ctx.stroke();
  }

  private renderThrownBroadsword(ctx: CanvasRenderingContext2D): void {
    const length = WEAPONS.broadsword.range;
    const width = WEAPONS.broadsword.width;

    ctx.fillStyle = WEAPONS.broadsword.color;
    ctx.beginPath();
    ctx.moveTo(-length / 2, -width / 2);
    ctx.lineTo(length / 2 - 8, -width / 2);
    ctx.lineTo(length / 2, 0);
    ctx.lineTo(length / 2 - 8, width / 2);
    ctx.lineTo(-length / 2, width / 2);
    ctx.closePath();
    ctx.fill();
  }

  private renderThrownBow(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = WEAPONS.bow.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 15, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  renderUnarmedFist(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    isPunching: boolean,
    punchProgress: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    if (facing === -1) {
      ctx.scale(-1, 1);
    }

    const extension = isPunching ? 12 * Math.sin(punchProgress * Math.PI) : 0;

    ctx.fillStyle = COLORS.line;
    ctx.beginPath();
    ctx.arc(8 + extension, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

import { CANVAS_WIDTH, COLORS } from '../constants';

interface HUDData {
  lives: number;
  level: number;
  screen: number;
  weaponName: string;
  cooldown: number;
  maxCooldown: number;
}

export class HUD {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(data: HUDData): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, 35);

    this.ctx.fillStyle = COLORS.text;
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`Level ${data.level}-${data.screen}`, 10, 10);

    this.ctx.textAlign = 'right';
    for (let i = 0; i < 3; i++) {
      this.ctx.fillStyle = i < data.lives ? '#E63946' : '#CCCCCC';
      this.ctx.fillText('♥', CANVAS_WIDTH - 80 + i * 22, 10);
    }

    const centerX = CANVAS_WIDTH / 2;
    this.ctx.fillStyle = COLORS.text;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(data.weaponName.toUpperCase(), centerX, 10);

    if (data.cooldown > 0) {
      const pct = 1 - data.cooldown / data.maxCooldown;
      this.ctx.fillStyle = COLORS.primary;
      this.ctx.fillRect(centerX - 30, 28, 60 * pct, 4);

      this.ctx.strokeStyle = COLORS.text;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(centerX - 30, 28, 60, 4);
    }
  }
}

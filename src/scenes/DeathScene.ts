import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class DeathScene extends Scene {
  private timer = 0;
  private readonly DISPLAY_DURATION = 2;

  constructor(sceneManager: SceneManager) {
    super('death', sceneManager);
  }

  enter(): void {
    this.timer = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.timer += dt;

    if (this.timer >= this.DISPLAY_DURATION) {
      this.sceneManager.pop();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.bg;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU DIED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

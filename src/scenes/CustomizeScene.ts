import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class CustomizeScene extends Scene {
  constructor(sceneManager: SceneManager) {
    super('customize', sceneManager);
  }

  enter(): void {
    setTimeout(() => {
      this.sceneManager.replace('game');
    }, 100);
  }

  exit(): void {}

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

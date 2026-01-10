import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class TitleScene extends Scene {
  private startButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 50,
    width: 200,
    height: 50,
    hovered: false
  };
  private canvas: HTMLCanvasElement | null = null;

  constructor(sceneManager: SceneManager) {
    super('title', sceneManager);
  }

  enter(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick);
  }

  exit(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
  }

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    this.canvas = ctx.canvas;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WYRM CHASE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    ctx.fillStyle = this.startButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.startButton.x,
      this.startButton.y,
      this.startButton.width,
      this.startButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(
      'START GAME',
      this.startButton.x + this.startButton.width / 2,
      this.startButton.y + this.startButton.height / 2
    );
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.startButton.hovered =
      x >= this.startButton.x &&
      x <= this.startButton.x + this.startButton.width &&
      y >= this.startButton.y &&
      y <= this.startButton.y + this.startButton.height;
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= this.startButton.x &&
      x <= this.startButton.x + this.startButton.width &&
      y >= this.startButton.y &&
      y <= this.startButton.y + this.startButton.height
    ) {
      this.sceneManager.replace('game');
    }
  };
}

import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class VictoryScene extends Scene {
  private continueButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 80,
    width: 200,
    height: 50,
    hovered: false
  };
  private canvas: HTMLCanvasElement | null = null;

  constructor(sceneManager: SceneManager) {
    super('victory', sceneManager);
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

    ctx.fillStyle = COLORS.success;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    ctx.fillStyle = COLORS.text;
    ctx.font = '24px monospace';
    ctx.fillText('You escaped the Wyrm!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText('Level Complete', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = this.continueButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.continueButton.x,
      this.continueButton.y,
      this.continueButton.width,
      this.continueButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      'MAIN MENU',
      this.continueButton.x + this.continueButton.width / 2,
      this.continueButton.y + this.continueButton.height / 2
    );
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.continueButton.hovered = this.isPointInButton(x, y, this.continueButton);
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isPointInButton(x, y, this.continueButton)) {
      this.sceneManager.replace('title');
    }
  };

  private isPointInButton(
    x: number,
    y: number,
    button: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      x >= button.x &&
      x <= button.x + button.width &&
      y >= button.y &&
      y <= button.y + button.height
    );
  }
}

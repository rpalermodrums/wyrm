import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class GameOverScene extends Scene {
  private retryButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 40,
    width: 200,
    height: 50,
    hovered: false
  };
  private menuButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 110,
    width: 200,
    height: 50,
    hovered: false
  };
  private canvas: HTMLCanvasElement | null = null;

  constructor(sceneManager: SceneManager) {
    super('gameover', sceneManager);
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

    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    ctx.fillStyle = COLORS.text;
    ctx.font = '24px monospace';
    ctx.fillText('The Wyrm got you!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = this.retryButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.retryButton.x,
      this.retryButton.y,
      this.retryButton.width,
      this.retryButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      'RETRY',
      this.retryButton.x + this.retryButton.width / 2,
      this.retryButton.y + this.retryButton.height / 2
    );

    ctx.fillStyle = this.menuButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.menuButton.x,
      this.menuButton.y,
      this.menuButton.width,
      this.menuButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.fillText(
      'MAIN MENU',
      this.menuButton.x + this.menuButton.width / 2,
      this.menuButton.y + this.menuButton.height / 2
    );
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.retryButton.hovered = this.isPointInButton(x, y, this.retryButton);
    this.menuButton.hovered = this.isPointInButton(x, y, this.menuButton);
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isPointInButton(x, y, this.retryButton)) {
      this.sceneManager.replace('game');
    } else if (this.isPointInButton(x, y, this.menuButton)) {
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

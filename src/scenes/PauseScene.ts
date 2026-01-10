import { Scene } from './Scene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager } from '../types';

export class PauseScene extends Scene {
  private resumeButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 - 40,
    width: 200,
    height: 50,
    hovered: false
  };
  private quitButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 30,
    width: 200,
    height: 50,
    hovered: false
  };
  private canvas: HTMLCanvasElement | null = null;

  constructor(sceneManager: SceneManager) {
    super('pause', sceneManager);
  }

  enter(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  exit(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    this.canvas = ctx.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

    ctx.fillStyle = this.resumeButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.resumeButton.x,
      this.resumeButton.y,
      this.resumeButton.width,
      this.resumeButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      'RESUME',
      this.resumeButton.x + this.resumeButton.width / 2,
      this.resumeButton.y + this.resumeButton.height / 2
    );

    ctx.fillStyle = this.quitButton.hovered ? COLORS.accent : COLORS.primary;
    ctx.fillRect(
      this.quitButton.x,
      this.quitButton.y,
      this.quitButton.width,
      this.quitButton.height
    );

    ctx.fillStyle = COLORS.background;
    ctx.fillText(
      'QUIT',
      this.quitButton.x + this.quitButton.width / 2,
      this.quitButton.y + this.quitButton.height / 2
    );
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.resumeButton.hovered = this.isPointInButton(x, y, this.resumeButton);
    this.quitButton.hovered = this.isPointInButton(x, y, this.quitButton);
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isPointInButton(x, y, this.resumeButton)) {
      this.sceneManager.pop();
    } else if (this.isPointInButton(x, y, this.quitButton)) {
      this.sceneManager.replace('title');
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.sceneManager.pop();
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

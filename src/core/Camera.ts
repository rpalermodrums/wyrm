import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { Vector2 } from '../utils/Vector2';

export class Camera {
  public position: Vector2;
  public shake: number = 0;
  private shakeOffset: Vector2 = new Vector2();
  private targetPosition: Vector2 | null = null;
  private followSpeed: number = 0.1;

  constructor(x: number = 0, y: number = 0) {
    this.position = new Vector2(x, y);
  }

  follow(target: Vector2, speed: number = 0.1): void {
    this.targetPosition = target;
    this.followSpeed = speed;
  }

  stopFollowing(): void {
    this.targetPosition = null;
  }

  setShake(intensity: number): void {
    this.shake = Math.max(this.shake, intensity);
  }

  update(): void {
    if (this.targetPosition) {
      this.position.x += (this.targetPosition.x - CANVAS_WIDTH / 2 - this.position.x) * this.followSpeed;
      this.position.y += (this.targetPosition.y - CANVAS_HEIGHT / 2 - this.position.y) * this.followSpeed;
    }

    if (this.shake > 0) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shake,
        (Math.random() - 0.5) * this.shake
      );
      this.shake *= 0.9;
      if (this.shake < 0.1) {
        this.shake = 0;
        this.shakeOffset.set(0, 0);
      }
    }
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(
      -this.position.x + this.shakeOffset.x,
      -this.position.y + this.shakeOffset.y
    );
  }

  screenToWorld(screenX: number, screenY: number): Vector2 {
    return new Vector2(
      screenX + this.position.x - this.shakeOffset.x,
      screenY + this.position.y - this.shakeOffset.y
    );
  }

  worldToScreen(worldX: number, worldY: number): Vector2 {
    return new Vector2(
      worldX - this.position.x + this.shakeOffset.x,
      worldY - this.position.y + this.shakeOffset.y
    );
  }

  isVisible(x: number, y: number, width: number, height: number): boolean {
    return (
      x + width > this.position.x &&
      x < this.position.x + CANVAS_WIDTH &&
      y + height > this.position.y &&
      y < this.position.y + CANVAS_HEIGHT
    );
  }
}

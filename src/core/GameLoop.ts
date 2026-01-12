/**
 * GameLoop - Fixed timestep game loop with interpolated rendering
 *
 * Physics runs at fixed 60 FPS for deterministic behavior.
 * Rendering can run at any frame rate.
 */

import { FIXED_TIMESTEP, MAX_DELTA } from '../constants';

export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = (alpha: number) => void;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private isRunning = false;
  private animationFrameId: number | null = null;

  constructor(
    private readonly onUpdate: UpdateCallback,
    private readonly onRender: RenderCallback,
    private readonly onFrameEnd?: () => void,
    private readonly onFixedUpdateEnd?: () => void
  ) {}

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = Math.min(currentTime - this.lastTime, MAX_DELTA);
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.onUpdate(FIXED_TIMESTEP);
      // Clear edge-triggered input after each fixed update to prevent multi-processing
      this.onFixedUpdateEnd?.();
      this.accumulator -= FIXED_TIMESTEP;
    }

    // Interpolated render
    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.onRender(alpha);

    // Frame end callback (for input cleanup, etc.)
    this.onFrameEnd?.();

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}

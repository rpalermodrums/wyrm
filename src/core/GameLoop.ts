import { FIXED_TIMESTEP, MAX_DELTA } from '../constants';

export type GameLoopCallback = (deltaTime: number) => void;
export type RenderCallback = (alpha: number) => void;

export class GameLoop {
  private running: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private frameId: number = 0;

  private updateCallback: GameLoopCallback;
  private renderCallback: RenderCallback;

  constructor(updateCallback: GameLoopCallback, renderCallback: RenderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.running) {
      return;
    }

    this.frameId = requestAnimationFrame(this.loop);

    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > MAX_DELTA) {
      deltaTime = MAX_DELTA;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this.updateCallback(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.renderCallback(alpha);
  };

  get isRunning(): boolean {
    return this.running;
  }

  reset(): void {
    this.lastTime = performance.now();
    this.accumulator = 0;
  }
}

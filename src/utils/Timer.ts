// src/utils/Timer.ts - Game timer utilities

export class Timer {
  private elapsed: number = 0;
  private running: boolean = false;
  private readonly duration: number;
  private readonly loop: boolean;
  private readonly callback: (() => void) | undefined;

  constructor(duration: number, callback: (() => void) | undefined = undefined, loop: boolean = false) {
    this.duration = duration;
    this.callback = callback;
    this.loop = loop;
  }

  static create(duration: number, callback?: () => void): Timer {
    return new Timer(duration, callback, false);
  }

  static createLooping(duration: number, callback?: () => void): Timer {
    return new Timer(duration, callback, true);
  }

  start(): this {
    this.running = true;
    this.elapsed = 0;
    return this;
  }

  stop(): this {
    this.running = false;
    return this;
  }

  reset(): this {
    this.elapsed = 0;
    return this;
  }

  restart(): this {
    this.elapsed = 0;
    this.running = true;
    return this;
  }

  pause(): this {
    this.running = false;
    return this;
  }

  resume(): this {
    this.running = true;
    return this;
  }

  update(deltaTime: number): boolean {
    if (!this.running) {
      return false;
    }

    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      if (this.callback) {
        this.callback();
      }

      if (this.loop) {
        this.elapsed -= this.duration;
        return true;
      } else {
        this.running = false;
        return true;
      }
    }

    return false;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isComplete(): boolean {
    return !this.running && this.elapsed >= this.duration;
  }

  get progress(): number {
    return Math.min(this.elapsed / this.duration, 1);
  }

  get remaining(): number {
    return Math.max(this.duration - this.elapsed, 0);
  }

  get elapsedTime(): number {
    return this.elapsed;
  }

  get totalDuration(): number {
    return this.duration;
  }
}

// Frame-based counter (for fixed timestep updates)
export class FrameCounter {
  private count: number = 0;
  private readonly target: number;
  private readonly callback: (() => void) | undefined;
  private readonly loop: boolean;
  private running: boolean = false;

  constructor(frames: number, callback: (() => void) | undefined = undefined, loop: boolean = false) {
    this.target = frames;
    this.callback = callback;
    this.loop = loop;
  }

  static create(frames: number, callback?: () => void): FrameCounter {
    return new FrameCounter(frames, callback, false);
  }

  static createLooping(frames: number, callback?: () => void): FrameCounter {
    return new FrameCounter(frames, callback, true);
  }

  start(): this {
    this.running = true;
    this.count = 0;
    return this;
  }

  stop(): this {
    this.running = false;
    return this;
  }

  reset(): this {
    this.count = 0;
    return this;
  }

  restart(): this {
    this.count = 0;
    this.running = true;
    return this;
  }

  tick(): boolean {
    if (!this.running) {
      return false;
    }

    this.count++;

    if (this.count >= this.target) {
      if (this.callback) {
        this.callback();
      }

      if (this.loop) {
        this.count = 0;
        return true;
      } else {
        this.running = false;
        return true;
      }
    }

    return false;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isComplete(): boolean {
    return !this.running && this.count >= this.target;
  }

  get progress(): number {
    return Math.min(this.count / this.target, 1);
  }

  get remaining(): number {
    return Math.max(this.target - this.count, 0);
  }

  get current(): number {
    return this.count;
  }

  get targetFrames(): number {
    return this.target;
  }
}

// Cooldown manager for tracking multiple cooldowns
export class CooldownManager {
  private cooldowns: Map<string, number> = new Map();

  set(key: string, frames: number): void {
    this.cooldowns.set(key, frames);
  }

  tick(): void {
    for (const [key, value] of this.cooldowns) {
      if (value > 0) {
        this.cooldowns.set(key, value - 1);
      } else {
        this.cooldowns.delete(key);
      }
    }
  }

  isReady(key: string): boolean {
    return !this.cooldowns.has(key) || this.cooldowns.get(key)! <= 0;
  }

  get(key: string): number {
    return this.cooldowns.get(key) ?? 0;
  }

  clear(key?: string): void {
    if (key) {
      this.cooldowns.delete(key);
    } else {
      this.cooldowns.clear();
    }
  }

  reset(key: string, frames: number): void {
    if (this.isReady(key)) {
      this.set(key, frames);
    }
  }
}

// Delayed action queue
export interface DelayedAction {
  delay: number;
  callback: () => void;
}

export class ActionQueue {
  private actions: DelayedAction[] = [];

  schedule(delay: number, callback: () => void): void {
    this.actions.push({ delay, callback });
  }

  update(deltaTime: number): void {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      const action = this.actions[i];
      if (!action) continue;
      
      action.delay -= deltaTime;

      if (action.delay <= 0) {
        action.callback();
        this.actions.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.actions = [];
  }

  get pending(): number {
    return this.actions.length;
  }
}

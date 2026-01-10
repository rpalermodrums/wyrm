import { Canvas } from './core/Canvas';
import { GameLoop } from './core/GameLoop';
import { Events } from './core/Events';
import type { SceneManager } from './types';

export class Game {
  private canvas: Canvas;
  private gameLoop: GameLoop;
  private events: Events;
  private sceneManager: SceneManager | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }

    this.canvas = new Canvas(container);
    this.events = new Events();
    
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );
  }

  setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
  }

  start(): void {
    if (!this.sceneManager) {
      throw new Error('SceneManager not set. Call setSceneManager() first.');
    }
    this.gameLoop.start();
  }

  stop(): void {
    this.gameLoop.stop();
  }

  private update(deltaTime: number): void {
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }
  }

  private render(_alpha: number): void {
    this.canvas.clear();
    
    if (this.sceneManager) {
      this.sceneManager.render(this.canvas.ctx);
    }
  }

  destroy(): void {
    this.gameLoop.stop();
    this.canvas.destroy();
    this.events.clear();
  }

  get ctx(): CanvasRenderingContext2D {
    return this.canvas.ctx;
  }

  get eventBus(): Events {
    return this.events;
  }

  get canvasElement(): HTMLCanvasElement {
    return this.canvas.element;
  }
}

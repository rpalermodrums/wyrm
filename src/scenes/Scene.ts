import type { Scene as IScene, SceneManager } from '../types';

export abstract class Scene implements IScene {
  readonly name: string;
  protected sceneManager: SceneManager;

  constructor(name: string, sceneManager: SceneManager) {
    this.name = name;
    this.sceneManager = sceneManager;
  }

  abstract enter(): void | Promise<void>;
  abstract exit(): void;
  abstract update(dt: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  pause?(): void;
  resume?(): void;
}

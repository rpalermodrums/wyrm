import type { Scene, SceneManager as ISceneManager } from '../types';

export class SceneManager implements ISceneManager {
  private sceneStack: Scene[] = [];
  private scenes: Map<string, Scene> = new Map();

  constructor(_ctx: CanvasRenderingContext2D) {}

  addScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  async transition(name: string): Promise<void> {
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene not found: ${name}`);
    }

    if (this.sceneStack.length > 0) {
      const current = this.sceneStack.pop();
      current?.exit();
    }

    this.sceneStack.push(scene);
    await scene.enter();
  }

  async push(name: string): Promise<void> {
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene not found: ${name}`);
    }

    if (this.sceneStack.length > 0) {
      const current = this.sceneStack[this.sceneStack.length - 1];
      current?.pause?.();
    }

    this.sceneStack.push(scene);
    await scene.enter();
  }

  pop(): void {
    if (this.sceneStack.length === 0) return;

    const scene = this.sceneStack.pop();
    scene?.exit();

    if (this.sceneStack.length > 0) {
      const current = this.sceneStack[this.sceneStack.length - 1];
      current?.resume?.();
    }
  }

  replace(name: string): void {
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene not found: ${name}`);
    }

    if (this.sceneStack.length > 0) {
      const current = this.sceneStack.pop();
      current?.exit();
    }

    this.sceneStack.push(scene);
    scene.enter();
  }

  update(dt: number): void {
    if (this.sceneStack.length === 0) return;
    const current = this.sceneStack[this.sceneStack.length - 1];
    current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const scene of this.sceneStack) {
      scene.render(ctx);
    }
  }

  getCurrentScene(): Scene | undefined {
    return this.sceneStack[this.sceneStack.length - 1];
  }

  clear(): void {
    while (this.sceneStack.length > 0) {
      this.pop();
    }
  }
}

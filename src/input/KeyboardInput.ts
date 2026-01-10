import type { InputAdapter } from '../types';

export class KeyboardInput implements InputAdapter {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  update(): void {
    this.prevKeys = new Set(this.keys);
  }

  isDown(action: string): boolean {
    switch (action) {
      case 'left':
        return this.keys.has('ArrowLeft') || this.keys.has('KeyA');
      case 'right':
        return this.keys.has('ArrowRight') || this.keys.has('KeyD');
      case 'jump':
        return this.keys.has('Space') || this.keys.has('KeyW') || this.keys.has('ArrowUp');
      case 'attack':
        return this.keys.has('KeyJ') || this.keys.has('KeyZ') || this.keys.has('ShiftLeft');
      case 'throw':
        return this.keys.has('KeyK') || this.keys.has('KeyX');
      case 'pause':
        return this.keys.has('Escape') || this.keys.has('KeyP');
      default:
        return false;
    }
  }

  isPressed(action: string): boolean {
    const isCurrentlyDown = this.isDown(action);
    const wasDown = this.wasPreviouslyDown(action);
    return isCurrentlyDown && !wasDown;
  }

  private wasPreviouslyDown(action: string): boolean {
    switch (action) {
      case 'left':
        return this.prevKeys.has('ArrowLeft') || this.prevKeys.has('KeyA');
      case 'right':
        return this.prevKeys.has('ArrowRight') || this.prevKeys.has('KeyD');
      case 'jump':
        return this.prevKeys.has('Space') || this.prevKeys.has('KeyW') || this.prevKeys.has('ArrowUp');
      case 'attack':
        return this.prevKeys.has('KeyJ') || this.prevKeys.has('KeyZ') || this.prevKeys.has('ShiftLeft');
      case 'throw':
        return this.prevKeys.has('KeyK') || this.prevKeys.has('KeyX');
      case 'pause':
        return this.prevKeys.has('Escape') || this.prevKeys.has('KeyP');
      default:
        return false;
    }
  }

  getAxis(axis: 'horizontal' | 'vertical'): number {
    if (axis === 'horizontal') {
      const left = this.isDown('left');
      const right = this.isDown('right');
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    }
    return 0;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

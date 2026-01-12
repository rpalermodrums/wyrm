/**
 * InputManager - Singleton input handling
 *
 * CRITICAL: Uses edge-triggered detection to prevent race conditions.
 * All systems share this singleton instance.
 * Call endFrame() at the end of each game loop tick.
 */

import type { InputAction } from '../types';

const KEY_BINDINGS: Record<string, InputAction> = {
  // Movement
  KeyA: 'moveLeft',
  ArrowLeft: 'moveLeft',
  KeyD: 'moveRight',
  ArrowRight: 'moveRight',
  Space: 'jump',

  // Combat
  KeyJ: 'attack',
  KeyZ: 'attack',
  ShiftLeft: 'attack',
  KeyK: 'throw',
  KeyX: 'throw',

  // Sword position
  ArrowDown: 'swordDown',
  KeyS: 'swordDown',
  ArrowUp: 'swordUp',
  KeyW: 'swordUp',

  // Roll
  KeyC: 'roll',

  // System
  Escape: 'pause',
  KeyP: 'pause',
};

export class InputManager {
  private static instance: InputManager | null = null;

  private readonly keysDown: Set<string> = new Set();
  private readonly keysJustPressed: Set<string> = new Set();
  private readonly keysJustReleased: Set<string> = new Set();

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  static destroy(): void {
    if (InputManager.instance) {
      window.removeEventListener('keydown', InputManager.instance.handleKeyDown);
      window.removeEventListener('keyup', InputManager.instance.handleKeyUp);
      window.removeEventListener('blur', InputManager.instance.handleBlur);
      InputManager.instance = null;
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Prevent default for game keys
    if (KEY_BINDINGS[e.code]) {
      e.preventDefault();
    }

    if (!this.keysDown.has(e.code)) {
      this.keysJustPressed.add(e.code);
      this.keysDown.add(e.code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
    this.keysJustReleased.add(e.code);
  };

  private handleBlur = (): void => {
    // Release all keys when window loses focus
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  };

  /**
   * Check if an action's key is currently held down
   */
  isDown(action: InputAction): boolean {
    for (const [key, boundAction] of Object.entries(KEY_BINDINGS)) {
      if (boundAction === action && this.keysDown.has(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if an action's key was just pressed this frame
   */
  justPressed(action: InputAction): boolean {
    for (const [key, boundAction] of Object.entries(KEY_BINDINGS)) {
      if (boundAction === action && this.keysJustPressed.has(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if an action's key was just released this frame
   */
  justReleased(action: InputAction): boolean {
    for (const [key, boundAction] of Object.entries(KEY_BINDINGS)) {
      if (boundAction === action && this.keysJustReleased.has(key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get horizontal input axis (-1 to 1)
   */
  getHorizontalAxis(): number {
    const left = this.isDown('moveLeft') ? -1 : 0;
    const right = this.isDown('moveRight') ? 1 : 0;
    return left + right;
  }

  /**
   * Call at the END of each frame to clear edge-triggered state
   */
  endFrame(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }
}

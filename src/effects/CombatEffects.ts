/**
 * CombatEffects - Screen shake and hit pause effect handlers
 *
 * Listens to EventBus for screenShake and hitPause events.
 * Controls ThreeRenderer camera shake and manages game loop pause for hit freeze.
 */

import type { EventBus } from '../core/Events';
import type { ThreeRenderer } from '../rendering/ThreeRenderer';
import type { GameEvent } from '../types';

type ScreenShakeEvent = Extract<GameEvent, { type: 'screenShake' }>;
type HitPauseEvent = Extract<GameEvent, { type: 'hitPause' }>;

export class CombatEffects {
  private trauma = 0;
  private hitPauseFrames = 0;

  // Configuration
  private readonly TRAUMA_DECAY = 0.0025; // per ms
  private readonly MAX_OFFSET = 1.5;
  private readonly MAX_TRAUMA = 1.0;

  private readonly handleScreenShake: (event: ScreenShakeEvent) => void;
  private readonly handleHitPause: (event: HitPauseEvent) => void;

  constructor(
    private readonly events: EventBus,
    private readonly renderer: ThreeRenderer
  ) {
    // Store bound handlers for cleanup
    this.handleScreenShake = (event: ScreenShakeEvent) => {
      this.addTrauma(event.intensity / 20); // Normalize intensity (usually 1-10) to 0-1 range
    };

    this.handleHitPause = (event: HitPauseEvent) => {
      this.hitPauseFrames = event.frames;
    };

    this.setupListeners();
  }

  private addTrauma(amount: number): void {
    this.trauma = Math.min(this.MAX_TRAUMA, this.trauma + amount);
  }

  private setupListeners(): void {
    this.events.on('screenShake', this.handleScreenShake);
    this.events.on('hitPause', this.handleHitPause);
  }

  /**
   * Update effects each frame
   * @param deltaTime - Time since last frame in milliseconds
   * @returns true if game should pause (hit freeze active), false otherwise
   */
  update(deltaTime: number): boolean {
    // Screen shake (Trauma Juice)
    if (this.trauma > 0) {
      // Shake is non-linear (square of trauma)
      const shake = this.trauma * this.trauma;
      
      const offsetX = (Math.random() * 2 - 1) * this.MAX_OFFSET * shake;
      const offsetY = (Math.random() * 2 - 1) * this.MAX_OFFSET * shake;
      
      this.renderer.setShakeOffset(offsetX, offsetY);
      
      // Linear decay
      this.trauma = Math.max(0, this.trauma - this.TRAUMA_DECAY * deltaTime);
    } else {
        this.renderer.setShakeOffset(0, 0);
    }

    // Hit pause
    if (this.hitPauseFrames > 0) {
      this.hitPauseFrames--;
      return true; // pause game
    }
    return false;
  }

  /**
   * Check if hit pause is currently active
   */
  get isHitPaused(): boolean {
    return this.hitPauseFrames > 0;
  }

  /**
   * Remove event listeners for cleanup
   */
  cleanup(): void {
    this.events.off('screenShake', this.handleScreenShake);
    this.events.off('hitPause', this.handleHitPause);
    // Reset shake offset on cleanup
    this.renderer.setShakeOffset(0, 0);
  }
}

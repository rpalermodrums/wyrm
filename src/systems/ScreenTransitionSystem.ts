/**
 * ScreenTransitionSystem - Detects screen boundaries and manages transitions
 *
 * Tracks player position and triggers screen transitions when crossing
 * right edge boundaries. Emits events for camera panning and level completion.
 */

import type {
  System,
  Entity,
  World,
  TransformComponent,
} from '../types';
import type { EventBus } from '../core/Events';
import { SYSTEM_PRIORITY, SCREEN_WIDTH_UNITS, SCREENS_PER_LEVEL } from '../constants';

const DEBUG = true;
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[ScreenTransitionSystem] ${msg}`, ...args);
};

// Screen boundary buffer - player must cross this far past screen edge
const SCREEN_BOUNDARY_BUFFER = 2;

// Module-level state for current screen (exported for external access)
let currentScreenIndex = 0;

/**
 * Get the current screen index (0-based)
 */
export function getCurrentScreen(): number {
  return currentScreenIndex;
}

/**
 * Set the current screen index (for level loading, etc.)
 */
export function setCurrentScreen(screen: number): void {
  const clampedScreen = Math.max(0, Math.min(screen, SCREENS_PER_LEVEL - 1));
  log(`Setting screen to ${clampedScreen}`);
  currentScreenIndex = clampedScreen;
}

/**
 * Calculate the right edge boundary for a given screen
 */
function getScreenRightEdge(screenIndex: number): number {
  return screenIndex * SCREEN_WIDTH_UNITS + SCREEN_WIDTH_UNITS - SCREEN_BOUNDARY_BUFFER;
}

/**
 * Calculate the center X position for a given screen
 */
function getScreenCenterX(screenIndex: number): number {
  return screenIndex * SCREEN_WIDTH_UNITS + SCREEN_WIDTH_UNITS / 2;
}

export class ScreenTransitionSystem implements System {
  readonly name = 'ScreenTransitionSystem';
  readonly requiredComponents = ['transform', 'playerControlled'] as const;
  readonly priority = SYSTEM_PRIORITY.ScreenTransition;

  private events: EventBus | null = null;

  constructor() {
    log('ScreenTransitionSystem initialized');
    log(`Screen width: ${SCREEN_WIDTH_UNITS} units, Total screens: ${SCREENS_PER_LEVEL}`);
  }

  setWorld(_world: World): void {
    // World reference available if needed for future cross-entity queries
    log('World reference set');
  }

  setEvents(events: EventBus): void {
    this.events = events;
    log('Events connected');
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    // Find the player entity
    const player = entities[0]; // Should only be one player
    if (!player) {
      return;
    }

    const transform = player.getComponent<TransformComponent>('transform');
    if (!transform) {
      return;
    }

    // Check if player has crossed the right edge of the current screen
    const rightEdge = getScreenRightEdge(currentScreenIndex);

    if (transform.x > rightEdge) {
      log(`Player crossed right edge at x=${transform.x.toFixed(2)}, edge=${rightEdge}`);
      this.handleScreenTransition();
    }
  }

  private handleScreenTransition(): void {
    const previousScreen = currentScreenIndex;
    const newScreen = currentScreenIndex + 1;

    // Check if we've reached the end of the level
    if (newScreen >= SCREENS_PER_LEVEL) {
      log(`Level complete! Reached end of screen ${previousScreen + 1}/${SCREENS_PER_LEVEL}`);
      this.events?.emit({ type: 'levelComplete' });
      return;
    }

    // Transition to next screen
    currentScreenIndex = newScreen;
    log(`Screen transition: ${previousScreen} -> ${newScreen}`);

    // Emit screen transition event for camera and other systems
    const newCenterX = getScreenCenterX(newScreen);
    log(`Camera should pan to x=${newCenterX} (screen ${newScreen + 1} center)`);

    this.events?.emit({
      type: 'screenTransition',
      direction: 'right',
      newScreen: newScreen,
      totalScreens: SCREENS_PER_LEVEL,
    });
  }

  /**
   * Reset screen tracking (for level restart, etc.)
   */
  reset(): void {
    log(`Resetting from screen ${currentScreenIndex} to 0`);
    currentScreenIndex = 0;
  }
}

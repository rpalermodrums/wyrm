/**
 * Level 1: The Escape
 *
 * First level - 5 connected screens of increasing difficulty.
 * Entry-level platforming with guards using rapiers.
 *
 * Screen layout (30 units per screen):
 *   Screen 0 (x: 0-30):   Tutorial area, simple platforms, 1 guard
 *   Screen 1 (x: 30-60):  More vertical challenge, 1 guard
 *   Screen 2 (x: 60-90):  Elevated platforms, 2 guards
 *   Screen 3 (x: 90-120): Staircase pattern, 2 guards
 *   Screen 4 (x: 120-150): Final gauntlet, 2 guards
 */

import type { LevelData } from '../types';

export const level1: LevelData = {
  id: 'level1',
  name: 'The Escape',
  screens: [
    // ========================================================================
    // Screen 0: Tutorial area (x: 0-30)
    // Simple introduction - low platforms, one guard at the end
    // ========================================================================
    {
      index: 0,
      platforms: [
        // Ground platform (extends slightly past screen for seamless transition)
        { x: -1, y: 0, width: 32, height: 1 },
        // Low stepping platform (one-way to allow jumping through)
        { x: 8, y: 2, width: 5, height: 0.5, isOneWay: true },
        // Mid-height platform
        { x: 16, y: 3.5, width: 6, height: 0.5, isOneWay: true },
        // Small platform near end (one-way)
        { x: 24, y: 2.5, width: 4, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Single guard near end of screen, facing left to confront player
        { x: 22, y: 1, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // ========================================================================
    // Screen 1: Vertical challenge (x: 30-60)
    // More platforms requiring jumping, one guard on elevated platform
    // ========================================================================
    {
      index: 1,
      platforms: [
        // Ground platform
        { x: 29, y: 0, width: 32, height: 1 },
        // Lower left platform (one-way)
        { x: 34, y: 2.5, width: 5, height: 0.5, isOneWay: true },
        // Middle floating platform (one-way for drop-through)
        { x: 42, y: 4, width: 6, height: 0.4, isOneWay: true },
        // Higher right platform (one-way)
        { x: 50, y: 5.5, width: 5, height: 0.5, isOneWay: true },
        // Low platform near transition
        { x: 55, y: 2, width: 4, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Guard patrolling the elevated platform area
        { x: 45, y: 1, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // ========================================================================
    // Screen 2: Elevated challenge (x: 60-90)
    // Multi-tier platforms, 2 guards at different heights
    // ========================================================================
    {
      index: 2,
      platforms: [
        // Ground platform
        { x: 59, y: 0, width: 32, height: 1 },
        // Lower tier left
        { x: 63, y: 2.5, width: 6, height: 0.5 },
        // Mid tier center (one-way)
        { x: 72, y: 4.5, width: 8, height: 0.4, isOneWay: true },
        // Upper tier right
        { x: 82, y: 6, width: 5, height: 0.5 },
        // Lower connecting platform
        { x: 78, y: 2, width: 4, height: 0.5 },
        // Small stepping stone
        { x: 68, y: 3, width: 3, height: 0.4, isOneWay: true },
      ],
      enemies: [
        // Guard on ground level
        { x: 70, y: 1, type: 'guard', facingRight: false },
        // Guard on elevated platform
        { x: 84, y: 6.5, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // ========================================================================
    // Screen 3: Staircase pattern (x: 90-120)
    // Ascending platforms, 2 guards blocking progress
    // ========================================================================
    {
      index: 3,
      platforms: [
        // Ground platform
        { x: 89, y: 0, width: 32, height: 1 },
        // Staircase ascending left to right
        { x: 93, y: 2, width: 5, height: 0.5 },
        { x: 99, y: 3.5, width: 5, height: 0.5 },
        { x: 105, y: 5, width: 5, height: 0.5, isOneWay: true },
        { x: 111, y: 6.5, width: 5, height: 0.5 },
        // Alternative lower path
        { x: 102, y: 1.5, width: 4, height: 0.4, isOneWay: true },
        { x: 108, y: 2.5, width: 4, height: 0.4, isOneWay: true },
      ],
      enemies: [
        // Guard blocking the lower path
        { x: 100, y: 1, type: 'guard', facingRight: false },
        // Guard on the staircase
        { x: 108, y: 5.5, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // ========================================================================
    // Screen 4: Final gauntlet (x: 120-150)
    // Intense final section - reaching x: 150 = level complete
    // ========================================================================
    {
      index: 4,
      platforms: [
        // Ground platform
        { x: 119, y: 0, width: 32, height: 1 },
        // Gauntlet platforms - varied heights for combat variety
        { x: 124, y: 3, width: 5, height: 0.5 },
        { x: 131, y: 4.5, width: 6, height: 0.4, isOneWay: true },
        { x: 138, y: 3, width: 5, height: 0.5 },
        // High escape route
        { x: 127, y: 6, width: 4, height: 0.4, isOneWay: true },
        { x: 134, y: 7, width: 4, height: 0.4, isOneWay: true },
        // Final platform before exit
        { x: 144, y: 2, width: 5, height: 0.5 },
      ],
      enemies: [
        // Two guards defending the final stretch
        { x: 130, y: 1, type: 'guard', facingRight: false },
        { x: 142, y: 1, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },
  ],
};

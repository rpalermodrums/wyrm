/**
 * Test Level - Simple level for testing Phase 1 movement
 *
 * Contains ground platform and several elevated platforms for testing jumping.
 */

import type { LevelData } from '../types';

export const testLevel: LevelData = {
  id: 'test',
  name: 'Test Level',
  screens: [
    {
      index: 0,
      platforms: [
        // Ground platform - wide floor
        { x: -10, y: 0, width: 50, height: 1 },

        // Elevated platforms for testing jumping
        { x: 5, y: 3, width: 4, height: 0.5 },
        { x: 12, y: 5, width: 4, height: 0.5 },
        { x: 20, y: 3, width: 6, height: 0.5 },

        // Staircase platforms
        { x: 28, y: 2, width: 3, height: 0.5 },
        { x: 32, y: 4, width: 3, height: 0.5 },
        { x: 36, y: 6, width: 3, height: 0.5 },
      ],
      enemies: [
        { x: 15, y: 1, type: 'guard', facingRight: false },
        { x: 25, y: 1, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },
  ],
};

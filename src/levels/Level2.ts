/**
 * Level 2 - The Tunnels
 *
 * Increased difficulty with mix of guard and runner enemies.
 * Features more complex platform layouts with narrow platforms
 * and challenging gaps requiring precise jumping.
 */

import type { LevelData } from '../types';

export const level2: LevelData = {
  id: 'level2',
  name: 'The Tunnels',
  screens: [
    // Screen 0 (x: 0-30) - Introduction to runners
    {
      index: 0,
      platforms: [
        // Ground platform
        { x: 0, y: 0, width: 32, height: 1 },

        // Low platform cluster - easy warmup
        { x: 8, y: 2.5, width: 5, height: 0.5, isOneWay: true },
        { x: 16, y: 4, width: 4, height: 0.5, isOneWay: true },

        // High perch
        { x: 24, y: 6, width: 3, height: 0.5, isOneWay: true },
      ],
      enemies: [
        { x: 12, y: 1, type: 'guard', facingRight: false },
        { x: 22, y: 1, type: 'runner', facingRight: false },
      ],
      hazards: [],
    },

    // Screen 1 (x: 30-60) - Vertical challenge
    {
      index: 1,
      platforms: [
        // Ground platform
        { x: 30, y: 0, width: 32, height: 1 },

        // Staggered narrow platforms - requires precise jumping
        { x: 35, y: 2.5, width: 2.5, height: 0.5, isOneWay: true },
        { x: 40, y: 4.5, width: 2.5, height: 0.5, isOneWay: true },
        { x: 45, y: 6.5, width: 2.5, height: 0.5, isOneWay: true },

        // Landing platform
        { x: 52, y: 4, width: 4, height: 0.5, isOneWay: true },

        // Low cover platform
        { x: 56, y: 2, width: 3, height: 0.5, isOneWay: true },
      ],
      enemies: [
        { x: 38, y: 1, type: 'runner', facingRight: false },
        { x: 48, y: 1, type: 'guard', facingRight: false },
        { x: 55, y: 1, type: 'runner', facingRight: false },
      ],
      hazards: [],
    },

    // Screen 2 (x: 60-90) - Platform gauntlet
    {
      index: 2,
      platforms: [
        // Ground platform
        { x: 60, y: 0, width: 32, height: 1 },

        // Gap in ground coverage - forces platforming
        { x: 68, y: 3, width: 3, height: 0.5, isOneWay: true },
        { x: 73, y: 3, width: 3, height: 0.5, isOneWay: true },
        { x: 78, y: 3, width: 3, height: 0.5, isOneWay: true },

        // High route
        { x: 65, y: 6, width: 4, height: 0.5, isOneWay: true },
        { x: 72, y: 7, width: 3, height: 0.5, isOneWay: true },
        { x: 80, y: 5.5, width: 4, height: 0.5, isOneWay: true },

        // Solid mid platform for combat
        { x: 85, y: 2.5, width: 5, height: 0.5 },
      ],
      enemies: [
        { x: 70, y: 1, type: 'guard', facingRight: false },
        { x: 82, y: 1, type: 'runner', facingRight: false },
        { x: 87, y: 3, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // Screen 3 (x: 90-120) - Runner ambush
    {
      index: 3,
      platforms: [
        // Ground platform
        { x: 90, y: 0, width: 32, height: 1 },

        // Tight corridor of platforms
        { x: 95, y: 2, width: 2, height: 0.5, isOneWay: true },
        { x: 99, y: 3.5, width: 2, height: 0.5, isOneWay: true },
        { x: 103, y: 2, width: 2, height: 0.5, isOneWay: true },

        // Wide combat platform
        { x: 108, y: 4, width: 6, height: 0.5, isOneWay: true },

        // Escape platforms
        { x: 116, y: 2.5, width: 3, height: 0.5, isOneWay: true },
        { x: 116, y: 5.5, width: 3, height: 0.5, isOneWay: true },
      ],
      enemies: [
        { x: 97, y: 1, type: 'runner', facingRight: false },
        { x: 107, y: 1, type: 'runner', facingRight: false },
        { x: 115, y: 1, type: 'guard', facingRight: false },
      ],
      hazards: [],
    },

    // Screen 4 (x: 120-150) - Final challenge
    {
      index: 4,
      platforms: [
        // Ground platform
        { x: 120, y: 0, width: 32, height: 1 },

        // Narrow stepping stones
        { x: 125, y: 2, width: 2, height: 0.5, isOneWay: true },
        { x: 129, y: 4, width: 2, height: 0.5, isOneWay: true },
        { x: 133, y: 6, width: 2, height: 0.5, isOneWay: true },

        // Mid bridge
        { x: 137, y: 3.5, width: 5, height: 0.5 },

        // High platform gauntlet
        { x: 144, y: 5, width: 2.5, height: 0.5, isOneWay: true },
        { x: 148, y: 3, width: 3, height: 0.5, isOneWay: true },
      ],
      enemies: [
        { x: 128, y: 1, type: 'runner', facingRight: false },
        { x: 139, y: 4, type: 'guard', facingRight: false },
        { x: 146, y: 1, type: 'runner', facingRight: false },
      ],
      hazards: [],
    },
  ],
};

/**
 * Level 3 - The Gauntlet
 *
 * Final level with maximum difficulty. Features the hardest enemy mix
 * (guards, runners, brutes) and complex platform layouts with
 * vertical challenges and tricky gaps.
 */

import type { LevelData } from '../types';

export const level3: LevelData = {
  id: 'level3',
  name: 'The Gauntlet',
  screens: [
    // Screen 0: The Entrance - Immediate pressure
    {
      index: 0,
      platforms: [
        // Ground platform
        { x: 0, y: 0, width: 32, height: 1 },
        // Staggered platforms forcing vertical movement
        { x: 5, y: 3, width: 4, height: 0.5, isOneWay: true },
        { x: 12, y: 5, width: 3, height: 0.5, isOneWay: true },
        { x: 18, y: 3.5, width: 4, height: 0.5, isOneWay: true },
        // High platform for ambush
        { x: 24, y: 6, width: 5, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Runner immediately attacks
        { x: 8, y: 1, type: 'runner', facingRight: false },
        // Guard on mid platform
        { x: 13, y: 6, type: 'guard', facingRight: false },
        // Brute blocking path
        { x: 22, y: 1, type: 'brute', facingRight: false },
      ],
      hazards: [
        // Small pit to punish careless players
        { x: 15, y: -2, width: 2, height: 2, type: 'pit' },
      ],
    },

    // Screen 1: The Gauntlet Run - Fast enemies and narrow platforms
    {
      index: 1,
      platforms: [
        // Ground with gaps
        { x: 30, y: 0, width: 8, height: 1 },
        { x: 42, y: 0, width: 6, height: 1 },
        { x: 52, y: 0, width: 10, height: 1 },
        // Stepping stones over void
        { x: 38, y: 2, width: 3, height: 0.5, isOneWay: true },
        { x: 48, y: 3, width: 3, height: 0.5, isOneWay: true },
        // Upper escape route
        { x: 35, y: 5, width: 5, height: 0.5, isOneWay: true },
        { x: 45, y: 6, width: 4, height: 0.5, isOneWay: true },
        { x: 54, y: 5, width: 4, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Two runners create pincer
        { x: 35, y: 1, type: 'runner', facingRight: false },
        { x: 55, y: 1, type: 'runner', facingRight: false },
        // Guard on upper path
        { x: 46, y: 7, type: 'guard', facingRight: false },
        // Brute guarding exit
        { x: 58, y: 1, type: 'brute', facingRight: false },
      ],
      hazards: [
        { x: 38, y: -2, width: 4, height: 2, type: 'pit' },
        { x: 48, y: -2, width: 4, height: 2, type: 'pit' },
      ],
    },

    // Screen 2: The Tower - Vertical challenge
    {
      index: 2,
      platforms: [
        // Ground platform
        { x: 60, y: 0, width: 32, height: 1 },
        // Ascending tower platforms
        { x: 62, y: 2.5, width: 4, height: 0.5, isOneWay: true },
        { x: 68, y: 4, width: 3, height: 0.5, isOneWay: true },
        { x: 64, y: 5.5, width: 3, height: 0.5, isOneWay: true },
        { x: 70, y: 7, width: 4, height: 0.5, isOneWay: true },
        // Parallel path on right side
        { x: 78, y: 3, width: 5, height: 0.5, isOneWay: true },
        { x: 82, y: 5, width: 4, height: 0.5, isOneWay: true },
        { x: 76, y: 6.5, width: 4, height: 0.5, isOneWay: true },
        // Bridge connecting paths
        { x: 74, y: 7, width: 3, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Guard at base
        { x: 65, y: 1, type: 'guard', facingRight: false },
        // Runner patrols mid-level
        { x: 69, y: 5, type: 'runner', facingRight: true },
        // Brute guards right path
        { x: 80, y: 4, type: 'brute', facingRight: false },
        // Guard on high ground
        { x: 77, y: 8, type: 'guard', facingRight: true },
      ],
      hazards: [
        { x: 85, y: -2, width: 3, height: 2, type: 'pit' },
      ],
    },

    // Screen 3: The Maze - Complex interlocking platforms
    {
      index: 3,
      platforms: [
        // Broken ground
        { x: 90, y: 0, width: 10, height: 1 },
        { x: 104, y: 0, width: 8, height: 1 },
        { x: 116, y: 0, width: 6, height: 1 },
        // Lower tier
        { x: 100, y: 1.5, width: 4, height: 0.5, isOneWay: true },
        { x: 112, y: 2, width: 4, height: 0.5, isOneWay: true },
        // Middle tier - maze-like
        { x: 92, y: 3, width: 5, height: 0.5, isOneWay: true },
        { x: 98, y: 4, width: 4, height: 0.5, isOneWay: true },
        { x: 104, y: 3.5, width: 5, height: 0.5, isOneWay: true },
        { x: 110, y: 4.5, width: 4, height: 0.5, isOneWay: true },
        { x: 116, y: 3, width: 4, height: 0.5, isOneWay: true },
        // Upper tier
        { x: 95, y: 6, width: 4, height: 0.5, isOneWay: true },
        { x: 102, y: 6.5, width: 5, height: 0.5, isOneWay: true },
        { x: 109, y: 7, width: 4, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Runners create chaos in the maze
        { x: 94, y: 1, type: 'runner', facingRight: false },
        { x: 108, y: 1, type: 'runner', facingRight: false },
        // Guards hold key positions
        { x: 99, y: 5, type: 'guard', facingRight: true },
        { x: 110, y: 8, type: 'guard', facingRight: false },
      ],
      hazards: [
        { x: 100, y: -2, width: 4, height: 2, type: 'pit' },
        { x: 112, y: -2, width: 4, height: 2, type: 'pit' },
      ],
    },

    // Screen 4: The Final Stand - Intense climax
    {
      index: 4,
      platforms: [
        // Ground platform - last stand arena
        { x: 120, y: 0, width: 32, height: 1 },
        // Arena platforms for dynamic combat
        { x: 124, y: 2.5, width: 4, height: 0.5, isOneWay: true },
        { x: 132, y: 3, width: 5, height: 0.5, isOneWay: true },
        { x: 140, y: 2.5, width: 4, height: 0.5, isOneWay: true },
        // Mid-height ring
        { x: 126, y: 5, width: 4, height: 0.5, isOneWay: true },
        { x: 133, y: 5.5, width: 4, height: 0.5, isOneWay: true },
        { x: 140, y: 5, width: 4, height: 0.5, isOneWay: true },
        // High platforms for dramatic finish
        { x: 128, y: 7.5, width: 5, height: 0.5, isOneWay: true },
        { x: 137, y: 8, width: 5, height: 0.5, isOneWay: true },
        // Victory platform
        { x: 145, y: 6, width: 4, height: 0.5, isOneWay: true },
      ],
      enemies: [
        // Elite squad - all enemy types
        { x: 126, y: 1, type: 'brute', facingRight: false },
        { x: 135, y: 1, type: 'guard', facingRight: false },
        { x: 142, y: 1, type: 'runner', facingRight: false },
        { x: 134, y: 6, type: 'guard', facingRight: true },
      ],
      hazards: [],
    },
  ],
} as const;

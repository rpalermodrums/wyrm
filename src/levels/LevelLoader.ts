/**
 * LevelLoader - Load and setup levels from level data
 *
 * Creates entities for platforms, enemies, and hazards from level data.
 * Supports multiple levels with wyrm speed scaling per level.
 */

import type { World, LevelData, Entity } from '../types';
import { createPlayer } from '../entities/PlayerFactory';
import { createPlatformFromData } from '../entities/PlatformFactory';
import { createEnemy } from '../entities/EnemyFactory';
import { createHazardFromData } from '../entities/HazardFactory';
import { level1 } from './Level1';
import { level2 } from './Level2';
import { level3 } from './Level3';
import { WYRM_BASE_SPEED, WYRM_LEVEL_SCALING } from '../constants';

/**
 * Array of all available levels in order
 */
const levels: readonly LevelData[] = [level1, level2, level3];

export interface LoadedLevel {
  readonly player: Entity;
  readonly platforms: readonly Entity[];
}

/**
 * Get the total number of available levels
 */
export function getTotalLevels(): number {
  return levels.length;
}

/**
 * Get level data by index
 * @param levelIndex - Zero-based level index (0 = level1, 1 = level2, etc.)
 * @throws Error if levelIndex is out of bounds
 */
export function getLevelData(levelIndex: number): LevelData {
  if (levelIndex < 0 || levelIndex >= levels.length) {
    throw new Error(`Invalid level index: ${levelIndex}. Valid range: 0-${levels.length - 1}`);
  }
  const levelData = levels[levelIndex];
  // This assertion is safe because we've already bounds-checked above
  if (!levelData) {
    throw new Error(`Level data not found for index: ${levelIndex}`);
  }
  return levelData;
}

/**
 * Calculate wyrm speed for a given level
 * Wyrm speed increases by WYRM_LEVEL_SCALING (8%) per level
 * @param levelIndex - Zero-based level index
 * @returns Wyrm speed for the level
 */
export function getWyrmSpeedForLevel(levelIndex: number): number {
  return WYRM_BASE_SPEED * (1 + WYRM_LEVEL_SCALING * levelIndex);
}

/**
 * Load a level and create all entities
 * @param world - The ECS world to create entities in
 * @param levelData - Level data to load (optional if levelIndex provided)
 * @param levelIndex - Zero-based level index (default 0)
 */
export function loadLevel(world: World, levelData?: LevelData, levelIndex: number = 0): LoadedLevel {
  const data = levelData ?? getLevelData(levelIndex);
  const platforms: Entity[] = [];

  // Load platforms from all screens
  for (const screen of data.screens) {
    for (const platformData of screen.platforms) {
      const platform = createPlatformFromData(world, platformData);
      platforms.push(platform);
    }

    // Load enemies from screen data
    for (const enemyData of screen.enemies) {
      createEnemy(world, enemyData.x, enemyData.y, enemyData.type, enemyData.facingRight);
    }

    // Load hazards from screen data
    for (const hazardData of screen.hazards) {
      createHazardFromData(world, hazardData);
    }
  }

  // Create player at starting position
  const player = createPlayer(world, 0, 3);

  return {
    player,
    platforms,
  };
}

/**
 * Unload a level - destroy all entities except persistent ones
 * Calls processDestructions() synchronously to ensure entities are
 * removed before any new level is loaded (prevents one-frame overlap)
 */
export function unloadLevel(world: World): void {
  // Get all entities and destroy them
  const entities = world.getAllEntities();
  for (const entity of entities) {
    world.destroyEntity(entity.id);
  }
  // Process destructions immediately to prevent overlap with new entities
  world.processDestructions();
}

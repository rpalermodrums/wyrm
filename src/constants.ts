// src/constants.ts - Shared constants for Wyrm Chase
// All agents import from this file for consistency

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const TARGET_FPS = 60;
export const FIXED_TIMESTEP = 1000 / TARGET_FPS; // 16.67ms
export const MAX_DELTA = 250; // Prevent death spiral

// Physics
export const GRAVITY = 0.6;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_FORCE = -14;
export const COYOTE_TIME = 8; // frames
export const JUMP_BUFFER = 6; // frames
export const PIT_DEATH_Y = CANVAS_HEIGHT + 50;

// Wyrm
export const WYRM_BASE_SPEED = 1.8;
export const WYRM_SURGE_MULTIPLIER = 1.5;
export const WYRM_SLOW_MULTIPLIER = 0.7;
export const WYRM_SEGMENT_COUNT = 10;
export const WYRM_LEVEL_SCALING = 0.05; // +5% per level

// Collision Layers (bitmask)
export enum CollisionLayer {
  NONE = 0,
  PLAYER = 1 << 0,      // 1
  ENEMY = 1 << 1,       // 2
  PLATFORM = 1 << 2,    // 4
  HAZARD = 1 << 3,      // 8
  WYRM = 1 << 4,        // 16
  PROJECTILE = 1 << 5,  // 32
}

export const COLLISION_MATRIX: Record<CollisionLayer, number> = {
  [CollisionLayer.NONE]: 0,
  [CollisionLayer.PLAYER]: CollisionLayer.ENEMY | CollisionLayer.PLATFORM |
                           CollisionLayer.HAZARD | CollisionLayer.WYRM |
                           CollisionLayer.PROJECTILE,
  [CollisionLayer.ENEMY]: CollisionLayer.PLAYER | CollisionLayer.PLATFORM |
                          CollisionLayer.PROJECTILE,
  [CollisionLayer.PLATFORM]: CollisionLayer.PLAYER | CollisionLayer.ENEMY,
  [CollisionLayer.HAZARD]: CollisionLayer.PLAYER,
  [CollisionLayer.WYRM]: CollisionLayer.PLAYER,
  [CollisionLayer.PROJECTILE]: CollisionLayer.PLAYER | CollisionLayer.ENEMY |
                               CollisionLayer.PLATFORM,
};

// Weapons
export type WeaponType = 'rapier' | 'broadsword' | 'bow';

export interface WeaponData {
  readonly name: string;
  readonly range: number;
  readonly speed: number;
  readonly cooldown: number;
  readonly damage: number;
  readonly knockback: number;
  readonly priority: number;
  readonly losesTo: WeaponType;
  readonly isRanged: boolean;
  readonly projectileSpeed?: number;
  readonly color: string;
  readonly width: number;
}

export const WEAPONS: Readonly<Record<WeaponType, WeaponData>> = {
  rapier: {
    name: 'Rapier',
    range: 55,
    speed: 6,
    cooldown: 20,
    damage: 1,
    knockback: 3,
    priority: 1,
    losesTo: 'broadsword',
    isRanged: false,
    color: '#555',
    width: 2,
  },
  broadsword: {
    name: 'Broadsword',
    range: 45,
    speed: 3,
    cooldown: 35,
    damage: 2,
    knockback: 8,
    priority: 2,
    losesTo: 'bow',
    isRanged: false,
    color: '#333',
    width: 6,
  },
  bow: {
    name: 'Bow',
    range: 250,
    speed: 5,
    cooldown: 40,
    damage: 1,
    knockback: 2,
    priority: 3,
    losesTo: 'rapier',
    isRanged: true,
    projectileSpeed: 12,
    color: '#664422',
    width: 2,
  },
};

export const WEAPON_CYCLE_ORDER: readonly WeaponType[] = ['rapier', 'broadsword', 'bow'];

// Enemies
export type EnemyType = 'guard' | 'brute' | 'archer' | 'runner' | 'elite';

export interface EnemyData {
  readonly weapon: WeaponType;
  readonly hp: number;
  readonly speed: number;
  readonly aggroRange: number;
  readonly attackRange: number;
  readonly shootCooldown?: number;
  readonly adapts?: boolean;
}

export const ENEMY_TYPES: Readonly<Record<EnemyType, EnemyData>> = {
  guard: { weapon: 'rapier', hp: 1, speed: 2.5, aggroRange: 200, attackRange: 45 },
  brute: { weapon: 'broadsword', hp: 2, speed: 1.5, aggroRange: 200, attackRange: 40 },
  archer: { weapon: 'bow', hp: 1, speed: 0, aggroRange: 300, attackRange: 250, shootCooldown: 90 },
  runner: { weapon: 'rapier', hp: 1, speed: 4, aggroRange: 300, attackRange: 40 },
  elite: { weapon: 'rapier', hp: 2, speed: 2, aggroRange: 250, attackRange: 50, adapts: true },
};

// AI States
export type AIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'stagger';

// Hazards
export type HazardType = 'lava' | 'spikes' | 'void';

export const COLORS = {
  bg: '#F5F5F0',
  bgAlt: '#EAEAE5',
  line: '#1A1A1A',
  lineLight: '#444',
  platform: '#2A2A2A',
  platformTop: '#3A3A3A',
  hazard: '#FF6B35',
  hazardGlow: 'rgba(255, 107, 53, 0.4)',
  wyrm: '#8B0000',
  wyrmBody: '#1A1A1A',
  wyrmHighlight: '#333',
  player: '#E63946',
  enemy: '#457B9D',
  enemyBrute: '#6A4C93',
  safe: '#4A7C59',
  projectile: '#CC3333',
  clash: '#FFD700',
  spikes: '#CC3333',
  background: '#F5F5F0',
  text: '#1A1A1A',
  accent: '#E63946',
  primary: '#457B9D',
  danger: '#CC3333',
  success: '#4A7C59',
} as const;

// Input Actions
export type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'attack'
  | 'throw'
  | 'pause';

// Game States
export type GameState =
  | 'boot'
  | 'title'
  | 'customize'
  | 'playing'
  | 'paused'
  | 'death'
  | 'gameover'
  | 'levelComplete'
  | 'victory';

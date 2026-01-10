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

// ============================================================================
// PHASE 2: Combat Feel & Polish Constants
// ============================================================================

// Attack Phases
export type AttackPhase = 'idle' | 'anticipation' | 'action' | 'impact' | 'recovery';

// Attack Frame Data (at 60 FPS)
export interface AttackFrameData {
  readonly anticipation: number;
  readonly action: number;
  readonly impact: number;
  readonly recovery: number;
  readonly total: number;
}

export const ATTACK_FRAME_DATA: Readonly<Record<WeaponType, AttackFrameData>> = {
  rapier: {
    anticipation: 3,
    action: 4,
    impact: 2,
    recovery: 7,
    total: 16, // 267ms
  },
  broadsword: {
    anticipation: 8,
    action: 5,
    impact: 4,
    recovery: 11,
    total: 28, // 467ms
  },
  bow: {
    anticipation: 10, // draw time (minimum)
    action: 0, // hold (variable, up to 60 frames)
    impact: 2, // release
    recovery: 8,
    total: 20, // minimum without hold
  },
};

// Screen Shake Configurations
export interface ScreenShakeConfig {
  readonly intensity: number;
  readonly duration: number;
  readonly decay: number;
  readonly direction: 'forward' | 'horizontal' | 'omnidirectional';
}

export const SCREEN_SHAKE_CONFIGS = {
  rapierHit: {
    intensity: 3,
    duration: 6,
    decay: 0.85,
    direction: 'forward',
  },
  broadswordHit: {
    intensity: 10,
    duration: 12,
    decay: 0.75,
    direction: 'omnidirectional',
  },
  bowHit: {
    intensity: 5,
    duration: 4,
    decay: 0.9,
    direction: 'forward',
  },
  clash: {
    intensity: 8,
    duration: 10,
    decay: 0.8,
    direction: 'omnidirectional',
  },
  playerDeath: {
    intensity: 15,
    duration: 20,
    decay: 0.7,
    direction: 'omnidirectional',
  },
  wyrmSnap: {
    intensity: 12,
    duration: 15,
    decay: 0.75,
    direction: 'horizontal',
  },
} as const satisfies Record<string, ScreenShakeConfig>;

// Hit Pause (freeze frames on impact)
export const HIT_PAUSE_FRAMES = {
  rapier: 2,
  broadsword: 4,
  bow: 2,
  clash: 3,
} as const;

// Thrown Weapon Constants
export const THROWN_WEAPON = {
  speed: 15,
  maxDistance: 300,
  gravity: 0.15,
  rotationSpeed: 0.3,
} as const;

// Unarmed Combat Constants
export const UNARMED = {
  punchRange: 15,
  punchDamage: 0.5,
  punchCooldown: 12,
  disarmWindow: 4, // frames of perfect timing for disarm
} as const;

// Slash Trail Constants
export const SLASH_TRAIL = {
  maxPoints: 8,
  fadeFrames: 5,
  baseWidth: 2,
  rapierWidth: 3,
  broadswordWidth: 8,
} as const;

// Combat Colors
export const COMBAT_COLORS = {
  slashTrail: 'rgba(255, 255, 255, 0.6)',
  slashTrailRapier: 'rgba(200, 200, 200, 0.7)',
  slashTrailBroadsword: 'rgba(150, 150, 150, 0.8)',
  impactSpark: '#FFD700',
  impactDust: '#8B8B8B',
  hitFlash: '#FFFFFF',
} as const;

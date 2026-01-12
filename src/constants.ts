/**
 * Wyrm Chase V2 - Game Constants
 *
 * All game configuration values in one place.
 * See WYRM_CHASE_V2_SPEC.md for detailed explanations.
 */

import type { WeaponType, EnemyType } from './types';

// ============================================================================
// Display
// ============================================================================

export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;
export const ASPECT_RATIO = 16 / 9;
export const SCREENS_PER_LEVEL = 5;
export const TOTAL_LEVEL_WIDTH = SCREEN_WIDTH * SCREENS_PER_LEVEL;

// Three.js world units for visible screen width (camera view is ~30 units wide)
export const SCREEN_WIDTH_UNITS = 30;

// ============================================================================
// Physics
// ============================================================================

export const TARGET_FPS = 60;
export const FIXED_TIMESTEP = 1000 / TARGET_FPS;
export const MAX_DELTA = 250;

// Note: In Three.js, Y+ is UP. Gravity pulls down (negative), jump pushes up (positive)
// Physics values tuned for Three.js units (camera view ~30 units wide)
export const GRAVITY = -0.03; // Slightly stronger gravity for snappier jumps
export const MAX_FALL_SPEED = -0.5; // Terminal velocity - prevents tunneling through thin platforms
export const PLAYER_SPEED = 0.15; // Horizontal movement (~9 units/sec at 60fps)
export const PLAYER_JUMP_FORCE = 0.5; // Upward impulse on jump (higher to reach platforms)
export const COYOTE_TIME = 6;
export const JUMP_BUFFER = 4;
export const ROLL_DURATION = 15;
export const ROLL_INVINCIBILITY = 10;
export const ROLL_SPEED = 12;

export const PIT_DEATH_Y = SCREEN_HEIGHT + 100;

// ============================================================================
// Wyrm
// ============================================================================

// Wyrm speeds are per-frame values (like PLAYER_SPEED = 0.15)
// Player can outrun wyrm at base speed, but wyrm catches up if player idles
export const WYRM_BASE_SPEED = 0.08;       // Closer to player speed (0.15) for chase pressure
export const WYRM_SURGE_MULTIPLIER = 1.5;  // 0.12 when player moves toward wyrm
export const WYRM_SLOW_MULTIPLIER = 0.7;   // 0.056 when player is far ahead
export const WYRM_SEGMENT_COUNT = 12;
export const WYRM_LEVEL_SCALING = 0.08;
export const WYRM_MAX_SPEED = 0.12;        // Can almost catch idle player, creates real pressure
export const WYRM_START_X = -15;           // Start closer so player sees wyrm quickly

// ============================================================================
// Combat
// ============================================================================

export interface WeaponData {
  readonly name: string;
  readonly range: number;
  readonly anticipationFrames: number;
  readonly activeFrames: number;
  readonly recoveryFrames: number;
  readonly damage: number;
  readonly knockback: number;
  readonly hitPauseFrames: number;
}

export const WEAPONS: Readonly<Record<Exclude<WeaponType, 'none'>, WeaponData>> = {
  rapier: {
    name: 'Rapier',
    range: 55,
    anticipationFrames: 3,
    activeFrames: 4,
    recoveryFrames: 7,
    damage: 1,
    knockback: 3,
    hitPauseFrames: 2,
  },
  broadsword: {
    name: 'Broadsword',
    range: 45,
    anticipationFrames: 6,
    activeFrames: 5,
    recoveryFrames: 10,
    damage: 2,
    knockback: 8,
    hitPauseFrames: 4,
  },
  bow: {
    name: 'Bow',
    range: 400,
    anticipationFrames: 10,
    activeFrames: 2,
    recoveryFrames: 8,
    damage: 1,
    knockback: 2,
    hitPauseFrames: 2,
  },
};

export const WEAPON_CYCLE: readonly Exclude<WeaponType, 'none'>[] = ['rapier', 'broadsword', 'bow'];

// Unarmed combat
export const PUNCH_RANGE = 20;
export const PUNCH_DAMAGE = 0.5;
export const PUNCH_COOLDOWN = 10;
export const KNOCKDOWN_DURATION = 30;
export const DISARM_WINDOW = 4;

// Thrown weapons
export const THROW_SPEED = 15;
export const THROW_GRAVITY = 0.2;
export const THROW_ROTATION = 0.4;
export const MAX_THROW_DISTANCE = 400;

// ============================================================================
// Enemies
// ============================================================================

export interface EnemyData {
  readonly weapon: Exclude<WeaponType, 'none'>;
  readonly hp: number;
  readonly speed: number;
  readonly detectionRange: number;
  readonly attackRange: number;
  readonly adapts?: boolean;
}

// NOTE: Detection and attack ranges are in Three.js units (not pixels)
// Camera view is approximately 30-40 units wide
export const ENEMIES: Readonly<Record<EnemyType, EnemyData>> = {
  guard: { weapon: 'rapier', hp: 1, speed: 0.08, detectionRange: 12, attackRange: 2 },
  brute: { weapon: 'broadsword', hp: 2, speed: 0.06, detectionRange: 10, attackRange: 1.8 },
  archer: { weapon: 'bow', hp: 1, speed: 0, detectionRange: 15, attackRange: 12 },
  runner: { weapon: 'rapier', hp: 1, speed: 0.12, detectionRange: 15, attackRange: 2 },
  elite: { weapon: 'rapier', hp: 2, speed: 0.08, detectionRange: 14, attackRange: 2, adapts: true },
};

// ============================================================================
// Camera
// ============================================================================

export const CAMERA_FOV = 50;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;
export const CAMERA_POSITION = { x: 0, y: 5, z: 20 };
export const CAMERA_LOOK_AT = { x: 0, y: 3, z: 0 };

export const CAMERA_DEADZONE_LEFT = 0.25;
export const CAMERA_DEADZONE_RIGHT = 0.65;

// ============================================================================
// Visual Effects
// ============================================================================

export interface ScreenShakeConfig {
  readonly intensity: number;
  readonly duration: number;
  readonly decay: number;
}

export const SCREEN_SHAKE = {
  rapierHit: { intensity: 3, duration: 100, decay: 0.85 },
  broadswordHit: { intensity: 8, duration: 150, decay: 0.75 },
  clash: { intensity: 6, duration: 120, decay: 0.8 },
  wyrmClose: { intensity: 2, duration: 50, decay: 0.9 },
  playerDeath: { intensity: 12, duration: 200, decay: 0.7 },
} as const satisfies Record<string, ScreenShakeConfig>;

// ============================================================================
// Colors
// ============================================================================

export const COLORS = {
  // Backgrounds
  bgDark: 0x1a1a2e,
  bgMid: 0x16213e,
  bgLight: 0x0f3460,

  // Characters
  player: 0xe94560,
  enemy: 0x4ea8de,
  wyrm: 0x7b2cbf,
  wyrmGlow: 0xc77dff,

  // Environment
  platform: 0x2d3436,
  platformEdge: 0x636e72,
  hazard: 0xff6b35,

  // Effects
  slash: 0xffffff,
  impact: 0xffd93d,
} as const;

// ============================================================================
// System Priorities
// ============================================================================

export const SYSTEM_PRIORITY = {
  Input: 0,
  AI: 10,
  Fencing: 20,
  Combat: 25,
  ThrownWeapon: 26,
  Roll: 27,
  Movement: 30,
  Collision: 40,
  Hazard: 45,
  Wyrm: 50,
  ScreenTransition: 55,
  Camera: 60,
  Ghost: 65,
  Particle: 70,
  Animation: 75,
  UI: 90,
  Render: 100,
} as const;

// ============================================================================
// Wyrm Behavior (extracted from WyrmSystem)
// ============================================================================

export const WYRM_BEHAVIOR = {
  Y_TRACKING_LERP: 0.02,
  SEGMENT_FOLLOW_LERP: 0.3,
  WAVE_AMPLITUDE: 0.5,
  WAVE_FREQUENCY: 0.1,
  COLLISION_DISTANCE: 2.0,
  SHAKE_TRIGGER_DISTANCE: 10.0,
  FAR_AHEAD_DISTANCE: 20.0,
  MIN_SPEED_MULTIPLIER: 0.5,
  SEGMENT_OFFSET: 1.5,
  SEGMENT_PHASE_OFFSET: 0.5,
  SEGMENT_SPACING: 1.2,
} as const;

// ============================================================================
// AI Behavior (extracted from AISystem)
// ============================================================================

export const AI_BEHAVIOR = {
  DECISION_COOLDOWN_FRAMES: 10,
  RETREAT_DISTANCE: 4,
  RETREAT_DURATION_FRAMES: 30,
  DISENGAGE_RANGE_MULTIPLIER: 1.2,
  COUNTER_PROBABILITY: 0.3,
  RETREAT_SPEED_MULTIPLIER: 0.7,
} as const;

// ============================================================================
// Combat Detection (extracted from CombatSystem)
// ============================================================================

export const COMBAT_DETECTION = {
  DEFAULT_MELEE_RANGE: 2.0,
  VERTICAL_HIT_TOLERANCE: 1.5,
  CANVAS_TO_THREEJS_SCALE: 25,
  DIVE_KICK_VELOCITY: { vx: 0.3, vy: -0.4 },
  TRIP_RANGE: 1.5,
  KNOCKDOWN_FRAMES: 30,
  PARRY_SCREEN_SHAKE: { intensity: 6, duration: 120 },
  DAMAGE_SCREEN_SHAKE: { intensity: 7, duration: 150 },
  DEFAULT_HIT_PAUSE_FRAMES: 2,
} as const;

// ============================================================================
// Thrown Weapon Physics (extracted from ThrownWeaponSystem)
// ============================================================================

export const THROWN_WEAPON = {
  GROUND_LEVEL: 0.5,
  PROJECTILE_HIT_RADIUS: 0.8,
  VERTICAL_HIT_TOLERANCE: 1.0,
  PICKUP_RADIUS: 1.0,
  PLATFORM_COLLISION_TOLERANCE: 0.5,
  // Frame time conversion factor (ms to per-frame)
  FRAME_TIME_FACTOR: 0.016,
  // Weapon mesh dimensions
  BLADE: {
    LONG_LENGTH: 0.9,
    SHORT_LENGTH: 0.7,
    WIDE_WIDTH: 0.08,
    NARROW_WIDTH: 0.04,
    DEPTH: 0.02,
  },
  HILT: {
    LENGTH: 0.15,
    WIDTH: 0.08,
    DEPTH: 0.04,
  },
  // Stuck weapon rotation angles
  STUCK_ANGLE_DOWN: Math.PI / 4,
  STUCK_ANGLE_FLAT: Math.PI / 2,
} as const;

// ============================================================================
// Collision System (extracted from CollisionSystem)
// ============================================================================

export const COLLISION = {
  ONE_WAY_EPSILON: 0.15,
} as const;

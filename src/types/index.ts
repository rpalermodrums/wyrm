/**
 * Wyrm Chase V2 - Type Definitions
 *
 * Core type definitions for the ECS architecture and game systems.
 * See WYRM_CHASE_V2_SPEC.md for full documentation.
 */

import type * as THREE from 'three';

// ============================================================================
// ECS Core Types
// ============================================================================

export interface Component {
  readonly type: string;
}

export interface Entity {
  readonly id: string;
  readonly components: Map<string, Component>;
  addComponent<T extends Component>(component: T): void;
  getComponent<T extends Component>(type: string): T | undefined;
  hasComponent(type: string): boolean;
  hasComponents(types: readonly string[]): boolean;
  removeComponent(type: string): void;
}

export interface System {
  readonly name: string;
  readonly requiredComponents: readonly string[];
  readonly priority: number;
  update(entities: Entity[], deltaTime: number): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
}

export interface World {
  createEntity(): Entity;
  destroyEntity(id: string): void;
  getEntity(id: string): Entity | undefined;
  query(componentTypes: readonly string[]): Entity[];
  queryOne(componentTypes: readonly string[]): Entity | undefined;
  addSystem(system: System): void;
  removeSystem(name: string): void;
  getSystem(name: string): System | undefined;
  update(deltaTime: number): void;
  clear(): void;
  getAllEntities(): Entity[];
  readonly entityCount: number;
  /** Notify systems that an entity is fully configured. Call after adding components. */
  notifyEntityReady(entity: Entity): void;
  /** Process all queued entity destructions immediately. Call after unloadLevel(). */
  processDestructions(): void;
}

// ============================================================================
// Component Types
// ============================================================================

export interface TransformComponent extends Component {
  type: 'transform';
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: { x: number; y: number; z: number };
}

export interface VelocityComponent extends Component {
  type: 'velocity';
  vx: number;
  vy: number;
  vz: number;
}

export interface ColliderComponent extends Component {
  type: 'collider';
  width: number;
  height: number;
  depth: number;
  offsetX: number;
  offsetY: number;
  layer: CollisionLayer;
  mask: number;
}

export interface FencerComponent extends Component {
  type: 'fencer';
  swordPosition: SwordPosition;
  isLunging: boolean;
  lungeFrame: number;
  canParry: boolean;
  disarmWindow: number;
  facingRight: boolean;
}

export interface WeaponComponent extends Component {
  type: 'weapon';
  weaponType: WeaponType;
  attackCooldown: number;
  isAttacking: boolean;
  attackPhase: AttackPhase;
  attackFrame: number;
}

export interface HealthComponent extends Component {
  type: 'health';
  current: number;
  max: number;
  invincibilityFrames: number;
  isKnockedDown: boolean;
  knockdownFrames: number;
}

export interface AIComponent extends Component {
  type: 'ai';
  aiType: EnemyType;
  state: AIState;
  targetEntityId: string | null;
  detectionRange: number;
  attackRange: number;
  decisionCooldown: number;
}

export interface WyrmComponent extends Component {
  type: 'wyrm';
  segments: Array<{ x: number; y: number; z: number; baseY?: number }>;
  baseSpeed: number;
  currentSpeed: number;
  targetY: number;
}

export interface ThreeObjectComponent extends Component {
  type: 'threeObject';
  object: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
}

export interface PlayerControlledComponent extends Component {
  type: 'playerControlled';
  isGrounded: boolean;
  coyoteFrames: number;
  jumpBufferFrames: number;
  rollFrames: number;
  isRolling: boolean;
}

export interface PlatformComponent extends Component {
  type: 'platform';
  isOneWay: boolean;
}

export interface HazardComponent extends Component {
  type: 'hazard';
  hazardType: HazardType;
}

export interface GhostComponent extends Component {
  type: 'ghost';
  life: number;
  maxLife: number;
  opacity: number;
}

export interface ThrownWeaponComponent extends Component {
  type: 'thrownWeapon';
  weaponType: WeaponType;
  ownerId: string;           // Who threw it (can't damage self)
  direction: number;         // 1 for right, -1 for left
  traveledDistance: number;  // Track for MAX_THROW_DISTANCE
  rotation: number;          // Visual spin
  canBePickedUp: boolean;    // True when stuck in ground/wall
  stuckIn: 'ground' | 'wall' | null;
}

// ============================================================================
// Game State Types
// ============================================================================

export type SwordPosition = 'high' | 'mid' | 'low';

export type WeaponType = 'rapier' | 'broadsword' | 'bow' | 'none';

export type HazardType = 'pit' | 'spikes';

export type AttackPhase = 'idle' | 'anticipation' | 'active' | 'recovery';

export type EnemyType = 'guard' | 'brute' | 'archer' | 'runner' | 'elite';

export type AIState = 'idle' | 'patrol' | 'engage' | 'attack' | 'retreat' | 'dead';

export type GameState = 'loading' | 'title' | 'playing' | 'paused' | 'death' | 'victory' | 'gameover';

export type InputAction = 'moveLeft' | 'moveRight' | 'jump' | 'swordUp' | 'swordDown' | 'attack' | 'throw' | 'roll' | 'pause';

// ============================================================================
// Collision Types
// ============================================================================

export enum CollisionLayer {
  NONE = 0,
  PLAYER = 1 << 0,
  ENEMY = 1 << 1,
  PLATFORM = 1 << 2,
  HAZARD = 1 << 3,
  WYRM = 1 << 4,
  PROJECTILE = 1 << 5,
}

// ============================================================================
// Event Types
// ============================================================================

export type GameEvent =
  | { type: 'playerDeath'; cause: 'wyrm' | 'pit' | 'enemy' }
  | { type: 'enemyDeath'; entityId: string; droppedWeapon: WeaponType }
  | { type: 'weaponClash'; entityA: string; entityB: string; x: number; y: number }
  | { type: 'disarm'; victimId: string; weapon: WeaponType }
  | { type: 'parry'; defenderId: string; attackerId: string }
  | { type: 'screenShake'; intensity: number; duration: number }
  | { type: 'hitPause'; frames: number }
  | { type: 'levelComplete' }
  | { type: 'gameOver' }
  | { type: 'weaponThrown'; entityId: string; weapon: WeaponType; x: number; y: number; direction: number }
  | { type: 'screenTransition'; direction: 'right'; newScreen: number; totalScreens: number }
  | { type: 'gameStateChange'; newState: GameState }
  | { type: 'entityHit'; entityId: string; damage: number }
  | { type: 'entityJump'; entityId: string; x: number; y: number }
  | { type: 'entityLand'; entityId: string; x: number; y: number };

export interface EventBus {
  emit(event: GameEvent): void;
  on<T extends GameEvent['type']>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): void;
  off<T extends GameEvent['type']>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): void;
}

// ============================================================================
// Level Types
// ============================================================================

export interface LevelData {
  readonly id: string;
  readonly name: string;
  readonly screens: readonly ScreenData[];
}

export interface ScreenData {
  readonly index: number;
  readonly platforms: readonly PlatformData[];
  readonly enemies: readonly EnemySpawnData[];
  readonly hazards: readonly HazardData[];
}

export interface PlatformData {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isOneWay?: boolean;
}

export interface EnemySpawnData {
  readonly x: number;
  readonly y: number;
  readonly type: EnemyType;
  readonly facingRight: boolean;
}

export interface HazardData {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly type: HazardType;
}

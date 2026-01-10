// src/types/index.ts - Core type definitions for Wyrm Chase

import { CollisionLayer } from '../constants';
import type { WeaponType, EnemyType, HazardType, AIState } from '../constants';

// Re-export types from constants for convenience
export type { WeaponType, EnemyType, HazardType, AIState };
export { CollisionLayer };

// ============================================================================
// ECS Types
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
  removeComponent(type: string): void;
  hasComponents(types: string[]): boolean;
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
  query(componentTypes: string[]): Entity[];
  queryOne(componentTypes: string[]): Entity | undefined;
  addSystem(system: System): void;
  removeSystem(name: string): void;
  update(deltaTime: number): void;
  clear(): void;
  getAllEntities(): Entity[];
}

// ============================================================================
// Component Types
// ============================================================================

export interface TransformComponent extends Component {
  readonly type: 'transform';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  rotation: number;
  scale: number;
}

export interface VelocityComponent extends Component {
  readonly type: 'velocity';
  vx: number;
  vy: number;
  maxSpeed: number;
}

export interface ColliderComponent extends Component {
  readonly type: 'collider';
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  layer: CollisionLayer;
  solid: boolean;
}

export interface HealthComponent extends Component {
  readonly type: 'health';
  current: number;
  max: number;
  lives: number;
  iframes: number;
}

export interface WeaponComponent extends Component {
  readonly type: 'weapon';
  weaponType: WeaponType | null;
  cooldown: number;
  attackTimer: number;
}

export type AttackPhase = 'idle' | 'anticipation' | 'action' | 'impact' | 'recovery';

export interface EnhancedWeaponComponent extends Component {
  readonly type: 'enhancedWeapon';
  weaponType: WeaponType | null;
  phase: AttackPhase;
  phaseTimer: number;
  cooldown: number;
  isThrown: boolean;
  holdTime: number;
}

export interface CombatComponent extends Component {
  readonly type: 'combat';
  attacking: boolean;
  facing: 1 | -1;
  hitStun: number;
}

export interface EnhancedCombatComponent extends Component {
  readonly type: 'enhancedCombat';
  attacking: boolean;
  facing: 1 | -1;
  hitStun: number;
  hitPauseFrames: number;
  isUnarmed: boolean;
  canDisarm: boolean;
  disarmWindow: number;
}

export interface AIComponent extends Component {
  readonly type: 'ai';
  enemyType: EnemyType;
  state: AIState;
  stateTimer: number;
  aggroRange: number;
  attackRange: number;
  homeX: number;
  patrolDir: 1 | -1;
  shootCooldown: number;
}

export interface WyrmComponent extends Component {
  readonly type: 'wyrm';
  segments: Array<{ x: number; y: number }>;
  targetY: number;
  baseSpeed: number;
  currentSpeed: number;
}

export interface SpriteComponent extends Component {
  readonly type: 'sprite';
  animation: string;
  frame: number;
  color: string;
}

export interface PlayerControlledComponent extends Component {
  readonly type: 'playerControlled';
  coyoteTime: number;
  jumpBuffer: number;
  grounded: boolean;
}

export interface PlatformComponent extends Component {
  readonly type: 'platform';
  platformType: 'ground' | 'platform';
}

export interface HazardComponent extends Component {
  readonly type: 'hazard';
  hazardType: HazardType;
}

export interface ProjectileComponent extends Component {
  readonly type: 'projectile';
  owner: 'player' | 'enemy';
  weaponType: WeaponType;
  life: number;
}

export interface ThrownWeaponComponent extends Component {
  readonly type: 'thrownWeapon';
  weaponType: WeaponType;
  owner: 'player' | 'enemy';
  distanceTraveled: number;
  rotation: number;
  stuck: boolean;
}

export interface ExitZoneComponent extends Component {
  readonly type: 'exitZone';
}

// ============================================================================
// Event Types
// ============================================================================

export type GameEvent =
  | { type: 'playerDeath'; cause: 'hit' | 'hazard' | 'wyrm' | 'pit' }
  | { type: 'enemyDeath'; enemyId: string }
  | { type: 'weaponCycle'; newWeapon: WeaponType }
  | { type: 'screenTransition'; from: number; to: number }
  | { type: 'levelComplete'; levelIndex: number }
  | { type: 'clash'; x: number; y: number }
  | { type: 'screenShake'; intensity: number; duration: number }
  | { type: 'spawnParticles'; x: number; y: number; color: string; count: number }
  | { type: 'gameOver' }
  | { type: 'victory' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'shootProjectile'; x: number; y: number; direction: 1 | -1; owner: 'player' | 'enemy'; weapon: WeaponType }
  | { type: 'hitPause'; frames: number }
  | { type: 'throwWeapon'; x: number; y: number; direction: 1 | -1; owner: 'player' | 'enemy'; weapon: WeaponType }
  | { type: 'weaponPickup'; entityId: string; weapon: WeaponType }
  | { type: 'weaponDrop'; x: number; y: number; weapon: WeaponType }
  | { type: 'disarm'; entityId: string }
  | { type: 'combatHit'; attackerId: string; targetId: string; weapon: WeaponType; x: number; y: number };

export type GameEventType = GameEvent['type'];

export type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

export interface EventBus {
  emit<T extends GameEvent>(event: T): void;
  on<T extends GameEventType>(
    type: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>
  ): () => void;
  off(type: GameEventType, handler: EventHandler): void;
  clear(): void;
}

// ============================================================================
// Scene Types
// ============================================================================

export interface Scene {
  readonly name: string;
  enter(): void | Promise<void>;
  exit(): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  pause?(): void;
  resume?(): void;
}

export interface SceneManager {
  addScene(name: string, scene: Scene): void;
  transition(name: string): Promise<void>;
  push(name: string): Promise<void>;
  pop(): void;
  replace(name: string): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  getCurrentScene(): Scene | undefined;
}

// ============================================================================
// Level Types
// ============================================================================

export interface LevelData {
  id: string;
  name: string;
  screens: ScreenData[];
  wyrmConfig: WyrmConfig;
}

export interface ScreenData {
  platforms: PlatformData[];
  enemies: EnemySpawnData[];
  hazards: HazardData[];
  pits?: PitData[];
}

export interface PlatformData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnemySpawnData {
  x: number;
  y: number;
  type: EnemyType;
  weapon: WeaponType;
}

export interface HazardData {
  x: number;
  y: number;
  w: number;
  h: number;
  type: HazardType;
}

export interface PitData {
  x: number;
  y: number;
  w: number;
}

export interface WyrmConfig {
  baseSpeed: number;
  surgeMultiplier: number;
  slowMultiplier: number;
}

// ============================================================================
// Input Types
// ============================================================================

export interface InputState {
  readonly left: boolean;
  readonly right: boolean;
  readonly jump: boolean;
  readonly jumpPressed: boolean;
  readonly attack: boolean;
  readonly attackPressed: boolean;
  readonly pause: boolean;
  readonly pausePressed: boolean;
}

export interface InputAdapter {
  update(): void;
  isDown(action: string): boolean;
  isPressed(action: string): boolean;
  getAxis(axis: 'horizontal' | 'vertical'): number;
}

// ============================================================================
// Rendering Types
// ============================================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ClashEffect {
  x: number;
  y: number;
  timer: number;
}

export interface SlashTrailPoint {
  x: number;
  y: number;
  age: number;
}

export interface SlashTrail {
  points: SlashTrailPoint[];
  weaponType: WeaponType;
  facing: 1 | -1;
}

// ============================================================================
// Game Config Types
// ============================================================================

export interface GameConfig {
  startingLives: number;
  startingWeapon: WeaponType;
  playerColor: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export const DEFAULT_CONFIG: GameConfig = {
  startingLives: 3,
  startingWeapon: 'rapier',
  playerColor: '#E63946',
  soundEnabled: true,
  musicEnabled: true,
};

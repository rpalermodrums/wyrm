# Wyrm Chase V2 - Complete Specification

> **Purpose**: This document provides complete context for building Wyrm Chase V2 from scratch using Three.js. It captures all learnings from the Canvas 2D MVP and research on Nidhogg mechanics.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Core Concept & Differentiation](#core-concept--differentiation)
3. [Game Mechanics](#game-mechanics)
4. [Level Design](#level-design)
5. [Visual Design](#visual-design)
6. [Technical Architecture](#technical-architecture)
7. [Implementation Priorities](#implementation-priorities)
8. [Learnings from MVP](#learnings-from-mvp)
9. [Reference Materials](#reference-materials)

---

## Product Overview

### Elevator Pitch

**Wyrm Chase** is a single-player survival chase game inspired by Nidhogg's fencing mechanics. The player must escape through 5 connected screens while a relentless wyrm-dragon pursues from behind. Combat is skill-based with sword positioning, parrying, and strategic weapon throwing.

### Key Differences from Nidhogg

| Nidhogg | Wyrm Chase |
|---------|------------|
| 2-player competitive | Single-player survival |
| Tug-of-war (reach opponent's end) | Linear escape (reach exit before wyrm catches you) |
| Respawns on death | Limited lives or instant wyrm death |
| Face opponent throughout | Face forward (toward exit), enemies spawn ahead |
| Both players have same goal | Player escapes, wyrm chases |

### Target Experience

- **Tension**: The wyrm is always approaching - standing still means death
- **Skill Expression**: Fencing mechanics reward mastery (parrying, disarming, positioning)
- **Flow State**: Fast-paced action with micro-decisions every moment
- **Spectacle**: Dramatic 3D visuals with impactful combat effects

---

## Core Concept & Differentiation

### The Chase Dynamic

Unlike Nidhogg where players fight each other in a tug-of-war, Wyrm Chase creates tension through:

1. **Constant Pursuit**: The wyrm never stops advancing
2. **Forward Pressure**: Enemies spawn ahead, blocking progress
3. **Resource Management**: Throwing your weapon leaves you vulnerable
4. **Risk/Reward**: Fighting enemies costs time, but they drop weapons

### Win/Lose Conditions

**Win**: Reach the exit zone at the end of screen 5
**Lose**:
- Wyrm catches player (instant death)
- Fall into pit/hazard (respawn, but wyrm catches up)
- Run out of lives (optional game mode)

---

## Game Mechanics

### Movement System

Based on Nidhogg's movement with adaptations for 3D:

| Action | Input | Description |
|--------|-------|-------------|
| **Run** | Left/Right | Full speed horizontal movement |
| **Duck** | Down | Lower stance, avoid high attacks |
| **Jump** | Space/W | Standard jump with coyote time |
| **Roll** | Down + Direction while moving | Fast dodge, invincibility frames |
| **Roll-Jump** | Jump while crouched/rolling | Curled jump, keeps head low |
| **Dive Kick** | Down + Attack in air | High-risk attack, disarms on hit |
| **Wall Climb** | Jump at wall edge | Grab and climb ledges |

**Movement Constants**:
```
PLAYER_SPEED = 8
JUMP_FORCE = -16
GRAVITY = 0.8
COYOTE_TIME = 6 frames (100ms)
JUMP_BUFFER = 4 frames (67ms)
ROLL_DURATION = 15 frames
ROLL_INVINCIBILITY = 10 frames
ROLL_SPEED = 12 (1.5x normal)
```

### Fencing Combat System

The core of Nidhogg's brilliance - adapted for single-player:

#### Sword Positions

Three heights that form a rock-paper-scissors dynamic:

```
HIGH (Up held):     ----▲
                       |

MID (Neutral):      ----▲

LOW (Down held):       |
                    ----▲
```

| Position | Beats | Loses To | Notes |
|----------|-------|----------|-------|
| HIGH | MID | LOW | Good for overhead attacks |
| MID | LOW | HIGH | Default stance, balanced |
| LOW | HIGH | MID | Longest reach, sweeping attacks |

#### Attack Actions

| Action | Input | Effect |
|--------|-------|--------|
| **Lunge** | Attack | Quick forward thrust at current height |
| **Parry** | Match opponent's height | Automatic block, brief stagger |
| **Disarm** | Cross blades while your sword passes theirs | Knocks sword away |
| **Throw** | Throw key | Hurl sword as projectile |

**Attack Frame Data** (at 60 FPS):
```
RAPIER:
  Anticipation: 3 frames
  Active: 4 frames
  Recovery: 7 frames
  Total: 14 frames (~233ms)

BROADSWORD:
  Anticipation: 6 frames
  Active: 5 frames
  Recovery: 10 frames
  Total: 21 frames (~350ms)
```

#### Parrying & Disarming

**Parry**: When both swords are at the same height and one player lunges, the defender automatically blocks if their sword tip is positioned beyond the attacker's.

**Disarm**: When crossing blades (swords at same height, close range), if your sword passes more than halfway across the opponent's blade, you knock their weapon away.

**Draw Attack**: When drawing your sword (recovering from throw or pickup), if at the same height as opponent, you can disarm them.

#### Thrown Weapons

- Sword travels in arc affected by gravity
- Can be blocked by holding sword at MID or HIGH
- Can be ducked under
- Sticks in platforms/walls and can be picked up

```
THROW_SPEED = 15
THROW_GRAVITY = 0.2
THROW_ROTATION = 0.4 rad/frame
MAX_THROW_DISTANCE = 400
```

### Unarmed Combat

When disarmed:

| Action | Input | Effect |
|--------|-------|--------|
| **Punch** | Attack | Quick jab, 2 hits = knockdown |
| **Trip** | Attack while crouched | Leg sweep, knockdown |
| **Grab** | Close range | Can throw opponent |
| **Dive Kick** | Down + Attack in air | Disarms opponent on connect |

```
PUNCH_RANGE = 20
PUNCH_COOLDOWN = 10 frames
KNOCKDOWN_DURATION = 30 frames
```

### The Wyrm

The wyrm is the primary threat driving urgency:

**Behavior**:
- Constantly advances from left side of screen
- Speed scales with player behavior and level
- Segmented body creates visual menace
- Undulates vertically to track player's Y position

**Speed Dynamics**:
```
BASE_SPEED = 2.0
SURGE (player moves backward) = +50%
CATCHUP (player too far ahead) = -30%
LEVEL_SCALING = +8% per level
MAX_SPEED = 5.0
```

**Wyrm Segments**:
- 12 segments following the head
- Head tracks player's Y with lag
- Body segments follow with wave motion
- Creates serpentine movement pattern

### Weapon Types

Three weapon types with distinct playstyles:

#### Rapier (Default)
- Fastest attacks
- Medium range
- Standard damage
- Best for aggressive play

#### Broadsword
- Slow attacks
- Short range
- High damage + knockback
- Better disarm window
- Best for defensive/timing play

#### Bow (Ranged)
- Charge to draw
- Long range projectile
- Can be parried at close range
- Best for keeping distance

**Weapon Cycle**: When you kill an enemy, you get their weapon. When you die, you respawn with next weapon in cycle: Rapier → Broadsword → Bow → Rapier

### Enemy Types

| Type | Weapon | HP | Speed | Behavior |
|------|--------|----|----|----------|
| **Guard** | Rapier | 1 | 3 | Standard fencing AI |
| **Brute** | Broadsword | 2 | 2 | Slow but deadly swings |
| **Archer** | Bow | 1 | 0 | Stationary, fires arrows |
| **Runner** | Rapier | 1 | 5 | Aggressive chase AI |
| **Elite** | Adapts | 2 | 3 | Counters your weapon type |

**AI Behaviors**:
- **Guard**: Maintains distance, lunges when in range, parries
- **Brute**: Advances slowly, big wind-up attacks
- **Archer**: Tracks player, fires at intervals
- **Runner**: Sprints toward player, aggressive attacks
- **Elite**: Switches stance to counter player's weapon

---

## Level Design

### Screen Structure

Each level = 5 connected screens (like Nidhogg's 4-screen stages)

```
[Screen 1] → [Screen 2] → [Screen 3] → [Screen 4] → [Screen 5 + EXIT]
    ↑
  WYRM ENTERS
```

**Screen Dimensions**:
```
SCREEN_WIDTH = 1280 (gameplay) / fits 16:9 viewport
SCREEN_HEIGHT = 720
TOTAL_LEVEL_WIDTH = 6400 (5 × 1280)
```

### Platform Philosophy

From Nidhogg's designer: "Avoid overly lethal traps that made standing still dangerous"

**Design Principles**:
1. Platforms create combat arenas, not deathtraps
2. Pits should be jumpable with skill, not random deaths
3. Elevation changes force weapon stance decisions
4. Choke points create tension but allow skillful passage

### Screen Types

1. **Flat Arena**: Open combat area, tests fencing skill
2. **Platforming Challenge**: Vertical movement, pit jumps
3. **Gauntlet**: Multiple enemies, tests efficiency
4. **Boss Arena**: Elite enemy encounter
5. **Exit Screen**: Final dash to victory

### Environmental Elements

| Element | Effect |
|---------|--------|
| **Platform** | Solid ground, blocks movement |
| **Pit** | Fall = death, respawn behind |
| **Wall** | Blocks horizontal movement, climbable |
| **Ledge** | Can grab and climb |
| **Hazard Glow** | Visual warning for pits |

---

## Visual Design

### Art Direction

**Style**: Modern minimalist with depth

- Clean geometric shapes (not pixel art)
- High contrast silhouettes
- Strategic color for emphasis
- Smooth animations with "game feel"

**Color Palette**:
```javascript
COLORS = {
  // Backgrounds
  bgDark: '#1a1a2e',
  bgMid: '#16213e',
  bgLight: '#0f3460',

  // Characters
  player: '#e94560',      // Vibrant red
  enemy: '#4ea8de',       // Cool blue
  wyrm: '#7b2cbf',        // Menacing purple
  wyrmGlow: '#c77dff',    // Wyrm highlight

  // Environment
  platform: '#2d3436',    // Dark gray
  platformEdge: '#636e72', // Light gray edge
  hazard: '#ff6b35',      // Warning orange

  // Effects
  slash: '#ffffff',       // White trails
  impact: '#ffd93d',      // Gold sparks
  blood: '#9d0208',       // Dark red
}
```

### Three.js Implementation

**Camera Setup**:
```javascript
// Side-scrolling 2.5D perspective
camera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 1000);
camera.position.set(0, 5, 20);  // Elevated, looking slightly down
camera.lookAt(0, 3, 0);

// Camera follows player with deadzone
const CAMERA_DEADZONE_LEFT = 0.25;   // 25% from left
const CAMERA_DEADZONE_RIGHT = 0.65;  // 65% from left (player stays left-ish)
```

**Character Rendering**:
- Stick figures using `THREE.Line` or thin `BoxGeometry`
- Skeletal animation for smooth movement
- Sprite-based alternative for stylized look

**Parallax Layers**:
```javascript
PARALLAX = {
  wyrm: 0.0,        // Fixed to camera (always visible)
  foreground: 1.0,  // Moves with player
  midground: 0.5,   // Half speed
  background: 0.2,  // Slow drift
  sky: 0.1,         // Very slow
}
```

### Visual Effects

**Combat Effects**:
- Slash trails (fading polyline behind sword)
- Impact sparks (particle burst)
- Screen shake (camera offset)
- Hit pause (freeze frames)
- Screen flash (overlay opacity pulse)

**Screen Shake Configs**:
```javascript
SHAKE = {
  rapierHit: { intensity: 3, duration: 100, decay: 0.85 },
  broadswordHit: { intensity: 8, duration: 150, decay: 0.75 },
  clash: { intensity: 6, duration: 120, decay: 0.8 },
  wyrmClose: { intensity: 2, duration: 50, decay: 0.9 }, // Rumble when wyrm is near
}
```

**Hit Pause** (freeze frames on impact):
```javascript
HIT_PAUSE = {
  rapier: 2,      // frames
  broadsword: 4,
  clash: 3,
}
```

---

## Technical Architecture

### ECS Pattern (Entity-Component-System)

Proven pattern from MVP - keep it:

```typescript
interface Entity {
  readonly id: string;
  addComponent<T extends Component>(component: T): void;
  getComponent<T extends Component>(type: string): T | undefined;
  hasComponent(type: string): boolean;
  removeComponent(type: string): void;
}

interface Component {
  readonly type: string;
}

interface System {
  readonly name: string;
  readonly requiredComponents: readonly string[];
  readonly priority: number;
  update(entities: Entity[], deltaTime: number): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
}

interface World {
  createEntity(): Entity;
  destroyEntity(id: string): void;
  query(componentTypes: string[]): Entity[];
  queryOne(componentTypes: string[]): Entity | undefined;
  addSystem(system: System): void;
  update(deltaTime: number): void;
}
```

### Core Components

```typescript
// Transform - Position and rotation in 3D space
interface TransformComponent extends Component {
  type: 'transform';
  x: number;
  y: number;
  z: number;
  rotation: number;  // Y-axis rotation for facing direction
  scale: { x: number; y: number; z: number };
}

// Velocity - Physics movement
interface VelocityComponent extends Component {
  type: 'velocity';
  vx: number;
  vy: number;
  vz: number;  // Usually 0 for 2.5D
}

// Collider - Hitbox for collision detection
interface ColliderComponent extends Component {
  type: 'collider';
  width: number;
  height: number;
  depth: number;  // For 2.5D, usually thin
  offsetX: number;
  offsetY: number;
  layer: CollisionLayer;
  mask: number;  // Bitmask of layers to collide with
}

// Fencer - Fencing combat state
interface FencerComponent extends Component {
  type: 'fencer';
  swordPosition: 'high' | 'mid' | 'low';
  isLunging: boolean;
  lungeFrame: number;
  canParry: boolean;
  disarmWindow: number;  // Frames remaining where disarm is possible
  facingRight: boolean;
}

// Weapon - Currently held weapon
interface WeaponComponent extends Component {
  type: 'weapon';
  weaponType: 'rapier' | 'broadsword' | 'bow' | 'none';
  attackCooldown: number;
  isAttacking: boolean;
  attackPhase: 'idle' | 'anticipation' | 'active' | 'recovery';
  attackFrame: number;
}

// Health - Damage tracking
interface HealthComponent extends Component {
  type: 'health';
  current: number;
  max: number;
  invincibilityFrames: number;
  isKnockedDown: boolean;
  knockdownFrames: number;
}

// AI - Enemy behavior
interface AIComponent extends Component {
  type: 'ai';
  state: 'idle' | 'patrol' | 'engage' | 'attack' | 'retreat' | 'dead';
  targetEntity: string | null;
  detectionRange: number;
  attackRange: number;
  decisionCooldown: number;
}

// Wyrm - Wyrm-specific data
interface WyrmComponent extends Component {
  type: 'wyrm';
  segments: { x: number; y: number; z: number }[];
  baseSpeed: number;
  currentSpeed: number;
  targetY: number;
  isVisible: boolean;
}

// ThreeObject - Reference to Three.js scene object
interface ThreeObjectComponent extends Component {
  type: 'threeObject';
  object: THREE.Object3D;
  mixer?: THREE.AnimationMixer;  // For animated models
}
```

### System Priority Order

```typescript
const SYSTEM_PRIORITIES = {
  InputSystem: 0,        // Read input first
  AISystem: 10,          // AI decisions
  FencingSystem: 20,     // Sword positioning, parrying
  CombatSystem: 25,      // Attack resolution
  MovementSystem: 30,    // Apply velocities
  CollisionSystem: 40,   // Resolve collisions
  WyrmSystem: 50,        // Wyrm chase logic
  CameraSystem: 60,      // Camera follow
  AnimationSystem: 70,   // Update animations
  RenderSystem: 100,     // Always last
};
```

### Event System

Decoupled communication (proven in MVP):

```typescript
type GameEvent =
  | { type: 'playerDeath'; cause: 'wyrm' | 'pit' | 'enemy' }
  | { type: 'enemyDeath'; entityId: string; weapon: WeaponType }
  | { type: 'weaponClash'; entityA: string; entityB: string }
  | { type: 'disarm'; victim: string; weapon: WeaponType }
  | { type: 'parry'; defender: string; attacker: string }
  | { type: 'screenShake'; config: ScreenShakeConfig }
  | { type: 'hitPause'; frames: number }
  | { type: 'levelComplete' }
  | { type: 'gameOver' };

interface EventBus {
  emit(event: GameEvent): void;
  on(type: string, handler: (event: GameEvent) => void): void;
  off(type: string, handler: (event: GameEvent) => void): void;
}
```

### Input Handling

**CRITICAL LEARNING**: Use singleton pattern with edge-triggered detection

```typescript
class InputManager {
  private static instance: InputManager;

  private keysDown: Set<string> = new Set();
  private keysJustPressed: Set<string> = new Set();
  private keysJustReleased: Set<string> = new Set();

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.keysDown.has(e.code)) {
      this.keysJustPressed.add(e.code);
      this.keysDown.add(e.code);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    this.keysJustReleased.add(e.code);
  }

  isDown(action: InputAction): boolean { /* ... */ }
  justPressed(action: InputAction): boolean { /* ... */ }
  justReleased(action: InputAction): boolean { /* ... */ }

  // Call at END of frame to clear edge-triggered state
  endFrame(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }
}
```

### Game Loop

Fixed timestep with interpolated rendering:

```typescript
const FIXED_TIMESTEP = 1000 / 60;  // 16.67ms
const MAX_DELTA = 250;              // Prevent death spiral

class GameLoop {
  private accumulator = 0;
  private lastTime = 0;

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  private tick(currentTime: number): void {
    const deltaTime = Math.min(currentTime - this.lastTime, MAX_DELTA);
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.world.update(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    // Interpolated render
    const alpha = this.accumulator / FIXED_TIMESTEP;
    this.renderer.render(alpha);

    // Clear edge-triggered input at frame end
    InputManager.getInstance().endFrame();

    requestAnimationFrame(this.tick.bind(this));
  }
}
```

---

## Implementation Priorities

### Phase 1: Core Movement (Week 1)

1. Three.js scene setup with camera
2. Player entity with stick figure rendering
3. Horizontal movement and jump
4. Platform collision
5. Camera following player

### Phase 2: Fencing Combat (Week 2)

1. Sword position system (high/mid/low)
2. Lunge attack with frame data
3. Parry system (automatic when sword heights match)
4. Disarm mechanic
5. Hit effects (shake, pause, flash)

### Phase 3: Enemies & AI (Week 3)

1. Enemy spawning from level data
2. Basic guard AI (approach, attack, retreat)
3. Combat resolution (player vs enemy)
4. Death and respawn handling

### Phase 4: Wyrm Chase (Week 4)

1. Wyrm entity with segmented body
2. Wyrm movement and speed dynamics
3. Wyrm-player collision (death)
4. Screen shake when wyrm is close

### Phase 5: Level System (Week 5)

1. Level data format (JSON)
2. Screen transitions
3. Exit zone and victory
4. Multiple levels

### Phase 6: Polish (Week 6)

1. Particle effects
2. Sound effects and music
3. Menu system
4. Game feel tuning

---

## Learnings from MVP

### What Worked Well

1. **ECS Architecture**: Clean separation of concerns, easy to add new features
2. **Event Bus**: Decoupled systems communicate without tight coupling
3. **Fixed Timestep**: Consistent physics regardless of frame rate
4. **Singleton Input**: Prevented race conditions with input state
5. **World.queryOne()**: Efficient single-entity lookups

### What to Improve

1. **Type Safety**: Use stricter types for components, avoid `any`
2. **System Dependencies**: Make it explicit when systems need World reference
3. **Render vs Physics**: Separate render entities from physics entities
4. **Animation State**: Use proper state machine for animations
5. **Collision Layers**: Bitmask system works, keep it

### Bugs Fixed in MVP

| Bug | Root Cause | Solution |
|-----|------------|----------|
| Jump not working | `KeyboardInput.update()` called by multiple systems, clearing justPressed | Singleton with frame-end clear |
| Combat not dealing damage | Only handled mutual attacks, not attacker vs defender | Added `resolveAttacksOnDefenders()` |
| Wyrm not chasing | WyrmSystem couldn't find player (wrong component filter) | Added `setWorld()` for cross-queries |
| Thrown weapon invisible | Too small, too fast | Increased size, added trail |

### Architecture Patterns to Keep

```typescript
// Systems that need cross-entity queries store world reference
class WyrmSystem implements System {
  private world: World | null = null;

  setWorld(world: World): void {
    this.world = world;
  }

  update(entities: Entity[], dt: number): void {
    const player = this.world?.queryOne(['player', 'transform']);
    // ...
  }
}

// Factory pattern for entity creation
function createPlayer(world: World, x: number, y: number): Entity {
  const entity = world.createEntity();
  entity.addComponent({ type: 'transform', x, y, z: 0, rotation: 0, scale: { x: 1, y: 1, z: 1 } });
  entity.addComponent({ type: 'velocity', vx: 0, vy: 0, vz: 0 });
  entity.addComponent({ type: 'player' });
  entity.addComponent({ type: 'fencer', swordPosition: 'mid', isLunging: false, ... });
  // ... etc
  return entity;
}
```

---

## Reference Materials

### Old Code Location

All MVP code has been moved to: `./old-game-reference/`

**Key files to reference**:
- `old-game-reference/src/ecs/World.ts` - ECS implementation
- `old-game-reference/src/ecs/Entity.ts` - Entity class
- `old-game-reference/src/input/KeyboardInput.ts` - Singleton input pattern
- `old-game-reference/src/systems/CombatSystem.ts` - Combat resolution
- `old-game-reference/src/systems/WyrmSystem.ts` - Wyrm chase logic
- `old-game-reference/src/constants.ts` - Game constants and weapon data

### Three.js Skill

See `.claude/skills/threejs-builder/` for:
- SKILL.md - Core patterns and coordinate system
- references/game-patterns.md - Animation, state machines, effects
- references/gltf-loading-guide.md - Loading 3D models

### External Resources

**Nidhogg Mechanics**:
- [Wikipedia - Nidhogg](https://en.wikipedia.org/wiki/Nidhogg_(video_game))
- [Vice - Building a Better Nidhogg](https://www.vice.com/en/article/building-a-better-nidhogg/)
- [Steam Guide - Nidhogg Mechanics](https://steamcommunity.com/sharedfiles/filedetails/?id=216329928)

---

## Quick Start for New Agent

1. Read this spec fully
2. Review `.claude/skills/threejs-builder/SKILL.md` for Three.js patterns
3. Reference `old-game-reference/src/` for ECS and input patterns
4. Start with Phase 1: Core Movement
5. Test frequently with dev server (`npm run dev`)

**First task**: Set up Three.js scene with player stick figure that can move and jump.

# WYRM CHASE - Parallel Agent Development Prompt

## Context

You are a lead orchestration agent responsible for building **Wyrm Chase**, a single-player survival chase game. Your job is to spawn and coordinate multiple specialized coding agents that will work in parallel on different parts of the codebase.

Before writing any code, you must complete a planning phase and **pause for human review**.

---

## Project Overview

**Wyrm Chase** is a Nidhogg-inspired survival game where players flee from a pursuing wyrm-dragon through increasingly challenging screens. Key features:

- 5 levels × 5 screens each (25 total screens)
- 3-weapon rock-paper-scissors combat (Rapier → Bow → Broadsword → Rapier)
- Weapons cycle on kill or death
- Constant wyrm pursuit creating tension
- Stick-figure minimalist aesthetic (black/white with color accents)
- Web-first with path to Steam via Tauri

**Tech Stack:**
- TypeScript 5.x
- HTML5 Canvas 2D (custom engine, no Phaser)
- Vite for bundling
- Vitest for testing
- ECS-lite architecture

---

## Agent Spawning Strategy

You will spawn **6 specialized agents** that can work in parallel with minimal merge conflicts. Each agent owns a distinct vertical slice of the codebase.

### Agent Assignments

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGENT DEPENDENCY GRAPH                           │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  AGENT 1: CORE  │
                    │  (must complete │
                    │   first)        │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
   │ AGENT 2:      │ │ AGENT 3:      │ │ AGENT 4:      │
   │ PLAYER &      │ │ ENEMIES &     │ │ LEVELS &      │
   │ COMBAT        │ │ WYRM          │ │ RENDERING     │
   └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AGENT 5: UI &  │
                    │  SCENES         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AGENT 6:       │
                    │  INTEGRATION &  │
                    │  POLISH         │
                    └─────────────────┘
```

---

## Agent 1: Core Engine

**Ownership:** `src/core/`, `src/ecs/`, `src/utils/`, `src/types/`

**Responsibilities:**
- Game loop with fixed timestep (60Hz physics, interpolated rendering)
- Canvas abstraction and context management
- Camera/viewport system
- Event bus for decoupled communication
- ECS foundation: Entity, Component, System, World
- Utility classes: Vector2, AABB, Timer, ObjectPool
- TypeScript type definitions

**Key Interfaces to Define:**
```typescript
interface Component { readonly type: string; }
interface System {
  readonly requiredComponents: string[];
  update(entities: Entity[], dt: number): void;
}
interface Entity {
  id: string;
  components: Map<string, Component>;
  addComponent<T extends Component>(c: T): void;
  getComponent<T extends Component>(type: string): T | undefined;
  hasComponent(type: string): boolean;
}
```

**Deliverables:**
- [ ] GameLoop.ts with accumulator-based fixed timestep
- [ ] Canvas.ts wrapper with scaling/resolution handling
- [ ] Camera.ts with viewport bounds and shake support
- [ ] Events.ts pub/sub event bus
- [ ] Complete ECS implementation
- [ ] Vector2, AABB, Timer, ObjectPool utilities
- [ ] Global type definitions

**Test Requirements:**
- Game loop timing accuracy tests
- ECS query performance tests
- Vector2 math tests

---

## Agent 2: Player & Combat

**Ownership:** `src/components/player/`, `src/systems/InputSystem.ts`, `src/systems/MovementSystem.ts`, `src/systems/CombatSystem.ts`, `src/input/`

**Responsibilities:**
- Player entity factory with all required components
- Input abstraction (keyboard + gamepad)
- Movement physics: gravity, friction, coyote time, jump buffering
- Combat system: attack states, hitboxes, cooldowns
- Weapon definitions with distinct properties
- Rock-paper-scissors priority resolution
- Projectile spawning for bow
- Hit stun and knockback

**Weapon Data:**
```typescript
const WEAPONS = {
  rapier: { range: 55, speed: 6, cooldown: 20, knockback: 3, losesTo: 'broadsword' },
  broadsword: { range: 45, speed: 3, cooldown: 35, knockback: 8, damage: 2, losesTo: 'bow' },
  bow: { range: 250, cooldown: 40, isRanged: true, projectileSpeed: 12, losesTo: 'rapier' }
};
```

**Deliverables:**
- [ ] Transform, Velocity, Collider, Health, Weapon, Combat components
- [ ] PlayerControlled marker component
- [ ] InputSystem.ts with action mapping
- [ ] KeyboardInput.ts and GamepadInput.ts adapters
- [ ] MovementSystem.ts with platformer physics
- [ ] CombatSystem.ts with priority resolution
- [ ] Player.ts entity factory

**Test Requirements:**
- Coyote time window tests
- Jump buffer tests
- Weapon priority matrix tests (all 9 matchups)
- Input action mapping tests

---

## Agent 3: Enemies & Wyrm

**Ownership:** `src/components/ai/`, `src/systems/AISystem.ts`, `src/systems/WyrmSystem.ts`, `src/entities/Enemy.ts`, `src/entities/Wyrm.ts`

**Responsibilities:**
- AI component with behavior state machine
- Enemy variants: Guard (rapier), Brute (broadsword), Archer (bow), Runner (fast), Elite (adapts)
- Enemy behavior: idle, patrol, chase, attack states
- Wyrm entity with segmented body
- Wyrm pursuit logic: base speed, surge on player retreat, slow when ahead
- Wyrm Y-tracking (follows player loosely)

**Enemy Definitions:**
```typescript
const ENEMY_TYPES = {
  guard: { weapon: 'rapier', hp: 1, speed: 2.5, aggroRange: 200, attackRange: 45 },
  brute: { weapon: 'broadsword', hp: 2, speed: 1.5, aggroRange: 200, attackRange: 40 },
  archer: { weapon: 'bow', hp: 1, speed: 0, aggroRange: 300, attackRange: 250, shootCooldown: 90 },
  runner: { weapon: 'rapier', hp: 1, speed: 4, aggroRange: 300, attackRange: 40 },
  elite: { weapon: 'cycles', hp: 2, speed: 2, aggroRange: 250, attackRange: 50, adapts: true }
};
```

**Wyrm Behavior:**
```typescript
// Speed modifiers
baseSpeed: 1.8
surgeMultiplier: 1.5    // when player moves toward wyrm
slowMultiplier: 0.7     // when player is 2+ screens ahead
levelScaling: +5%       // per level
```

**Deliverables:**
- [ ] AI component with state machine
- [ ] Wyrm component with segment data
- [ ] AISystem.ts with behavior tree logic
- [ ] WyrmSystem.ts with pursuit mechanics
- [ ] Enemy.ts factory for all variants
- [ ] Wyrm.ts entity factory

**Test Requirements:**
- AI state transition tests
- Wyrm speed calculation tests
- Enemy aggro range tests

---

## Agent 4: Levels & Rendering

**Ownership:** `src/levels/`, `src/rendering/`, `src/systems/RenderSystem.ts`, `src/systems/CollisionSystem.ts`

**Responsibilities:**
- Level JSON schema and loader
- Platform and hazard entity factories
- Spatial partitioning grid for collision
- AABB collision detection and response
- Collision layers (player, enemy, platform, hazard, wyrm, projectile)
- Stick figure rendering with poses
- Wyrm rendering with segments
- Platform rendering with sketch aesthetic
- Hazard rendering (lava glow, spikes)
- Particle system
- Screen shake effect

**Level Schema:**
```typescript
interface LevelData {
  id: string;
  name: string;
  screens: ScreenData[];
  wyrmConfig: { baseSpeed: number; surgeMultiplier: number; };
}

interface ScreenData {
  id: string;
  platforms: { x: number; y: number; w: number; h: number; }[];
  enemies: { x: number; y: number; type: string; weapon: string; }[];
  hazards: { x: number; y: number; w: number; h: number; type: string; }[];
  playerSpawn: { x: number; y: number; };
  exitZone: { x: number; y: number; w: number; h: number; };
}
```

**Collision Layers:**
```typescript
enum Layer {
  PLAYER = 1 << 0,
  ENEMY = 1 << 1,
  PLATFORM = 1 << 2,
  HAZARD = 1 << 3,
  WYRM = 1 << 4,
  PROJECTILE = 1 << 5
}

const COLLISION_MATRIX = {
  [Layer.PLAYER]: Layer.ENEMY | Layer.PLATFORM | Layer.HAZARD | Layer.WYRM | Layer.PROJECTILE,
  [Layer.ENEMY]: Layer.PLAYER | Layer.PLATFORM | Layer.PROJECTILE,
  // ... etc
};
```

**Deliverables:**
- [ ] LevelLoader.ts with JSON parsing and validation
- [ ] Level 1 JSON data (3-5 screens for MVP)
- [ ] Platform.ts and Hazard.ts entity factories
- [ ] CollisionSystem.ts with spatial grid
- [ ] RenderSystem.ts with layer ordering
- [ ] SpriteRenderer.ts (stick figures)
- [ ] PrimitiveRenderer.ts (platforms, hazards)
- [ ] ParticleSystem.ts
- [ ] ScreenShake.ts

**Test Requirements:**
- Level JSON validation tests
- Collision detection accuracy tests
- Spatial grid query performance tests

---

## Agent 5: UI & Scenes

**Ownership:** `src/scenes/`, `src/managers/`, `src/ui/`

**Responsibilities:**
- Scene base class with lifecycle hooks
- Scene manager with transitions
- TitleScene with menu
- GameScene (main gameplay orchestration)
- PauseScene overlay
- DeathScene (brief, shows lives)
- GameOverScene with stats
- LevelCompleteScene
- VictoryScene
- HUD rendering (lives, weapon, level indicator)
- Asset loading and caching
- Audio manager (placeholder/stubs for now)
- Config manager with localStorage persistence

**Scene Lifecycle:**
```typescript
interface Scene {
  enter(): void | Promise<void>;
  exit(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  pause?(): void;
  resume?(): void;
}
```

**Deliverables:**
- [ ] Scene.ts base class
- [ ] SceneManager.ts with stack-based scenes
- [ ] All scene implementations
- [ ] HUD.ts rendering class
- [ ] AssetManager.ts with preloading
- [ ] AudioManager.ts (stub implementation)
- [ ] ConfigManager.ts with settings persistence

**Test Requirements:**
- Scene transition tests
- Config persistence tests
- Asset loading tests

---

## Agent 6: Integration & Polish

**Ownership:** `src/main.ts`, `src/Game.ts`, build configuration, cross-cutting concerns

**Responsibilities:**
- Main entry point setup
- Game class that wires everything together
- Vite configuration
- Build optimization
- Tauri configuration (for desktop)
- Performance profiling and optimization
- Bug fixes from integration
- Final polish: timing, feel, juice
- README and documentation

**Deliverables:**
- [ ] main.ts entry point
- [ ] Game.ts orchestration class
- [ ] vite.config.ts optimized for production
- [ ] tauri.conf.json (desktop wrapper)
- [ ] Performance audit and fixes
- [ ] README.md with setup instructions
- [ ] Final integration testing

---

## Planning Phase Requirements

Before any agent writes code, you must complete:

### 1. Interface Contracts

Define the exact interfaces each agent will implement. All agents must agree on:
- Component interfaces
- System interfaces  
- Entity factory signatures
- Event names and payloads
- Shared constants (physics values, weapon data, colors)

### 2. File Ownership Map

Create explicit file ownership to prevent conflicts:
```
Agent 1: src/core/*, src/ecs/*, src/utils/*, src/types/*
Agent 2: src/components/player/*, src/systems/Input*, src/systems/Movement*, src/systems/Combat*, src/input/*
Agent 3: src/components/ai/*, src/systems/AI*, src/systems/Wyrm*, src/entities/Enemy.ts, src/entities/Wyrm.ts
Agent 4: src/levels/*, src/rendering/*, src/systems/Render*, src/systems/Collision*, src/entities/Platform.ts, src/entities/Hazard.ts
Agent 5: src/scenes/*, src/managers/*, src/ui/*
Agent 6: src/main.ts, src/Game.ts, config files, docs
```

### 3. Dependency Order

Confirm the build order:
1. **Phase 1:** Agent 1 (Core) - must complete before others can integrate
2. **Phase 2:** Agents 2, 3, 4 (can work in parallel)
3. **Phase 3:** Agent 5 (depends on 2, 3, 4 for scene content)
4. **Phase 4:** Agent 6 (integration after all others)

### 4. Shared Constants File

Agent 1 must create `src/constants.ts` with all shared values that other agents will import:
- Physics constants (gravity, speeds, timings)
- Weapon definitions
- Enemy definitions
- Color palette
- Layer enums
- Screen dimensions

### 5. Communication Protocol

Define how agents will communicate during development:
- Shared types in `src/types/`
- Events via the event bus (Agent 1 defines, others use)
- No direct cross-agent imports except through defined interfaces

---

## ⚠️ CHECKPOINT: PAUSE FOR REVIEW

**Before proceeding to code generation, STOP and present the following for human review:**

1. **Interface Contracts Document** - All TypeScript interfaces that define agent boundaries
2. **File Ownership Map** - Explicit list of which agent owns which files
3. **Dependency Graph** - Visual confirmation of build order
4. **Shared Constants** - The exact content of constants.ts
5. **Risk Assessment** - Potential integration issues and mitigation strategies
6. **Estimated Complexity** - Per-agent effort estimate (S/M/L)
7. **Test Strategy** - What tests each agent must write

**Format your planning output as:**
```
## PLANNING PHASE COMPLETE - AWAITING REVIEW

### Interface Contracts
[List all interfaces]

### File Ownership
[Table of agent → files]

### Shared Constants
[Exact TypeScript code]

### Risk Assessment
[Bullet points]

### Complexity Estimates
[Table of agent → S/M/L]

### Test Coverage Plan
[Per-agent test requirements]

---
⏸️ PAUSED - Please review the above plan and respond with:
- "APPROVED" to proceed with code generation
- "REVISE: [feedback]" to request changes
```

---

## Code Generation Phase

**Only after receiving "APPROVED"**, proceed with:

1. Generate Agent 1 code first (blocking)
2. Generate Agents 2, 3, 4 code in parallel
3. Generate Agent 5 code
4. Generate Agent 6 code
5. Run integration tests
6. Report completion status

Each agent should output:
- All source files for their ownership area
- Corresponding test files
- Brief implementation notes

---

## Success Criteria

The project is complete when:
- [ ] Game runs at 60 FPS in browser
- [ ] Player can complete Level 1 (3+ screens)
- [ ] All 3 weapons function with correct priority
- [ ] Wyrm pursuit creates tension
- [ ] Enemies exhibit correct AI behavior
- [ ] Deaths and weapon cycling work
- [ ] Pause/resume functions
- [ ] Game over and victory states work
- [ ] No console errors
- [ ] All tests pass

---

## Notes for Orchestration Agent

- Spawn agents with clear context boundaries
- Each agent should be stateless and idempotent
- Use the event bus for runtime communication
- Prefer composition over inheritance
- Keep components pure data, systems pure logic
- Optimize for readability over cleverness
- Comment non-obvious code
- Follow the existing prototype's feel and timing

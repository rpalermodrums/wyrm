# Wyrm Chase - AI Agent Guidelines

> Custom TypeScript game engine using HTML5 Canvas 2D with ECS architecture.

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # TypeScript compile + Vite production build
npm run preview          # Preview production build locally

# Type Checking
npm run typecheck        # Run tsc --noEmit (MUST pass before commits)

# Testing
npm test                 # Run all tests once
npm run test:watch       # Run tests in watch mode
npm test -- path/to/file.test.ts           # Run single test file
npm test -- -t "test name"                 # Run tests matching name
npm test -- path/to/file.test.ts -t "name" # Single file + name filter
```

---

## Architecture Overview

```
src/
├── core/           # Engine: GameLoop, Canvas, Camera, Events
├── ecs/            # Entity-Component-System: Entity, World
├── components/     # Pure data components (Transform, Velocity, etc.)
├── systems/        # Logic processors (Input, Movement, Combat, AI, Render)
├── entities/       # Entity factories (Player, Enemy, Wyrm, Platform)
├── scenes/         # Game scenes (Title, Game, Pause, Death, Victory)
├── managers/       # Singletons (Scene, Asset, Audio, Config)
├── rendering/      # Drawing utilities (Sprite, Primitive, Particle)
├── levels/         # Level loader + JSON data
├── input/          # Input adapters (Keyboard, Gamepad)
├── utils/          # Math utilities (Vector2, AABB, Timer, ObjectPool)
├── types/          # TypeScript type definitions
└── constants.ts    # ALL shared constants (import from here)
```

---

## Code Style

### Imports
```typescript
// 1. Type imports first (use `import type`)
import type { Entity, System, Component } from '../types';

// 2. Then value imports
import { GRAVITY, COLORS, CollisionLayer } from '../constants';
import { Vector2 } from '../utils/Vector2';

// Use path alias for deep imports
import type { WeaponData } from '@/types';
```

### Types & Interfaces
```typescript
// Use `readonly` for immutable properties
interface WeaponData {
  readonly name: string;
  readonly damage: number;
}

// Use `as const` for literal objects
export const COLORS = {
  bg: '#F5F5F0',
  line: '#1A1A1A',
} as const;

// Prefer type aliases for unions
type WeaponType = 'rapier' | 'broadsword' | 'bow';
type AIState = 'idle' | 'patrol' | 'chase' | 'attack';

// Enums only for bitmasks
enum CollisionLayer {
  PLAYER = 1 << 0,
  ENEMY = 1 << 1,
}
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `GameLoop`, `World`, `InputSystem` |
| Interfaces | PascalCase | `Entity`, `Component`, `System` |
| Type aliases | PascalCase | `WeaponType`, `AIState` |
| Constants | SCREAMING_SNAKE | `GRAVITY`, `CANVAS_WIDTH`, `FIXED_TIMESTEP` |
| Functions/methods | camelCase | `createEntity()`, `getComponent()` |
| Variables | camelCase | `deltaTime`, `accumulator` |
| Files (classes) | PascalCase | `GameLoop.ts`, `Vector2.ts` |
| Files (types) | lowercase | `index.ts` |

### Components (ECS Pattern)
Components are **pure data objects** with a `type` discriminator:
```typescript
interface TransformComponent extends Component {
  readonly type: 'transform';
  x: number;
  y: number;
}

// Create component
const transform: TransformComponent = { type: 'transform', x: 0, y: 0 };
```

### Systems (ECS Pattern)
Systems process entities with required components:
```typescript
interface System {
  readonly name: string;
  readonly requiredComponents: readonly string[];
  readonly priority: number;  // Lower = runs first
  update(entities: Entity[], deltaTime: number): void;
}

// Priority order: Input(0) → Movement(10) → Combat(20) → AI(30) → Collision(40) → Render(100)
```

### Error Handling
```typescript
// Use early returns for guards
getEntity(id: string): Entity | undefined {
  return this.entities.get(id);  // Return undefined, don't throw
}

// Throw only for programmer errors
constructor(container: HTMLElement | null) {
  if (!container) {
    throw new Error('Container element not found');
  }
}
```

### Strict TypeScript Rules
The project uses strict TypeScript. Handle these patterns:

```typescript
// noUncheckedIndexedAccess: Array access returns T | undefined
const entity = entities[0];
if (entity) {
  entity.update();  // Safe after check
}

// exactOptionalPropertyTypes: undefined must be explicit
interface Config {
  volume?: number;  // Can be number or missing, NOT undefined
}

// Prefer optional chaining
const weapon = entity.getComponent<WeaponComponent>('weapon');
weapon?.attack();  // Safe
```

---

## Critical Patterns

### Constants Centralization
ALL game constants live in `src/constants.ts`. Never hardcode values:
```typescript
// WRONG
const gravity = 0.6;

// RIGHT
import { GRAVITY } from '../constants';
```

### Event-Driven Communication
Use the EventBus for decoupled systems:
```typescript
// Emit events, don't call methods directly
events.emit({ type: 'playerDeath', cause: 'wyrm' });
events.emit({ type: 'screenShake', intensity: 10, duration: 20 });

// Subscribe in systems
events.on('playerDeath', (e) => this.handleDeath(e.cause));
```

### Fixed Timestep
Physics runs at 60 FPS fixed timestep. Use `deltaTime` parameter, not real time:
```typescript
update(entities: Entity[], deltaTime: number): void {
  // deltaTime is always FIXED_TIMESTEP (16.67ms)
  entity.x += entity.vx * deltaTime;
}
```

---

## Anti-Patterns (NEVER DO)

```typescript
// NEVER suppress types
const data = response as any;        // NO
// @ts-ignore                        // NO
// @ts-expect-error                  // NO

// NEVER use `let` when `const` works
let x = 5;  // NO if never reassigned

// NEVER mutate shared constants
WEAPONS.rapier.damage = 999;  // NO (use Readonly<>)

// NEVER create entities outside factories
const player = new Entity();  // NO
const player = createPlayer(x, y);  // YES

// NEVER hardcode physics values
velocity.y += 0.6;  // NO
velocity.y += GRAVITY;  // YES
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| All constants | `src/constants.ts` |
| All types | `src/types/index.ts` |
| Game entry | `src/main.ts` |
| Game orchestrator | `src/Game.ts` |
| ECS world | `src/ecs/World.ts` |
| Main gameplay | `src/scenes/GameScene.ts` |

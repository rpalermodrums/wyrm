# Wyrm Chase V2 - Development Guide

> **Read `WYRM_CHASE_V2_SPEC.md` first** for complete game design, mechanics, and technical architecture.

## Project Overview

Wyrm Chase is a single-player survival chase game built with **Three.js** and **TypeScript**. The player escapes through 5 connected screens while a wyrm-dragon pursues from behind. Combat uses Nidhogg-inspired fencing mechanics.

**Current Status**: Phases 1-5 complete. Core movement, fencing combat, enemies, wyrm chase, and multi-level system implemented. Phase 6 (polish) is next.

## Architecture

### ECS Pattern (Entity-Component-System)

This project uses a strict ECS architecture:

- **Entities** (`src/ecs/Entity.ts`): Just IDs with component containers
- **Components** (`src/types/index.ts`): Pure data, no logic
- **Systems** (`src/systems/`): All game logic lives here
- **World** (`src/ecs/World.ts`): Manages entities and runs systems

```typescript
// Creating an entity with components
const player = world.createEntity();
player.addComponent({ type: 'transform', x: 0, y: 0, z: 0, rotation: 0, scale: { x: 1, y: 1, z: 1 } });
player.addComponent({ type: 'velocity', vx: 0, vy: 0, vz: 0 });
player.addComponent({ type: 'playerControlled', isGrounded: false, ... });
```

### System Priority Order

Systems run in priority order (lower = earlier):

| Priority | System | Purpose |
|----------|--------|---------|
| 0 | InputSystem | Read player input |
| 10 | AISystem | Enemy decisions |
| 20 | FencingSystem | Sword positions, parrying |
| 25 | CombatSystem | Attack resolution |
| 30 | MovementSystem | Apply velocities |
| 40 | CollisionSystem | Resolve collisions |
| 50 | WyrmSystem | Wyrm chase logic |
| 55 | ScreenTransitionSystem | Detect screen boundaries, emit transitions |
| 60 | CameraSystem | Camera follow and panning |
| 100 | RenderSystem | Always last |

### Event-Driven Communication

Systems communicate via `EventBus` (`src/core/Events.ts`):

```typescript
// Emitting events
events.emit({ type: 'playerDeath', cause: 'wyrm' });
events.emit({ type: 'screenShake', intensity: 5, duration: 100 });

// Listening for events
events.on('enemyDeath', (event) => {
  spawnWeaponPickup(event.entityId, event.droppedWeapon);
});
```

## Code Style

### TypeScript Conventions

1. **Prefer immutable variables** - Use `const` unless mutation is absolutely necessary
2. **Strict types** - No `any`, define proper interfaces
3. **Readonly where possible** - Mark arrays and objects as `readonly` when they shouldn't change

```typescript
// Good
const position = { x: 0, y: 0 };
const entities: readonly Entity[] = world.query(['transform']);

// Avoid
let position = { x: 0, y: 0 };  // 'let' when 'const' would work
const entities: any[] = world.query(['transform']);  // 'any' type
```

### Component Design

Components are pure data with a `type` discriminator:

```typescript
interface TransformComponent extends Component {
  type: 'transform';  // Discriminator for type narrowing
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: { x: number; y: number; z: number };
}
```

### Debug Logging (REQUIRED)

All systems and factories MUST include debug logging:

```typescript
const DEBUG = true;  // Toggle for production
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[SystemName] ${msg}`, ...args);
};

// Usage
log(`State transition: ${oldState} -> ${newState}`);
log(`Entity created at (${x}, ${y})`);
```

Log these events:
- System initialization
- State transitions
- Entity creation/destruction
- Collisions and combat events
- Position updates (sparingly)

### System Design

Systems declare their required components and priority:

```typescript
class MovementSystem implements System {
  readonly name = 'MovementSystem';
  readonly requiredComponents = ['transform', 'velocity'] as const;
  readonly priority = 30;

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      const velocity = entity.getComponent<VelocityComponent>('velocity');
      if (!transform || !velocity) continue;

      transform.x += velocity.vx * deltaTime;
      transform.y += velocity.vy * deltaTime;
    }
  }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `WYRM_CHASE_V2_SPEC.md` | Complete game design and technical spec |
| `PHASE_6_PROMPT.md` | Phase 6 handoff document (current) |
| `src/main.ts` | Game entry point and orchestration |
| `src/constants.ts` | All configuration values (physics, speeds, colors) |
| `src/types/index.ts` | TypeScript interfaces |
| `src/ecs/World.ts` | ECS world container |
| `src/core/Events.ts` | Event bus |
| `src/core/GameLoop.ts` | Fixed timestep loop (deltaTime in ms!) |
| `src/input/InputManager.ts` | Singleton input handler |
| `src/rendering/ThreeRenderer.ts` | Three.js setup |
| `src/entities/PlayerFactory.ts` | Player entity creation pattern |
| `src/entities/WyrmFactory.ts` | Wyrm entity with segments |
| `src/entities/EnemyFactory.ts` | Enemy entity creation |
| `src/systems/WyrmSystem.ts` | Wyrm chase logic |
| `src/systems/CombatSystem.ts` | Attack phases, hit detection |
| `src/systems/AISystem.ts` | Enemy state machine |
| `src/systems/ScreenTransitionSystem.ts` | Screen boundary detection |
| `src/levels/LevelLoader.ts` | Level management functions |
| `src/levels/Level1.ts` | Level 1 data (5 screens) |
| `src/levels/Level2.ts` | Level 2 data |
| `src/levels/Level3.ts` | Level 3 data |

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Type check (run before committing)
npm run typecheck

# Run tests
npm test

# Build for production
npm run build
```

## Three.js Patterns

### Coordinate System

Three.js uses right-handed coordinates:
- +X = right
- +Y = up
- +Z = toward camera

For this 2.5D game, gameplay happens on the XY plane with Z used for depth/layering.

### Adding Objects to Scene

```typescript
// Through the renderer
renderer.add(mesh);
renderer.remove(mesh);

// Store reference in ThreeObjectComponent
entity.addComponent({
  type: 'threeObject',
  object: mesh,
});
```

### Camera Setup

The camera is positioned for a side-scrolling view:
- Position: (0, 5, 20) - elevated, looking at gameplay
- FOV: 50 - moderate perspective
- Follows player with deadzone

## Common Pitfalls (Learned from MVP)

### 1. Input Race Conditions

**Problem**: Multiple systems calling `input.update()` clears `justPressed` before all systems read it.

**Solution**: Use singleton `InputManager` with frame-end clearing:
```typescript
// In game loop, AFTER all updates
InputManager.getInstance().endFrame();
```

### 2. Cross-Entity Queries in Systems

**Problem**: Systems only receive entities matching their `requiredComponents`, can't find other entities.

**Solution**: Store world reference in systems that need cross-queries:
```typescript
class WyrmSystem implements System {
  private world: World | null = null;

  setWorld(world: World): void {
    this.world = world;
  }

  update(entities: Entity[], dt: number): void {
    const player = this.world?.queryOne(['playerControlled', 'transform']);
    // Now we can access the player from the wyrm system
  }
}
```

### 3. Animation Mixer Cleanup

**Problem**: Removing entities without cleaning up Three.js mixers causes memory leaks.

**Solution**: Clean up in `onEntityRemoved`:
```typescript
onEntityRemoved(entity: Entity): void {
  const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');
  if (threeObj?.mixer) {
    threeObj.mixer.stopAllAction();
  }
  if (threeObj?.object) {
    this.renderer.remove(threeObj.object);
  }
}
```

### 4. Frame-Based Movement (NOT Time-Based)

**Problem**: Using `deltaTime` multiplication with per-frame speeds causes 60x faster movement.

**Why**: The game loop passes `FIXED_TIMESTEP` (~16.67ms) as deltaTime. All physics values are per-frame, not per-second.

**WRONG**:
```typescript
transform.x += speed * deltaTime;  // 0.15 * 16.67 = 2.5 units per frame!
```

**CORRECT**:
```typescript
transform.x += speed;  // 0.15 units per frame as intended
```

**Rule**: Never multiply per-frame physics values by deltaTime. Check MovementSystem for the correct pattern.

### 5. Canvas 2D to Three.js Unit Scale

**Problem**: Old constants from Canvas 2D are in pixels (screen is 1280px wide). Three.js camera view is ~30 units wide.

**Solution**: Scale all physics values by ~25-50x:
| Concept | Canvas 2D | Three.js |
|---------|-----------|----------|
| Player speed | 8 | 0.15 |
| Jump force | 16 | 0.5 |
| Gravity | -0.8 | -0.03 |
| Detection range | 400 | 12 |

### 6. Entity Notification Timing

**Problem**: `World.createEntity()` triggers `onEntityAdded` before components exist.

**Solution**: ALL factories must call `world.notifyEntityReady(entity)` after adding all components.

### 7. Platform Blocking Player Movement

**Problem**: Elevated platforms that aren't marked as one-way will block horizontal movement, trapping the player.

**Why**: The CollisionSystem resolves collisions by pushing the entity out along the axis with minimum overlap. If a player approaches a platform from the side, they get pushed back horizontally.

**Solution**: Mark all elevated platforms as `isOneWay: true` in level data:
```typescript
{ x: 8, y: 2, width: 5, height: 0.5, isOneWay: true }  // Correct
{ x: 8, y: 2, width: 5, height: 0.5 }  // WRONG - will block player
```

One-way platforms allow jumping through from below but provide solid ground when landing on top.

### 8. RenderSystem Entity Adding

**Problem**: New entities might not appear in the scene even though they're created.

**Solution**: Ensure the RenderSystem's `onEntityAdded` is called by:
1. Adding all components to the entity first
2. Calling `world.notifyEntityReady(entity)` at the end of the factory function
3. Verifying the entity has both `transform` and `threeObject` components

The RenderSystem logs entity additions when DEBUG=true.

## Testing

Tests go in `src/**/*.test.ts` (colocated) or `tests/` directory.

```typescript
import { describe, it, expect } from 'vitest';
import { World } from './ecs/World';

describe('World', () => {
  it('creates entities with unique IDs', () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    expect(e1.id).not.toBe(e2.id);
  });
});
```

## Reference Code

The original Canvas 2D implementation is preserved in `old-game-reference/` for reference:
- `old-game-reference/src/` - Original source code
- `old-game-reference/HANDOFF.md` - Session notes and bug fixes
- `old-game-reference/session-*.md` - Development session transcripts

## Implementation Phases

See `WYRM_CHASE_V2_SPEC.md` for detailed phases. Summary:

1. **Phase 1**: Core movement (player, jump, platforms)
2. **Phase 2**: Fencing combat (sword positions, attacks, parrying)
3. **Phase 3**: Enemies & AI
4. **Phase 4**: Wyrm chase
5. **Phase 5**: Level system
6. **Phase 6**: Polish (effects, sound, menus)

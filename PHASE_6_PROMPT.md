# Phase 6: Polish - Handoff Document

> **Read `WYRM_CHASE_V2_SPEC.md` and `CLAUDE.md` first** for complete game design and codebase conventions.

## Summary

**Wyrm Chase V2** is a single-player survival chase game built with **Three.js** and **TypeScript**. The player escapes through multi-screen levels while a wyrm-dragon pursues from behind. Combat uses Nidhogg-inspired fencing mechanics.

## What Has Been Accomplished

### Phase 1-4 (Core Game)
- **Player movement**: WASD/Arrow keys for movement, Space to jump
- **Fencing combat**: W/S for sword positions (high/mid/low), J to attack
- **ECS Architecture**: Entity-Component-System pattern with priority-sorted systems
- **Three.js rendering**: 2.5D side-scrolling view with stick figure characters
- **Wyrm chase**: Purple wyrm with body segments chases player from left
- **Enemy AI**: Guards detect player, engage, attack, and retreat
- **Collision system**: AABB collision with one-way platform support

### Phase 5 (Multi-Level System)
- **Three levels**: Level1 (The Escape), Level2, Level3 with increasing difficulty
- **Screen transitions**: ScreenTransitionSystem detects boundary crossings
- **Camera panning**: CameraSystem.panTo() for smooth transitions between screens
- **Wyrm speed scaling**: 8% speed increase per level (WYRM_LEVEL_SCALING)
- **Level management**: loadLevel, unloadLevel, getLevelData, getTotalLevels functions
- **Event-driven progression**: screenTransition, levelComplete, gameOver events

## What's Next: Phase 6 (Polish)

### Primary Goals
1. **Visual Effects**
   - Screen shake on hits (CombatEffects exists, needs tuning)
   - Hit pause/freeze frames for combat impact
   - Particle effects for sword clashes, deaths
   - Visual feedback for parries

2. **Audio**
   - Background music per level
   - Sound effects: sword clash, footsteps, jump, wyrm approach
   - Audio cues for wyrm getting close

3. **UI/HUD**
   - Health display
   - Level indicator
   - Wyrm proximity warning
   - Death/Victory screens

4. **Game Feel Improvements**
   - Tune movement speeds if needed
   - Adjust enemy AI difficulty curve
   - Balance wyrm chase tension
   - Test and tune combat timing

5. **Menu System**
   - Title screen
   - Pause menu
   - Level select (optional)

## Known Issues & Bugs

### Critical
- None currently blocking gameplay

### Minor
1. **Elevated platforms can block progress** - Platforms not marked as `isOneWay: true` block horizontal movement. Solution: Mark all elevated platforms as one-way in level data.

2. **Player can get stuck between platforms** - If collision resolution pushes player into another platform. Monitor and adjust level design if needed.

### Not Yet Implemented
- Hazards (pits, spikes) - Data structure exists but not rendered
- Weapon pickups/throwing
- Different weapon types (broadsword, bow)

## Solutions & Learnings

### Platform Blocking Issue
**Problem**: Player couldn't progress past elevated platforms.
**Solution**: Mark all elevated platforms as `isOneWay: true` in level data files. One-way platforms allow jumping through from below but land on top.

### Enemy Not Rendering
**Problem**: Enemies were created but not visible.
**Root Cause**: Misconfigured page reload timing - enemies were being added to scene correctly.
**Solution**: RenderSystem.onEntityAdded properly adds objects when World.notifyEntityReady is called.

### Entity Notification Timing
**Problem**: Systems need entities to have all components before onEntityAdded is called.
**Solution**: ALL factories must call `world.notifyEntityReady(entity)` after adding all components, not before.

### Frame-Based Movement (NOT Time-Based)
**Problem**: Physics values are per-frame, not per-second.
**Solution**: Never multiply per-frame physics values by deltaTime. The game loop passes fixed timestep.

### Canvas 2D to Three.js Scale
Scale factors for physics values:
| Concept | Canvas 2D | Three.js |
|---------|-----------|----------|
| Player speed | 8 | 0.15 |
| Jump force | 16 | 0.5 |
| Gravity | -0.8 | -0.03 |
| Detection range | 400 | 12 |

## Debug Logging

### ALWAYS Add Debug Logging
Every system and factory should have:
```typescript
const DEBUG = true;  // Set to false for production
const log = (msg: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[SystemName] ${msg}`, ...args);
};
```

### What to Log
- System initialization
- State transitions (AI states, game states)
- Entity creation/destruction
- Collisions and combat events
- Position updates (sparingly, can be noisy)
- Event emissions and handling

### Current Debug Flags
All systems and factories now have DEBUG flags. Key ones to enable during development:
- `WyrmSystem`: Distance tracking, speed changes
- `AISystem`: State transitions
- `CombatSystem`: Attack phases, hits
- `CollisionSystem`: Platform collisions (very verbose)
- `RenderSystem`: Entity add/remove to scene

## Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Game entry point, event handlers, level loading |
| `src/constants.ts` | All physics values, colors, timing |
| `src/types/index.ts` | TypeScript interfaces |
| `src/systems/*.ts` | All game logic |
| `src/entities/*.ts` | Entity factories |
| `src/levels/Level1.ts` | Level 1 data |
| `src/levels/LevelLoader.ts` | Level management |
| `src/effects/CombatEffects.ts` | Screen shake, hit pause |

## Running the Game

```bash
npm run dev      # Start dev server with HMR
npm run typecheck # Check for TypeScript errors
npm run build    # Production build
```

## Controls

| Key | Action |
|-----|--------|
| A/D or Arrows | Move left/right |
| Space | Jump |
| W/S or Up/Down | Sword position (high/low) |
| J | Attack |

## Architecture Notes

- **System Priority Order**: Lower priority runs first. Input(0) -> AI(10) -> Fencing(20) -> Combat(25) -> Movement(30) -> Collision(40) -> Wyrm(50) -> ScreenTransition(55) -> Camera(60) -> Render(100)

- **Event Bus**: Systems communicate via EventBus (`src/core/Events.ts`). Key events: playerDeath, screenTransition, levelComplete, gameOver

- **Cross-Entity Queries**: Systems that need to find other entities (AI finding player, Wyrm tracking player) must call `setWorld(world)` and use `world.queryOne()` or `world.query()`

## Testing Checklist for Phase 6

- [ ] All visual effects feel impactful
- [ ] Audio doesn't overlap incorrectly
- [ ] HUD is readable and updates correctly
- [ ] Menus navigate properly
- [ ] Game can be paused and resumed
- [ ] Death restarts level correctly
- [ ] Victory screen shows after level 3
- [ ] Performance is smooth (60fps target)

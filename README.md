# WYRM

A single-player survival chase game built with Three.js and TypeScript. Escape through 5 connected screens while a relentless wyrm-dragon pursues from behind.

## Quick Start

```bash
# Install dependencies (includes Three.js)
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Project Status

**V2 Development** - Fresh Three.js implementation based on learnings from Canvas 2D MVP.

See `WYRM_CHASE_V2_SPEC.md` for complete product, design, and technical specification.

## Controls

| Action | Keys |
|--------|------|
| Move | A/D or Arrow Left/Right |
| Jump | Space, W, or Arrow Up |
| Attack | J, Z, or Shift |
| Throw Weapon | K or X |
| Sword Up/Down | Arrow Up/Down or W/S |
| Roll | C |
| Pause | Escape or P |

## Architecture

**ECS Pattern** (Entity-Component-System):
- `src/ecs/` - Core ECS implementation
- `src/components/` - Data components
- `src/systems/` - Game logic systems
- `src/entities/` - Entity factories

**Core Systems**:
- `src/core/` - Game loop, events
- `src/input/` - Input management
- `src/rendering/` - Three.js renderer

## Reference

The original Canvas 2D implementation is preserved in `old-game-reference/` for reference.

## Development

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Run tests
npm test
```

## Tech Stack

- **Three.js** - 3D rendering
- **TypeScript** - Type-safe game logic
- **Vite** - Development and bundling
- **Vitest** - Testing

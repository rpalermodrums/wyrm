# WYRM CHASE

A single-player survival chase game inspired by Nidhogg mechanics. Flee from a pursuing wyrm-dragon through increasingly challenging screens while battling enemies with rotating weapons.

## Features

- **5 Levels × 5 Screens**: 25 unique screens across 5 themed levels
- **Rock-Paper-Scissors Combat**: Rapier beats Bow, Bow beats Broadsword, Broadsword beats Rapier
- **Dynamic Wyrm AI**: Pursues relentlessly with speed adjustments based on player behavior
- **5 Enemy Types**: Guards, Brutes, Archers, Runners, and Elite warriors
- **Stick Figure Aesthetic**: Minimalist black-and-white art with strategic color accents
- **Precise Platforming**: Coyote time, jump buffering, and responsive controls

## Tech Stack

- **TypeScript 5.x**: Type-safe game logic
- **HTML5 Canvas 2D**: Custom rendering engine
- **ECS Architecture**: Entity-Component-System for clean code organization
- **Vite**: Fast development and optimized builds
- **Vitest**: Unit testing framework

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Modern browser with Canvas 2D support

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Development

```bash
# Start dev server with HMR
npm run dev

# Game will be available at http://localhost:5173
```

### Building

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Controls

### Keyboard
- **WASD / Arrow Keys**: Move and jump
- **Z / J**: Attack
- **K**: Throw weapon
- **ESC / P**: Pause

### Gamepad (Xbox layout)
- **D-Pad / Left Stick**: Move
- **A Button**: Jump
- **X Button**: Attack
- **Y Button**: Throw weapon
- **Start**: Pause

## Game Mechanics

### Weapon System

Three weapons rotate on kill or death:

1. **Rapier**: Fast, medium range, beats Bow
2. **Broadsword**: Slow, short range, heavy damage, beats Rapier
3. **Bow**: Ranged projectile, beats Broadsword

### Enemy Types

- **Guard**: Basic enemy with rapier, patrols platforms
- **Brute**: Heavy hitter with broadsword, 2 HP, slow movement
- **Archer**: Stationary ranged attacker with bow
- **Runner**: Fast-moving threat with rapier
- **Elite**: Adapts weapon to counter yours

### The Wyrm

The wyrm constantly pursues from the left side of the screen:

- **Base Speed**: 70% of player speed
- **Surge**: +50% when player moves backward
- **Scaling**: +5% speed per level
- **Lethal**: Instant death on contact

## Project Structure

```
wyrm-chase/
├── src/
│   ├── core/          # Game loop, canvas, camera, events
│   ├── ecs/           # Entity-Component-System
│   ├── components/    # Game components
│   ├── systems/       # Game systems
│   ├── entities/      # Entity factories
│   ├── scenes/        # Game scenes
│   ├── managers/      # Asset, audio, config managers
│   ├── levels/        # Level data
│   ├── rendering/     # Rendering utilities
│   ├── input/         # Input handling
│   ├── utils/         # Utility classes
│   ├── types/         # TypeScript types
│   ├── constants.ts   # Game constants
│   ├── Game.ts        # Game orchestrator
│   └── main.ts        # Entry point
├── public/
│   └── index.html     # HTML entry
├── assets/            # Game assets
├── tests/             # Test files
└── docs/              # Documentation
```

## Architecture

### ECS Pattern

The game uses an Entity-Component-System architecture:

- **Entities**: Containers with unique IDs
- **Components**: Pure data (Transform, Velocity, Health, etc.)
- **Systems**: Logic processors (Movement, Combat, AI, etc.)

### Fixed Timestep Loop

60 FPS physics with interpolated rendering:

```
Update (16.67ms fixed) → Physics → Collision → Render (interpolated)
```

### Event-Driven

Decoupled communication via event bus:
- Player death
- Weapon cycling
- Screen transitions
- Particle effects

## Performance Targets

- **60 FPS** consistent frame rate
- **<16ms** input latency
- **<1ms** collision detection per frame
- **Object pooling** for particles and projectiles

## License

MIT

## Credits

Developed as a portfolio project demonstrating:
- Custom game engine development
- ECS architecture
- TypeScript best practices
- Canvas 2D rendering optimization
- Game feel and polish

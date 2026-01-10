# WYRM CHASE - Technical Architecture

## Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT TARGETS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │    WEB      │      │   DESKTOP   │      │    STEAM    │                │
│   │  (Primary)  │      │  (Electron/ │      │   (Future)  │                │
│   │             │      │   Tauri)    │      │             │                │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                │
│          │                    │                    │                        │
│          └────────────────────┴────────────────────┘                        │
│                               │                                             │
│                               ▼                                             │
│                    ┌─────────────────────┐                                  │
│                    │   GAME CORE (TS)    │                                  │
│                    │   Platform Agnostic │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Tech Stack

### Core Engine: Custom TypeScript + HTML5 Canvas

**Rationale**: For a portfolio piece with educational goals, building a custom engine provides:

1. **Deep Learning**: Understanding game loops, physics, collision detection from scratch
2. **Portfolio Value**: Demonstrates fundamental skills beyond framework usage
3. **Full Control**: No framework limitations or upgrade concerns
4. **Lightweight**: Minimal dependencies, fast load times
5. **Portability**: Easy to wrap for desktop via Electron/Tauri

**Alternative Considered**: Phaser 3 would reduce development time but obscure fundamental concepts.

### Stack Components

| Layer | Technology | Justification |
|-------|------------|---------------|
| Language | TypeScript 5.x | Type safety, better tooling, industry standard |
| Rendering | HTML5 Canvas 2D | Simple, performant for 2D, universal support |
| Build | Vite | Fast HMR, easy configuration, TypeScript native |
| Testing | Vitest | Fast, Vite-native, good coverage tools |
| Desktop | Tauri | Smaller bundle than Electron, Rust-based |
| State | Custom ECS-lite | Keeps game state predictable and debuggable |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTRY POINT                                    │
│                              main.ts                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 GAME                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Game Loop                                   │   │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐         │   │
│  │   │  Input  │───▶│ Update  │───▶│ Physics │───▶│ Render  │         │   │
│  │   │  Poll   │    │  State  │    │  Step   │    │  Frame  │         │   │
│  │   └─────────┘    └─────────┘    └─────────┘    └─────────┘         │   │
│  │        ▲              │              │              │               │   │
│  │        │              ▼              ▼              ▼               │   │
│  │   ┌─────────────────────────────────────────────────────────┐      │   │
│  │   │                    SYSTEMS                               │      │   │
│  │   │  Input │ Movement │ Combat │ Collision │ Animation │ AI │      │   │
│  │   └─────────────────────────────────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          MANAGERS                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Scene   │ │  Asset   │ │  Audio   │ │  Input   │ │  Config  │  │   │
│  │  │ Manager  │ │ Manager  │ │ Manager  │ │ Manager  │ │ Manager  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │ Entities │ │  Levels  │ │  Assets  │ │  Save    │               │   │
│  │  │  (ECS)   │ │  (JSON)  │ │ (Sprites)│ │  State   │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
wyrm-chase/
├── src/
│   ├── main.ts                 # Entry point
│   ├── Game.ts                 # Main game class
│   │
│   ├── core/                   # Engine fundamentals
│   │   ├── GameLoop.ts         # Fixed timestep loop
│   │   ├── Canvas.ts           # Rendering context wrapper
│   │   ├── Camera.ts           # Viewport management
│   │   └── Events.ts           # Event bus
│   │
│   ├── ecs/                    # Entity-Component-System
│   │   ├── Entity.ts           # Base entity class
│   │   ├── Component.ts        # Component interface
│   │   ├── System.ts           # System interface
│   │   └── World.ts            # Entity manager
│   │
│   ├── components/             # Game components
│   │   ├── Transform.ts        # Position, rotation, scale
│   │   ├── Velocity.ts         # Movement vector
│   │   ├── Sprite.ts           # Rendering data
│   │   ├── Collider.ts         # Collision bounds
│   │   ├── Health.ts           # HP, lives
│   │   ├── Weapon.ts           # Current weapon state
│   │   ├── Combat.ts           # Attack state, cooldowns
│   │   ├── AI.ts               # Enemy behavior data
│   │   └── Wyrm.ts             # Wyrm-specific state
│   │
│   ├── systems/                # Game systems
│   │   ├── InputSystem.ts      # Input processing
│   │   ├── MovementSystem.ts   # Physics & movement
│   │   ├── CollisionSystem.ts  # Collision detection
│   │   ├── CombatSystem.ts     # Combat resolution
│   │   ├── AISystem.ts         # Enemy behavior
│   │   ├── WyrmSystem.ts       # Wyrm pursuit logic
│   │   ├── AnimationSystem.ts  # Sprite animation
│   │   └── RenderSystem.ts     # Draw calls
│   │
│   ├── entities/               # Entity factories
│   │   ├── Player.ts           # Player entity builder
│   │   ├── Enemy.ts            # Enemy variants
│   │   ├── Wyrm.ts             # Wyrm entity
│   │   ├── Platform.ts         # Static terrain
│   │   └── Hazard.ts           # Environmental dangers
│   │
│   ├── scenes/                 # Game scenes/states
│   │   ├── Scene.ts            # Base scene class
│   │   ├── TitleScene.ts       # Main menu
│   │   ├── GameScene.ts        # Core gameplay
│   │   ├── PauseScene.ts       # Pause overlay
│   │   └── GameOverScene.ts    # End screens
│   │
│   ├── managers/               # Singleton managers
│   │   ├── SceneManager.ts     # Scene transitions
│   │   ├── AssetManager.ts     # Asset loading/caching
│   │   ├── AudioManager.ts     # Sound playback
│   │   ├── InputManager.ts     # Input abstraction
│   │   └── ConfigManager.ts    # Settings persistence
│   │
│   ├── input/                  # Input handling
│   │   ├── KeyboardInput.ts    # Keyboard adapter
│   │   ├── GamepadInput.ts     # Controller adapter
│   │   └── InputActions.ts     # Action definitions
│   │
│   ├── levels/                 # Level definitions
│   │   ├── LevelLoader.ts      # JSON level parser
│   │   └── data/               # Level JSON files
│   │       ├── level1.json
│   │       ├── level2.json
│   │       └── ...
│   │
│   ├── rendering/              # Rendering utilities
│   │   ├── SpriteRenderer.ts   # Sprite drawing
│   │   ├── PrimitiveRenderer.ts# Shape drawing (stick figures)
│   │   ├── ParticleSystem.ts   # Simple particles
│   │   └── ScreenShake.ts      # Juice effects
│   │
│   ├── utils/                  # Utilities
│   │   ├── Vector2.ts          # 2D vector math
│   │   ├── AABB.ts             # Collision primitives
│   │   ├── Timer.ts            # Game timers
│   │   └── ObjectPool.ts       # Object pooling
│   │
│   └── types/                  # TypeScript types
│       ├── index.ts            # Type exports
│       └── globals.d.ts        # Global declarations
│
├── assets/                     # Static assets
│   ├── sprites/                # PNG sprites
│   ├── audio/                  # Sound effects
│   └── fonts/                  # Web fonts
│
├── public/                     # Static files
│   └── index.html              # Entry HTML
│
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
│
├── dist/                       # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Game Loop Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FIXED TIMESTEP GAME LOOP                            │
└─────────────────────────────────────────────────────────────────────────────┘

  requestAnimationFrame
          │
          ▼
  ┌───────────────────┐
  │  Calculate Delta  │    delta = currentTime - lastTime
  │       Time        │
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │   Accumulate      │    accumulator += delta
  │      Time         │
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐     ┌───────────────────────────────────────┐
  │   While accum     │     │  FIXED UPDATE (16.67ms / 60Hz)        │
  │   >= TIMESTEP     │────▶│  - Input processing                   │
  │                   │     │  - Physics step                       │
  └─────────┬─────────┘     │  - Collision detection                │
            │               │  - Combat resolution                  │
            │               │  - AI updates                         │
            │               │  - State transitions                  │
            │               │  accumulator -= TIMESTEP              │
            │               └───────────────────────────────────────┘
            │
            ▼
  ┌───────────────────┐
  │  Interpolation    │    alpha = accumulator / TIMESTEP
  │     Factor        │    (for smooth rendering between updates)
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │      RENDER       │    Interpolate positions for smooth display
  │      Frame        │    Draw all entities
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │  Request Next     │
  │      Frame        │────────────▶ [loop]
  └───────────────────┘


  TIMING CONSTANTS:
  ┌─────────────────────────────────────────┐
  │  TARGET_FPS    = 60                     │
  │  TIMESTEP      = 1000 / 60 = 16.67ms    │
  │  MAX_DELTA     = 250ms (prevent spiral) │
  └─────────────────────────────────────────┘
```

---

## Entity-Component-System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 ENTITY                                      │
│                              (just an ID)                                   │
│                                  │                                          │
│                                  │ has                                      │
│                                  ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           COMPONENTS                                  │  │
│  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │  │
│  │   │ Transform │ │ Velocity  │ │  Sprite   │ │ Collider  │ ...       │  │
│  │   │ x, y, rot │ │  dx, dy   │ │ animation │ │  bounds   │           │  │
│  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                processed by                                 │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                            SYSTEMS                                    │  │
│  │                                                                       │  │
│  │   MovementSystem:  queries [Transform, Velocity]                     │  │
│  │                    updates positions each frame                       │  │
│  │                                                                       │  │
│  │   CollisionSystem: queries [Transform, Collider]                     │  │
│  │                    detects overlaps, triggers events                  │  │
│  │                                                                       │  │
│  │   RenderSystem:    queries [Transform, Sprite]                       │  │
│  │                    draws to canvas                                    │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘


PLAYER ENTITY COMPOSITION:
┌─────────────────────────────────────────────────────────────┐
│  Entity: Player                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Components:                                           │  │
│  │   - Transform { x, y, rotation, scale }              │  │
│  │   - Velocity { dx, dy, maxSpeed }                    │  │
│  │   - Collider { type: 'box', width, height }          │  │
│  │   - Health { current: 1, lives: 3 }                  │  │
│  │   - Weapon { type: 'rapier', cooldown: 0 }           │  │
│  │   - Combat { state: 'idle', iframes: 0 }             │  │
│  │   - Sprite { animation: 'idle', frame: 0 }           │  │
│  │   - PlayerControlled { }  // marker component        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Input System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INPUT PIPELINE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐      ┌──────────────────┐
  │     KEYBOARD     │      │     GAMEPAD      │
  │   addEventListener│      │   navigator.     │
  │   keydown/keyup  │      │   getGamepads()  │
  └────────┬─────────┘      └────────┬─────────┘
           │                         │
           ▼                         ▼
  ┌─────────────────────────────────────────────────┐
  │              INPUT ADAPTERS                      │
  │  ┌─────────────────┐  ┌─────────────────┐       │
  │  │ KeyboardInput   │  │ GamepadInput    │       │
  │  │ - keyStates     │  │ - buttonStates  │       │
  │  │ - isKeyDown()   │  │ - axes[]        │       │
  │  │ - isKeyPressed()│  │ - deadzone      │       │
  │  └─────────────────┘  └─────────────────┘       │
  └────────────────────────┬────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────┐
  │              INPUT MANAGER                       │
  │                                                  │
  │  Action Mapping:                                 │
  │  ┌────────────────────────────────────────────┐ │
  │  │  MOVE_LEFT   ← [A, ←, GamepadLeft]         │ │
  │  │  MOVE_RIGHT  ← [D, →, GamepadRight]        │ │
  │  │  JUMP        ← [W, ↑, Space, GamepadA]     │ │
  │  │  ATTACK      ← [J, Z, GamepadX]            │ │
  │  │  THROW       ← [K, X, GamepadY]            │ │
  │  │  PAUSE       ← [Escape, P, Start]          │ │
  │  └────────────────────────────────────────────┘ │
  │                                                  │
  │  Methods:                                        │
  │  - isActionDown(action): boolean                │
  │  - isActionPressed(action): boolean             │
  │  - getAxis(horizontal|vertical): number         │
  └────────────────────────┬────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────┐
  │              INPUT SYSTEM (ECS)                  │
  │                                                  │
  │  Queries: [PlayerControlled]                    │
  │                                                  │
  │  Updates player intent based on InputManager    │
  │  - Sets velocity direction                      │
  │  - Triggers jump                                │
  │  - Initiates attack/throw                       │
  └─────────────────────────────────────────────────┘


  GAMEPAD SUPPORT:
  ┌─────────────────────────────────────────────────────────┐
  │  Standard Gamepad Mapping (Xbox layout):                │
  │                                                         │
  │      [LB]                              [RB]             │
  │      [LT]                              [RT]             │
  │                                                         │
  │        ┌───┐                         ┌───┐             │
  │      ┌─┤ ↑ ├─┐    [Back] [Start]   ┌─┤ Y ├─┐           │
  │      │ └───┘ │                     │ └───┘ │           │
  │    ┌─┴─┐ ┌─┴─┐                   ┌─┴─┐ ┌─┴─┐           │
  │    │ ← │ │ → │                   │ X │ │ B │           │
  │    └─┬─┘ └─┬─┘                   └─┬─┘ └─┬─┘           │
  │      │ ┌───┐ │                     │ ┌───┐ │           │
  │      └─┤ ↓ ├─┘                     └─┤ A ├─┘           │
  │        └───┘                         └───┘             │
  │                                                         │
  │   D-Pad: Movement                                       │
  │   A: Jump       X: Attack       Y: Throw               │
  │   Start: Pause  B: Back/Cancel                         │
  └─────────────────────────────────────────────────────────┘
```

---

## Collision System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLLISION DETECTION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  SPATIAL PARTITIONING (Simple Grid):
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐   │
  │   │  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │   │
  │   │     │ [P] │     │ [E] │     │     │ [E] │     │   │
  │   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤   │
  │   │  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │   │
  │   │     │     │     │ [P] │     │     │     │     │   │
  │   └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘   │
  │                                                         │
  │   Only check collisions within same/adjacent cells     │
  │                                                         │
  └─────────────────────────────────────────────────────────┘


  COLLISION LAYERS:
  ┌───────────────────────────────────────────────────────────────┐
  │  Layer          │ Collides With                               │
  │─────────────────│─────────────────────────────────────────────│
  │  PLAYER         │ ENEMY, PLATFORM, HAZARD, WYRM, PROJECTILE  │
  │  ENEMY          │ PLAYER, PLATFORM, PROJECTILE               │
  │  PLATFORM       │ PLAYER, ENEMY                               │
  │  HAZARD         │ PLAYER                                      │
  │  WYRM           │ PLAYER                                      │
  │  PROJECTILE     │ PLAYER, ENEMY                               │
  └───────────────────────────────────────────────────────────────┘


  AABB COLLISION:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │    Collision: A.right > B.left  &&                     │
  │               A.left  < B.right &&                     │
  │               A.bottom > B.top  &&                     │
  │               A.top    < B.bottom                      │
  │                                                         │
  │    ┌─────────┐                                         │
  │    │    A    │                                         │
  │    │    ┌────┼────┐                                    │
  │    └────┼────┘    │  ← Overlapping = Collision         │
  │         │    B    │                                    │
  │         └─────────┘                                    │
  │                                                         │
  └─────────────────────────────────────────────────────────┘


  COLLISION RESPONSE:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Player vs Platform:                                   │
  │    - Resolve penetration (push out)                    │
  │    - Set grounded flag if on top                       │
  │                                                         │
  │  Player vs Enemy:                                      │
  │    - Trigger combat check if both attacking            │
  │    - Apply damage if not attacking                     │
  │                                                         │
  │  Player vs Hazard:                                     │
  │    - Instant death (lose life)                         │
  │                                                         │
  │  Player vs Wyrm:                                       │
  │    - Death (devoured)                                  │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

---

## Scene Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCENE STATE MACHINE                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │    BOOT     │
                              │  (loading)  │
                              └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
             ┌───────────────▶│    TITLE    │◀───────────────┐
             │                │   (menu)    │                │
             │                └──────┬──────┘                │
             │                       │                       │
             │                       ▼                       │
             │                ┌─────────────┐                │
             │                │  CUSTOMIZE  │                │
             │                └──────┬──────┘                │
             │                       │                       │
             │                       ▼                       │
             │                ┌─────────────┐                │
             │       ┌───────▶│    GAME     │◀───────┐       │
             │       │        │  (playing)  │        │       │
             │       │        └──────┬──────┘        │       │
             │       │               │               │       │
             │       │        ┌──────┴──────┐        │       │
             │       │        ▼             ▼        │       │
             │       │   ┌─────────┐   ┌─────────┐   │       │
             │       │   │  PAUSE  │   │  DEATH  │   │       │
             │       │   └────┬────┘   └────┬────┘   │       │
             │       │        │             │        │       │
             │       └────────┘             │        │       │
             │                              ▼        │       │
             │                       ┌───────────┐   │       │
             │                       │ GAME_OVER │───┘       │
             │                       └─────┬─────┘           │
             │                             │                 │
             └─────────────────────────────┘                 │
                                                             │
                              ┌─────────────┐                │
                              │  LEVEL_END  │────────────────┘
                              └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   VICTORY   │
                              └─────────────┘


  SCENE INTERFACE:
  ┌─────────────────────────────────────────────────────────┐
  │  interface Scene {                                      │
  │    enter(): void      // called when scene starts       │
  │    exit(): void       // called when scene ends         │
  │    update(dt): void   // game logic                     │
  │    render(ctx): void  // drawing                        │
  │    pause(): void      // optional                       │
  │    resume(): void     // optional                       │
  │  }                                                      │
  └─────────────────────────────────────────────────────────┘
```

---

## Level Data Format

```json
{
  "id": "level1",
  "name": "The Caverns",
  "screens": [
    {
      "id": "1-1",
      "width": 1920,
      "height": 1080,
      "playerSpawn": { "x": 100, "y": 800 },
      "exitZone": { "x": 1820, "y": 700, "width": 100, "height": 200 },
      "platforms": [
        { "x": 0, "y": 900, "width": 1920, "height": 180, "type": "ground" },
        { "x": 600, "y": 700, "width": 200, "height": 20, "type": "platform" }
      ],
      "enemies": [
        { "type": "guard", "x": 800, "y": 860, "patrol": { "left": 700, "right": 900 } }
      ],
      "hazards": [],
      "decorations": [
        { "type": "stalactite", "x": 300, "y": 0 },
        { "type": "rock", "x": 1200, "y": 880 }
      ]
    },
    {
      "id": "1-5",
      "trapType": "lava",
      "platforms": [
        { "x": 0, "y": 900, "width": 300, "height": 180, "type": "ground" },
        { "x": 500, "y": 700, "width": 150, "height": 20, "type": "platform" }
      ],
      "hazards": [
        { "type": "lava", "x": 300, "y": 950, "width": 1320, "height": 130 }
      ]
    }
  ],
  "wyrmConfig": {
    "baseSpeed": 180,
    "surgeMultiplier": 1.5,
    "slowMultiplier": 0.7
  }
}
```

---

## Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RENDER ORDER (Back to Front)                       │
└─────────────────────────────────────────────────────────────────────────────┘

  1. BACKGROUND
     └── Solid color or gradient
     └── Parallax layers (if any)

  2. TERRAIN (BACK)
     └── Background decorations
     └── Distant platforms

  3. WYRM
     └── Body segments (back to front)
     └── Head with glow effect

  4. PLATFORMS
     └── Ground tiles
     └── Floating platforms

  5. HAZARDS
     └── Lava/spikes with glow
     └── Particle effects

  6. ENTITIES
     └── Enemies (sorted by Y)
     └── Player
     └── Projectiles

  7. FOREGROUND
     └── Front decorations
     └── Screen-edge vignette

  8. UI (HUD)
     └── Lives
     └── Current weapon
     └── Level/screen indicator


  STICK FIGURE RENDERING:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   function drawStickFigure(ctx, x, y, animation) {     │
  │     const pose = getPose(animation);                   │
  │                                                         │
  │     ctx.strokeStyle = '#1A1A1A';                        │
  │     ctx.lineWidth = 3;                                  │
  │     ctx.lineCap = 'round';                              │
  │                                                         │
  │     // Head                                             │
  │     ctx.beginPath();                                    │
  │     ctx.arc(x, y - 50, 12, 0, Math.PI * 2);            │
  │     ctx.stroke();                                       │
  │                                                         │
  │     // Body                                             │
  │     drawLine(ctx, x, y - 38, x, y);                    │
  │                                                         │
  │     // Arms (from pose)                                │
  │     drawLine(ctx, x, y - 30, pose.leftArm.x, ...);     │
  │     drawLine(ctx, x, y - 30, pose.rightArm.x, ...);    │
  │                                                         │
  │     // Legs (from pose)                                │
  │     drawLine(ctx, x, y, pose.leftLeg.x, ...);          │
  │     drawLine(ctx, x, y, pose.rightLeg.x, ...);         │
  │                                                         │
  │     // Accessory (colored)                              │
  │     drawAccessory(ctx, x, y, color);                   │
  │   }                                                     │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

---

## Build & Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUILD PIPELINE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  DEVELOPMENT:
  ┌─────────────────────────────────────────────────────────┐
  │  npm run dev                                            │
  │    └── Vite dev server                                  │
  │    └── HMR enabled                                      │
  │    └── Source maps                                      │
  │    └── http://localhost:5173                            │
  └─────────────────────────────────────────────────────────┘

  PRODUCTION BUILD (WEB):
  ┌─────────────────────────────────────────────────────────┐
  │  npm run build                                          │
  │    └── TypeScript compile                               │
  │    └── Vite production build                            │
  │    └── Asset optimization                               │
  │    └── Output: dist/                                    │
  │                                                         │
  │  npm run preview                                        │
  │    └── Preview production build locally                 │
  └─────────────────────────────────────────────────────────┘

  DESKTOP BUILD (TAURI):
  ┌─────────────────────────────────────────────────────────┐
  │  npm run tauri build                                    │
  │    └── Web build                                        │
  │    └── Rust compilation                                 │
  │    └── Platform bundling                                │
  │    └── Output:                                          │
  │        - Windows: .msi installer                        │
  │        - macOS: .dmg                                    │
  │        - Linux: .AppImage, .deb                         │
  └─────────────────────────────────────────────────────────┘


  DEPLOYMENT (WEB):
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   GitHub Repository                                     │
  │         │                                               │
  │         ▼                                               │
  │   GitHub Actions                                        │
  │   ┌─────────────────────────────────────────┐          │
  │   │  on: push to main                       │          │
  │   │  - npm ci                               │          │
  │   │  - npm run build                        │          │
  │   │  - npm run test                         │          │
  │   │  - deploy to Vercel/Netlify/CF Pages   │          │
  │   └─────────────────────────────────────────┘          │
  │         │                                               │
  │         ▼                                               │
  │   Production URL                                        │
  │   https://wyrm-chase.example.com                       │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPTIMIZATION STRATEGIES                             │
└─────────────────────────────────────────────────────────────────────────────┘

  1. OBJECT POOLING
     ┌─────────────────────────────────────────────────────┐
     │  - Pool projectiles, particles, enemies            │
     │  - Avoid GC pauses during gameplay                 │
     │  - Pre-allocate common objects                     │
     └─────────────────────────────────────────────────────┘

  2. RENDER OPTIMIZATION
     ┌─────────────────────────────────────────────────────┐
     │  - Only draw visible entities (camera culling)     │
     │  - Batch similar draw calls                        │
     │  - Cache static terrain to offscreen canvas        │
     │  - Use requestAnimationFrame                       │
     └─────────────────────────────────────────────────────┘

  3. COLLISION OPTIMIZATION
     ┌─────────────────────────────────────────────────────┐
     │  - Spatial grid partitioning                       │
     │  - Broad phase (AABB) before narrow phase          │
     │  - Skip static-static checks                       │
     │  - Early exit on layer mismatches                  │
     └─────────────────────────────────────────────────────┘

  4. ASSET LOADING
     ┌─────────────────────────────────────────────────────┐
     │  - Preload all assets during boot                  │
     │  - Use sprite atlases for animations               │
     │  - Compress audio (MP3/OGG)                        │
     │  - Lazy load distant levels                        │
     └─────────────────────────────────────────────────────┘

  5. MEMORY MANAGEMENT
     ┌─────────────────────────────────────────────────────┐
     │  - Avoid creating objects in hot paths             │
     │  - Reuse vectors and arrays                        │
     │  - Clear references for garbage collection         │
     │  - Monitor heap size in dev tools                  │
     └─────────────────────────────────────────────────────┘
```

---

## Future Steam Release Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEAM RELEASE REQUIREMENTS                             │
└─────────────────────────────────────────────────────────────────────────────┘

  STEAMWORKS INTEGRATION:
  ┌─────────────────────────────────────────────────────────┐
  │  - Achievements (via Steamworks.js or Greenworks)     │
  │  - Cloud saves                                         │
  │  - Leaderboards (if speedrun mode added)              │
  │  - Rich presence                                       │
  └─────────────────────────────────────────────────────────┘

  TAURI/ELECTRON MODIFICATIONS:
  ┌─────────────────────────────────────────────────────────┐
  │  - Add Steam overlay support                           │
  │  - Handle Steam authentication                         │
  │  - Integrate achievement triggers                      │
  │  - Save games to Steam Cloud                           │
  └─────────────────────────────────────────────────────────┘

  STEAM STORE REQUIREMENTS:
  ┌─────────────────────────────────────────────────────────┐
  │  - Store assets (capsule images, screenshots)         │
  │  - Trailer video                                       │
  │  - Store description copy                              │
  │  - Controller support tags                             │
  │  - Achievement icons                                   │
  └─────────────────────────────────────────────────────────┘


  ARCHITECTURE NOTES FOR STEAM COMPATIBILITY:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  The current architecture is designed to make Steam    │
  │  integration straightforward:                          │
  │                                                         │
  │  1. Platform abstraction in ConfigManager allows       │
  │     swapping localStorage for Steam Cloud              │
  │                                                         │
  │  2. Event system can trigger achievement checks        │
  │     without coupling to Steamworks                     │
  │                                                         │
  │  3. Tauri's Rust backend can integrate native          │
  │     Steamworks SDK directly                            │
  │                                                         │
  │  4. All game logic is platform-agnostic; only the      │
  │     wrapper layer needs Steam-specific code            │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

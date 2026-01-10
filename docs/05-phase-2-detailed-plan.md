# WYRM CHASE - Detailed Implementation Plan (Phases 1-4)

## Pre-Implementation Status

### Codebase Validation ✅ COMPLETE
All 59 TypeScript files exist with real implementations (~4,600 lines total):

| Category | Files | Lines | Status |
|----------|-------|-------|--------|
| Core Engine | 12 | ~1,900 | ✅ Complete |
| Systems | 8 | ~893 | ✅ Complete |
| Entities | 6 | ~191 | ✅ Complete |
| Scenes | 8 | ~707 | ✅ Complete |
| Managers | 4 | ~167 | ✅ Complete |
| Rendering | 3 | ~288 | ✅ Complete |
| Input | 2 | ~182 | ✅ Complete |
| Components | 11 | ~133 | ✅ Complete |
| Levels | 2 | ~131 | ✅ Complete |

### TypeScript Errors to Fix First
Before Phase 1 implementation, fix these interface alignment issues:

```
PRIORITY FIXES (blocking):
1. Export EnemyType, AIState, WeaponType from src/types/index.ts
2. Add addScene(), transition(), getCurrentScene() to SceneManager interface
3. Fix Particle class to implement Poolable interface (add reset(), active)
4. Add null guards for possibly undefined values (use optional chaining)
5. Fix scene constructor signatures to match main.ts usage
```

**Estimated fix time**: 30-45 minutes

---

## PHASE 1: THE WYRM REIMAGINED

### Design Research Summary

**Reference Analysis:**
- **Nidhogg Wyrm**: Creates menace through inevitability - always visible, always approaching
- **Mario 64 Unagi**: Terror through scale, emergence, and unpredictability
- **Hollow Knight**: Boss presence through detailed animation + screen dominance
- **Chinese Dragons**: Serpentine elegance with multi-joint fluidity

### Visual Design Specification

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           WYRM HEAD DESIGN (SIDE VIEW)                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║                              HORNS/SPINES                                     ║
║                                 ╱╲  ╱╲                                        ║
║                               ╱    ╲╱    ╲                                    ║
║                          ___╱____________╲___                                 ║
║                      ___╱   ◉ EYE (glows)   ╲___          <- Brow ridge      ║
║                  ___╱                           ╲___                          ║
║              ___╱      SCALES (procedural)          ╲___                      ║
║          ___╱    ╭─────────────────────────────────╮    ╲___                  ║
║      ___╱       │  ▼▼▼▼▼▼▼ TEETH ▼▼▼▼▼▼▼           │        ╲___             ║
║     ╱           │         (jagged, uneven)          │            ╲            ║
║    │     NOSTRIL│                                   │NOSTRIL      │           ║
║    │       ●    │            M O U T H              │    ●        │           ║
║    │            │      (opens for snap attack)      │             │           ║
║     ╲___        │  ▲▲▲▲▲▲▲ TEETH ▲▲▲▲▲▲▲           │        ___╱            ║
║         ╲___    ╰─────────────────────────────────╯    ___╱                   ║
║             ╲___         LOWER JAW                 ___╱                       ║
║                 ╲___       (articulated)       ___╱                           ║
║                     ╲_______________________╱                                 ║
║                                                                               ║
║   HEAD SIZE: 80x60 pixels (4x current size)                                   ║
║   EYE: Pulsing glow (red #FF2222, shadow blur 15px)                          ║
║   TEETH: 8-10 triangles, slight random variation                              ║
║   SCALES: Procedural arcs, darker toward edges                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                           WYRM BODY SEGMENTS                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   SEGMENT STRUCTURE (50 segments total):                                      ║
║                                                                               ║
║      ╭────────────────────╮                                                   ║
║     ╱  ╭──────────────╮    ╲     <- Outer edge (darker)                      ║
║    │  ╱  SCALE LINES   ╲    │    <- Procedural arc patterns                  ║
║    │ │   ~~~~~~~~~~~~   │   │    <- Highlight stripe (center)                ║
║    │  ╲  SCALE LINES   ╱    │                                                ║
║     ╲  ╰──────────────╯    ╱     <- Glow on underside                        ║
║      ╰────────────────────╯                                                   ║
║                                                                               ║
║   SEGMENT SIZES (tapering):                                                   ║
║   - Segments 1-5:   radius 35px (near head)                                   ║
║   - Segments 6-20:  radius 30px                                               ║
║   - Segments 21-35: radius 25px                                               ║
║   - Segments 36-50: radius 20px → 12px (tail taper)                          ║
║                                                                               ║
║   COLORS:                                                                     ║
║   - Base: #1A1A1A (near black)                                                ║
║   - Highlight: #333333                                                        ║
║   - Underside glow: rgba(139, 0, 0, 0.3) pulsing                             ║
║   - Scale lines: #2A2A2A                                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Movement Algorithm (Multi-Frequency Serpentine)

```typescript
// Enhanced WyrmSystem movement calculation
function updateWyrmSegments(wyrm: EnhancedWyrm, playerX: number, playerY: number, frame: number) {
  const head = wyrm.segments[0];
  
  // Head tracks player Y with prediction
  const targetY = playerY + (playerY - wyrm.lastPlayerY) * 0.5; // Predict movement
  wyrm.targetY += (targetY - wyrm.targetY) * 0.03; // Smooth follow
  wyrm.targetY = clamp(wyrm.targetY, 280, 400);
  
  head.x = wyrm.x;
  head.y = wyrm.targetY;
  head.rotation = 0;
  
  // Body follows with multi-frequency wave
  for (let i = 1; i < wyrm.segments.length; i++) {
    const segment = wyrm.segments[i];
    const prev = wyrm.segments[i - 1];
    
    // Base serpentine wave
    const baseWave = Math.sin(frame * 0.06 + i * 0.12) * 15;
    
    // Secondary muscle wave (faster, smaller amplitude)
    const muscleWave = Math.sin(frame * 0.15 + i * 0.25) * 5;
    
    // Tertiary micro-movement (organic feel)
    const microWave = Math.sin(frame * 0.3 + i * 0.5) * 2;
    
    // Amplitude decreases toward tail
    const amplitudeFactor = 1 - (i / wyrm.segments.length) * 0.5;
    
    const totalWave = (baseWave + muscleWave + microWave) * amplitudeFactor;
    
    // Follow previous segment with offset
    const targetX = prev.x - 22; // Segment spacing
    const targetY = prev.y + totalWave;
    
    // Smooth interpolation (30% per frame)
    segment.x += (targetX - segment.x) * 0.3;
    segment.y += (targetY - segment.y) * 0.25;
    
    // Calculate rotation to face previous segment
    segment.rotation = Math.atan2(prev.y - segment.y, prev.x - segment.x);
    
    // Scale tapering
    segment.scale = 1 - (i / wyrm.segments.length) * 0.6;
    
    // Glow pulsing (offset per segment for wave effect)
    segment.glowIntensity = 0.3 + Math.sin(frame * 0.08 + i * 0.2) * 0.2;
  }
  
  wyrm.lastPlayerY = playerY;
}
```

### Wyrm State Machine

```
                    ┌─────────────────────────────────────────┐
                    │              WYRM STATES                │
                    └─────────────────────────────────────────┘

                              ┌─────────────┐
                              │  EMERGING   │ ← Level/screen start
                              │  (2 sec)    │
                              └──────┬──────┘
                                     │
                                     ▼
         ┌──────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  │
    ┌─────────┐      player retreats      ┌─────────┐      │
    │PURSUING │ ────────────────────────▶ │ SURGING │      │
    │(normal) │                           │ (1.5x)  │      │
    └────┬────┘ ◀──────────────────────── └────┬────┘      │
         │       player advances ahead         │           │
         │                                     │           │
         │         wyrm catches up             │           │
         │              │                      │           │
         ▼              ▼                      ▼           │
    ┌─────────────────────────────────────────────┐        │
    │                 SNAPPING                     │        │
    │  (mouth opens, lunge forward, 0.5 sec)      │        │
    └──────────────────────┬──────────────────────┘        │
                           │                               │
              ┌────────────┴────────────┐                  │
              │                         │                  │
              ▼                         ▼                  │
         ┌─────────┐              ┌──────────┐            │
         │  KILL   │              │  MISS    │────────────┘
         │(devour) │              │(retreat) │
         └─────────┘              └──────────┘


    SPEED VALUES:
    ├── PURSUING:  1.8 base + modifiers
    ├── SURGING:   2.7 (1.5x base)
    ├── SNAPPING:  4.0 (lunge burst)
    └── EMERGING:  0.0 → 1.8 (ramp up)
```

### Emergence Animation Sequence

```
SCREEN START EMERGENCE (2 seconds):

Frame 0-30 (0.5s):   [RUMBLE]
  - Screen shake begins (intensity 3, low frequency)
  - Edge glow appears on left side (red, pulsing)
  - Audio trigger: "wyrm_approach" (low rumble)

Frame 30-60 (0.5s):  [EYES APPEAR]
  - Two glowing eyes fade in at screen edge
  - Eye glow pulses faster (anticipation)
  - Screen shake intensifies (intensity 5)

Frame 60-90 (0.5s):  [HEAD EMERGES]
  - Head slides onto screen
  - Mouth opens slightly, teeth visible
  - Particle burst (embers, smoke)
  - Audio trigger: "wyrm_roar"

Frame 90-120 (0.5s): [BODY FOLLOWS]
  - Segments flow in with serpentine motion
  - Speed ramps from 0 → normal
  - Shake settles, wyrm now in PURSUING state

PLAYER DEATH RETREAT (1 second):
  - Wyrm retreats 100px
  - Mouth opens wide (devour animation)
  - Screen flash red
  - Wyrm re-emerges after respawn
```

### Particle System for Wyrm

```typescript
interface WyrmParticleConfig {
  // Ember trail (from body segments)
  embers: {
    spawnRate: 2,           // per frame, from random segments
    color: '#FF4400',
    size: { min: 2, max: 5 },
    lifetime: { min: 30, max: 60 },
    velocity: { x: [-1, 1], y: [-3, -1] }, // Float upward
    gravity: -0.05,         // Negative = rises
    fadeOut: true,
  },
  
  // Smoke trail (from head)
  smoke: {
    spawnRate: 1,
    color: 'rgba(50, 50, 50, 0.5)',
    size: { min: 8, max: 15 },
    lifetime: { min: 40, max: 80 },
    velocity: { x: [-0.5, 0.5], y: [-1, 0] },
    growthRate: 1.02,       // Expands over time
    fadeOut: true,
  },
  
  // Eye glow particles
  eyeGlow: {
    spawnRate: 0.5,
    color: '#FF0000',
    size: { min: 3, max: 8 },
    lifetime: { min: 10, max: 20 },
    velocity: { x: [1, 3], y: [-1, 1] },
    fadeOut: true,
  },
}
```

### Phase 1 Deliverables Checklist

```
□ src/components/ai/EnhancedWyrm.ts
  - 50 segments with individual properties
  - State machine (emerging, pursuing, surging, snapping)
  - Mouth open/close animation state
  
□ src/systems/EnhancedWyrmSystem.ts
  - Multi-frequency serpentine movement
  - Player tracking with prediction
  - State transitions and speed modifiers
  - Snap attack detection
  
□ src/rendering/WyrmRenderer.ts
  - Detailed head drawing (eyes, teeth, scales, horns)
  - Body segment rendering with rotation
  - Scale/taper calculation
  - Glow effects (eyes, underside)
  - Procedural scale texture
  
□ src/rendering/WyrmParticles.ts
  - Ember spawning from segments
  - Smoke from head
  - Eye glow particles
  
□ src/effects/ScreenEdgeIndicator.ts
  - Wyrm proximity warning when off-screen
  - Red glow on screen edge
  - Intensity based on distance
  
□ Update src/entities/Wyrm.ts factory
  - Initialize 50 segments
  - Set up enhanced component
  
□ Update src/scenes/GameScene.ts
  - Wyrm emergence on screen start
  - Handle wyrm snap attacks
```

---

## PHASE 2: WEAPON FEEL & COMBAT POLISH

### Combat Feel Research Summary

**Industry Standards (from Hollow Knight, Dead Cells, Katana Zero):**
- Hit pause: 2-5 frames depending on impact weight
- Screen shake: 2-10px, decay over 5-15 frames
- Attack animations: 3-phase (anticipation, action, recovery)
- Slash trails: 3-5 frame persistence, alpha fade

### Attack Animation Frame Data

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        WEAPON ATTACK FRAME DATA                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  RAPIER (Total: 16 frames @ 60fps = 267ms)                                   ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐                   ║
║  │ ANTICIPATE  │   ACTION    │   IMPACT    │  RECOVERY   │                   ║
║  │   3 frames  │  4 frames   │  2 frames   │  7 frames   │                   ║
║  │             │             │ (hit pause) │             │                   ║
║  │  Wind back  │   Thrust    │   Pierce    │  Withdraw   │                   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘                   ║
║                                                                               ║
║  BROADSWORD (Total: 28 frames @ 60fps = 467ms)                               ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐                   ║
║  │ ANTICIPATE  │   ACTION    │   IMPACT    │  RECOVERY   │                   ║
║  │   8 frames  │  5 frames   │  4 frames   │  11 frames  │                   ║
║  │             │             │ (hit pause) │             │                   ║
║  │  Wind up    │   Swing     │   Cleave    │  Follow thru│                   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘                   ║
║                                                                               ║
║  BOW (Total: Variable, depends on hold time)                                  ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐                   ║
║  │    DRAW     │    HOLD     │   RELEASE   │  RECOVERY   │                   ║
║  │  10 frames  │  0-60 max   │  2 frames   │  8 frames   │                   ║
║  │  (minimum)  │  (optional) │             │             │                   ║
║  │  Pull back  │  Aim/charge │   Fire      │  Lower bow  │                   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘                   ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Screen Shake Specifications

```typescript
interface ScreenShakeConfig {
  rapierHit: {
    intensity: 3,
    duration: 6,          // frames
    decay: 0.85,          // per frame multiplier
    direction: 'forward', // toward attack direction
  },
  
  broadswordHit: {
    intensity: 10,
    duration: 12,
    decay: 0.75,
    direction: 'omnidirectional',
  },
  
  bowHit: {
    intensity: 5,
    duration: 4,
    decay: 0.9,
    direction: 'forward',
  },
  
  clash: {
    intensity: 8,
    duration: 10,
    decay: 0.8,
    direction: 'omnidirectional',
  },
  
  playerDeath: {
    intensity: 15,
    duration: 20,
    decay: 0.7,
    direction: 'omnidirectional',
  },
  
  wyrmSnap: {
    intensity: 12,
    duration: 15,
    decay: 0.75,
    direction: 'horizontal',
  },
}
```

### Weapon Visual Designs

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           DETAILED WEAPON SPRITES                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  RAPIER (elegant, thin, precise):                                            ║
║                                                                               ║
║         ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶                     ║
║         │                                                                     ║
║    ════╬════    <- Cross-guard (4px wide)                                    ║
║         │                                                                     ║
║         │        <- Handle (wrapped texture, 3 diagonal lines)               ║
║         ●        <- Pommel                                                    ║
║                                                                               ║
║  Length: 55px  |  Blade width: 2px  |  Color: #555555                        ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  BROADSWORD (heavy, wide, powerful):                                         ║
║                                                                               ║
║              ╱▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔╲                                     ║
║             ╱  ═══════════════════════  ╲    <- Fuller (groove)              ║
║            ▕▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▏                                    ║
║            ▕         BLADE              ▏                                    ║
║            ▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▏                                    ║
║             ╲  ═══════════════════════  ╱                                     ║
║              ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╱                                      ║
║       ══════════╬══════════    <- Wide cross-guard                           ║
║                 ║                                                             ║
║                 ║              <- Thick handle                                ║
║                 ●              <- Heavy pommel                                ║
║                                                                               ║
║  Length: 45px  |  Blade width: 8px  |  Color: #333333                        ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  BOW (curved, tension visible):                                              ║
║                                                                               ║
║              ╭───────────╮                                                    ║
║             ╱             ╲           <- Upper limb                           ║
║            │       │       │          <- String (animates on draw)           ║
║            │       │       │                                                  ║
║            │       ●       │          <- Grip (hand position)                ║
║            │       │       │                                                  ║
║            │       │       │                                                  ║
║             ╲             ╱           <- Lower limb                           ║
║              ╰───────────╯                                                    ║
║                                                                               ║
║  ARROW:    ──────────────▶                                                   ║
║            shaft    tip                                                       ║
║                                                                               ║
║  Bow height: 40px  |  Color: #664422  |  String: #888888                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Weapon Throw System

```
THROW MECHANIC (K key / Y button):

┌─────────────────────────────────────────────────────────────────┐
│                      THROW TRAJECTORY                           │
│                                                                 │
│   Player ─────●                                                 │
│              ╱                                                  │
│             ╱   Thrown weapon travels in arc                    │
│            ╱                                                    │
│           ●═══════════════════════════════●────────▶           │
│                                           │                     │
│                                           │ Falls after         │
│                                           │ max distance        │
│                                           ▼                     │
│                                      ════════════              │
│                                       Platform                  │
│                                                                 │
│   THROW PROPERTIES:                                             │
│   - Speed: 15 px/frame                                          │
│   - Max distance: 300px                                         │
│   - Damage: Instant kill (no priority check)                    │
│   - Can stick into platforms                                    │
│   - Can be caught by enemies (rare, Elite only)                 │
│   - Falls into pits = lost                                      │
└─────────────────────────────────────────────────────────────────┘

UNARMED STATE:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   When weaponless, player can:                                  │
│   - Punch (Z key): 15px range, 0.5 damage, fast                │
│   - Kick: Part of punch combo                                   │
│   - Disarm: Perfect timing blocks disarm attacker              │
│   - Pick up: Walk over weapon to grab it                        │
│                                                                 │
│   STICK FIGURE UNARMED POSE:                                    │
│                                                                 │
│           o                   o                                 │
│          /|\     Punch →    /|━━━●  <- Fist extended           │
│          / \                / \                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2 Deliverables Checklist

```
□ src/components/player/EnhancedWeapon.ts
  - Attack phase state (anticipation/action/impact/recovery)
  - Phase timers per weapon type
  - Thrown state tracking
  
□ src/systems/EnhancedCombatSystem.ts
  - Phase-based attack processing
  - Hit pause implementation
  - Enhanced clash detection
  - Weapon throw mechanics
  - Disarm system
  
□ src/rendering/WeaponRenderer.ts
  - Detailed weapon sprites (rapier, broadsword, bow)
  - Attack animation poses
  - Slash trail effects
  - Thrown weapon rendering
  
□ src/effects/CombatEffects.ts
  - Hit pause (freeze frames)
  - Directional screen shake
  - Impact particles (sparks, dust)
  - Slash trails (alpha fade)
  
□ src/entities/ThrownWeapon.ts
  - Thrown weapon entity factory
  - Arc trajectory physics
  - Platform collision (stick)
  - Pickup collision
  
□ Update src/input/KeyboardInput.ts
  - K key for throw
  
□ Update src/input/GamepadInput.ts
  - Y button for throw
```

---

## PHASE 3: WORLD & ENVIRONMENT POLISH

### Parallax Background System

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        PARALLAX LAYER STRUCTURE                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  LAYER 0: Sky/Void (Farthest)                                                ║
║  ├── Parallax: 0% (static)                                                    ║
║  ├── Content: Gradient background, stars/particles                            ║
║  └── Color: Dark to medium gradient per level theme                           ║
║                                                                               ║
║  LAYER 1: Distant Background (10% parallax)                                   ║
║  ├── Content: Mountain silhouettes, distant structures                        ║
║  └── Style: Solid color shapes, no detail                                     ║
║                                                                               ║
║  LAYER 2: Mid Background (30% parallax)                                       ║
║  ├── Content: Medium-distance elements (trees, pillars, rocks)                ║
║  └── Style: Some detail, muted colors                                         ║
║                                                                               ║
║  LAYER 3: Near Background (60% parallax)                                      ║
║  ├── Content: Close background elements (vines, debris, fog wisps)            ║
║  └── Style: More detail, affects atmosphere                                   ║
║                                                                               ║
║  LAYER 4: Game Layer (100% - camera follows)                                  ║
║  ├── Content: Platforms, entities, hazards                                    ║
║  └── This is where gameplay happens                                           ║
║                                                                               ║
║  LAYER 5: Foreground Overlay (110% parallax)                                  ║
║  ├── Content: Fog, particles, atmospheric effects                             ║
║  └── Rendered AFTER entities for depth                                        ║
║                                                                               ║
║  IMPLEMENTATION:                                                              ║
║  ```typescript                                                                ║
║  function renderParallaxLayer(layer: ParallaxLayer, cameraX: number) {        ║
║    const offsetX = cameraX * layer.parallaxRatio;                             ║
║    ctx.save();                                                                ║
║    ctx.translate(-offsetX, 0);                                                ║
║    // Render layer elements                                                   ║
║    ctx.restore();                                                             ║
║  }                                                                            ║
║  ```                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Platform Types

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           PLATFORM VARIETY                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  SOLID (default):                                                            ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                                        ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  <- Standard collision                                ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  CRUMBLING (falls after player stands on it):                                ║
║                                                                               ║
║  Phase 1 (stable):    ░░░░░░░░░░░░░░░░░░░░                                   ║
║                                                                               ║
║  Phase 2 (shaking):   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░   <- Vibrate effect (1.5s)        ║
║                        cracks appear                                          ║
║                                                                               ║
║  Phase 3 (falling):      ░░░                                                  ║
║                            ░░░   <- Breaks into pieces                        ║
║                              ░░░                                              ║
║                                ▼                                              ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  MOVING (oscillates on path):                                                 ║
║                                                                               ║
║     ════════════════════════════════════════  <- Track (visual guide)        ║
║        ◀───── ▓▓▓▓▓▓▓▓▓▓ ─────▶                                              ║
║               Platform moves                                                  ║
║                                                                               ║
║  Properties:                                                                  ║
║  - speed: pixels per frame                                                    ║
║  - path: [start, end] points                                                  ║
║  - pauseAtEnds: frames to wait                                                ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  ONE-WAY (can jump through from below):                                       ║
║                                                                               ║
║          ↑ can pass ↑                                                         ║
║     ╔════════════════════╗                                                    ║
║     ║▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒║  <- Different visual (semi-transparent)          ║
║     ╚════════════════════╝                                                    ║
║          solid from above                                                     ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  BOUNCY (launches player upward):                                            ║
║                                                                               ║
║     ╔════════════════════╗                                                    ║
║     ║ ~ ~ ~ ~ ~ ~ ~ ~ ~  ║  <- Animated surface (membrane effect)            ║
║     ╚════════════════════╝                                                    ║
║                                                                               ║
║     On contact: player.vy = -22 (1.5x normal jump)                           ║
║     Visual: Platform compresses then springs                                  ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Screen Transitions

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         SCREEN TRANSITION TYPES                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  HORIZONTAL WIPE (screen to screen):                                          ║
║                                                                               ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         ║
║  │   CURRENT    │ │ CURR │ NEXT  │ │CURR│  NEXT   │ │     NEXT     │         ║
║  │    SCREEN    │ │      │       │ │    │         │ │    SCREEN    │         ║
║  │              │→│      │       │→│    │         │→│              │         ║
║  │              │ │      │       │ │    │         │ │              │         ║
║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         ║
║   Frame 0          Frame 10         Frame 20         Frame 30                 ║
║                                                                               ║
║  - Duration: 30 frames (0.5s)                                                 ║
║  - Player momentum preserved                                                  ║
║  - Wyrm visible during transition (continuous threat)                         ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  EMERGENCE TRANSITION (entering trap screens):                                ║
║                                                                               ║
║  1. Pause (10 frames)                                                         ║
║  2. Camera zooms out slightly (reveal danger)                                 ║
║  3. Dramatic lighting shift (darken edges)                                    ║
║  4. Resume normal gameplay                                                    ║
║                                                                               ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║                                                                               ║
║  DEATH TRANSITION:                                                            ║
║                                                                               ║
║  Frame 0:    Normal gameplay                                                  ║
║  Frame 1-5:  Screen flash red (alpha 0.5)                                     ║
║  Frame 6-20: Time slowdown (0.3x speed)                                       ║
║  Frame 21-30: Wyrm fills screen (if wyrm kill)                               ║
║  Frame 31-45: Fade to black                                                   ║
║  Frame 46-60: Respawn fade in                                                 ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Visual Language System

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          VISUAL COMMUNICATION                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  COLOR CODING:                                                                ║
║  ┌────────────────┬─────────────┬────────────────────────────────┐           ║
║  │    MEANING     │    COLOR    │           USAGE                │           ║
║  ├────────────────┼─────────────┼────────────────────────────────┤           ║
║  │ Safe/Exit      │ #4A7C59     │ Exit zones, safe platforms     │           ║
║  │ Danger         │ #FF6B35     │ Lava, hazards, warning         │           ║
║  │ Lethal         │ #CC3333     │ Spikes, instant death          │           ║
║  │ Wyrm           │ #8B0000     │ Wyrm presence, edge glow       │           ║
║  │ Player         │ #E63946     │ Player accent, hearts          │           ║
║  │ Enemy          │ #457B9D     │ Standard enemies               │           ║
║  │ Elite          │ #6A4C93     │ Brutes, elites                 │           ║
║  │ Neutral        │ #F5F5F0     │ Background, platforms          │           ║
║  └────────────────┴─────────────┴────────────────────────────────┘           ║
║                                                                               ║
║  SHAPE LANGUAGE:                                                              ║
║  ┌────────────────┬────────────────────────────────────────────┐             ║
║  │    MEANING     │              VISUAL STYLE                   │             ║
║  ├────────────────┼────────────────────────────────────────────┤             ║
║  │ Safe           │ Rounded corners, soft edges, warm lighting │             ║
║  │ Dangerous      │ Sharp angles, jagged edges, red tint       │             ║
║  │ Interactive    │ Pulsing glow, particle hints               │             ║
║  │ Solid          │ Bold outlines, high contrast               │             ║
║  │ Unstable       │ Cracks, slight vibration, muted color      │             ║
║  └────────────────┴────────────────────────────────────────────┘             ║
║                                                                               ║
║  ENVIRONMENTAL STORYTELLING:                                                  ║
║  - Bones/skulls near hazards (others died here)                               ║
║  - Claw marks near wyrm paths (it's been here before)                        ║
║  - Broken weapons (failed warriors)                                           ║
║  - Light sources illuminate safe paths                                        ║
║  - Shadows fall on dangerous areas                                            ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Phase 3 Deliverables Checklist

```
□ src/rendering/ParallaxSystem.ts
  - 6-layer parallax rendering
  - Per-layer scroll ratios
  - Element management per layer
  
□ src/components/player/PlatformTypes.ts
  - Crumbling platform logic
  - Moving platform paths
  - One-way collision flag
  - Bouncy platform force
  
□ src/systems/PlatformSystem.ts
  - Crumble timer management
  - Moving platform updates
  - Bounce force application
  
□ src/effects/ScreenTransitions.ts
  - Horizontal wipe
  - Emergence zoom
  - Death transition
  - Fade in/out utilities
  
□ src/rendering/EnvironmentRenderer.ts
  - Level-themed backgrounds
  - Atmospheric effects (fog, particles)
  - Environmental storytelling elements
  
□ src/levels/data/level1-enhanced.json
  - Platform types specified
  - Parallax layer data
  - Environmental storytelling elements
  
□ Update src/scenes/GameScene.ts
  - Parallax rendering integration
  - Screen transition handling
```

---

## PHASE 4: DYNAMIC MUSIC SYSTEM

### Audio Architecture Overview

For a music producer creating complex tracks in Ableton, we recommend a **hybrid vertical layering + horizontal sequencing** approach.

### Recommended File Structure

```
assets/audio/
├── music/
│   ├── level1/
│   │   ├── level1_base.ogg         # Always playing (drums, bass foundation)
│   │   ├── level1_layer1.ogg       # Screen 1-2 (add melodic element)
│   │   ├── level1_layer2.ogg       # Screen 3 (add intensity)
│   │   ├── level1_layer3.ogg       # Screen 4 (more intensity)
│   │   ├── level1_layer4.ogg       # Screen 5 trap (full intensity)
│   │   ├── level1_danger.ogg       # Wyrm close (additional tension layer)
│   │   └── level1_info.json        # Tempo, loop points, layer data
│   ├── level2/
│   │   └── ...
│   └── stingers/
│       ├── death.ogg               # Short death sound
│       ├── kill.ogg                # Enemy kill
│       ├── level_complete.ogg      # Level victory
│       └── wyrm_roar.ogg           # Wyrm emergence
└── sfx/
    ├── weapons/
    │   ├── rapier_swing.ogg
    │   ├── rapier_hit.ogg
    │   ├── broadsword_swing.ogg
    │   └── ...
    └── player/
        ├── jump.ogg
        ├── land.ogg
        └── ...
```

### Music Layer System

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         VERTICAL LAYERING SYSTEM                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  INTENSITY LEVELS (per screen):                                               ║
║                                                                               ║
║  Screen 1: ████░░░░░░  (Base + Layer 1)                                      ║
║  Screen 2: █████░░░░░  (Base + Layer 1 + 2)                                  ║
║  Screen 3: ███████░░░  (Base + Layer 1 + 2 + 3)                              ║
║  Screen 4: █████████░  (Base + Layer 1 + 2 + 3 + 4)                          ║
║  Screen 5: ██████████  (ALL LAYERS - Maximum intensity)                      ║
║                                                                               ║
║  WYRM PROXIMITY MODIFIER:                                                     ║
║  When wyrm is close (< 200px): Add danger layer                               ║
║  When wyrm is very close (< 100px): Increase all layer volumes               ║
║                                                                               ║
║  LAYER STRUCTURE RECOMMENDATION (for Ableton export):                         ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ BASE LAYER (always playing)                                              │ ║
║  │ - Drums (kick, snare pattern)                                            │ ║
║  │ - Sub bass                                                               │ ║
║  │ - Basic rhythmic element                                                 │ ║
║  │ - Export at: -6dB headroom                                               │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ LAYER 1 (Screen 2+)                                                      │ ║
║  │ - Melodic bass line                                                      │ ║
║  │ - Hi-hats / percussion                                                   │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ LAYER 2 (Screen 3+)                                                      │ ║
║  │ - Lead melody / arpeggio                                                 │ ║
║  │ - Additional percussion                                                  │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ LAYER 3 (Screen 4+)                                                      │ ║
║  │ - Intensity elements (risers, fills)                                     │ ║
║  │ - Doubled bass                                                           │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ LAYER 4 (Screen 5 - Trap)                                                │ ║
║  │ - Full intensity                                                         │ ║
║  │ - All elements unleashed                                                 │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ DANGER LAYER (Wyrm proximity)                                            │ ║
║  │ - Tension drones                                                         │ ║
║  │ - Heartbeat pulse                                                        │ ║
║  │ - Dissonant elements                                                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Web Audio API Implementation

```typescript
interface MusicLayerConfig {
  id: string;
  src: string;
  baseVolume: number;      // 0-1
  fadeInTime: number;      // seconds
  fadeOutTime: number;     // seconds
  loopStart?: number;      // seconds (for seamless loop point)
  loopEnd?: number;        // seconds
}

interface LevelMusicConfig {
  tempo: number;           // BPM (for sync purposes)
  loopLength: number;      // bars
  layers: MusicLayerConfig[];
  screenIntensity: number[]; // [0.2, 0.4, 0.6, 0.8, 1.0] per screen
  dangerThreshold: number; // wyrm distance to trigger danger layer
}

// Example level1_info.json
const level1Music: LevelMusicConfig = {
  tempo: 128,
  loopLength: 8,  // 8 bars
  layers: [
    { id: 'base', src: 'level1_base.ogg', baseVolume: 0.8, fadeInTime: 0, fadeOutTime: 2 },
    { id: 'layer1', src: 'level1_layer1.ogg', baseVolume: 0.6, fadeInTime: 1, fadeOutTime: 1 },
    { id: 'layer2', src: 'level1_layer2.ogg', baseVolume: 0.6, fadeInTime: 1, fadeOutTime: 1 },
    { id: 'layer3', src: 'level1_layer3.ogg', baseVolume: 0.7, fadeInTime: 0.5, fadeOutTime: 1 },
    { id: 'layer4', src: 'level1_layer4.ogg', baseVolume: 0.8, fadeInTime: 0.5, fadeOutTime: 0.5 },
    { id: 'danger', src: 'level1_danger.ogg', baseVolume: 0.5, fadeInTime: 0.3, fadeOutTime: 0.5 },
  ],
  screenIntensity: [1, 2, 3, 4, 5], // Which layers to enable per screen
  dangerThreshold: 200,
};
```

### Music Manager Architecture

```typescript
class MusicManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private layers: Map<string, MusicLayer> = new Map();
  private currentConfig: LevelMusicConfig | null = null;
  private currentIntensity: number = 1;
  
  async loadLevel(levelId: string): Promise<void> {
    // Load config JSON
    // Create AudioBufferSourceNode for each layer
    // Connect through individual GainNodes to masterGain
    // Start all layers simultaneously (for sync)
    // Set initial volumes based on intensity
  }
  
  setIntensity(screenNumber: number): void {
    // Fade in/out layers based on screenIntensity config
    // Uses exponential ramp for smooth transitions
    const targetLayers = this.currentConfig.screenIntensity[screenNumber - 1];
    
    for (const [id, layer] of this.layers) {
      const layerNumber = parseInt(id.replace('layer', ''));
      const shouldPlay = layerNumber <= targetLayers || id === 'base';
      
      if (shouldPlay && !layer.active) {
        this.fadeIn(layer);
      } else if (!shouldPlay && layer.active) {
        this.fadeOut(layer);
      }
    }
  }
  
  setDangerLevel(wyrmDistance: number): void {
    // Modulate danger layer based on wyrm proximity
    const dangerLayer = this.layers.get('danger');
    if (!dangerLayer) return;
    
    const threshold = this.currentConfig.dangerThreshold;
    if (wyrmDistance < threshold) {
      const intensity = 1 - (wyrmDistance / threshold);
      dangerLayer.gain.setTargetAtTime(intensity * 0.5, this.audioContext.currentTime, 0.1);
    } else {
      dangerLayer.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
    }
  }
  
  playStinger(name: string): void {
    // One-shot sounds that play over music
    // Duck music volume briefly if needed
  }
  
  pause(): void {
    // Suspend AudioContext (saves CPU)
    this.audioContext.suspend();
  }
  
  resume(): void {
    this.audioContext.resume();
  }
}
```

### Ableton Export Guidelines

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      ABLETON EXPORT RECOMMENDATIONS                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  FILE FORMAT:                                                                 ║
║  - Primary: OGG Vorbis (quality 8) - best size/quality for web               ║
║  - Fallback: MP3 320kbps for Safari < 15                                     ║
║  - Sample rate: 44.1kHz (standard)                                           ║
║  - Bit depth: 16-bit (sufficient for games)                                  ║
║                                                                               ║
║  LOOP CONSIDERATIONS:                                                         ║
║  - All layers MUST be exactly the same length                                 ║
║  - Export with 50ms silence at start/end for seamless looping                ║
║  - Mark loop points in JSON config (loopStart, loopEnd)                      ║
║  - Ensure downbeat alignment across all layers                                ║
║                                                                               ║
║  HEADROOM:                                                                    ║
║  - Export each layer at -6dB to -3dB                                         ║
║  - Leave headroom for summing in Web Audio                                   ║
║  - Danger layer can be quieter (-9dB) since it's additive                    ║
║                                                                               ║
║  LAYER ISOLATION:                                                             ║
║  - Each layer should sound complete when soloed with base                    ║
║  - Avoid elements that sound weird when faded in mid-phrase                  ║
║  - Consider 4 or 8 bar phrases for natural fade points                       ║
║                                                                               ║
║  TESTING:                                                                     ║
║  - Test all layer combinations in Ableton before export                      ║
║  - Verify no phase issues when layers combine                                ║
║  - Check that danger layer doesn't clash harmonically                        ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Music Sync Events

```typescript
// Events the music system listens to
interface MusicEvents {
  'screenEnter': { screenNumber: number };     // Trigger intensity change
  'wyrmProximity': { distance: number };       // Modulate danger layer
  'playerDeath': {};                           // Play death stinger, duck music
  'enemyKill': {};                             // Play kill stinger
  'levelComplete': {};                         // Transition to victory music
  'pause': {};                                 // Pause music
  'resume': {};                                // Resume music
}

// Events the music system emits
interface MusicEmits {
  'beatSync': { beat: number; bar: number };   // For visual sync (optional)
  'layerChange': { layer: string; active: boolean };
}
```

### Phase 4 Deliverables Checklist

```
□ src/managers/MusicManager.ts
  - Web Audio API setup
  - Layer loading and management
  - Intensity transitions
  - Danger proximity modulation
  - Stinger playback
  - Pause/resume handling
  
□ src/managers/SFXManager.ts
  - Sound effect loading
  - Positional audio (optional)
  - Volume management
  - Sound pooling (prevent overlap)
  
□ src/types/audio.ts
  - MusicLayerConfig interface
  - LevelMusicConfig interface
  - AudioState types
  
□ assets/audio/music/level1/
  - Placeholder structure for audio files
  - level1_info.json config template
  
□ assets/audio/sfx/
  - Placeholder structure for SFX
  
□ Update src/scenes/GameScene.ts
  - MusicManager integration
  - Screen change → intensity change
  - Wyrm distance → danger modulation
  
□ Update src/managers/AudioManager.ts
  - Replace stub with real implementation
  - Coordinate MusicManager + SFXManager
  
□ Documentation
  - Ableton export guide for you
  - Audio file naming conventions
  - Loop point specification format
```

---

## IMPLEMENTATION TIMELINE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          ESTIMATED TIMELINE                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  PRE-WORK: Fix TypeScript Errors                                             ║
║  ├── Duration: 30-45 minutes                                                  ║
║  └── Blocker for all other work                                               ║
║                                                                               ║
║  PHASE 1: Wyrm Reimagined                                                     ║
║  ├── Duration: 1-2 weeks                                                      ║
║  ├── Complexity: HIGH                                                         ║
║  ├── Dependencies: None (after pre-work)                                      ║
║  └── Key risk: Rendering performance with 50 segments                        ║
║                                                                               ║
║  PHASE 2: Weapon Feel                                                         ║
║  ├── Duration: 1-2 weeks                                                      ║
║  ├── Complexity: MEDIUM                                                       ║
║  ├── Dependencies: None (can parallel with Phase 1)                          ║
║  └── Key risk: Animation timing tuning                                       ║
║                                                                               ║
║  PHASE 3: World Polish                                                        ║
║  ├── Duration: 2-3 weeks                                                      ║
║  ├── Complexity: MEDIUM-HIGH                                                  ║
║  ├── Dependencies: Phases 1 & 2 (needs complete game feel)                   ║
║  └── Key risk: Parallax performance, platform variety scope                  ║
║                                                                               ║
║  PHASE 4: Dynamic Music                                                       ║
║  ├── Duration: 1-2 weeks (code) + your music production time                 ║
║  ├── Complexity: MEDIUM                                                       ║
║  ├── Dependencies: Phase 3 (needs screen transitions)                        ║
║  └── Key risk: Web Audio cross-browser compatibility                         ║
║                                                                               ║
║  TOTAL: 5-9 weeks (engineering) + music production time                      ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## SUCCESS CRITERIA

### Phase 1 Success
- [ ] Players audibly react to wyrm ("whoa", "oh no")
- [ ] Wyrm feels like a living creature, not a game mechanic
- [ ] Near-miss moments create genuine tension
- [ ] 60 FPS maintained with 50 segments

### Phase 2 Success
- [ ] Each weapon feels distinctly different
- [ ] Combat feels "crunchy" and satisfying
- [ ] Weapon throw adds strategic depth
- [ ] Clash moments feel impactful

### Phase 3 Success
- [ ] Each level feels thematically distinct
- [ ] Visual language communicates without text
- [ ] Platform variety adds gameplay depth
- [ ] Transitions feel polished, not jarring

### Phase 4 Success
- [ ] Music intensity matches gameplay tension
- [ ] Layer transitions are seamless (no audible pops/cuts)
- [ ] Wyrm proximity creates musical tension
- [ ] Music enhances the experience without distracting

---

## APPENDIX: INSPIRATION REFERENCES

### Visual References
- **Nidhogg 2 Wyrm**: https://www.youtube.com/watch?v=5DqKvgKxZXc
- **Hollow Knight Boss Fights**: Scale, presence, animation weight
- **Mario 64 Unagi**: Emergence, unpredictability, fear of unknown
- **Chinese Dragon Art**: Serpentine elegance, multi-joint flow

### Audio References
- **DOOM 2016**: Dynamic intensity based on combat
- **Hades**: Layer-based music that responds to action
- **Celeste**: Music that enhances emotional moments
- **Crypt of the NecroDancer**: Rhythm-synced gameplay

### Game Feel References
- **Hollow Knight**: Hit pause, screen shake, slash trails
- **Dead Cells**: Weapon variety, impact feedback
- **Katana Zero**: Time manipulation, precision combat
- **Celeste**: Movement polish, screen transitions

---

*Document Version: 2.0*  
*Created for: Next Session Implementation*  
*Includes: Phases 1-4 with full technical specifications*

# WYRM CHASE - Phase 2 Development Plan

## Product Vision Refinement

**Current State**: Functional prototype with basic mechanics  
**Target State**: A game that creates genuine tension, satisfaction, and moments of awe

### Core Experience Pillars

1. **Dread** - The wyrm should be terrifying, ever-present, and awe-inspiring
2. **Mastery** - Weapons should feel distinct, skillful, and satisfying to master
3. **Flow** - The world should guide, challenge, and reward without friction

---

## PHASE 1: THE WYRM REIMAGINED

### Vision
Transform the wyrm from a simple pursuer into a terrifying, almost Lovecraftian presence. Think: the Unagi eel from Mario 64's Jolly Roger Bay meets a Chinese dragon meets the Nidhogg wyrm's menace—but with the scale and presence that makes you FEEL hunted.

### Design Goals

**Scale & Presence**
- The wyrm should be **massive**—40-60 segments instead of 10
- Head should be 3-4x current size with detailed features
- When on screen, the wyrm should dominate visual attention
- Even off-screen, player should feel its presence (edge glow, rumble, shadow)

**Organic Movement**
- Current: Simple sine wave following
- Target: Multi-frequency serpentine motion that feels alive
- Body segments should have independent "muscle" movement
- Head should track player with slight prediction (feels intelligent)
- Occasional "surges" where wyrm accelerates with visual intensity

**Visual Design**

```
HEAD DESIGN (Side View):
                    ╔═══════════════════════╗
               ____/║  ◉            ◉      ║\____    <- Glowing eyes
         ____/      ║    ▼▼▼▼▼▼▼▼▼▼▼      ║      \____
    ____/           ║      TEETH           ║           \____
   /    ~~~~~~~~~~~~║~~~~~~~~~~~~~~~~~~~~~║~~~~~~~~~~~~    \
   \    ~~~~~~~~~~~~║    M O U T H        ║~~~~~~~~~~~~    /
    \____           ╚═══════════════════════╝           ____/
         \____    scales/ridges texture         ____/
              \____                        ____/
                   \______________________/

BODY SEGMENTS:
   Each segment has:
   - Scale texture (procedural lines)
   - Subtle color gradient (darker toward tail)
   - Glow effect on underside
   - Independent micro-movement
```

**Emergence & Drama**
- Wyrm doesn't just exist at screen edge—it EMERGES
- Level start: Wyrm bursts from the left with dramatic entrance
- After player death: Wyrm retreats slightly, then re-emerges with intent
- Near-miss moments: Wyrm mouth opens, snaps, player barely escapes

### Technical Implementation

```typescript
interface WyrmSegment {
  x: number;
  y: number;
  rotation: number;
  scale: number;           // Segments taper toward tail
  wavePhase: number;       // Individual segment oscillation
  glowIntensity: number;   // Pulsing glow effect
}

interface EnhancedWyrmComponent {
  segments: WyrmSegment[];  // 40-60 segments
  headState: 'pursuing' | 'surging' | 'snapping' | 'retreating';
  mouthOpen: number;        // 0-1 for animation
  eyeGlow: number;          // Intensity pulsing
  trailParticles: boolean;  // Smoke/ember trail
  emergenceProgress: number; // For dramatic entrances
}
```

**Movement Algorithm**:
```
For each segment i:
  baseWave = sin(time * 0.08 + i * 0.15) * amplitude
  muscleWave = sin(time * 0.2 + i * 0.3) * (amplitude * 0.3)
  segment.y = targetY + baseWave + muscleWave
  segment.rotation = atan2(segment[i-1].y - segment.y, segment[i-1].x - segment.x)
```

### Deliverables
- [ ] New WyrmRenderer with detailed head drawing
- [ ] Procedural scale/texture generation for body
- [ ] Multi-frequency serpentine movement system
- [ ] Wyrm state machine (pursuing, surging, snapping, retreating)
- [ ] Emergence animation system
- [ ] Particle trail system (embers, smoke)
- [ ] Eye glow and pulsing effects
- [ ] Sound design hooks (roar, slither, snap triggers)
- [ ] Screen edge presence indicator (when wyrm is close but off-screen)

---

## PHASE 2: WEAPON FEEL & COMBAT POLISH

### Vision
Each weapon should feel like a completely different game. The rapier should make you feel like a fencer—precise, quick, elegant. The broadsword should make you feel powerful but committed. The bow should build tension and release satisfaction.

### Design Goals

**Weapon Personality Matrix**

| Weapon | Feel | Animation Style | Sound Concept | Screen Effect |
|--------|------|-----------------|---------------|---------------|
| Rapier | Precise, quick, elegant | Fencing lunge, quick recovery | Sharp "ting" | Minimal shake, white flash |
| Broadsword | Heavy, powerful, committed | Wind-up, heavy swing, slow recovery | Deep "whoosh" then "thunk" | Heavy shake, impact frame |
| Bow | Tension, release, satisfaction | Draw back, hold, release | String tension, arrow whistle | Time slowdown on hit |

**Attack Animation Phases**
```
ANTICIPATION → ACTION → IMPACT → RECOVERY

Rapier:     [2 frames] → [3 frames] → [1 frame] → [4 frames]
Broadsword: [6 frames] → [4 frames] → [3 frames] → [8 frames]  
Bow:        [hold...] → [2 frames] → [on hit] → [6 frames]
```

**Visual Weapon Design**

```
RAPIER (detailed):
         ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶
         │
    ════╬════  <- Guard (cross-guard detail)
         │
         │     <- Handle with wrap texture

BROADSWORD (detailed):
              ╱▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔╲
             ╱                          ╲
            ▕▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▏
            ▕   BLADE (with fuller)     ▏
            ▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▏
             ╲                          ╱
       ══════╬══════  <- Wide guard
             ║
             ║        <- Wrapped handle

BOW (detailed):
           ╭───────╮
          ╱         ╲
         │           │  <- Curved limbs
         │     │     │  <- String (animates on draw)
         │     │     │
         │           │
          ╲         ╱
           ╰───────╯
```

**Combat Feedback Layers**

1. **Hit Pause** (Impact Frame)
   - Rapier: 2 frame pause
   - Broadsword: 4 frame pause  
   - Bow: 3 frame pause on arrow hit

2. **Screen Shake**
   - Rapier: Subtle directional shake (2px, toward target)
   - Broadsword: Heavy omnidirectional shake (8px, decay over 10 frames)
   - Bow: Sharp snap (4px, instant decay)

3. **Visual Effects**
   - Rapier: White slash trail, small sparks
   - Broadsword: Arc trail, impact dust cloud
   - Bow: Arrow trail, impact burst

4. **Clash System Enhancement**
   - Same-weapon clash: Both stagger, sparks fly outward
   - Priority win: Loser's weapon flies away, brief slowdown
   - Near-miss: Whoosh effect, close call indicator

**Weapon Throw & Pickup System**

```
NEW MECHANIC: Throw Weapon (K key / Y button)

- Player throws current weapon as projectile
- Becomes unarmed until:
  a) Pick up own thrown weapon
  b) Pick up enemy's dropped weapon
  c) Die and respawn with cycled weapon

- Thrown weapon can:
  - Kill enemies (instant kill, no priority check)
  - Be caught by enemies (they now have it)
  - Stick into platforms (retrievable)
  - Fall into pits (lost)

- Unarmed combat:
  - Can still attack (punch/kick)
  - Very short range, low damage
  - Can disarm attacking enemies on perfect timing
```

### Technical Implementation

```typescript
interface WeaponState {
  type: WeaponType | 'unarmed';
  phase: 'idle' | 'anticipation' | 'action' | 'impact' | 'recovery';
  phaseTimer: number;
  thrown: boolean;
  thrownEntity?: Entity;  // Reference to thrown weapon entity
}

interface AttackAnimation {
  anticipationFrames: number;
  actionFrames: number;
  impactFrames: number;
  recoveryFrames: number;
  hitPauseFrames: number;
  shakeIntensity: number;
  shakeDecay: number;
}

const WEAPON_ANIMATIONS: Record<WeaponType, AttackAnimation> = {
  rapier: { anticipationFrames: 2, actionFrames: 3, impactFrames: 1, recoveryFrames: 4, hitPauseFrames: 2, shakeIntensity: 2, shakeDecay: 0.8 },
  broadsword: { anticipationFrames: 6, actionFrames: 4, impactFrames: 3, recoveryFrames: 8, hitPauseFrames: 4, shakeIntensity: 8, shakeDecay: 0.6 },
  bow: { anticipationFrames: 0, actionFrames: 2, impactFrames: 0, recoveryFrames: 6, hitPauseFrames: 3, shakeIntensity: 4, shakeDecay: 0.9 },
};
```

### Deliverables
- [ ] Detailed weapon sprites (rapier, broadsword, bow)
- [ ] Attack animation state machine with phases
- [ ] Hit pause system (impact frames)
- [ ] Enhanced screen shake with directional variants
- [ ] Weapon trail effects (slash arcs, arrow trails)
- [ ] Clash effect overhaul (sparks, weapon fly-off)
- [ ] Weapon throw mechanic
- [ ] Thrown weapon entity type
- [ ] Weapon pickup system
- [ ] Unarmed combat state
- [ ] Sound design hooks for each weapon action

---

## PHASE 3: WORLD & ENVIRONMENT POLISH

### Vision
The world should feel alive, dangerous, and full of character. Every element should communicate—safe zones should feel safe, danger should feel dangerous, and the journey should tell a story without words.

### Design Goals

**Environmental Storytelling**
- Why is the wyrm chasing us? Visual hints in environment
- Each level has a theme that builds narrative:
  - Level 1: Caverns (we awakened something)
  - Level 2: Forest (it's following us to the surface)
  - Level 3: Ruins (others have fled before, and failed)
  - Level 4: Abyss (we're going deeper to escape)
  - Level 5: The Maw (there is no escape, only survival)

**Platform Variety**

```
PLATFORM TYPES:

SOLID (standard):
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

CRUMBLING (falls after stood on):
░░░░░░░░░░░░░░░░░░░░  <- Shakes when player lands
   cracks appear...    <- Falls after 1.5 seconds
      ↓ ↓ ↓ ↓

MOVING (horizontal or vertical):
→ ▓▓▓▓▓▓▓▓▓▓ →        <- Oscillates on path
  ════════════         <- Track/guide line

ONE-WAY (can jump through from below):
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  <- Different visual style
   ↑ can pass ↑        <- Solid from above

BOUNCY (launches player upward):
╔════════════════════╗
║ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~║  <- Animated surface
╚════════════════════╝  <- Higher jump force
```

**Hazard Variety**

```
LAVA (current, enhanced):
- Animated bubbling surface
- Rising/falling tide in some screens
- Glow illuminates nearby platforms
- Particles rise from surface

SPIKES:
  ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
- Static or retractable (timed)
- Visual "danger" glow
- Blood splatter on death (subtle, aesthetic)

VOID:
█████████████████████
█████████████████████  <- Darkness that kills
- No bottom, endless fall
- Particle wisps rise from edge
- Different from pit (pits have visible bottom)

WYRM SPAWN POINTS:
- Cracks in walls where mini-wyrms emerge
- Not the main wyrm, but smaller threats
- Adds variety to chase dynamic
```

**Parallax Background System**

```
LAYER DEPTHS:

Layer 0 (Farthest): Sky/void gradient, barely moves
Layer 1: Distant mountains/structures, 10% parallax
Layer 2: Mid-ground elements, 30% parallax  
Layer 3: Near background, 60% parallax
Layer 4: Foreground decorations, 90% parallax
Layer 5: Game layer (platforms, entities)
Layer 6: Foreground overlay (fog, particles)
```

**Screen Transitions**

```
CURRENT: Hard cut (jarring)
TARGET: Smooth, thematic transitions

HORIZONTAL WIPE:
- Player exits right
- Screen slides left, new screen slides in
- Player momentum preserved
- Wyrm visible during transition (continuous threat)

EMERGENCE TRANSITION (entering trap screens):
- Brief pause
- Camera zooms out slightly (reveal danger)
- Dramatic lighting shift
- Then normal gameplay resumes

DEATH TRANSITION:
- Screen flash (red tint)
- Brief slowdown
- Wyrm fills screen momentarily
- Fade to respawn
```

**Visual Language System**

```
COLOR CODING:
- Safe zones: Green tint/glow (#4A7C59)
- Danger zones: Red/orange tint (#FF6B35, #CC3333)
- Neutral: Warm paper tone (#F5F5F0)
- Wyrm presence: Dark purple/red aura (#8B0000)

SHAPE LANGUAGE:
- Safe: Rounded corners, soft edges
- Danger: Sharp angles, jagged edges
- Interactive: Pulsing glow, particle hints

ENVIRONMENTAL HINTS:
- Bones/debris near hazards (others died here)
- Claw marks near wyrm path (it's been here)
- Light sources illuminate safe paths
- Shadow falls on dangerous areas
```

**Interactive Elements**

```
BREAKABLE OBJECTS:
- Crates: Can be destroyed, may contain... nothing (it's not that kind of game)
- Stalagmites: Can fall, block wyrm temporarily
- Torches: Can be knocked over, illuminate briefly

ENVIRONMENTAL WEAPONS:
- Falling rocks: Trigger to drop on enemies
- Spike traps: Can be triggered, affect enemies too
- These are rare, strategic, not the focus
```

### Technical Implementation

```typescript
interface PlatformComponent {
  type: 'solid' | 'crumbling' | 'moving' | 'one-way' | 'bouncy';
  crumbleTimer?: number;
  moveSpeed?: number;
  movePath?: Vector2[];
  bounceForce?: number;
}

interface ParallaxLayer {
  depth: number;        // 0-1, affects scroll speed
  elements: BackgroundElement[];
  tint?: string;
  opacity?: number;
}

interface ScreenTransition {
  type: 'wipe' | 'fade' | 'emergence' | 'death';
  duration: number;
  progress: number;
  fromScreen: number;
  toScreen: number;
}

interface EnvironmentalHazard {
  type: 'lava' | 'spikes' | 'void' | 'wyrm-spawn';
  animated: boolean;
  particles: boolean;
  tidalCycle?: number;  // For rising/falling lava
  retractCycle?: number; // For timed spikes
}
```

### Deliverables
- [ ] Platform type system (crumbling, moving, one-way, bouncy)
- [ ] Crumbling platform animation and physics
- [ ] Moving platform paths and collision
- [ ] Enhanced hazard visuals (lava bubbles, spike glow)
- [ ] Parallax background system (6 layers)
- [ ] Screen transition system (wipe, fade, emergence)
- [ ] Environmental particle systems
- [ ] Visual language implementation (color coding, shape language)
- [ ] Interactive/breakable objects (basic implementation)
- [ ] Per-level atmosphere/theme system
- [ ] Sound design hooks for environment

---

## IMPLEMENTATION PRIORITY

### Phase 1: Wyrm (Highest Impact)
**Why first**: The wyrm IS the game. A terrifying wyrm transforms a decent platformer into a memorable experience. This is the unique selling point.

**Timeline**: 1-2 weeks  
**Complexity**: High (rendering, animation, state machine)  
**Impact**: Transformative

### Phase 2: Weapons (Core Loop Polish)
**Why second**: Combat is the primary verb. Once the wyrm is terrifying, the combat needs to feel satisfying enough that players WANT to fight instead of just run.

**Timeline**: 1-2 weeks  
**Complexity**: Medium (animation, effects, new mechanics)  
**Impact**: High (moment-to-moment feel)

### Phase 3: World (Immersion)
**Why third**: Environment polish is the final layer that makes everything cohesive. It's important but builds on the foundation of great wyrm + great combat.

**Timeline**: 2-3 weeks  
**Complexity**: Medium-High (systems, art, variety)  
**Impact**: Medium-High (cohesion, replayability)

---

## SUCCESS METRICS

### Phase 1 Success
- [ ] First-time players audibly react to wyrm appearance
- [ ] Wyrm feels like a living creature, not a game mechanic
- [ ] Near-miss moments create genuine tension
- [ ] Players remember the wyrm specifically when describing the game

### Phase 2 Success
- [ ] Players develop weapon preferences
- [ ] Combat feels "crunchy" and satisfying
- [ ] Kills feel earned, deaths feel fair
- [ ] Weapon throw adds strategic depth without complexity

### Phase 3 Success
- [ ] Each level feels distinct
- [ ] Players can navigate intuitively (visual language works)
- [ ] Environment enhances tension without distracting
- [ ] World feels cohesive and intentional

---

## OPEN QUESTIONS FOR FUTURE PHASES

1. **Multiplayer**: Could this become competitive like Nidhogg?
2. **Boss Fights**: Does the wyrm become fightable in Level 5?
3. **Progression**: Unlockable cosmetics? New weapons?
4. **Story Mode**: Cutscenes? Dialogue? Or purely environmental?
5. **Difficulty Modes**: How do we scale for different skill levels?
6. **Audio**: When do we invest in real sound design and music?

---

## APPENDIX: REFERENCE GAMES

| Game | What to Learn |
|------|---------------|
| **Nidhogg 1 & 2** | Wyrm presence, combat feel, tension pacing |
| **Mario 64 (Unagi)** | Scale, emergence, environmental dread |
| **Hollow Knight** | Screen shake, hit pause, combat weight |
| **Celeste** | Movement feel, screen transitions, visual language |
| **Limbo/Inside** | Environmental storytelling, atmosphere |
| **Katana Zero** | Hit effects, time manipulation feel |
| **Dead Cells** | Weapon variety, combat feedback |

---

*Document Version: 1.0*  
*Last Updated: Phase 2 Planning*  
*Author: Product/UX/Design Engineering Review*

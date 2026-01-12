# UI/UX Enhancement Plan for Wyrm Chase V2

## 1. Design Philosophy: "Neon Tension"
**Core Pillars:**
-   **Clarity in Chaos:** The UI must remain legible even when the screen is shaking and enemies are swarming.
-   **Diegetic Integration:** Information should live in the world where possible (e.g., player changing color on low health instead of just a bar).
-   **Fluidity:** All UI transitions should use spring physics or smooth easings—no abrupt "pops."
-   **Thematic Unity:** Align with the existing "Dark Synth/Neon" palette (`#1a1a2e` bg, `#e94560` player).

## 2. Technical Architecture
**Hybrid Approach:**
-   **Game World:** Three.js (WebGL) for gameplay and particle effects.
-   **UI Layer:** HTML/CSS Overlay (Absolute positioning over Canvas) for text, HUD, and menus.
-   **VFX System:** A dedicated Three.js system for "Juice" (particles, trails, flashes).

### New Systems
1.  **`UISystem`**: Listens to `EventBus` and manipulates the DOM. Decouples game state from UI rendering.
2.  **`ParticleSystem`**: Manages pooled particle emitters in the 3D scene.
3.  **`PostProcessing` (Optional Phase 4):** Bloom/Glow effects to sell the "Neon" look.

## 3. Feature Breakdown

### A. The HUD (Heads-Up Display)
*Minimalist, anchored to edges.*

1.  **Health (Top-Left):**
    -   **Visual:** 3 Horizontal "Life Blocks" (Neon Red).
    -   **Feedback:** Blocks shatter/fade when lost. Entire bar shakes on damage.
    -   **Low HP:** Red vignette pulses on screen edges (CSS radial gradient).
2.  **Wyrm Threat (Top-Center):**
    -   **Visual:** A minimal "Distance Bar" or "Threat Radar".
    -   **Behavior:**
        -   Safe: Thin blue line.
        -   Danger: Thickens and turns Purple/Pink (`#7b2cbf`).
        -   Critical: Pulses and glows.
3.  **Weapon (Bottom-Left):**
    -   **Visual:** SVG Icon of current weapon (Rapier, Broadsword, Bow).
    -   **Transition:** Slide-up/Scale animation when picking up a new weapon.

### B. Menus & Screens
*Glassmorphism aesthetic: Dark semi-transparent backgrounds with blur.*

1.  **Title Screen:**
    -   **Background:** Slow parallax pan of a game level.
    -   **Logo:** Large, neon-styled text with "glitch" effects on hover.
    -   **CTA:** "Press Any Key" with a slow breathe animation.
2.  **Pause Overlay:**
    -   **Style:** `backdrop-filter: blur(8px)` with a dark overlay.
    -   **Animation:** Menu items stagger-slide in from the bottom.
3.  **Game Over / Victory:**
    -   **Game Over:** "SLAIN" in jagged red text. Screen desaturates (CSS filter).
    -   **Victory:** "ESCAPED" in bright gold/white. Confetti particles.

### C. "Juice" & Micro-interactions (The Delight)
1.  **Combat Impact:**
    -   **Hit Stop:** Freeze frame for 50-100ms on impact (already in `CombatEffects`, refine timing).
    -   **Flash:** White material override on entity for 1 frame.
    -   **Particles:** Directional sparks (cones) based on hit angle.
2.  **Movement:**
    -   **Jump:** Small "dust" puff (scaled circles) at feet.
    -   **Land:** Squashing the player sprite slightly (Y-scale) on impact.
    -   **Dash/Roll:** "Ghost" trails (previous frame positions with lower opacity).
3.  **Camera:**
    -   **Trauma Shake:** Non-linear shake decay (violent snap, smooth recovery).
    -   **Look-Ahead:** Camera pans slightly in the direction of movement/velocity.

## 4. Implementation Roadmap

### Phase 1: Foundation (HTML/CSS & System Setup)
-   [ ] Create `UISystem.ts` structure in `src/systems/`.
-   [ ] Add `#ui-layer` to `index.html` with containers for HUD, Menus, and Notifications.
-   [ ] Define CSS variables for theme colors (`src/constants.ts` sync).
-   [ ] Implement basic HUD (Static Health + Weapon).
-   [ ] Register `UISystem` in `Game.ts`.

### Phase 2: Reactivity & Menus
-   [ ] Connect `EventBus` events (`playerHit`, `weaponPickup`, `wyrmUpdate`) to UI updates.
-   [ ] Implement Title and Game Over screens with CSS transitions.
-   [ ] Add "Low Health" vignette effect (CSS overlay).
-   [ ] Implement "Wyrm Threat" meter logic.

### Phase 3: The Juice (VFX)
-   [ ] Create `ParticleSystem.ts` (Three.js instanced mesh for performance).
-   [ ] Register `ParticleSystem` in `Game.ts`.
-   [ ] Implement "Hit Flash" in `RenderSystem` (material swapping).
-   [ ] Add "Dust" particles for jumps and landings.
-   [ ] Add "Spark" particles for combat clashes.

### Phase 4: Polish (Motion Design)
-   [ ] Add "Ghost Trails" for the dash/roll mechanic.
-   [ ] Tune camera shake algorithms for "snappiness".
-   [ ] Add placeholder CSS-based icons for weapons if SVGs unavailable.

## 5. File Structure Changes
```text
src/
├── systems/
│   ├── UISystem.ts       # NEW: Handles DOM updates
│   ├── ParticleSystem.ts # NEW: Handles 3D particles
├── ui/                   # NEW: CSS and HTML templates
│   ├── styles.css
│   └── templates.ts
```

## 6. Assets Strategy
-   **Icons:** Use CSS geometric shapes or simple inline SVGs for now.
-   **Fonts:** Import Google Font 'Orbitron' (Headers) and 'Roboto Mono' (UI) via `index.html`.

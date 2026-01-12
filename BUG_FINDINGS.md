# Bug Investigation Findings

Scope: Static review of source code only (no runtime execution). This list focuses on likely bugs or unexpected behavior based on current implementation.

## 1) One-way platforms can snap the player upward from below - ✅ FIXED
- Priority: High (core traversal; one-way platforms can behave like sticky ceilings and cause unexpected teleports)
- Symptom: Falling while below a one-way platform can pop the player up onto the platform, even when several units below it.
- Suspected root cause: The landing check uses a very large tolerance (`platformAABB.maxY - 5`) and does not gate on previous-frame position, so any falling entity within ~5 units below a platform gets snapped on top.
- Suggested solution: Use previous-frame Y to confirm the entity crossed the platform top from above, or replace the 5-unit tolerance with a small epsilon in world units (e.g., 0.05-0.2) and require `entityAABB.minY >= platformAABB.maxY - epsilon`.
- Repro/impact notes: Player height is ~1.5 units, so a 5-unit buffer is large enough to trigger from far below; repeated snaps can feel like a sticky ceiling or teleport when descending through stacked one-way platforms.
- Evidence: src/systems/CollisionSystem.ts:150-168
- **Fix applied**: Changed tolerance from 5 units to 0.15 units (ONE_WAY_EPSILON constant) at CollisionSystem.ts:154-155. This ensures entities must be very close to the platform surface before snapping can occur.

## 2) Roll and throw inputs are wired but never produce gameplay effects - ✅ FIXED
- Priority: Medium (controls advertise actions that do nothing; ghost trail never spawns because `isRolling` is never set)
- Suspected root cause: No system updates `playerControlled.isRolling/rollFrames` and no throw/weapon system consumes the `throw` action.
- Suggested solution: Implement a RollSystem (or expand MovementSystem) to manage roll state and invincibility, and add a throw/weapon system (or remove the bindings until implemented).
- Evidence: src/input/InputManager.ts:19-34, src/types/index.ts:139-146, src/systems/GhostSystem.ts:51-67
- **Fix applied**: RollSystem.ts and ThrownWeaponSystem.ts have been implemented and registered in main.ts. RollSystem sets isRolling/rollFrames and grants invincibility. ThrownWeaponSystem listens for weaponThrown events from CombatSystem. MovementSystem applies 1.5x roll speed multiplier. GhostSystem spawns trails when isRolling is true.

## 3) Hit pause is configured but never triggered - ✅ FIXED
- Priority: Medium (combat feel is flatter than intended; hit pause never occurs even though weapons define it)
- Suspected root cause: CombatEffects listens for `hitPause`, and weapons define `hitPauseFrames`, but CombatSystem never emits `hitPause` on hits.
- Suggested solution: Emit `hitPause` when a hit lands, using the attacker weapon's `hitPauseFrames` value.
- Evidence: src/effects/CombatEffects.ts:47-79, src/constants.ts:63-104, src/systems/CombatSystem.ts:272-280
- **Fix applied**: Added `hitPause` event emission in CombatSystem.ts:437-444 after successful normal attack hits. Uses the attacker's weapon's `hitPauseFrames` value (rapier: 2, broadsword: 4, bow: 2) or defaults to 2 frames for unarmed attacks.

## 4) Parry/clash can spam every active frame - ✅ FIXED
- Priority: Medium (excessive screen shakes/particles; parry feedback repeats multiple times per attack)
- Symptom: Holding matching sword positions can emit multiple clash events per attack, creating repeated shakes and spark bursts.
- Suspected root cause: The parry path does not mark the target as handled for the current attack, so each active frame emits another `weaponClash` and `screenShake`.
- Suggested solution: Add parried targets to the per-attack set (or introduce a separate set), or end the attack early on parry to prevent repeated clashes.
- Repro/impact notes: Each `weaponClash` spawns 15 particles and triggers camera shake, so multi-frame clashes can spike visual noise and particle count.
- Evidence: src/systems/CombatSystem.ts:186-263, src/systems/ParticleSystem.ts:83-94
- **Fix applied**: Added parried targets to `hitTargets` set at CombatSystem.ts:358-360. When a parry occurs, the target is now marked as handled so subsequent frames during the same attack's active phase will skip them, preventing multi-frame clash spam.

## 5) Wyrm segment wave animation likely runs too fast - ✅ FIXED
- Priority: Low/Medium (visual jitter; effect speed is tied to milliseconds but tuned like frames)
- Suspected root cause: `waveTime` increments by `deltaTime` in ms while `WAVE_FREQUENCY` is a small constant tuned for per-frame increments.
- Suggested solution: Convert `deltaTime` to seconds (or increment by 1 per fixed step) and adjust `WAVE_FREQUENCY` accordingly for the intended oscillation rate.
- Evidence: src/systems/WyrmSystem.ts:62-75, src/systems/WyrmSystem.ts:166-181
- **Fix applied**: Changed `waveTime += deltaTime` to `waveTime += 1` at WyrmSystem.ts:75. Since deltaTime was ~16.67ms, the animation was running ~16x faster than intended. Now increments by 1 per fixed update, giving approximately one full wave cycle per second with WAVE_FREQUENCY=0.1.

## 6) Edge-triggered input can be applied across multiple fixed updates - ✅ FIXED
- Priority: Medium (after a long frame, a single keypress can be treated as "just pressed" across multiple fixed updates)
- Symptom: On a frame that runs multiple fixed updates, a single keypress can be processed more than once (e.g., pause toggles on then immediately off).
- Suspected root cause: `endFrame()` is called once per render frame, but the fixed update loop can run multiple times before that, so `keysJustPressed` survives across multiple updates.
- Suggested solution: Clear edge-triggered input after each fixed update (or snapshot input per update tick) instead of only at frame end.
- Repro/impact notes: Dropped frames or long GC pauses can cause multiple updates in one RAF tick; any edge-triggered toggle (pause/resume) is most sensitive.
- Evidence: src/core/GameLoop.ts:49-61, src/main.ts:116-121
- **Fix applied**: Added new `onFixedUpdateEnd` callback parameter to GameLoop constructor. Now `input.endFrame()` is called after each fixed update iteration (GameLoop.ts:53-54) instead of only once per render frame. This ensures edge-triggered inputs like `justPressed` are cleared immediately after being consumed, preventing multi-processing during catch-up frames.

## 7) Collision masks act as one-sided filters - ✅ VALIDATED (NOT A BUG - Intentional Design)
- Priority: Low (future content risk; collisions may happen even when one side intends to opt out)
- Symptom: An entity can still collide with a platform even if the entity's mask excludes that layer, as long as the platform's mask includes the entity's layer (or vice versa).
- Suspected root cause: CollisionSystem treats a collision as valid if either mask matches (`OR`), instead of requiring mutual agreement (`AND`).
- Suggested solution: If you want symmetric filtering, use `(a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0`, or document the one-sided behavior explicitly.
- Repro/impact notes: Today this mostly affects platform collisions, but it becomes surprising once you add more entity types with asymmetric masks.
- Evidence: src/systems/CollisionSystem.ts:102-104
- **Resolution**: This is intentional design, not a bug. The OR logic enables asymmetric collision relationships that the game relies on:
  - Wyrm (mask: PLAYER) catches Player even though Player's mask doesn't include WYRM
  - Hazards affect players without players explicitly opting into HAZARD collisions
  - Changing to AND logic would break these core mechanics
  - Added documentation comment at CollisionSystem.ts:103-107 explaining the design choice and providing the AND alternative for future reference.

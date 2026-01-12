# Wyrm Chase V2 - Bug Investigation (Fresh Pass)

This report is based on a fresh code review (no prior bug markdown consulted). Each item includes priority context, suspected root cause, and a suggested fix direction.

## 1) Roll invincibility never takes effect
- Priority: High — rolling is described as invincible, but damage still applies during rolls, so core defensive gameplay is unreliable.
- Suspected root cause: `HealthComponent.invincibilityFrames` is set in the roll system but never decremented or checked before applying damage.
- Suggested solution: introduce a health/invincibility tick (decrement per update) and gate damage in combat, thrown weapons, and hazards when `invincibilityFrames > 0`.
- References: `src/systems/RollSystem.ts:51`, `src/systems/CombatSystem.ts:468`, `src/systems/ThrownWeaponSystem.ts:247`, `src/types/index.ts:106`

## 2) Trip knockdown state has no gameplay effect
- Priority: Medium — trip attacks set knockdown flags but targets keep moving/attacking, so the mechanic appears broken.
- Suspected root cause: `isKnockedDown`/`knockdownFrames` are written but never read or decremented in any system.
- Suggested solution: add a knockdown state handler (e.g., in Movement/AISystem) that reduces `knockdownFrames` each update and suppresses movement/attacks while knocked down.
- References: `src/systems/CombatSystem.ts:459`, `src/types/index.ts:106`

## 3) Thrown weapons get double gravity and conflicting platform collisions
- Priority: High — projectile arcs and sticking behavior are inconsistent, especially near platforms.
- Suspected root cause: MovementSystem applies global gravity to all entities with velocity, while ThrownWeaponSystem applies its own gravity and runs an independent collision/stick path; CollisionSystem also resolves platform collisions for projectiles.
- Suggested solution: exclude `thrownWeapon` entities from MovementSystem gravity and/or CollisionSystem platform resolution, or move projectile physics fully into one system with consistent collision handling.
- References: `src/systems/MovementSystem.ts:54`, `src/systems/ThrownWeaponSystem.ts:186`, `src/systems/CollisionSystem.ts:33`

## 4) Thrown weapons only “stick” near platform centers
- Priority: Medium — wall/platform sticking rarely happens; most hits just pass through unless near the platform’s center point.
- Suspected root cause: `checkPlatformCollision` uses a fixed `dx/dy < 0.5` test against the platform’s center, ignoring platform dimensions.
- Suggested solution: use platform collider bounds for overlap checks (AABB vs AABB), or reuse CollisionSystem contact info to mark the projectile as stuck.
- References: `src/systems/ThrownWeaponSystem.ts:284`

## 5) Particles can linger after the last particle expires
- Priority: Low — visual artifacts: the final particle batch can remain on screen until another effect spawns.
- Suspected root cause: instanced mesh buffers only update when `activeCount > 0`, so the frame that deactivates the last particle never flushes updated matrices/colors.
- Suggested solution: track a “dirty” flag when any particle changes state (spawn/die) and update buffers even if `activeCount === 0`.
- References: `src/systems/ParticleSystem.ts:139`

## 6) Unarmed combat path is missing after throwing a weapon
- Priority: Medium — UI shows “Unarmed” and constants exist, but the player can’t attack once weaponType is `none`.
- Suspected root cause: CombatSystem skips all attack processing when `weaponType === 'none'`, and no alternate punch logic uses the unarmed constants.
- Suggested solution: add an unarmed attack branch in CombatSystem using `PUNCH_*` values, or disallow throwing if unarmed combat isn’t supported.
- References: `src/systems/CombatSystem.ts:72`, `src/constants.ts:109`, `src/systems/UISystem.ts:162`

## 7) Hazard events always report “pit” cause
- Priority: Low — if spikes are ever added, deaths will be misclassified and can’t be distinguished in events.
- Suspected root cause: HazardSystem ignores `hazardType` and always emits `playerDeath` with `cause: 'pit'`; the event union doesn’t include a spike cause.
- Suggested solution: add a spike cause to `GameEvent`, map hazard types to specific causes, or simplify the type model to a generic “hazard” cause.
- References: `src/systems/HazardSystem.ts:50`, `src/types/index.ts:214`

/**
 * WyrmSystem - Handles wyrm movement, player tracking, and collision detection
 *
 * The wyrm is the primary threat that chases the player through the level.
 * It moves forward constantly, tracks player Y position with lag, and
 * modulates speed based on player position.
 */

import type {
  System,
  Entity,
  World,
  WyrmComponent,
  TransformComponent,
  ThreeObjectComponent,
  VelocityComponent,
} from '../types';
import type { EventBus } from '../core/Events';
import {
  SYSTEM_PRIORITY,
  WYRM_MAX_SPEED,
  WYRM_SURGE_MULTIPLIER,
  WYRM_SLOW_MULTIPLIER,
  WYRM_BEHAVIOR,
} from '../constants';
import { createLogger } from '../utils/debug';
import { lerp } from '../utils/math';
import type * as THREE from 'three';

const log = createLogger('WyrmSystem');

// Destructure behavior constants for cleaner access
const {
  Y_TRACKING_LERP,
  SEGMENT_FOLLOW_LERP,
  WAVE_AMPLITUDE,
  WAVE_FREQUENCY,
  COLLISION_DISTANCE,
  SHAKE_TRIGGER_DISTANCE,
  FAR_AHEAD_DISTANCE,
  MIN_SPEED_MULTIPLIER,
  SEGMENT_OFFSET,
  SEGMENT_PHASE_OFFSET,
  SEGMENT_SPACING,
} = WYRM_BEHAVIOR;

export class WyrmSystem implements System {
  readonly name = 'WyrmSystem';
  readonly requiredComponents = ['wyrm', 'transform'] as const;
  readonly priority = SYSTEM_PRIORITY.Wyrm;

  private world: World | null = null;
  private readonly events: EventBus;
  private waveTime = 0;
  private isShaking = false;

  constructor(events: EventBus) {
    this.events = events;
    log('WyrmSystem initialized');
  }

  setWorld(world: World): void {
    this.world = world;
    log('World reference set');
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    // Query for player entity
    const player = this.world?.queryOne(['playerControlled', 'transform']);
    if (!player) {
      log('No player found');
      return;
    }

    const playerTransform = player.getComponent<TransformComponent>('transform');
    if (!playerTransform) return;

    // Update wave time for segment animation
    // Increment by 1 per fixed update (not deltaTime in ms) since WAVE_FREQUENCY is tuned for per-frame increments
    this.waveTime += 1;

    for (const entity of entities) {
      const wyrm = entity.getComponent<WyrmComponent>('wyrm');
      const transform = entity.getComponent<TransformComponent>('transform');
      const threeObj = entity.getComponent<ThreeObjectComponent>('threeObject');

      if (!wyrm || !transform) continue;

      // Calculate player velocity direction for surge detection
      const playerVelocity = player.getComponent<VelocityComponent>('velocity');
      const playerMovingLeft = playerVelocity !== undefined && playerVelocity.vx < 0;

      // Modulate speed based on player position
      this.updateSpeed(wyrm, transform, playerTransform, playerMovingLeft);

      // Move wyrm forward (speed is per-frame, not per-second)
      transform.x += wyrm.currentSpeed;
      log(`Wyrm moving: x=${transform.x.toFixed(2)}, speed=${wyrm.currentSpeed.toFixed(4)}`);

      // Track player Y with smooth lag (lerp)
      wyrm.targetY = playerTransform.y;
      transform.y = lerp(transform.y, wyrm.targetY, Y_TRACKING_LERP);

      // Update segment positions (follow-the-leader with wave motion)
      this.updateSegments(wyrm, transform);

      // Update Three.js mesh positions
      if (threeObj?.object) {
        threeObj.object.position.set(transform.x, transform.y, transform.z);
        this.updateSegmentMeshes(wyrm, threeObj.object);
      }

      // Check collision with player
      const distance = this.calculateDistance(transform, playerTransform);
      log(`Distance to player: ${distance.toFixed(2)}`);

      // Emit screen shake when close
      if (distance < SHAKE_TRIGGER_DISTANCE && !this.isShaking) {
        this.isShaking = true;
        this.events.emit({ type: 'screenShake', intensity: 2, duration: 50 });
        log('Screen shake triggered');
      } else if (distance >= SHAKE_TRIGGER_DISTANCE) {
        this.isShaking = false;
      }

      // Check for collision (player death)
      if (distance < COLLISION_DISTANCE) {
        log('Player caught by wyrm!');
        this.events.emit({ type: 'playerDeath', cause: 'wyrm' });
      }
    }
  }

  private updateSpeed(
    wyrm: WyrmComponent,
    wyrmTransform: TransformComponent,
    playerTransform: TransformComponent,
    playerMovingLeft: boolean
  ): void {
    const horizontalDistance = playerTransform.x - wyrmTransform.x;
    const minSpeed = wyrm.baseSpeed * MIN_SPEED_MULTIPLIER;

    // Surge: player moving toward wyrm (leftward)
    if (playerMovingLeft) {
      wyrm.currentSpeed = Math.min(
        wyrm.baseSpeed * WYRM_SURGE_MULTIPLIER,
        WYRM_MAX_SPEED
      );
      log('Surge mode: player moving left');
    }
    // Slowdown: player is far ahead
    else if (horizontalDistance > FAR_AHEAD_DISTANCE) {
      wyrm.currentSpeed = wyrm.baseSpeed * WYRM_SLOW_MULTIPLIER;
      log('Slow mode: player far ahead');
    }
    // Normal speed
    else {
      wyrm.currentSpeed = wyrm.baseSpeed;
    }

    // Clamp speed
    wyrm.currentSpeed = Math.max(minSpeed, Math.min(wyrm.currentSpeed, WYRM_MAX_SPEED));
  }

  private updateSegments(wyrm: WyrmComponent, headTransform: TransformComponent): void {
    const segments = wyrm.segments;
    if (segments.length === 0) return;

    const firstSegment = segments[0];
    if (!firstSegment) return;

    firstSegment.x = lerp(firstSegment.x, headTransform.x - SEGMENT_OFFSET, SEGMENT_FOLLOW_LERP);
    firstSegment.baseY = lerp(firstSegment.baseY ?? firstSegment.y, headTransform.y, SEGMENT_FOLLOW_LERP);
    firstSegment.y = firstSegment.baseY + Math.sin(this.waveTime * WAVE_FREQUENCY) * WAVE_AMPLITUDE;
    firstSegment.z = headTransform.z;

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const leader = segments[i - 1];
      if (!segment || !leader) continue;

      const phaseOffset = i * SEGMENT_PHASE_OFFSET;

      segment.x = lerp(segment.x, leader.x - SEGMENT_SPACING, SEGMENT_FOLLOW_LERP);
      segment.baseY = lerp(segment.baseY ?? segment.y, leader.baseY ?? leader.y, SEGMENT_FOLLOW_LERP);
      segment.y = segment.baseY + Math.sin(this.waveTime * WAVE_FREQUENCY + phaseOffset) * WAVE_AMPLITUDE;
      segment.z = leader.z;
    }
  }

  private updateSegmentMeshes(wyrm: WyrmComponent, group: THREE.Object3D): void {
    // Group structure: children[0] = head, children[1..n] = segments
    const children = group.children;
    const segments = wyrm.segments;

    // Skip head (index 0), update segment meshes (indices 1 to n)
    for (let i = 0; i < segments.length; i++) {
      const child = children[i + 1]; // +1 to skip head
      const segment = segments[i];
      if (!child || !segment) continue;

      // Set absolute world position for segment mesh
      child.position.set(
        segment.x - group.position.x, // Relative to group
        segment.y - group.position.y,
        segment.z - group.position.z
      );
    }
  }

  private calculateDistance(
    wyrmTransform: TransformComponent,
    playerTransform: TransformComponent
  ): number {
    const dx = playerTransform.x - wyrmTransform.x;
    const dy = playerTransform.y - wyrmTransform.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

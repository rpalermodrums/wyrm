import type { EventBus, SlashTrail } from '../types';
import type { WeaponType, ScreenShakeConfig } from '../constants';
import {
  SCREEN_SHAKE_CONFIGS,
  SLASH_TRAIL,
  COMBAT_COLORS,
  HIT_PAUSE_FRAMES,
} from '../constants';

export interface DirectionalShake {
  intensity: number;
  duration: number;
  decay: number;
  direction: 'forward' | 'horizontal' | 'omnidirectional';
  facing: 1 | -1;
  currentFrame: number;
}

export class CombatEffects {
  private slashTrails: SlashTrail[] = [];
  private activeShake: DirectionalShake | null = null;
  private hitPauseFrames = 0;
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on('combatHit', (event) => {
      this.triggerHitEffects(event.weapon, event.x, event.y);
    });

    this.events.on('clash', (event) => {
      this.triggerClashEffects(event.x, event.y);
    });

    this.events.on('hitPause', (event) => {
      this.applyHitPause(event.frames);
    });
  }

  triggerHitEffects(weapon: WeaponType, x: number, y: number): void {
    const shakeConfig = this.getShakeConfigForWeapon(weapon);
    this.startDirectionalShake(shakeConfig, 1);

    const hitPause = HIT_PAUSE_FRAMES[weapon];
    this.applyHitPause(hitPause);

    this.events.emit({
      type: 'spawnParticles',
      x,
      y,
      color: COMBAT_COLORS.impactSpark,
      count: weapon === 'broadsword' ? 8 : 4,
    });
  }

  triggerClashEffects(x: number, y: number): void {
    this.startDirectionalShake(SCREEN_SHAKE_CONFIGS.clash, 1);
    this.applyHitPause(HIT_PAUSE_FRAMES.clash);

    this.events.emit({
      type: 'spawnParticles',
      x,
      y,
      color: COMBAT_COLORS.impactSpark,
      count: 12,
    });
  }

  private getShakeConfigForWeapon(weapon: WeaponType): ScreenShakeConfig {
    switch (weapon) {
      case 'rapier':
        return SCREEN_SHAKE_CONFIGS.rapierHit;
      case 'broadsword':
        return SCREEN_SHAKE_CONFIGS.broadswordHit;
      case 'bow':
        return SCREEN_SHAKE_CONFIGS.bowHit;
    }
  }

  startDirectionalShake(
    config: ScreenShakeConfig,
    facing: 1 | -1
  ): void {
    this.activeShake = {
      intensity: config.intensity,
      duration: config.duration,
      decay: config.decay,
      direction: config.direction,
      facing,
      currentFrame: 0,
    };
  }

  applyHitPause(frames: number): void {
    this.hitPauseFrames = Math.max(this.hitPauseFrames, frames);
  }

  isInHitPause(): boolean {
    return this.hitPauseFrames > 0;
  }

  startSlashTrail(weaponType: WeaponType, facing: 1 | -1): SlashTrail {
    const trail: SlashTrail = {
      points: [],
      weaponType,
      facing,
    };
    this.slashTrails.push(trail);
    return trail;
  }

  addSlashTrailPoint(trail: SlashTrail, x: number, y: number): void {
    trail.points.push({ x, y, age: 0 });
    if (trail.points.length > SLASH_TRAIL.maxPoints) {
      trail.points.shift();
    }
  }

  update(): boolean {
    if (this.hitPauseFrames > 0) {
      this.hitPauseFrames--;
      return true;
    }

    this.updateShake();
    this.updateSlashTrails();

    return false;
  }

  private updateShake(): void {
    if (!this.activeShake) return;

    this.activeShake.currentFrame++;
    this.activeShake.intensity *= this.activeShake.decay;

    if (
      this.activeShake.currentFrame >= this.activeShake.duration ||
      this.activeShake.intensity < 0.5
    ) {
      this.activeShake = null;
    }
  }

  private updateSlashTrails(): void {
    for (const trail of this.slashTrails) {
      for (const point of trail.points) {
        point.age++;
      }
      trail.points = trail.points.filter((p) => p.age < SLASH_TRAIL.fadeFrames);
    }
    this.slashTrails = this.slashTrails.filter((t) => t.points.length > 0);
  }

  getShakeOffset(): { x: number; y: number } {
    if (!this.activeShake) return { x: 0, y: 0 };

    const { intensity, direction, facing } = this.activeShake;

    switch (direction) {
      case 'forward':
        return {
          x: (Math.random() - 0.5) * intensity * 0.5 + facing * intensity * 0.5,
          y: (Math.random() - 0.5) * intensity * 0.3,
        };
      case 'horizontal':
        return {
          x: (Math.random() - 0.5) * intensity * 2,
          y: (Math.random() - 0.5) * intensity * 0.3,
        };
      case 'omnidirectional':
      default:
        return {
          x: (Math.random() - 0.5) * intensity * 2,
          y: (Math.random() - 0.5) * intensity * 2,
        };
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderSlashTrails(ctx);
  }

  private renderSlashTrails(ctx: CanvasRenderingContext2D): void {
    for (const trail of this.slashTrails) {
      if (trail.points.length < 2) continue;

      const trailColor = this.getTrailColor(trail.weaponType);
      const trailWidth = this.getTrailWidth(trail.weaponType);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < trail.points.length; i++) {
        const prev = trail.points[i - 1];
        const curr = trail.points[i];
        if (!prev || !curr) continue;

        const alpha = 1 - curr.age / SLASH_TRAIL.fadeFrames;
        const width = trailWidth * (1 - curr.age / SLASH_TRAIL.fadeFrames);

        ctx.beginPath();
        ctx.strokeStyle = this.applyAlpha(trailColor, alpha);
        ctx.lineWidth = width;
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private getTrailColor(weapon: WeaponType): string {
    switch (weapon) {
      case 'rapier':
        return COMBAT_COLORS.slashTrailRapier;
      case 'broadsword':
        return COMBAT_COLORS.slashTrailBroadsword;
      default:
        return COMBAT_COLORS.slashTrail;
    }
  }

  private getTrailWidth(weapon: WeaponType): number {
    switch (weapon) {
      case 'rapier':
        return SLASH_TRAIL.rapierWidth;
      case 'broadsword':
        return SLASH_TRAIL.broadswordWidth;
      default:
        return SLASH_TRAIL.baseWidth;
    }
  }

  private applyAlpha(color: string, alpha: number): string {
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, `${alpha})`);
    }
    return color;
  }

  clear(): void {
    this.slashTrails = [];
    this.activeShake = null;
    this.hitPauseFrames = 0;
  }
}

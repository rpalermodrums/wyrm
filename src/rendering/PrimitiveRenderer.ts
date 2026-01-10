import type { Entity, TransformComponent, ColliderComponent, HazardComponent, ProjectileComponent, WeaponComponent } from '../types';
import { COLORS, WEAPONS } from '../constants';

export class PrimitiveRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  renderPlatform(entity: Entity): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const collider = entity.getComponent<ColliderComponent>('collider');

    if (!transform || !collider) return;

    const ctx = this.ctx;
    const x = transform.x + collider.offsetX;
    const y = transform.y + collider.offsetY;
    const w = collider.width;
    const h = collider.height;

    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(x, y, w, 4);

    ctx.strokeStyle = COLORS.lineLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < w; i += 30) {
      ctx.moveTo(x + i, y + 4);
      ctx.lineTo(x + i + 10, y + 14);
    }
    ctx.stroke();
  }

  renderHazard(entity: Entity, frame: number): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const collider = entity.getComponent<ColliderComponent>('collider');
    const hazard = entity.getComponent<HazardComponent>('hazard');

    if (!transform || !collider || !hazard) return;

    if (hazard.hazardType === 'lava') {
      this.renderLava(transform, collider, frame);
    }
  }

  private renderLava(transform: TransformComponent, collider: ColliderComponent, frame: number): void {
    const ctx = this.ctx;
    const x = transform.x + collider.offsetX;
    const y = transform.y + collider.offsetY;
    const w = collider.width;
    const h = collider.height;

    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, 'rgba(255, 107, 53, 0.3)');
    gradient.addColorStop(1, COLORS.hazard);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i <= w; i += 5) {
      const waveY = y + Math.sin((i + frame * 3) * 0.1) * 2;
      ctx.lineTo(x + i, waveY);
    }
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.clip();
    
    ctx.fillStyle = COLORS.hazard;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.fillStyle = COLORS.hazardGlow;
    ctx.fillRect(x, y - 5, w, 5);
  }

  renderProjectile(entity: Entity): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const projectile = entity.getComponent<ProjectileComponent>('projectile');
    const weapon = entity.getComponent<WeaponComponent>('weapon');

    if (!transform || !projectile || !weapon || weapon.weaponType === null) return;

    const ctx = this.ctx;
    const weaponData = WEAPONS[weapon.weaponType];

    ctx.fillStyle = weaponData.color;
    ctx.beginPath();
    ctx.arc(transform.x, transform.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

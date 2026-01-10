import type { Entity, TransformComponent, SpriteComponent, CombatComponent, WeaponComponent, WyrmComponent } from '../types';
import { COLORS, WEAPONS } from '../constants';

export class SpriteRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  renderStickFigure(entity: Entity, frame: number): void {
    const transform = entity.getComponent<TransformComponent>('transform');
    const sprite = entity.getComponent<SpriteComponent>('sprite');
    const combat = entity.getComponent<CombatComponent>('combat');
    const weapon = entity.getComponent<WeaponComponent>('weapon');

    if (!transform || !sprite) return;

    const ctx = this.ctx;
    const x = transform.x;
    const y = transform.y;
    const facing = combat?.facing ?? 1;
    const attacking = combat?.attacking ?? false;
    const hitStun = combat?.hitStun ?? 0;

    ctx.save();
    ctx.translate(x, y);

    if (hitStun > 0) {
      ctx.translate(Math.sin(frame * 0.8) * 2, 0);
    }

    ctx.strokeStyle = sprite.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = sprite.color;
    ctx.beginPath();
    ctx.arc(0, -35, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 5);
    ctx.stroke();

    if (attacking && weapon && weapon.weaponType !== null) {
      const weaponData = WEAPONS[weapon.weaponType];
      const weaponLength = weaponData.range;
      const armX = facing * weaponLength * 0.7;
      const armY = -15;

      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(armX, armY);
      ctx.stroke();

      ctx.strokeStyle = weaponData.color;
      ctx.lineWidth = weaponData.width;
      ctx.beginPath();
      ctx.moveTo(armX, armY);
      ctx.lineTo(facing * weaponLength, armY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(facing * 12, -8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-facing * 8, -8);
      ctx.stroke();
    }

    const legOffset = sprite.animation === 'running' ? Math.sin(frame * 0.3) * 8 : 0;

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-8 + legOffset, 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(8 - legOffset, 25);
    ctx.stroke();

    ctx.restore();
  }

  renderWyrm(entity: Entity): void {
    const wyrmComponent = entity.getComponent<WyrmComponent>('wyrm');
    if (!wyrmComponent) return;

    const ctx = this.ctx;
    const segments = wyrmComponent.segments;

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (!segment) continue;
      
      const radius = i === 0 ? 25 : 15 - (i / segments.length) * 5;

      if (i === 0) {
        ctx.fillStyle = COLORS.wyrm;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(segment.x - 8, segment.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(segment.x + 8, segment.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(segment.x - 8, segment.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(segment.x + 8, segment.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gradient = ctx.createRadialGradient(segment.x, segment.y, 0, segment.x, segment.y, radius);
        gradient.addColorStop(0, COLORS.wyrmHighlight);
        gradient.addColorStop(1, COLORS.wyrmBody);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

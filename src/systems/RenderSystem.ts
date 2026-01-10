import type { System, Entity, EventBus } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import { SpriteRenderer } from '../rendering/SpriteRenderer';
import { EnhancedSpriteRenderer } from '../rendering/EnhancedSpriteRenderer';
import { PrimitiveRenderer } from '../rendering/PrimitiveRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import type { CombatEffects } from '../effects/CombatEffects';

export class RenderSystem implements System {
  readonly name = 'render';
  readonly requiredComponents = [] as const;
  readonly priority = 100;

  private spriteRenderer: SpriteRenderer | null = null;
  private enhancedSpriteRenderer: EnhancedSpriteRenderer | null = null;
  private primitiveRenderer: PrimitiveRenderer | null = null;
  private particleSystem: ParticleSystem;
  private combatEffects: CombatEffects | null = null;
  private frame = 0;

  constructor(eventBus: EventBus) {
    this.particleSystem = new ParticleSystem(eventBus);
  }

  setCombatEffects(effects: CombatEffects): void {
    this.combatEffects = effects;
  }

  private ensureRenderers(ctx: CanvasRenderingContext2D): void {
    if (!this.spriteRenderer) {
      this.spriteRenderer = new SpriteRenderer(ctx);
    }
    if (!this.enhancedSpriteRenderer) {
      this.enhancedSpriteRenderer = new EnhancedSpriteRenderer(ctx);
    }
    if (!this.primitiveRenderer) {
      this.primitiveRenderer = new PrimitiveRenderer(ctx);
    }
  }

  update(_entities: Entity[], deltaTime: number): void {
    this.frame++;
    this.particleSystem.update(deltaTime);
  }

  renderToContext(ctx: CanvasRenderingContext2D, entities: Entity[]): void {
    this.ensureRenderers(ctx);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const platforms = entities.filter((e) => e.hasComponent('platform'));
    const hazards = entities.filter((e) => e.hasComponent('hazard'));
    const wyrms = entities.filter((e) => e.hasComponent('wyrm'));
    const players = entities.filter((e) => e.hasComponent('playerControlled'));
    const enemies = entities.filter((e) => e.hasComponent('ai'));
    const projectiles = entities.filter((e) => e.hasComponent('projectile'));
    const thrownWeapons = entities.filter((e) => e.hasComponent('thrownWeapon'));

    if (this.primitiveRenderer) {
      platforms.forEach((entity) => this.primitiveRenderer!.renderPlatform(entity));
      hazards.forEach((entity) => this.primitiveRenderer!.renderHazard(entity, this.frame));
      projectiles.forEach((entity) => this.primitiveRenderer!.renderProjectile(entity));
    }

    if (this.enhancedSpriteRenderer) {
      thrownWeapons.forEach((entity) => this.enhancedSpriteRenderer!.renderThrownWeapon(entity));
      wyrms.forEach((entity) => this.enhancedSpriteRenderer!.renderWyrm(entity));
      players.forEach((entity) => this.enhancedSpriteRenderer!.renderStickFigure(entity, this.frame));
      enemies.forEach((entity) => this.enhancedSpriteRenderer!.renderStickFigure(entity, this.frame));
    } else if (this.spriteRenderer) {
      wyrms.forEach((entity) => this.spriteRenderer!.renderWyrm(entity));
      players.forEach((entity) => this.spriteRenderer!.renderStickFigure(entity, this.frame));
      enemies.forEach((entity) => this.spriteRenderer!.renderStickFigure(entity, this.frame));
    }

    if (this.combatEffects) {
      this.combatEffects.render(ctx);
    }

    this.particleSystem.render(ctx);
  }
}

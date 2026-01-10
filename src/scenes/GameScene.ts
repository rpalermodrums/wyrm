import { Scene } from './Scene';
import { World } from '../ecs/World';
import { Events } from '../core/Events';
import { Camera } from '../core/Camera';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { AISystem } from '../systems/AISystem';
import { WyrmSystem } from '../systems/WyrmSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { HUD } from '../ui/HUD';
import { createPlayer } from '../entities/Player';
import { createPlatform } from '../entities/Platform';
import { createEnemy } from '../entities/Enemy';
import { createWyrmEntity } from '../entities/Wyrm';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';
import type { SceneManager, TransformComponent, WeaponComponent } from '../types';

export class GameScene extends Scene {
  private world: World;
  private camera: Camera;
  private hud: HUD | null = null;
  private events: Events;
  private currentLevel = 0;
  private currentScreen = 0;
  private lives = 3;
  private isPaused = false;

  constructor(sceneManager: SceneManager) {
    super('game', sceneManager);
    this.world = new World();
    this.camera = new Camera(0, 0);
    this.events = new Events();
  }

  enter(): void {
    this.setupSystems();
    this.setupEventListeners();
    this.loadLevel();
  }

  exit(): void {
    this.world.clear();
  }

  update(dt: number): void {
    if (this.isPaused) return;
    this.world.update(dt);
    this.camera.update();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.hud) {
      this.hud = new HUD(ctx);
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    this.camera.applyTransform(ctx);

    const entities = this.world.getAllEntities();
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('transform');
      if (transform) {
        ctx.fillStyle = COLORS.platform;
        ctx.fillRect(transform.x - 10, transform.y - 10, 20, 20);
      }
    }

    ctx.restore();

    const weaponName = this.getCurrentWeapon();
    const cooldown = this.getPlayerCooldown();

    this.hud.render({
      lives: this.lives,
      level: this.currentLevel + 1,
      screen: this.currentScreen + 1,
      weaponName,
      cooldown: cooldown.current,
      maxCooldown: cooldown.max
    });
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  private setupSystems(): void {
    this.world.addSystem(new InputSystem());
    this.world.addSystem(new MovementSystem(this.events));
    this.world.addSystem(new CombatSystem(this.events));
    this.world.addSystem(new AISystem(this.events));
    this.world.addSystem(new WyrmSystem(this.currentLevel));
    this.world.addSystem(new CollisionSystem());
    this.world.addSystem(new RenderSystem(this.events));
  }

  private setupEventListeners(): void {
    this.events.on('playerDeath', () => {
      this.lives--;
      if (this.lives <= 0) {
        this.sceneManager.replace('gameover');
      } else {
        this.sceneManager.push('death');
      }
    });

    this.events.on('levelComplete', () => {
      this.sceneManager.replace('victory');
    });

    this.events.on('gameOver', () => {
      this.sceneManager.replace('gameover');
    });

    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' || e.key === 'p') {
      this.sceneManager.push('pause');
    }
  };

  private loadLevel(): void {
    this.world.clear();

    createPlayer(this.world, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);

    createPlatform(this.world, {
      x: 0,
      y: CANVAS_HEIGHT - 50,
      width: CANVAS_WIDTH,
      height: 50
    });

    createPlatform(this.world, {
      x: 200,
      y: CANVAS_HEIGHT - 150,
      width: 150,
      height: 20
    });

    createPlatform(this.world, {
      x: 450,
      y: CANVAS_HEIGHT - 200,
      width: 150,
      height: 20
    });

    createEnemy(this.world, 600, CANVAS_HEIGHT - 100, 'guard');

    createWyrmEntity(this.world, this.currentLevel);
  }

  private getCurrentWeapon(): string {
    const player = this.world.queryOne(['playerControlled', 'weapon']);
    if (!player) return 'UNARMED';

    const weapon = player.getComponent<WeaponComponent>('weapon');
    return weapon?.weaponType || 'UNARMED';
  }

  private getPlayerCooldown(): { current: number; max: number } {
    const player = this.world.queryOne(['playerControlled', 'weapon']);
    if (!player) return { current: 0, max: 1 };

    const weapon = player.getComponent<WeaponComponent>('weapon');
    return {
      current: weapon?.cooldown || 0,
      max: weapon?.cooldown || 1
    };
  }
}

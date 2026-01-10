import type { World } from '../ecs/World';
import type { LevelData, ScreenData } from '../types';
import { createPlatform } from '../entities/Platform';
import { createHazard } from '../entities/Hazard';

export class LevelLoader {
  private currentScreen = 0;
  private levelData: LevelData | null = null;

  constructor(private readonly world: World) {}

  async loadLevel(levelPath: string): Promise<void> {
    const response = await fetch(levelPath);
    this.levelData = await response.json();
    this.currentScreen = 0;
    this.loadScreen(0);
  }

  loadScreen(screenIndex: number): void {
    if (!this.levelData || screenIndex < 0 || screenIndex >= this.levelData.screens.length) {
      return;
    }

    this.clearEntities();
    this.currentScreen = screenIndex;
    
    const screen = this.levelData.screens[screenIndex];
    if (screen) {
      this.spawnScreenEntities(screen, screenIndex);
    }
  }

  private clearEntities(): void {
    const platforms = this.world.query(['platform', 'transform', 'collider']);
    const hazards = this.world.query(['hazard', 'transform', 'collider']);
    const enemies = this.world.query(['ai', 'transform']);

    [...platforms, ...hazards, ...enemies].forEach((entity) => {
      this.world.destroyEntity(entity.id);
    });
  }

  private spawnScreenEntities(screen: ScreenData, screenIndex: number): void {
    const xOffset = screenIndex * 800;

    screen.platforms.forEach((platformData) => {
      createPlatform(this.world, {
        x: platformData.x + xOffset,
        y: platformData.y,
        width: platformData.w,
        height: platformData.h,
      });
    });

    screen.hazards.forEach((hazardData) => {
      createHazard(this.world, {
        x: hazardData.x + xOffset,
        y: hazardData.y,
        width: hazardData.w,
        height: hazardData.h,
        type: hazardData.type,
      });
    });
  }

  getCurrentScreen(): number {
    return this.currentScreen;
  }

  getTotalScreens(): number {
    return this.levelData?.screens.length ?? 0;
  }

  getLevelData(): LevelData | null {
    return this.levelData;
  }
}

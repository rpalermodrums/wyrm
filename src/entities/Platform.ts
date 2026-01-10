import type { World } from '../ecs/World';
import { CollisionLayer } from '../constants';

interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createPlatform(world: World, config: PlatformConfig): string {
  const entity = world.createEntity();

  entity.addComponent({
    type: 'transform',
    x: config.x,
    y: config.y,
    prevX: config.x,
    prevY: config.y,
    rotation: 0,
    scale: 1,
  });

  entity.addComponent({
    type: 'collider',
    width: config.width,
    height: config.height,
    offsetX: 0,
    offsetY: 0,
    layer: CollisionLayer.PLATFORM,
    solid: true,
  });

  entity.addComponent({
    type: 'platform',
    platformType: 'ground',
  });

  return entity.id;
}

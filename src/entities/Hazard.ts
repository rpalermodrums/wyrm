import type { World } from '../ecs/World';
import type { HazardType } from '../constants';
import { CollisionLayer } from '../constants';

interface HazardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: HazardType;
}

export function createHazard(world: World, config: HazardConfig): string {
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
    layer: CollisionLayer.HAZARD,
    solid: false,
  });

  entity.addComponent({
    type: 'hazard',
    hazardType: config.type,
  });

  return entity.id;
}

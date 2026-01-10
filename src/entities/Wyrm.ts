import type { Entity, World } from '../types';
import { WYRM_BASE_SPEED, WYRM_SEGMENT_COUNT, CollisionLayer, CANVAS_HEIGHT } from '../constants';
import { createWyrm } from '../components/ai/Wyrm';
import { createTransform } from '../components/player/Transform';
import { createCollider } from '../components/player/Collider';

export const createWyrmEntity = (world: World, _currentLevel: number = 0): Entity => {
  const entity = world.createEntity();
  const startX = -200;
  const startY = CANVAS_HEIGHT / 2;
  const baseSpeed = WYRM_BASE_SPEED;

  entity.addComponent(createTransform(startX, startY));
  entity.addComponent(
    createCollider(
      60,
      60,
      0,
      0,
      CollisionLayer.WYRM,
      false
    )
  );
  entity.addComponent(createWyrm(startX, startY, WYRM_SEGMENT_COUNT, baseSpeed));

  return entity;
};

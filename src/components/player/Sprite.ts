import type { SpriteComponent } from '../../types';

export const createSprite = (animation: string, color: string): SpriteComponent => ({
  type: 'sprite',
  animation,
  frame: 0,
  color,
});

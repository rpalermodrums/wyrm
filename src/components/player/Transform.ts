import type { TransformComponent } from '../../types';

export function createTransform(x: number, y: number): TransformComponent {
  return {
    type: 'transform',
    x,
    y,
    prevX: x,
    prevY: y,
    rotation: 0,
    scale: 1,
  };
}

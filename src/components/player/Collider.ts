import type { ColliderComponent } from '../../types';
import { CollisionLayer } from '../../constants';

export function createCollider(
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
  layer: CollisionLayer = CollisionLayer.PLAYER,
  solid = true
): ColliderComponent {
  return {
    type: 'collider',
    width,
    height,
    offsetX,
    offsetY,
    layer,
    solid,
  };
}

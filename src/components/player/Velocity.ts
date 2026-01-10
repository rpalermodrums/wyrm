import type { VelocityComponent } from '../../types';

export function createVelocity(vx = 0, vy = 0, maxSpeed = 999): VelocityComponent {
  return {
    type: 'velocity',
    vx,
    vy,
    maxSpeed,
  };
}

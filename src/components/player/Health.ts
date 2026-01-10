import type { HealthComponent } from '../../types';

export function createHealth(current: number, max: number, lives = 3): HealthComponent {
  return {
    type: 'health',
    current,
    max,
    lives,
    iframes: 0,
  };
}

import type { PlayerControlledComponent } from '../../types';

export function createPlayerControlled(): PlayerControlledComponent {
  return {
    type: 'playerControlled',
    coyoteTime: 0,
    jumpBuffer: 0,
    grounded: false,
  };
}

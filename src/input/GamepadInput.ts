import type { InputAdapter } from '../types';

export class GamepadInput implements InputAdapter {
  private prevButtons: boolean[] = [];
  private currentButtons: boolean[] = [];

  update(): void {
    this.prevButtons = [...this.currentButtons];
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (gamepad) {
      this.currentButtons = gamepad.buttons.map(b => b.pressed);
    } else {
      this.currentButtons = [];
    }
  }

  isDown(action: string): boolean {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (!gamepad) return false;

    switch (action) {
      case 'left':
        return (gamepad.axes[0] ?? 0) < -0.2 || (gamepad.buttons[14]?.pressed ?? false);
      case 'right':
        return (gamepad.axes[0] ?? 0) > 0.2 || (gamepad.buttons[15]?.pressed ?? false);
      case 'jump':
        return gamepad.buttons[0]?.pressed ?? false;
      case 'attack':
        return gamepad.buttons[2]?.pressed ?? false;
      case 'throw':
        return gamepad.buttons[3]?.pressed ?? false;
      case 'pause':
        return gamepad.buttons[9]?.pressed ?? false;
      default:
        return false;
    }
  }

  isPressed(action: string): boolean {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (!gamepad) return false;

    let buttonIndex = -1;
    switch (action) {
      case 'jump':
        buttonIndex = 0;
        break;
      case 'attack':
        buttonIndex = 2;
        break;
      case 'throw':
        buttonIndex = 3;
        break;
      case 'pause':
        buttonIndex = 9;
        break;
    }

    if (buttonIndex === -1) return false;

    const isCurrentlyPressed = gamepad.buttons[buttonIndex]?.pressed ?? false;
    const wasPreviouslyPressed = this.prevButtons[buttonIndex] ?? false;
    
    return isCurrentlyPressed && !wasPreviouslyPressed;
  }

  getAxis(axis: 'horizontal' | 'vertical'): number {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];
    
    if (!gamepad) return 0;

    if (axis === 'horizontal') {
      const axisValue = gamepad.axes[0] ?? 0;
      const dpadLeft = gamepad.buttons[14]?.pressed ?? false;
      const dpadRight = gamepad.buttons[15]?.pressed ?? false;
      
      if (Math.abs(axisValue) > 0.2) {
        return axisValue > 0 ? 1 : -1;
      }
      if (dpadLeft) return -1;
      if (dpadRight) return 1;
      return 0;
    }
    
    return 0;
  }

  destroy(): void {
    this.prevButtons = [];
    this.currentButtons = [];
  }
}

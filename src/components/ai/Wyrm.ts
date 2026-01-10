import type { WyrmComponent } from '../../types';

export const createWyrm = (x: number, y: number, segmentCount: number, baseSpeed: number): WyrmComponent => {
  const segments: Array<{ x: number; y: number }> = [];
  const spacing = 30;
  
  for (let i = 0; i < segmentCount; i++) {
    segments.push({ x: x - i * spacing, y });
  }
  
  return {
    type: 'wyrm',
    segments,
    targetY: y,
    baseSpeed,
    currentSpeed: baseSpeed,
  };
};

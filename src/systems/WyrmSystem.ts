import type { System, Entity, WyrmComponent, TransformComponent, VelocityComponent } from '../types';
import { CANVAS_WIDTH } from '../constants';

export class WyrmSystem implements System {
  readonly name = 'WyrmSystem';
  readonly requiredComponents = ['wyrm', 'transform'] as const;
  readonly priority = 10;

  constructor(private readonly currentLevel: number = 0) {}

  update(entities: Entity[], _deltaTime: number): void {
    const playerEntity = this.findPlayer(entities);
    if (!playerEntity) return;

    const playerTransform = playerEntity.getComponent<TransformComponent>('transform')!;
    const playerVelocity = playerEntity.getComponent<VelocityComponent>('velocity')!;

    for (const entity of entities) {
      if (!entity.hasComponents(this.requiredComponents as unknown as string[])) continue;

      const wyrm = entity.getComponent<WyrmComponent>('wyrm')!;
      const transform = entity.getComponent<TransformComponent>('transform')!;

      const cameraX = playerTransform.x - CANVAS_WIDTH / 2;
      const wyrmScreenX = transform.x - cameraX;
      const playerScreenX = playerTransform.x - cameraX;

      let speed = wyrm.baseSpeed * (1 + this.currentLevel * 0.05);

      if (playerVelocity.vx < 0) {
        speed += 0.8;
      }

      if (playerScreenX < wyrmScreenX + 100) {
        speed += 1;
      }

      if (playerScreenX > wyrmScreenX + 400) {
        speed -= 0.5;
      }

      speed = Math.max(0.5, Math.min(4, speed));

      wyrm.currentSpeed = speed;

      transform.x += speed;

      wyrm.targetY += (playerTransform.y - wyrm.targetY) * 0.02;
      wyrm.targetY = Math.max(300, Math.min(380, wyrm.targetY));

      const firstSegment = wyrm.segments[0];
      if (firstSegment) {
        firstSegment.x = transform.x;
        firstSegment.y = wyrm.targetY;
      }

      for (let i = 1; i < wyrm.segments.length; i++) {
        const prev = wyrm.segments[i - 1];
        const curr = wyrm.segments[i];
        if (!prev || !curr) continue;

        const targetX = prev.x;
        const targetY = prev.y;

        curr.x += (targetX - curr.x) * 0.3;
        curr.y += (targetY - curr.y) * 0.3;

        const waveOffset = Math.sin((Date.now() * 0.01 + i * 0.5)) * 5;
        curr.y += waveOffset;
      }
    }
  }

  private findPlayer(entities: Entity[]): Entity | undefined {
    return entities.find(e => e.hasComponent('playerControlled'));
  }
}

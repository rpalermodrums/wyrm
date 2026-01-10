import type { EventBus, Particle } from '../types';
import { SimplePool } from '../utils/ObjectPool';

export class ParticleSystem {
  private particles: Particle[] = [];
  private particlePool: SimplePool<Particle>;

  constructor(eventBus: EventBus) {
    this.particlePool = new SimplePool(
      () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '#000', size: 2 }),
      (p) => { p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.life = 0; p.maxLife = 0; },
      1000
    );

    eventBus.on('spawnParticles', (event) => {
      this.spawn(event.x, event.y, event.color, event.count);
    });
  }

  spawn(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.acquire();
      particle.x = x;
      particle.y = y;
      particle.vx = (Math.random() - 0.5) * 8;
      particle.vy = (Math.random() - 0.5) * 8 - 2;
      particle.life = 1;
      particle.maxLife = 30 + Math.random() * 20;
      particle.color = color;
      particle.size = 2 + Math.random() * 3;
      this.particles.push(particle);
    }
  }

  update(_deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) continue;

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.life++;

      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
        this.particlePool.release(particle);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    this.particles.forEach((particle) => {
      const alpha = 1 - particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

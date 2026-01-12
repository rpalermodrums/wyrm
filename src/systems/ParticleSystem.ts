/**
 * ParticleSystem - Manages 3D particle effects
 *
 * Uses Three.js InstancedMesh for high performance.
 * Listens to game events to spawn particles.
 */

import * as THREE from 'three';
import type { System, Entity, World, TransformComponent } from '../types';
import type { EventBus } from '../types';
import { SYSTEM_PRIORITY, SCREEN_WIDTH_UNITS } from '../constants';

const MAX_PARTICLES = 1000;

const PARTICLE_TYPES = {
  dust: { color: 0xaaaaaa, size: 0.2, life: 30, decay: 0.95, gravity: 0.01 },
  spark: { color: 0xffff00, size: 0.15, life: 15, decay: 0.9, gravity: 0.05 },
  blood: { color: 0xff0000, size: 0.2, life: 40, decay: 0.98, gravity: 0.03 },
  confetti: { color: 0xffffff, size: 0.15, life: 120, decay: 0.98, gravity: 0.02 },
} as const;

interface ParticleData {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  type: keyof typeof PARTICLE_TYPES;
  colorOverride?: number | undefined;
}

export class ParticleSystem implements System {
  readonly name = 'ParticleSystem';
  readonly requiredComponents = [] as const;
  readonly priority = SYSTEM_PRIORITY.Animation;

  private world: World | null = null;
  private readonly events: EventBus;
  private readonly scene: THREE.Scene;
  
  private particles: ParticleData[] = [];
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshBasicMaterial;
  private mesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private tempColor: THREE.Color;

  constructor(events: EventBus, scene: THREE.Scene) {
    this.events = events;
    this.scene = scene;
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0,
        type: 'dust'
      });
    }

    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    // vertexColors: true is required for setColorAt() to work
    this.material = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color(); // Reusable color instance for performance

    this.setupEventListeners();
  }

  setWorld(world: World): void {
    this.world = world;
  }

  private setupEventListeners(): void {
    this.events.on('entityJump', (event) => {
      this.spawnExplosion(event.x, event.y - 0.5, 'dust', 5);
    });

    this.events.on('entityLand', (event) => {
      this.spawnExplosion(event.x, event.y - 0.5, 'dust', 8);
    });

    this.events.on('weaponClash', (event) => {
        this.spawnExplosion(event.x, event.y, 'spark', 15);
    });
    
    this.events.on('entityHit', (event) => {
       const entity = this.world?.getEntity(event.entityId);
       const transform = entity?.getComponent<TransformComponent>('transform');
       if (transform) {
         this.spawnExplosion(transform.x, transform.y, 'spark', 10);
       }
    });

    this.events.on('gameStateChange', (event) => {
        if (event.newState === 'victory') {
            this.spawnConfetti();
        }
    });
  }

  update(_entities: readonly Entity[], _deltaTime: number): void {
    let activeCount = 0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p) continue;
      if (!p.active) continue;

      const config = PARTICLE_TYPES[p.type];
      
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.vy -= config.gravity;
      
      if (p.y < 0) {
        p.y = 0;
        p.vy = 0;
        p.vx *= 0.8;
        p.life -= 2;
      }
      
      p.vx *= config.decay;
      p.vy *= config.decay;
      p.vz *= config.decay;

      p.life--;

      if (p.life <= 0) {
        p.active = false;
        this.dummy.position.set(0, 0, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      this.dummy.position.set(p.x, p.y, p.z);
      const scale = (p.life / p.maxLife) * config.size;
      this.dummy.scale.set(scale, scale, scale);
      
      const colorValue = p.colorOverride !== undefined ? p.colorOverride : config.color;
      this.tempColor.set(colorValue);
      this.mesh.setColorAt(i, this.tempColor);

      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      
      activeCount++;
    }

    if (activeCount > 0) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }

  spawnExplosion(x: number, y: number, type: keyof typeof PARTICLE_TYPES, count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(x, y, type);
    }
  }

  private spawnConfetti(): void {
      // Spawn confetti across the screen width (assumed near camera)
      // We don't know exact camera position here easily without querying, but we can guess or use world query
      // Let's assume camera is around the player.
      const player = this.world?.queryOne(['playerControlled', 'transform']);
      const centerX = player ? player.getComponent<TransformComponent>('transform')?.x ?? 0 : 0;
      
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];

      for (let i = 0; i < 100; i++) {
          const x = centerX + (Math.random() - 0.5) * SCREEN_WIDTH_UNITS;
          const y = 10 + Math.random() * 5; // Start high up
          const type = 'confetti';
          
          const index = this.particles.findIndex(p => !p.active);
          if (index === -1) continue;

          const p = this.particles[index];
          if (!p) continue;
          
          const config = PARTICLE_TYPES[type];
          
          p.active = true;
          p.type = type;
          p.x = x;
          p.y = y;
          p.z = Math.random() * 2; // Some depth variation
          
          p.vx = (Math.random() - 0.5) * 0.1;
          p.vy = -Math.random() * 0.1 - 0.05;
          p.vz = (Math.random() - 0.5) * 0.1;
          
          p.life = config.life + Math.random() * 60;
          p.maxLife = p.life;
          
          // Override color for confetti
          p.colorOverride = colors[Math.floor(Math.random() * colors.length)];
      }
  }

  private spawnParticle(x: number, y: number, type: keyof typeof PARTICLE_TYPES): void {
    const index = this.particles.findIndex(p => !p.active);
    if (index === -1) return;

    const p = this.particles[index];
    if (!p) return;
    const config = PARTICLE_TYPES[type];

    p.active = true;
    p.type = type;
    p.x = x;
    p.y = y;
    p.z = 0;
    p.colorOverride = undefined;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.2 + 0.05;
    
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.vz = (Math.random() - 0.5) * 0.1;
    
    p.life = config.life;
    p.maxLife = config.life;
  }
}

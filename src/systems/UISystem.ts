import type {
  System,
  Entity,
  World,
  TransformComponent,
  HealthComponent,
  WeaponComponent,
} from '../types';
import type { EventBus } from '../core/Events';
import { SYSTEM_PRIORITY, WEAPONS } from '../constants';

// Percentage of screen width that represents "dangerously close"
const THREAT_MAX_DISTANCE = 30; // Three.js units

export class UISystem implements System {
  readonly name = 'UISystem';
  readonly requiredComponents = [] as const;
  readonly priority = SYSTEM_PRIORITY.UI;

  private world: World | null = null;
  private readonly events: EventBus;

  private healthContainer: HTMLElement | null = null;
  private wyrmBar: HTMLElement | null = null;
  private weaponIcon: HTMLElement | null = null;
  private weaponName: HTMLElement | null = null;
  private screens: Record<string, HTMLElement | null> = {};

  // State caching to prevent DOM thrashing
  private lastHealth = -1;
  private lastWeaponType = '';
  private lastWyrmDistanceRatio = -1;

  constructor(events: EventBus) {
    this.events = events;
    this.initializeUI();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.events.on('gameStateChange', (event) => {
      this.hideAllScreens();
      
      switch (event.newState) {
        case 'title':
          this.showScreen('title');
          break;
        case 'paused':
          this.showScreen('pause');
          break;
        case 'death':
          this.showScreen('gameover');
          break;
        case 'victory':
          this.showScreen('victory');
          break;
        case 'gameover':
          this.showScreen('gameover');
          break;
        case 'playing':
          break;
      }
    });
  }

  private hideAllScreens(): void {
    Object.values(this.screens).forEach(screen => {
      screen?.classList.add('hidden');
    });
  }

  private showScreen(name: string): void {
    const screen = this.screens[name];
    screen?.classList.remove('hidden');
  }

  setWorld(world: World): void {
    this.world = world;
  }

  private initializeUI(): void {
    this.healthContainer = document.getElementById('hud-health');
    this.wyrmBar = document.getElementById('wyrm-bar');
    this.weaponIcon = document.querySelector('.weapon-icon');
    this.weaponName = document.getElementById('weapon-name');

    this.screens = {
      title: document.getElementById('title-screen'),
      pause: document.getElementById('pause-screen'),
      gameover: document.getElementById('game-over-screen'),
      victory: document.getElementById('victory-screen'),
    };
  }

  update(_entities: readonly Entity[], _deltaTime: number): void {
    if (!this.world) return;

    this.updateHUD();
  }

  private updateHUD(): void {
    const player = this.world?.queryOne(['playerControlled', 'health', 'weapon', 'transform']);
    if (!player) return;

    // Update Health
    const health = player.getComponent<HealthComponent>('health');
    if (health && health.current !== this.lastHealth) {
      this.updateHealthDisplay(health.current, health.max);
      this.lastHealth = health.current;
    }

    // Update Weapon
    const weapon = player.getComponent<WeaponComponent>('weapon');
    if (weapon && weapon.weaponType !== this.lastWeaponType) {
      this.updateWeaponDisplay(weapon.weaponType);
      this.lastWeaponType = weapon.weaponType;
    }

    // Update Wyrm Threat
    const wyrm = this.world?.queryOne(['wyrm', 'transform']);
    const playerTransform = player.getComponent<TransformComponent>('transform');
    
    if (wyrm && playerTransform) {
      const wyrmTransform = wyrm.getComponent<TransformComponent>('transform');
      if (wyrmTransform) {
        const distance = playerTransform.x - wyrmTransform.x;
        this.updateWyrmThreat(distance);
      }
    }
  }

  private updateHealthDisplay(current: number, _max: number): void {
    if (!this.healthContainer) return;

    // Ensure we have correct number of life blocks
    const blocks = this.healthContainer.children;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i] as HTMLElement;
      // Index 0 is first block (health 1), Index 1 is second (health 2)...
      // If current health is 2, blocks 0 and 1 should be active. Block 2 should be lost.
      if (i < current) {
        block.classList.remove('lost');
      } else {
        block.classList.add('lost');
      }
    }
  }

  private updateWeaponDisplay(weaponType: string): void {
    if (!this.weaponName || !this.weaponIcon) return;

    // Trigger animation
    const container = this.weaponIcon.parentElement;
    if (container) {
        container.classList.remove('weapon-anim');
        // Trigger reflow
        void container.offsetWidth;
        container.classList.add('weapon-anim');
    }

    if (weaponType === 'none') {
        this.weaponName.textContent = 'Unarmed';
        this.weaponIcon.textContent = '👊';
    } else {
        const data = WEAPONS[weaponType as keyof typeof WEAPONS];
        if (data) {
            this.weaponName.textContent = data.name;
            // Simple icons for now
            const icons: Record<string, string> = {
                rapier: '⚔️',
                broadsword: '🗡️',
                bow: '🏹'
            };
            this.weaponIcon.textContent = icons[weaponType] || '?';
        }
    }
  }

  private updateWyrmThreat(distance: number): void {
    if (!this.wyrmBar) return;

    // Calculate threat ratio (0 to 1)
    // Distance 0 = 100% threat
    // Distance THREAT_MAX_DISTANCE = 0% threat
    
    let threatRatio = 1 - (distance / THREAT_MAX_DISTANCE);
    threatRatio = Math.max(0, Math.min(1, threatRatio));
    
    // Only update if changed significantly
    if (Math.abs(threatRatio - this.lastWyrmDistanceRatio) > 0.01) {
        this.wyrmBar.style.width = `${threatRatio * 100}%`;
        
        // Update classes based on threat level
        this.wyrmBar.classList.remove('danger', 'critical');
        if (threatRatio > 0.8) {
            this.wyrmBar.classList.add('critical');
        } else if (threatRatio > 0.5) {
            this.wyrmBar.classList.add('danger');
        }
        
        this.lastWyrmDistanceRatio = threatRatio;
    }
  }
}

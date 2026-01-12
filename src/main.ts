/**
 * Wyrm Chase V2 - Entry Point
 *
 * Three.js based side-scrolling chase game.
 * See WYRM_CHASE_V2_SPEC.md for full documentation.
 */

import { World } from './ecs/World';
import { EventBus } from './core/Events';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './input/InputManager';
import { ThreeRenderer } from './rendering/ThreeRenderer';
import './ui/styles.css';
import { MovementSystem } from './systems/MovementSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { HazardSystem } from './systems/HazardSystem';
import { RenderSystem } from './systems/RenderSystem';
import { CameraSystem } from './systems/CameraSystem';
import { FencingSystem } from './systems/FencingSystem';
import { CombatSystem } from './systems/CombatSystem';
import { AISystem } from './systems/AISystem';
import { WyrmSystem } from './systems/WyrmSystem';
import { RollSystem } from './systems/RollSystem';
import { ThrownWeaponSystem } from './systems/ThrownWeaponSystem';
import { UISystem } from './systems/UISystem';
import { ParticleSystem } from './systems/ParticleSystem';
import { GhostSystem } from './systems/GhostSystem';
import { ScreenTransitionSystem, setCurrentScreen } from './systems/ScreenTransitionSystem';
import { CombatEffects } from './effects/CombatEffects';
import { createWyrm } from './entities/WyrmFactory';
import { WYRM_START_X, SCREEN_WIDTH_UNITS } from './constants';
import { loadLevel, unloadLevel, getLevelData, getTotalLevels, getWyrmSpeedForLevel } from './levels/LevelLoader';
import type { GameState, Entity, TransformComponent } from './types';

class Game {
  private readonly world: World;
  private readonly events: EventBus;
  private readonly renderer: ThreeRenderer;
  private readonly gameLoop: GameLoop;
  private readonly input: InputManager;

  private readonly movementSystem: MovementSystem;
  private readonly collisionSystem: CollisionSystem;
  private readonly hazardSystem: HazardSystem;
  private readonly renderSystem: RenderSystem;
  private readonly cameraSystem: CameraSystem;
  private readonly fencingSystem: FencingSystem;
  private readonly combatSystem: CombatSystem;
  private readonly aiSystem: AISystem;
  private readonly wyrmSystem: WyrmSystem;
  private readonly rollSystem: RollSystem;
  private readonly thrownWeaponSystem: ThrownWeaponSystem;
  private readonly uiSystem: UISystem;
  private readonly particleSystem: ParticleSystem;
  private readonly ghostSystem: GhostSystem;
  private readonly screenTransitionSystem: ScreenTransitionSystem;
  private readonly combatEffects: CombatEffects;

  private state: GameState = 'loading';
  private player: Entity | null = null;
  private currentLevelIndex = 0;

  constructor() {
    // Get container and hide loading message
    const container = document.getElementById('game-container');
    if (!container) throw new Error('Game container not found');

    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Initialize core systems
    this.world = new World();
    this.events = new EventBus();
    this.renderer = new ThreeRenderer(container);
    this.input = InputManager.getInstance();

    // Create game systems
    this.movementSystem = new MovementSystem(this.events);
    this.collisionSystem = new CollisionSystem(this.events);
    this.hazardSystem = new HazardSystem(this.events);
    this.renderSystem = new RenderSystem(this.renderer, this.events);
    this.cameraSystem = new CameraSystem(this.renderer);
    this.fencingSystem = new FencingSystem();
    this.combatSystem = new CombatSystem(this.events);
    this.aiSystem = new AISystem();
    this.wyrmSystem = new WyrmSystem(this.events);
    this.rollSystem = new RollSystem();
    this.thrownWeaponSystem = new ThrownWeaponSystem(this.events);
    this.uiSystem = new UISystem(this.events);
    this.particleSystem = new ParticleSystem(this.events, this.renderer.getScene());
    this.ghostSystem = new GhostSystem();
    this.screenTransitionSystem = new ScreenTransitionSystem();
    this.combatEffects = new CombatEffects(this.events, this.renderer);

    // Set world references for systems that need cross-entity queries
    this.collisionSystem.setWorld(this.world);
    this.hazardSystem.setWorld(this.world);
    this.aiSystem.setWorld(this.world);
    this.combatSystem.setWorld(this.world);
    this.wyrmSystem.setWorld(this.world);
    this.thrownWeaponSystem.setWorld(this.world);
    this.uiSystem.setWorld(this.world);
    this.particleSystem.setWorld(this.world);
    this.ghostSystem.setWorld(this.world);
    this.screenTransitionSystem.setWorld(this.world);
    this.screenTransitionSystem.setEvents(this.events);

    // Add systems to world (auto-sorted by priority)
    this.world.addSystem(this.aiSystem);                 // Priority 10
    this.world.addSystem(this.rollSystem);               // Priority 15
    this.world.addSystem(this.fencingSystem);            // Priority 20
    this.world.addSystem(this.combatSystem);             // Priority 25
    this.world.addSystem(this.thrownWeaponSystem);       // Priority 26
    this.world.addSystem(this.movementSystem);           // Priority 30
    this.world.addSystem(this.collisionSystem);          // Priority 40
    this.world.addSystem(this.hazardSystem);             // Priority 45
    this.world.addSystem(this.wyrmSystem);               // Priority 50
    this.world.addSystem(this.screenTransitionSystem);   // Priority 55
    this.world.addSystem(this.cameraSystem);             // Priority 60
    this.world.addSystem(this.particleSystem);           // Priority 70
    this.world.addSystem(this.ghostSystem);              // Priority 70 (Animation)
    this.world.addSystem(this.uiSystem);                 // Priority 90
    this.world.addSystem(this.renderSystem);             // Priority 100

    // Create game loop
    // Pass input.endFrame to onFixedUpdateEnd to clear edge-triggered input after each fixed update
    // This prevents a single keypress from being processed multiple times during catch-up frames
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this),
      undefined, // onFrameEnd - no longer needed for input clearing
      () => this.input.endFrame() // onFixedUpdateEnd - clears edge-triggered input after each fixed update
    );

    // Setup event listeners
    this.setupEventListeners();

    // Initialize and start
    this.init();
  }

  private setupEventListeners(): void {
    this.events.on('playerDeath', (event) => {
      console.log('[Game] Player died:', event.cause);
      this.state = 'death';
      this.events.emit({ type: 'gameStateChange', newState: 'death' });
      // Player must click "Try Again" button to restart
    });

    this.events.on('screenTransition', (event) => {
      console.log(`[Game] Screen transition: moving to screen ${event.newScreen + 1}/${event.totalScreens}`);
      // Pan camera to new screen center
      const newCameraX = event.newScreen * SCREEN_WIDTH_UNITS + SCREEN_WIDTH_UNITS / 2;
      this.cameraSystem.panTo(newCameraX, 5);
      console.log(`[Game] Camera panning to x=${newCameraX}`);
    });

    this.events.on('levelComplete', () => {
      console.log(`[Game] Level ${this.currentLevelIndex + 1} complete!`);
      this.currentLevelIndex += 1;

      if (this.currentLevelIndex < getTotalLevels()) {
        // Load next level with faster wyrm
        console.log(`[Game] Loading Level ${this.currentLevelIndex + 1}...`);
        this.loadNextLevel();
      } else {
        // All levels completed - victory!
        console.log('[Game] All levels completed! Victory!');
        this.state = 'victory';
        this.events.emit({ type: 'gameStateChange', newState: 'victory' });
      }
    });

    this.events.on('gameOver', () => {
      console.log('[Game] Game over!');
      this.state = 'gameover';
      this.events.emit({ type: 'gameStateChange', newState: 'gameover' });
    });

    this.events.on('enemyDeath', (event) => {
      console.log(`[Game] Enemy died: ${event.entityId}, dropped: ${event.droppedWeapon}`);
      this.world.destroyEntity(event.entityId);
    });
  }

  // ============================================================================
  // Level Loading (consolidated from 4 similar methods)
  // ============================================================================

  /**
   * Core level loading logic used by all level transition methods.
   * Handles unloading, loading, wyrm creation, and camera positioning.
   */
  private loadLevelInternal(options: {
    readonly unloadCurrent: boolean;
    readonly setPlayingState: boolean;
  }): void {
    const { unloadCurrent, setPlayingState } = options;

    // Step 1: Optionally unload current level
    if (unloadCurrent) {
      unloadLevel(this.world);
    }

    // Step 2: Reset screen tracking
    setCurrentScreen(0);
    this.screenTransitionSystem.reset();

    // Step 3: Load level data
    const levelData = getLevelData(this.currentLevelIndex);
    const loaded = loadLevel(this.world, levelData, this.currentLevelIndex);
    this.player = loaded.player;
    console.log(`[Game] Loaded Level ${this.currentLevelIndex + 1}: "${levelData.name}"`);

    // Step 4: Create wyrm with level-appropriate speed
    const wyrmSpeed = getWyrmSpeedForLevel(this.currentLevelIndex);
    const playerTransform = this.player.getComponent<TransformComponent>('transform');
    const wyrmStartY = playerTransform?.y ?? 5;
    createWyrm(this.world, WYRM_START_X, wyrmStartY, wyrmSpeed);
    console.log(`[Game] Wyrm spawned at x=${WYRM_START_X}, y=${wyrmStartY}, speed=${wyrmSpeed.toFixed(4)}`);

    // Step 5: Snap camera to player position
    if (playerTransform) {
      this.cameraSystem.snapTo(playerTransform.x, playerTransform.y);
    }

    // Step 6: Optionally transition to playing state
    if (setPlayingState) {
      this.state = 'playing';
      this.events.emit({ type: 'gameStateChange', newState: 'playing' });
    }
  }

  private loadNextLevel(): void {
    this.loadLevelInternal({ unloadCurrent: true, setPlayingState: false });
    console.log(`[Game] Level ${this.currentLevelIndex + 1} loaded!`);
  }

  private restartLevel(): void {
    console.log(`[Game] Restarting Level ${this.currentLevelIndex + 1}...`);
    this.loadLevelInternal({ unloadCurrent: true, setPlayingState: true });
    console.log(`[Game] Level ${this.currentLevelIndex + 1} restarted!`);
  }

  private async init(): Promise<void> {
    console.log('[Game] Wyrm Chase V2 - Initializing...');

    // Setup button click handlers
    this.setupMenuButtons();

    // Setup keyboard listener for title screen
    this.setupTitleKeyboardListener();

    // Show title screen
    this.state = 'title';
    this.events.emit({ type: 'gameStateChange', newState: 'title' });

    // Start the game loop (for rendering, but update() won't run game logic)
    this.gameLoop.start();

    console.log('[Game] Title screen displayed. Press Space or click Start to begin.');
    console.log('[Game] Controls: A/D to move, Space to jump, Up/Down for sword position, J to attack');
    console.log(`[Game] Total levels: ${getTotalLevels()}`);
  }

  private setupMenuButtons(): void {
    const startButton = document.getElementById('start-button');
    const retryButton = document.getElementById('retry-button');
    const playAgainButton = document.getElementById('play-again-button');

    startButton?.addEventListener('click', () => {
      if (this.state === 'title') {
        this.startGame();
      }
    });

    retryButton?.addEventListener('click', () => {
      if (this.state === 'death' || this.state === 'gameover') {
        this.restartLevel();
      }
    });

    playAgainButton?.addEventListener('click', () => {
      if (this.state === 'victory') {
        this.restartFromBeginning();
      }
    });
  }

  private setupTitleKeyboardListener(): void {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.state === 'title') {
        event.preventDefault();
        this.startGame();
      }
    });
  }

  private startGame(): void {
    console.log('[Game] Starting game...');
    this.currentLevelIndex = 0;
    this.loadLevelInternal({ unloadCurrent: false, setPlayingState: true });
    console.log('[Game] Game started!');
  }

  private restartFromBeginning(): void {
    console.log('[Game] Restarting from beginning...');
    this.currentLevelIndex = 0;
    this.loadLevelInternal({ unloadCurrent: true, setPlayingState: true });
    console.log('[Game] Game restarted from Level 1!');
  }

  private pauseGame(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.events.emit({ type: 'gameStateChange', newState: 'paused' });
    console.log('[Game] Paused');
  }

  private resumeGame(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.events.emit({ type: 'gameStateChange', newState: 'playing' });
    console.log('[Game] Resumed');
  }

  private update(deltaTime: number): void {
    if (this.state === 'title') {
      if (this.input.justPressed('jump')) {
        this.startGame();
      }
      return;
    }

    if (this.state === 'paused') {
      if (this.input.justPressed('pause')) {
        this.resumeGame();
      }
      return;
    }

    if (this.state !== 'playing') return;

    if (this.input.justPressed('pause')) {
      this.pauseGame();
      return;
    }

    // Update combat effects (screen shake, hit pause)
    const isPaused = this.combatEffects.update(deltaTime);
    if (isPaused) return; // Skip game logic during hit pause

    // Update ECS world - this runs all systems in priority order
    this.world.update(deltaTime);
  }

  private render(_alpha: number): void {
    this.renderer.render();
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Game());
} else {
  new Game();
}

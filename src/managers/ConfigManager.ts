interface GameConfig {
  musicVolume: number;
  sfxVolume: number;
  audioEnabled: boolean;
  showFPS: boolean;
}

const DEFAULT_CONFIG: GameConfig = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  audioEnabled: true,
  showFPS: false
};

export class ConfigManager {
  private static readonly STORAGE_KEY = 'wyrmChaseConfig';
  private config: GameConfig;

  constructor() {
    this.config = this.load();
  }

  get<K extends keyof GameConfig>(key: K): GameConfig[K] {
    return this.config[key];
  }

  set<K extends keyof GameConfig>(key: K, value: GameConfig[K]): void {
    this.config[key] = value;
    this.save();
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }

  private load(): GameConfig {
    try {
      const stored = localStorage.getItem(ConfigManager.STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    try {
      localStorage.setItem(ConfigManager.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }
}

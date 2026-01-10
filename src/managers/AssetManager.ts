export class AssetManager {
  private loaded = false;

  async preload(): Promise<void> {
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

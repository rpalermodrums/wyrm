export class AudioManager {
  private enabled = true;
  private musicVolume = 0.5;
  private sfxVolume = 0.7;

  playMusic(_track: string): void {}

  stopMusic(): void {}

  playSFX(_sound: string): void {}

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }
}

import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private currentBgm: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Phaser.Math.Clamp(vol, 0, 1);
    if (this.currentBgm && 'setVolume' in this.currentBgm) {
      (this.currentBgm as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSfxVolume(vol: number): void {
    this.sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  playBgm(key: string): void {
    this.stopBgm();
    if (this.scene.cache.audio.exists(key)) {
      this.currentBgm = this.scene.sound.add(key, {
        loop: true,
        volume: this.musicVolume,
      });
      this.currentBgm.play();
    }
  }

  stopBgm(): void {
    this.currentBgm?.stop();
    this.currentBgm?.destroy();
    this.currentBgm = null;
  }

  playSfx(key: string): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: this.sfxVolume });
    }
  }
}

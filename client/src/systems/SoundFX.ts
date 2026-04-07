import Phaser from 'phaser';

export class SoundFX {
  private scene: Phaser.Scene;
  private ctx: AudioContext | null = null;
  private volume = 0.3;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    try {
      this.ctx = new AudioContext();
    } catch {
      // Web Audio not available
    }
  }

  setVolume(vol: number): void {
    this.volume = Phaser.Math.Clamp(vol, 0, 1);
  }

  meleeSwipe(): void {
    this.playTone(200, 0.08, 'sawtooth', 0.5, 80);
  }

  rangedShoot(): void {
    this.playTone(600, 0.12, 'sine', 0.4, 900);
  }

  hit(): void {
    this.playTone(150, 0.1, 'square', 0.3, 50);
  }

  enemyDeath(): void {
    this.playTone(400, 0.15, 'sine', 0.3, 100);
    this.playTone(300, 0.15, 'sine', 0.2, 50, 0.08);
  }

  playerHurt(): void {
    this.playTone(100, 0.2, 'sawtooth', 0.4, 60);
  }

  bossHit(): void {
    this.playTone(120, 0.12, 'square', 0.4, 40);
    this.playTone(80, 0.1, 'sawtooth', 0.3, 30, 0.05);
  }

  bossAttack(): void {
    this.playTone(250, 0.2, 'sawtooth', 0.3, 100);
  }

  bossPhaseTransition(): void {
    this.playTone(100, 0.5, 'sawtooth', 0.5, 400);
    this.playTone(200, 0.4, 'sine', 0.4, 600, 0.15);
  }

  bossDefeat(): void {
    for (let i = 0; i < 5; i++) {
      this.playTone(200 + i * 100, 0.2, 'sine', 0.3, 100 + i * 50, i * 0.12);
    }
  }

  itemCollect(): void {
    this.playTone(500, 0.1, 'sine', 0.3, 800);
    this.playTone(700, 0.1, 'sine', 0.25, 900, 0.06);
  }

  checkpoint(): void {
    this.playTone(400, 0.1, 'sine', 0.3, 600);
    this.playTone(600, 0.1, 'sine', 0.25, 800, 0.1);
    this.playTone(800, 0.15, 'sine', 0.2, 900, 0.2);
  }

  jump(): void {
    this.playTone(300, 0.08, 'sine', 0.2, 500);
  }

  dash(): void {
    this.playTone(150, 0.15, 'sawtooth', 0.25, 300);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    vol: number,
    endFreq: number,
    delay = 0,
  ): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(vol * this.volume, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }
}

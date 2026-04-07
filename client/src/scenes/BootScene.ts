import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import { SaveSystem } from '../systems/SaveSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Star Sailor', {
      fontSize: '64px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'A Space Cat Adventure', {
      fontSize: '24px',
      color: '#aaccff',
      fontFamily: 'Arial, sans-serif',
    });
    subtitle.setOrigin(0.5);

    // Twinkling star effect
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000),
      });
    }

    // Initialize save system
    SaveSystem.load();

    // Transition to MenuScene after splash
    this.time.delayedCall(2000, () => {
      this.scene.start('MenuScene');
    });
  }
}

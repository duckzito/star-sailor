import Phaser from 'phaser';
import { GAME_WIDTH } from '@shared/constants';
import type { BaseBoss } from '../entities/BaseBoss';

export class BossHealthBar {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private barWidth: number;

  constructor(scene: Phaser.Scene, bossName: string, barWidth = 400) {
    this.scene = scene;
    this.barWidth = barWidth;

    const barX = GAME_WIDTH / 2 - barWidth / 2;

    this.bg = scene.add.rectangle(GAME_WIDTH / 2, 30, barWidth, 20, 0x333333).setScrollFactor(0).setDepth(100);
    this.fill = scene.add.rectangle(barX, 30, barWidth, 20, 0xff2222).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    this.nameText = scene.add.text(GAME_WIDTH / 2, 50, bossName, {
      fontSize: '16px',
      color: '#ff8888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.phaseText = scene.add.text(GAME_WIDTH / 2, 70, 'Phase 1', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  update(boss: BaseBoss): void {
    this.fill.width = this.barWidth * boss.getHpRatio();
    this.phaseText.setText(`Phase ${boss.currentPhase + 1}`);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
    this.nameText.destroy();
    this.phaseText.destroy();
  }
}

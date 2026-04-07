import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import { LEVEL_CONFIGS } from '@shared/level-configs';
import { SaveSystem } from '../systems/SaveSystem';

export class LevelSelectScene extends Phaser.Scene {
  private unlockedLevels: number[] = [0];
  private inventory: string[] = [];

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  init(data: { unlockedLevels?: number[]; inventory?: string[] }): void {
    // Merge save data with scene data — save is source of truth
    this.unlockedLevels = SaveSystem.getUnlockedLevels();
    this.inventory = SaveSystem.getEquipment();
    // Also merge any newly passed data (from VictoryScene transitions)
    if (data.unlockedLevels) {
      for (const lvl of data.unlockedLevels) {
        if (!this.unlockedLevels.includes(lvl)) {
          SaveSystem.unlockLevel(lvl);
          this.unlockedLevels.push(lvl);
        }
      }
    }
    if (data.inventory) {
      SaveSystem.addEquipmentBatch(data.inventory);
      this.inventory = SaveSystem.getEquipment();
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a2e');

    this.add.text(GAME_WIDTH / 2, 50, 'Select Level', {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const startX = GAME_WIDTH / 2 - (LEVEL_CONFIGS.length - 1) * 120 / 2;

    for (let i = 0; i < LEVEL_CONFIGS.length; i++) {
      const config = LEVEL_CONFIGS[i];
      const unlocked = this.unlockedLevels.includes(i);
      const x = startX + i * 120;
      const y = GAME_HEIGHT / 2 - 40;

      // Level card
      const card = this.add.rectangle(x, y, 100, 130, unlocked ? 0x2a2a5a : 0x1a1a2a);
      card.setStrokeStyle(2, unlocked ? 0xffd700 : 0x333333);

      // Level number
      this.add.text(x, y - 35, `${i + 1}`, {
        fontSize: '32px',
        color: unlocked ? '#ffd700' : '#444444',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Level name
      this.add.text(x, y + 10, config.name, {
        fontSize: '12px',
        color: unlocked ? '#aaccff' : '#444444',
        wordWrap: { width: 90 },
        align: 'center',
      }).setOrigin(0.5);

      // Lock icon for locked levels
      if (!unlocked) {
        this.add.text(x, y + 40, '🔒', {
          fontSize: '20px',
        }).setOrigin(0.5);
      }

      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setFillStyle(0x3a3a7a));
        card.on('pointerout', () => card.setFillStyle(0x2a2a5a));
        card.on('pointerdown', () => {
          this.scene.start('LoadoutScene', {
            levelIndex: i,
            unlockedLevels: this.unlockedLevels,
            inventory: this.inventory,
          });
        });
      }
    }

    // Back button
    const backBtn = this.add.text(60, GAME_HEIGHT - 50, '< Back', {
      fontSize: '22px',
      color: '#aaaaaa',
      backgroundColor: '#1a1a3a',
      padding: { x: 12, y: 6 },
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#aaaaaa'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}

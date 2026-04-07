import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import { EQUIPMENT } from '@shared/equipment-data';
import type { LoadoutSlots } from '@shared/types';
import { SaveSystem } from '../systems/SaveSystem';

export class VictoryScene extends Phaser.Scene {
  private levelIndex = 0;
  private collectedItems: string[] = [];
  private loadout: LoadoutSlots = { weapon: null, armor: null, accessory: null, consumables: [null, null] };
  private unlockedLevels: number[] = [0];
  private inventory: string[] = [];
  private bossName = 'Boss';

  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data: {
    levelIndex?: number;
    collectedItems?: string[];
    loadout?: LoadoutSlots;
    unlockedLevels?: number[];
    inventory?: string[];
    bossName?: string;
  }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.collectedItems = data.collectedItems ?? [];
    this.loadout = data.loadout ?? this.loadout;
    this.unlockedLevels = data.unlockedLevels ?? [0];
    this.inventory = [...(data.inventory ?? []), ...this.collectedItems];
    this.bossName = data.bossName ?? 'Boss';

    // Unlock next level and persist
    const nextLevel = this.levelIndex + 1;
    if (nextLevel < 5 && !this.unlockedLevels.includes(nextLevel)) {
      this.unlockedLevels.push(nextLevel);
    }

    // Save progress to localStorage
    for (const lvl of this.unlockedLevels) {
      SaveSystem.unlockLevel(lvl);
    }
    SaveSystem.addEquipmentBatch(this.collectedItems);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a2e');

    // Celebration starfield
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const color = Phaser.Utils.Array.GetRandom([0xffd700, 0xff4444, 0x44ff44, 0x4488ff]);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 4), color);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        scale: { from: 0.5, to: 1.5 },
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Victory text
    this.add.text(GAME_WIDTH / 2, 80, 'VICTORY!', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 140, `${this.bossName} Defeated!`, {
      fontSize: '28px',
      color: '#ff8888',
    }).setOrigin(0.5);

    // Loot collected
    this.add.text(GAME_WIDTH / 2, 200, 'Loot Collected:', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    let y = 240;
    if (this.collectedItems.length === 0) {
      this.add.text(GAME_WIDTH / 2, y, 'No items collected', {
        fontSize: '18px',
        color: '#666666',
      }).setOrigin(0.5);
    } else {
      for (const itemId of this.collectedItems) {
        const item = EQUIPMENT[itemId];
        const name = item?.name ?? itemId;
        const color = this.getCategoryColor(item?.category ?? 'consumable');
        this.add.text(GAME_WIDTH / 2, y, `+ ${name}`, {
          fontSize: '20px',
          color: color,
        }).setOrigin(0.5);
        y += 30;
      }
    }

    // Next level unlock
    const nextLevel = this.levelIndex + 1;
    if (nextLevel < 5) {
      this.add.text(GAME_WIDTH / 2, y + 30, `Level ${nextLevel + 1} Unlocked!`, {
        fontSize: '22px',
        color: '#44ff44',
      }).setOrigin(0.5);
    } else {
      this.add.text(GAME_WIDTH / 2, y + 30, 'All Levels Complete! You are the Star Sailor!', {
        fontSize: '22px',
        color: '#ffd700',
      }).setOrigin(0.5);
    }

    // Continue button
    const continueBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '[ Continue ]', {
      fontSize: '28px',
      color: '#ffd700',
      backgroundColor: '#2a2a5a',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.on('pointerover', () => continueBtn.setBackgroundColor('#3a3a7a'));
    continueBtn.on('pointerout', () => continueBtn.setBackgroundColor('#2a2a5a'));
    continueBtn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene', {
        unlockedLevels: this.unlockedLevels,
        inventory: this.inventory,
      });
    });
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'weapon': return '#ff6666';
      case 'armor': return '#6688ff';
      case 'accessory': return '#66ff66';
      case 'consumable': return '#ffdd66';
      default: return '#ffffff';
    }
  }
}

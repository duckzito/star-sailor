import Phaser from 'phaser';
import { GAME_WIDTH } from '@shared/constants';
import { EQUIPMENT } from '@shared/equipment-data';
import type { PlayerStats, LoadoutSlots } from '@shared/types';
import { HealthBar } from './HealthBar';

export class HUD {
  private scene: Phaser.Scene;
  private healthBar: HealthBar;
  private hpText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private levelNameText: Phaser.GameObjects.Text;
  private equipmentTexts: Phaser.GameObjects.Text[] = [];
  private gateText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Player HP bar
    this.healthBar = new HealthBar(scene, 10, 16, 160, 14, 0xff2222, 0);
    this.healthBar.setDepth(100);

    this.hpText = scene.add.text(12, 8, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(102);

    this.livesText = scene.add.text(10, 34, '', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    this.levelNameText = scene.add.text(GAME_WIDTH / 2, 10, '', {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.gateText = scene.add.text(GAME_WIDTH - 10, 10, '', {
      fontSize: '14px',
      color: '#aaccff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  setLevelName(name: string): void {
    this.levelNameText.setText(name);
  }

  setLoadout(loadout: LoadoutSlots): void {
    // Clear old
    this.equipmentTexts.forEach((t) => t.destroy());
    this.equipmentTexts = [];

    const slots = [
      { key: 'W', id: loadout.weapon },
      { key: 'A', id: loadout.armor },
      { key: 'Ac', id: loadout.accessory },
    ];

    let x = 10;
    const y = this.scene.scale.height - 30;
    for (const slot of slots) {
      const name = slot.id ? (EQUIPMENT[slot.id]?.name ?? slot.id) : '--';
      const color = slot.id ? '#ffd700' : '#666666';
      const text = this.scene.add.text(x, y, `[${slot.key}] ${name}`, {
        fontSize: '12px',
        color,
        stroke: '#000000',
        strokeThickness: 2,
      }).setScrollFactor(0).setDepth(100);
      this.equipmentTexts.push(text);
      x += text.width + 16;
    }
  }

  update(stats: PlayerStats, lives: number): void {
    this.healthBar.update(stats.hp, stats.maxHp);
    this.hpText.setText(`${stats.hp}/${stats.maxHp}`);
    this.livesText.setText(`Lives: ${'*'.repeat(lives)}`);
  }

  setGateStatus(open: boolean, elitesDefeated: number, totalElites: number): void {
    if (totalElites === 0 || open) {
      this.gateText.setText('Boss Gate: OPEN').setColor('#44ff44');
    } else {
      this.gateText.setText(`Elites: ${elitesDefeated}/${totalElites}`).setColor('#aaccff');
    }
  }

  destroy(): void {
    this.healthBar.destroy();
    this.hpText.destroy();
    this.livesText.destroy();
    this.levelNameText.destroy();
    this.gateText.destroy();
    this.equipmentTexts.forEach((t) => t.destroy());
  }
}

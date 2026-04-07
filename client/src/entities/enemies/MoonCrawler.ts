import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const MOON_CRAWLER_CONFIG: EnemyConfig = {
  id: 'moon_crawler',
  name: 'Moon Crawler',
  hp: 40,
  attack: 8,
  speed: 60,
  detectionRange: 150,
  attackRange: 40,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.3 },
  ],
};

export class MoonCrawler extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolPath?: { x: number; y: number }[],
  ) {
    super(scene, x, y, MOON_CRAWLER_CONFIG, patrolPath);
  }

  protected createTexture(): void {
    const texKey = 'moon_crawler';
    if (this.scene.textures.exists(texKey)) {
      this.setTexture(texKey);
      return;
    }
    const g = this.scene.add.graphics();
    // Body — dark purple bug-like creature
    g.fillStyle(0x553388, 1);
    g.fillRoundedRect(2, 8, 28, 16, 6);
    // Legs
    g.lineStyle(2, 0x442277);
    g.lineBetween(6, 24, 4, 30);
    g.lineBetween(12, 24, 10, 30);
    g.lineBetween(20, 24, 22, 30);
    g.lineBetween(26, 24, 28, 30);
    // Eyes — glowing red
    g.fillStyle(0xff2222, 1);
    g.fillCircle(10, 12, 3);
    g.fillCircle(22, 12, 3);
    g.generateTexture(texKey, 32, 32);
    g.destroy();
    this.setTexture(texKey);
  }

}

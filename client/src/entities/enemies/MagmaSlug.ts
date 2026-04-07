import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'magma_slug',
  name: 'Magma Slug',
  hp: 50,
  attack: 10,
  speed: 40,
  detectionRange: 120,
  attackRange: 35,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.3 },
    { itemId: 'supernova_charge', dropRate: 0.1 },
  ],
};

export class MagmaSlug extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
  }

  protected createTexture(): void {
    const k = 'magma_slug';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0xcc4400, 1);
    g.fillRoundedRect(2, 10, 28, 16, 8);
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(10, 14, 4);
    g.fillCircle(22, 14, 4);
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(8, 12, 2);
    g.fillCircle(24, 12, 2);
    // Trail glow
    g.fillStyle(0xff4400, 0.4);
    g.fillEllipse(16, 24, 20, 6);
    g.generateTexture(k, 32, 28);
    g.destroy();
    this.setTexture(k);
  }
}

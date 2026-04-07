import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'shadow_cat',
  name: 'Shadow Cat',
  hp: 40,
  attack: 11,
  speed: 120,
  detectionRange: 200,
  attackRange: 45,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.2 },
    { itemId: 'comet_trail', dropRate: 0.05 },
  ],
};

export class ShadowCat extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
    this.setAlpha(0.7);
  }

  protected createTexture(): void {
    const k = 'shadow_cat';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    // Dark cat shape — mirror of Star Sailor but corrupted
    g.fillStyle(0x221133, 1);
    g.fillRoundedRect(0, 8, 32, 24, 4);
    g.fillStyle(0x331144, 1);
    g.fillCircle(16, 8, 10);
    g.fillTriangle(8, 2, 6, -6, 12, 0);
    g.fillTriangle(24, 2, 20, 0, 26, -6);
    // Red eyes
    g.fillStyle(0xff0044, 1);
    g.fillCircle(12, 7, 3);
    g.fillCircle(20, 7, 3);
    // Dark star
    g.fillStyle(0x660044, 1);
    g.fillCircle(16, 2, 2);
    g.generateTexture(k, 32, 32);
    g.destroy();
    this.setTexture(k);
  }
}

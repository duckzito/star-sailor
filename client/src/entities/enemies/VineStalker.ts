import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'vine_stalker',
  name: 'Vine Stalker',
  hp: 45,
  attack: 9,
  speed: 55,
  detectionRange: 140,
  attackRange: 50,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.25 },
    { itemId: 'nebula_shield', dropRate: 0.05 },
  ],
};

export class VineStalker extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
  }

  protected createTexture(): void {
    const k = 'vine_stalker';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x225522, 1);
    g.fillRoundedRect(4, 4, 24, 28, 4);
    g.lineStyle(2, 0x33aa33);
    g.lineBetween(8, 0, 6, 8);
    g.lineBetween(24, 0, 26, 8);
    g.lineBetween(4, 16, 0, 20);
    g.lineBetween(28, 16, 32, 20);
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(12, 14, 3);
    g.fillCircle(20, 14, 3);
    g.generateTexture(k, 32, 32);
    g.destroy();
    this.setTexture(k);
  }
}

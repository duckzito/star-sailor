import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const DUST_SPRITE_CONFIG: EnemyConfig = {
  id: 'dust_sprite',
  name: 'Dust Sprite',
  hp: 25,
  attack: 5,
  speed: 80,
  detectionRange: 200,
  attackRange: 60,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.2 },
    { itemId: 'supernova_charge', dropRate: 0.1 },
  ],
};

export class DustSprite extends BaseEnemy {
  private bobTime = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolPath?: { x: number; y: number }[],
  ) {
    super(scene, x, y, DUST_SPRITE_CONFIG, patrolPath);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.003;
    const bobVelocity = Math.sin(this.bobTime) * 30;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
  }

  protected createTexture(): void {
    const texKey = 'dust_sprite';
    if (this.scene.textures.exists(texKey)) {
      this.setTexture(texKey);
      return;
    }
    const g = this.scene.add.graphics();
    g.fillStyle(0xccaa88, 0.8);
    g.fillCircle(16, 12, 10);
    g.fillStyle(0xbbaa77, 0.6);
    g.fillCircle(10, 18, 6);
    g.fillCircle(22, 18, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 10, 3);
    g.fillCircle(20, 10, 3);
    g.fillStyle(0x222222, 1);
    g.fillCircle(12, 10, 1.5);
    g.fillCircle(20, 10, 1.5);
    g.generateTexture(texKey, 32, 28);
    g.destroy();
    this.setTexture(texKey);
  }
}

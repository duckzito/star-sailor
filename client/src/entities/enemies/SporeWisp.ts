import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'spore_wisp',
  name: 'Spore Wisp',
  hp: 20,
  attack: 6,
  speed: 90,
  detectionRange: 180,
  attackRange: 70,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.2 },
  ],
};

export class SporeWisp extends BaseEnemy {
  private bobTime = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.003;
    const bobY = Math.sin(this.bobTime) * 35;
    const bobX = Math.cos(this.bobTime * 0.7) * 10;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(bobY);
    body.setVelocityX(body.velocity.x + bobX * 0.1);
  }

  protected createTexture(): void {
    const k = 'spore_wisp';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x44cc66, 0.7);
    g.fillCircle(16, 12, 10);
    g.fillStyle(0x66ff88, 0.5);
    g.fillCircle(10, 18, 5);
    g.fillCircle(22, 18, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 10, 2);
    g.fillCircle(20, 10, 2);
    g.generateTexture(k, 32, 24);
    g.destroy();
    this.setTexture(k);
  }
}

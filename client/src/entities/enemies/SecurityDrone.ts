import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'security_drone',
  name: 'Security Drone',
  hp: 35,
  attack: 8,
  speed: 110,
  detectionRange: 220,
  attackRange: 90,
  lootTable: [
    { itemId: 'supernova_charge', dropRate: 0.15 },
  ],
};

export class SecurityDrone extends BaseEnemy {
  private bobTime = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.006;
    const bobVelocity = Math.sin(this.bobTime) * 20;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
  }

  protected createTexture(): void {
    const k = 'security_drone';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x666688, 1);
    g.fillRoundedRect(4, 8, 24, 16, 4);
    g.fillStyle(0x8888aa, 1);
    g.fillRect(12, 4, 8, 6);
    g.fillStyle(0x00ccff, 1);
    g.fillCircle(16, 14, 4);
    g.lineStyle(1, 0x4444ff);
    g.strokeCircle(16, 14, 6);
    g.generateTexture(k, 32, 28);
    g.destroy();
    this.setTexture(k);
  }
}

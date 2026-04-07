import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'rock_hornet',
  name: 'Rock Hornet',
  hp: 30,
  attack: 7,
  speed: 100,
  detectionRange: 200,
  attackRange: 80,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.25 },
  ],
};

export class RockHornet extends BaseEnemy {
  private bobTime = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.005;
    const bobVelocity = Math.sin(this.bobTime) * 40;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
  }

  protected createTexture(): void {
    const k = 'rock_hornet';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x886644, 1);
    g.fillEllipse(16, 14, 24, 16);
    g.fillStyle(0xaa8855, 1);
    g.fillTriangle(4, 14, 0, 6, 8, 10);
    g.fillTriangle(28, 14, 32, 6, 24, 10);
    g.fillStyle(0xff6600, 1);
    g.fillCircle(12, 12, 3);
    g.fillCircle(20, 12, 3);
    g.fillStyle(0xcc4400, 1);
    g.fillTriangle(16, 20, 14, 28, 18, 28);
    g.generateTexture(k, 32, 28);
    g.destroy();
    this.setTexture(k);
  }
}

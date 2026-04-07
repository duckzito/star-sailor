import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'void_wraith',
  name: 'Void Wraith',
  hp: 35,
  attack: 9,
  speed: 70,
  detectionRange: 250,
  attackRange: 100,
  lootTable: [
    { itemId: 'supernova_charge', dropRate: 0.15 },
    { itemId: 'cosmic_crown', dropRate: 0.02 },
  ],
};

export class VoidWraith extends BaseEnemy {
  private bobTime = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    super(scene, x, y, CONFIG, patrolPath);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setAlpha(0.6);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.002;
    const bobVelocity = Math.sin(this.bobTime) * 25;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
    // Ghostly alpha pulse
    this.setAlpha(0.5 + Math.sin(this.bobTime * 1.5) * 0.3);
  }

  protected createTexture(): void {
    const k = 'void_wraith';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x220033, 0.9);
    g.fillCircle(16, 10, 12);
    g.fillStyle(0x330044, 0.7);
    g.fillTriangle(6, 14, 16, 30, 10, 18);
    g.fillTriangle(26, 14, 16, 30, 22, 18);
    // Hollow eyes
    g.fillStyle(0xcc00ff, 1);
    g.fillCircle(11, 9, 3);
    g.fillCircle(21, 9, 3);
    g.fillStyle(0x220033, 1);
    g.fillCircle(11, 9, 1.5);
    g.fillCircle(21, 9, 1.5);
    g.generateTexture(k, 32, 32);
    g.destroy();
    this.setTexture(k);
  }
}

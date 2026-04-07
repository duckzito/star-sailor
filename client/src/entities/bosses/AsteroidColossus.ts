import Phaser from 'phaser';
import type { BossConfig } from '@shared/types';
import { BaseBoss } from '../BaseBoss';

const CONFIG: BossConfig = {
  id: 'asteroid_colossus',
  name: 'Asteroid Colossus',
  phases: [
    { hpThreshold: 1.0, attacks: ['boulder_hurl', 'stomp'], speed: 55, attackCooldown: 2200 },
    { hpThreshold: 0.6, attacks: ['boulder_hurl', 'stomp', 'meteor_rain'], speed: 70, attackCooldown: 1600 },
    { hpThreshold: 0.3, attacks: ['boulder_hurl', 'stomp', 'meteor_rain', 'seismic_slam'], speed: 85, attackCooldown: 1000 },
  ],
  uniqueDrop: 'meteor_hammer',
};

export class AsteroidColossus extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 700);
    this.setSize(56, 60);
  }

  protected createTexture(): void {
    const k = 'asteroid_colossus';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x775533, 1);
    g.fillRoundedRect(0, 0, 64, 64, 12);
    g.fillStyle(0x996644, 1);
    g.fillCircle(16, 16, 8);
    g.fillCircle(48, 20, 6);
    g.fillCircle(28, 50, 7);
    g.fillStyle(0xff6600, 1);
    g.fillCircle(22, 24, 5);
    g.fillCircle(42, 24, 5);
    g.fillStyle(0xcc4400, 1);
    g.fillRect(24, 38, 16, 6);
    g.generateTexture(k, 64, 64);
    g.destroy();
    this.setTexture(k);
  }

  protected performAttack(name: string, target: Phaser.Physics.Arcade.Sprite): void {
    switch (name) {
      case 'boulder_hurl':
        for (let i = -1; i <= 1; i++) {
          this.fireProjectile(target.x + i * 50, target.y, 160, 0x886644, 12);
        }
        break;
      case 'stomp':
        this.scene.cameras.main.shake(300, 0.02);
        (this.body as Phaser.Physics.Arcade.Body).setVelocityY(-250);
        this.scene.time.delayedCall(400, () => {
          if (!this.active) return;
          (this.body as Phaser.Physics.Arcade.Body).setVelocityY(400);
          this.scene.time.delayedCall(200, () => {
            this.fireProjectile(this.x - 80, this.y, 120, 0xcc6600, 10);
            this.fireProjectile(this.x + 80, this.y, 120, 0xcc6600, 10);
          });
        });
        break;
      case 'meteor_rain':
        for (let i = 0; i < 4; i++) {
          this.scene.time.delayedCall(i * 300, () => {
            if (!this.active) return;
            const rx = target.x + Phaser.Math.Between(-100, 100);
            this.fireProjectile(rx, target.y + 50, 180, 0xff4400, 8);
          });
        }
        break;
      case 'seismic_slam':
        this.scene.cameras.main.shake(500, 0.03);
        for (let i = -3; i <= 3; i++) {
          this.scene.time.delayedCall(Math.abs(i) * 100, () => {
            if (!this.active) return;
            this.fireProjectile(this.x + i * 60, this.y, 100, 0x886644, 10);
          });
        }
        break;
    }
  }
}

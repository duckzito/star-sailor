import Phaser from 'phaser';
import type { BossConfig } from '@shared/types';
import { BaseBoss } from '../BaseBoss';

const CONFIG: BossConfig = {
  id: 'nebula_hydra',
  name: 'Nebula Hydra',
  phases: [
    { hpThreshold: 1.0, attacks: ['acid_spit', 'vine_lash'], speed: 60, attackCooldown: 2000 },
    { hpThreshold: 0.6, attacks: ['acid_spit', 'vine_lash', 'spore_cloud'], speed: 75, attackCooldown: 1400 },
    { hpThreshold: 0.3, attacks: ['acid_spit', 'vine_lash', 'spore_cloud', 'multi_head_strike'], speed: 90, attackCooldown: 900 },
  ],
  uniqueDrop: 'solar_wings',
};

export class NebulaHydra extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 900);
    this.setSize(52, 58);
  }

  protected createTexture(): void {
    const k = 'nebula_hydra';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    g.fillStyle(0x226644, 1);
    g.fillRoundedRect(8, 16, 48, 48, 8);
    // Three heads
    g.fillStyle(0x33aa55, 1);
    g.fillCircle(16, 12, 10);
    g.fillCircle(32, 8, 10);
    g.fillCircle(48, 12, 10);
    // Eyes on each head
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(14, 10, 3); g.fillCircle(18, 10, 3);
    g.fillCircle(30, 6, 3); g.fillCircle(34, 6, 3);
    g.fillCircle(46, 10, 3); g.fillCircle(50, 10, 3);
    g.generateTexture(k, 64, 64);
    g.destroy();
    this.setTexture(k);
  }

  protected performAttack(name: string, target: Phaser.Physics.Arcade.Sprite): void {
    switch (name) {
      case 'acid_spit':
        this.fireProjectile(target.x, target.y, 200, 0x44ff44, 8);
        this.fireProjectile(target.x + 30, target.y - 20, 180, 0x44ff44, 6);
        break;
      case 'vine_lash':
        // Fast horizontal projectile
        const dir = target.x > this.x ? 1 : -1;
        this.fireProjectile(this.x + dir * 300, this.y, 300, 0x228833, 6);
        break;
      case 'spore_cloud':
        // Ring of spores
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const tx = this.x + Math.cos(angle) * 150;
          const ty = this.y + Math.sin(angle) * 150;
          this.fireProjectile(tx, ty, 80, 0x66cc44, 6);
        }
        break;
      case 'multi_head_strike':
        // Three rapid projectiles from different angles
        for (let i = 0; i < 3; i++) {
          this.scene.time.delayedCall(i * 200, () => {
            if (!this.active) return;
            const offsetY = (i - 1) * 40;
            this.fireProjectile(target.x, target.y + offsetY, 250, 0x33aa55, 10);
          });
        }
        break;
    }
  }
}

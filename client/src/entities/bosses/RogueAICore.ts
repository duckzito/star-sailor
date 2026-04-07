import Phaser from 'phaser';
import type { BossConfig } from '@shared/types';
import { BaseBoss } from '../BaseBoss';

const CONFIG: BossConfig = {
  id: 'rogue_ai_core',
  name: 'Rogue AI Core',
  phases: [
    { hpThreshold: 1.0, attacks: ['laser_beam', 'drone_swarm'], speed: 0, attackCooldown: 1800 },
    { hpThreshold: 0.6, attacks: ['laser_beam', 'drone_swarm', 'emp_pulse'], speed: 0, attackCooldown: 1200 },
    { hpThreshold: 0.3, attacks: ['laser_beam', 'drone_swarm', 'emp_pulse', 'overload'], speed: 40, attackCooldown: 800 },
  ],
  uniqueDrop: 'nova_blaster',
};

export class RogueAICore extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 1100);
    this.setSize(48, 48);
    // Floating core
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.bobTime = 0;
  }

  private bobTime = 0;

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.bobTime += delta * 0.003;
    const bobVelocity = Math.sin(this.bobTime) * 25;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
  }

  protected createTexture(): void {
    const k = 'rogue_ai_core';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    // Metallic sphere
    g.fillStyle(0x445566, 1);
    g.fillCircle(32, 32, 28);
    g.fillStyle(0x556677, 1);
    g.fillCircle(32, 32, 22);
    // Glowing core
    g.fillStyle(0x00ccff, 1);
    g.fillCircle(32, 32, 12);
    g.lineStyle(2, 0x00ffff, 0.8);
    g.strokeCircle(32, 32, 16);
    // Scanner eye
    g.fillStyle(0xff0044, 1);
    g.fillCircle(32, 28, 4);
    g.generateTexture(k, 64, 64);
    g.destroy();
    this.setTexture(k);
  }

  protected performAttack(name: string, target: Phaser.Physics.Arcade.Sprite): void {
    switch (name) {
      case 'laser_beam':
        // Horizontal laser line
        for (let i = 0; i < 5; i++) {
          this.scene.time.delayedCall(i * 80, () => {
            if (!this.active) return;
            this.fireProjectile(target.x + (i - 2) * 30, this.y, 350, 0x00ccff, 4);
          });
        }
        break;
      case 'drone_swarm':
        // Small fast projectiles from multiple directions
        for (let i = 0; i < 4; i++) {
          this.scene.time.delayedCall(i * 100, () => {
            if (!this.active) return;
            this.fireProjectile(target.x, target.y, 200, 0x00ccff, 4);
          });
        }
        break;
      case 'emp_pulse':
        // Expanding ring of projectiles
        this.scene.cameras.main.flash(200, 0, 200, 255);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const tx = this.x + Math.cos(angle) * 200;
          const ty = this.y + Math.sin(angle) * 200;
          this.fireProjectile(tx, ty, 120, 0x8800ff, 6);
        }
        break;
      case 'overload':
        // Massive barrage
        this.scene.cameras.main.shake(500, 0.02);
        for (let i = 0; i < 8; i++) {
          this.scene.time.delayedCall(i * 150, () => {
            if (!this.active) return;
            this.fireProjectile(
              target.x + Phaser.Math.Between(-80, 80),
              target.y + Phaser.Math.Between(-40, 40),
              280, 0x00ffff, 6,
            );
          });
        }
        break;
    }
  }

  protected onPhaseTransition(phase: number): void {
    if (phase === 2) {
      this.scene.cameras.main.flash(800, 0, 100, 255);
    }
  }
}

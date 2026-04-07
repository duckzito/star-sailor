import Phaser from 'phaser';
import type { BossConfig } from '@shared/types';
import { BaseBoss } from '../BaseBoss';

const CRATER_TITAN_CONFIG: BossConfig = {
  id: 'crater_titan',
  name: 'Crater Titan',
  phases: [
    { hpThreshold: 1.0, attacks: ['ground_slam', 'rock_throw'], speed: 60, attackCooldown: 1800 },
    { hpThreshold: 0.5, attacks: ['ground_slam', 'rock_throw', 'charge', 'double_shockwave'], speed: 90, attackCooldown: 1200 },
  ],
  uniqueDrop: 'gravity_boots',
};

export class CraterTitan extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CRATER_TITAN_CONFIG, 500);
    this.setSize(48, 56);
  }

  protected createTexture(): void {
    const texKey = 'crater_titan';
    if (this.scene.textures.exists(texKey)) {
      this.setTexture(texKey);
      return;
    }
    const g = this.scene.add.graphics();
    // Large rocky golem
    g.fillStyle(0x665544, 1);
    g.fillRoundedRect(0, 0, 64, 64, 8);
    // Cracks
    g.lineStyle(2, 0x443322);
    g.lineBetween(20, 10, 30, 30);
    g.lineBetween(40, 15, 35, 40);
    // Glowing eyes
    g.fillStyle(0xff4400, 1);
    g.fillCircle(20, 22, 6);
    g.fillCircle(44, 22, 6);
    // Mouth — jagged
    g.fillStyle(0xff2200, 1);
    g.fillRect(18, 42, 28, 6);
    g.generateTexture(texKey, 64, 64);
    g.destroy();
    this.setTexture(texKey);
  }

  protected performAttack(attackName: string, target: Phaser.Physics.Arcade.Sprite): void {
    switch (attackName) {
      case 'ground_slam':
        this.groundSlam(target);
        break;
      case 'rock_throw':
        this.rockThrow(target);
        break;
      case 'charge':
        this.charge(target);
        break;
      case 'double_shockwave':
        this.doubleShockwave();
        break;
    }
  }

  private groundSlam(target: Phaser.Physics.Arcade.Sprite): void {
    // Jump up and slam down, creating a shockwave zone
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-300);

    this.scene.time.delayedCall(600, () => {
      if (!this.active) return;
      body.setVelocityY(500);

      // Create shockwave zone after landing
      this.scene.time.delayedCall(300, () => {
        if (!this.active) return;
        this.scene.cameras.main.shake(200, 0.015);

        // Shockwave — wide low projectile along ground
        const wave = this.fireProjectile(
          target.x, this.y,
          150, 0xcc6600, 12,
        );
        if (wave.body) {
          (wave.body as Phaser.Physics.Arcade.Body).setSize(48, 16);
        }
      });
    });
  }

  private rockThrow(target: Phaser.Physics.Arcade.Sprite): void {
    // Throw 3 rocks in a spread
    for (let i = -1; i <= 1; i++) {
      const offsetX = i * 60;
      this.fireProjectile(
        target.x + offsetX, target.y,
        180, 0x886644, 10,
      );
    }
  }

  private charge(target: Phaser.Physics.Arcade.Sprite): void {
    // Rush toward player at high speed
    this.setTint(0xff2200);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = target.x > this.x ? 1 : -1;
    body.setVelocityX(dir * 350);

    this.scene.time.delayedCall(800, () => {
      if (!this.active) return;
      body.setVelocityX(0);
      this.clearTint();
    });
  }

  private doubleShockwave(): void {
    this.scene.cameras.main.shake(300, 0.02);

    // Generate texture first
    if (!this.scene.textures.exists('shockwave')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xcc6600, 0.8);
      g.fillRect(0, 0, 32, 12);
      g.generateTexture('shockwave', 32, 12);
      g.destroy();
    }

    // Left wave
    const left = this.scene.physics.add.sprite(this.x - 20, this.y, 'shockwave');
    (left.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    left.setVelocityX(-200);
    this.projectiles.add(left);

    // Right wave
    const right = this.scene.physics.add.sprite(this.x + 20, this.y, 'shockwave');
    (right.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    right.setVelocityX(200);
    this.projectiles.add(right);

    // Cleanup
    this.scene.time.delayedCall(3000, () => {
      if (left.active) left.destroy();
      if (right.active) right.destroy();
    });
  }

  protected onPhaseTransition(phase: number): void {
    // Phase 2 — boss gets angrier, darker tint
    if (phase === 1) {
      this.scene.cameras.main.flash(500, 255, 100, 0);
    }
  }
}

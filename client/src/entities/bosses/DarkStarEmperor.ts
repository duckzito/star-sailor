import Phaser from 'phaser';
import type { BossConfig } from '@shared/types';
import { BaseBoss } from '../BaseBoss';

const CONFIG: BossConfig = {
  id: 'dark_star_emperor',
  name: 'Dark Star Emperor',
  phases: [
    { hpThreshold: 1.0, attacks: ['shadow_bolt', 'void_slash'], speed: 75, attackCooldown: 1800 },
    { hpThreshold: 0.7, attacks: ['shadow_bolt', 'void_slash', 'dark_nova'], speed: 90, attackCooldown: 1300 },
    { hpThreshold: 0.4, attacks: ['shadow_bolt', 'void_slash', 'dark_nova', 'shadow_clones'], speed: 105, attackCooldown: 900 },
    { hpThreshold: 0.15, attacks: ['shadow_bolt', 'void_slash', 'dark_nova', 'shadow_clones', 'annihilate'], speed: 120, attackCooldown: 600 },
  ],
  uniqueDrop: 'cosmic_crown',
};

export class DarkStarEmperor extends BaseBoss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 1500);
    this.setSize(52, 58);
  }

  protected createTexture(): void {
    const k = 'dark_star_emperor';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    // Dark regal figure
    g.fillStyle(0x110022, 1);
    g.fillRoundedRect(4, 8, 56, 52, 6);
    // Crown
    g.fillStyle(0x660044, 1);
    g.fillTriangle(16, 8, 12, 0, 20, 4);
    g.fillTriangle(32, 8, 28, -2, 36, -2);
    g.fillTriangle(48, 8, 44, 0, 52, 4);
    // Cape
    g.fillStyle(0x220033, 0.8);
    g.fillTriangle(4, 20, 0, 60, 16, 60);
    g.fillTriangle(60, 20, 48, 60, 64, 60);
    // Eyes
    g.fillStyle(0xff0066, 1);
    g.fillCircle(22, 24, 5);
    g.fillCircle(42, 24, 5);
    // Dark star emblem
    g.fillStyle(0xcc0044, 1);
    g.fillCircle(32, 42, 5);
    g.generateTexture(k, 64, 64);
    g.destroy();
    this.setTexture(k);
  }

  protected performAttack(name: string, target: Phaser.Physics.Arcade.Sprite): void {
    switch (name) {
      case 'shadow_bolt':
        this.fireProjectile(target.x, target.y, 250, 0x660044, 8);
        this.fireProjectile(target.x - 40, target.y + 20, 220, 0x440033, 6);
        this.fireProjectile(target.x + 40, target.y + 20, 220, 0x440033, 6);
        break;
      case 'void_slash':
        // Fast horizontal slash
        const dir = target.x > this.x ? 1 : -1;
        this.setTint(0xff0066);
        (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 400);
        this.scene.time.delayedCall(500, () => {
          if (!this.active) return;
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
          this.clearTint();
          // Leave trail projectiles
          this.fireProjectile(this.x - dir * 60, this.y, 100, 0x220033, 10);
          this.fireProjectile(this.x - dir * 120, this.y, 80, 0x220033, 8);
        });
        break;
      case 'dark_nova':
        this.scene.cameras.main.shake(400, 0.025);
        this.scene.cameras.main.flash(300, 50, 0, 50);
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const tx = this.x + Math.cos(angle) * 200;
          const ty = this.y + Math.sin(angle) * 200;
          this.fireProjectile(tx, ty, 130, 0xcc0044, 8);
        }
        break;
      case 'shadow_clones':
        // Spawn temporary clones that fire from their own positions
        for (let i = 0; i < 2; i++) {
          const cx = this.x + (i === 0 ? -150 : 150);
          const cy = this.y;

          // Generate clone texture
          const cloneTexKey = 'boss_proj_3346756';
          if (!this.scene.textures.exists(cloneTexKey)) {
            const cg = this.scene.add.graphics();
            cg.fillStyle(0x331144, 1);
            cg.fillCircle(20, 20, 20);
            cg.generateTexture(cloneTexKey, 40, 40);
            cg.destroy();
          }
          const clone = this.scene.physics.add.sprite(cx, cy, cloneTexKey);
          (clone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          clone.setAlpha(0.5);
          this.projectiles.add(clone);

          // Each clone fires at player from its own position
          this.scene.time.delayedCall(800, () => {
            if (!clone.active) return;
            // Fire from clone position
            const dx = target.x - clone.x;
            const dy = target.y - clone.y;
            const angle = Math.atan2(dy, dx);
            const proj = this.fireProjectile(target.x, target.y, 200, 0x660044, 6);
            proj.setPosition(clone.x, clone.y);
            proj.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
            clone.destroy();
          });
        }
        break;
      case 'annihilate':
        // Ultimate attack — screen-wide barrage
        this.scene.cameras.main.shake(800, 0.04);
        this.scene.cameras.main.flash(500, 100, 0, 50);
        for (let i = 0; i < 12; i++) {
          this.scene.time.delayedCall(i * 120, () => {
            if (!this.active) return;
            this.fireProjectile(
              target.x + Phaser.Math.Between(-120, 120),
              target.y + Phaser.Math.Between(-60, 60),
              300, 0xff0066, 10,
            );
          });
        }
        break;
    }
  }

  protected onPhaseTransition(phase: number): void {
    this.scene.cameras.main.flash(600, 80, 0, 60);
    if (phase === 3) {
      // Final phase — darken the arena
      this.scene.cameras.main.setBackgroundColor('#050008');
    }
  }
}

import Phaser from 'phaser';

export class ParticleEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ensureTextures();
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('particle_white')) {
      const g = this.scene.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture('particle_white', 8, 8);
      g.destroy();
    }
  }

  dashTrail(x: number, y: number, facingRight: boolean): void {
    for (let i = 0; i < 5; i++) {
      const px = x + (facingRight ? -i * 8 : i * 8);
      const p = this.scene.add.circle(px, y + Phaser.Math.Between(-4, 4), 3, 0x00ffff, 0.8);
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0,
        duration: 300,
        delay: i * 30,
        onComplete: () => p.destroy(),
      });
    }
  }

  meleeSwipe(x: number, y: number, facingRight: boolean): void {
    const dir = facingRight ? 1 : -1;
    for (let i = 0; i < 3; i++) {
      const angle = (i - 1) * 0.4;
      const px = x + dir * 24 + Math.cos(angle) * 16;
      const py = y + Math.sin(angle) * 16;
      const p = this.scene.add.circle(px, py, 2, 0xff4444, 1);
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        x: px + dir * 20,
        alpha: 0,
        duration: 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  deathPoof(x: number, y: number, color: number = 0xffffff): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 40 + Math.random() * 40;
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.9);
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  itemSparkle(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-8, 8),
        2, 0xffd700, 1,
      );
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        y: p.y - 15,
        alpha: 0,
        duration: 500,
        delay: i * 100,
        onComplete: () => p.destroy(),
      });
    }
  }

  hitSpark(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.circle(
        x + Phaser.Math.Between(-6, 6),
        y + Phaser.Math.Between(-6, 6),
        Phaser.Math.Between(1, 3), 0xffaa00, 1,
      );
      p.setDepth(50);
      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 2,
        duration: 200,
        onComplete: () => p.destroy(),
      });
    }
  }
}

import Phaser from 'phaser';
import { RANGED_SPEED, RANGED_DAMAGE } from '@shared/constants';

export class StarProjectile extends Phaser.Physics.Arcade.Sprite {
  damage: number = RANGED_DAMAGE;
  private trail: Phaser.GameObjects.Graphics[] = [];
  private trailTimer = 0;
  private facingRight: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, facingRight: boolean) {
    StarProjectile.ensureTexture(scene);
    super(scene, x, y, 'star_projectile');
    this.facingRight = facingRight;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(14, 14);
    this.setDepth(55);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.onWorldBounds = true;
    body.world.on('worldbounds', (b: Phaser.Physics.Arcade.Body) => {
      if (b.gameObject === this) this.destroyWithEffect();
    });

    this.setVelocityX(facingRight ? RANGED_SPEED : -RANGED_SPEED);

    // Spinning rotation
    scene.tweens.add({
      targets: this,
      angle: facingRight ? 360 : -360,
      duration: 400,
      repeat: -1,
    });

    // Pulsing glow
    scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 1, to: 0.8 },
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }

  private static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('star_projectile')) return;
    const g = scene.add.graphics();

    // Outer glow
    g.fillStyle(0xffaa00, 0.4);
    g.fillCircle(10, 10, 10);
    // Core
    g.fillStyle(0xffd700, 1);
    g.fillCircle(10, 10, 6);
    // Inner bright spot
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(9, 8, 3);
    // Star points
    g.fillStyle(0xffee44, 0.8);
    g.fillTriangle(10, 0, 8, 6, 12, 6);   // top
    g.fillTriangle(10, 20, 8, 14, 12, 14); // bottom
    g.fillTriangle(0, 10, 6, 8, 6, 12);    // left
    g.fillTriangle(20, 10, 14, 8, 14, 12); // right

    g.generateTexture('star_projectile', 20, 20);
    g.destroy();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;

    // Re-enforce no gravity every frame (in case group overrides it)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.allowGravity) {
      body.setAllowGravity(false);
      body.setVelocityY(0);
    }

    // Spawn trail particles
    this.trailTimer += delta;
    if (this.trailTimer >= 30) {
      this.trailTimer = 0;
      this.spawnTrail();
    }
  }

  private spawnTrail(): void {
    const trail = this.scene.add.graphics();
    const size = Phaser.Math.Between(2, 4);
    const color = Phaser.Utils.Array.GetRandom([0xffd700, 0xffaa00, 0xffee66]);
    trail.fillStyle(color, 0.7);
    trail.fillCircle(0, 0, size);
    trail.setPosition(this.x + Phaser.Math.Between(-3, 3), this.y + Phaser.Math.Between(-3, 3));
    trail.setDepth(54);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => trail.destroy(),
    });
  }

  destroyWithEffect(): void {
    if (!this.active) return;

    // Burst effect on impact/despawn
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.scene.add.circle(
        this.x, this.y,
        Phaser.Math.Between(2, 4),
        Phaser.Utils.Array.GetRandom([0xffd700, 0xffaa00, 0xffffff]),
        1,
      );
      spark.setDepth(55);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        alpha: 0,
        scale: 0,
        duration: 200,
        onComplete: () => spark.destroy(),
      });
    }

    this.destroy();
  }
}

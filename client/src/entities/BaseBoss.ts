import Phaser from 'phaser';
import type { BossConfig, BossPhaseConfig } from '@shared/types';

export abstract class BaseBoss extends Phaser.Physics.Arcade.Sprite {
  bossConfig: BossConfig;
  hp: number;
  maxHp: number;
  currentPhase = 0;
  invulnerable = false;
  projectiles: Phaser.Physics.Arcade.Group;

  private attackTimer = 0;
  private lastAttack: string | null = null;
  private target: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: BossConfig,
    maxHp: number,
  ) {
    super(scene, x, y, '__MISSING');
    this.bossConfig = config;
    this.maxHp = maxHp;
    this.hp = maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.createTexture();
    this.setCollideWorldBounds(true);

    this.projectiles = scene.physics.add.group({ allowGravity: false });
    this.attackTimer = this.getCurrentPhase().attackCooldown;
  }

  protected abstract createTexture(): void;
  protected abstract performAttack(attackName: string, target: Phaser.Physics.Arcade.Sprite): void;

  setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
  }

  getCurrentPhase(): BossPhaseConfig {
    return this.bossConfig.phases[this.currentPhase] ?? this.bossConfig.phases[0];
  }

  getHpRatio(): number {
    return this.hp / this.maxHp;
  }

  update(_time: number, delta: number): void {
    if (!this.active || this.invulnerable || !this.target) return;

    const phase = this.getCurrentPhase();

    // Move toward target
    const dx = this.target.x - this.x;
    if (Math.abs(dx) > 60 && phase.speed > 0) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(Math.sign(dx) * phase.speed);
      this.setFlipX(dx < 0);
    } else {
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    }

    // Attack timer — avoid repeating the same attack consecutively
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.attackTimer = phase.attackCooldown;
      let candidates = phase.attacks.filter((a) => a !== this.lastAttack);
      if (candidates.length === 0) candidates = phase.attacks;
      const attackName = Phaser.Utils.Array.GetRandom(candidates);
      this.lastAttack = attackName;
      this.telegraphAttack(attackName);
    }
  }

  private telegraphAttack(attackName: string): void {
    this.setTint(0xff6600);
    this.scene.time.delayedCall(500, () => {
      if (!this.active || !this.target) return;
      this.clearTint();
      this.performAttack(attackName, this.target);
    });
  }

  takeDamage(amount: number): void {
    if (this.invulnerable) return;

    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => this.clearTint());

    // Check phase transition
    const hpRatio = this.getHpRatio();
    const phases = this.bossConfig.phases;
    let newPhase = 0;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (hpRatio <= phases[i].hpThreshold) {
        newPhase = i;
        break;
      }
    }

    if (newPhase > this.currentPhase) {
      this.transitionPhase(newPhase);
    }

    if (this.hp <= 0) {
      this.onDefeated();
    }
  }

  private transitionPhase(newPhase: number): void {
    this.currentPhase = newPhase;
    this.invulnerable = true;

    this.setTint(0xff0000);
    this.scene.cameras.main.shake(300, 0.01);

    this.onPhaseTransition(newPhase);

    this.scene.time.delayedCall(1000, () => {
      this.invulnerable = false;
      this.clearTint();
    });
  }

  protected onPhaseTransition(_phase: number): void {
    // Override for custom phase transition effects
  }

  private onDefeated(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);

    // Clean up all active projectiles immediately
    this.projectiles.clear(true, true);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 1000,
      onComplete: () => {
        this.scene.events.emit('boss-defeated', this.bossConfig);
        this.destroy();
      },
    });
  }

  protected fireProjectile(
    targetX: number,
    targetY: number,
    speed: number,
    color: number = 0xff4444,
    size: number = 8,
  ): Phaser.Physics.Arcade.Sprite {
    const texKey = `boss_proj_${color}_${size}`;
    if (!this.scene.textures.exists(texKey)) {
      const g = this.scene.add.graphics();
      const pad = 4;
      const totalSize = (size + pad) * 2;
      // Outer glow
      g.fillStyle(color, 0.3);
      g.fillCircle(size + pad, size + pad, size + pad);
      // Core
      g.fillStyle(color, 1);
      g.fillCircle(size + pad, size + pad, size);
      // Inner bright spot
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(size + pad - 1, size + pad - 1, size * 0.4);
      g.generateTexture(texKey, totalSize, totalSize);
      g.destroy();
    }

    const proj = this.scene.physics.add.sprite(this.x, this.y, texKey);
    proj.setDepth(55);

    // Add to group first, then configure body (group add can reset body props)
    this.projectiles.add(proj);

    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const angle = Math.atan2(dy, dx);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Pulsing glow
    this.scene.tweens.add({
      targets: proj,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0.7 },
      duration: 120,
      yoyo: true,
      repeat: -1,
    });

    // Trail particles
    const trailColor = color;
    const trailEvent = this.scene.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (!proj.active) { trailEvent.destroy(); return; }
        const t = this.scene.add.circle(
          proj.x + Phaser.Math.Between(-2, 2),
          proj.y + Phaser.Math.Between(-2, 2),
          Phaser.Math.Between(1, size * 0.5),
          trailColor, 0.6,
        );
        t.setDepth(54);
        this.scene.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0.2,
          duration: 180,
          onComplete: () => t.destroy(),
        });
      },
    });

    // Auto-destroy after timeout
    this.scene.time.delayedCall(4000, () => {
      if (proj.active) proj.destroy();
      trailEvent.destroy();
    });

    return proj;
  }
}

import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  DASH_SPEED,
  DASH_DURATION,
  DASH_COOLDOWN,
  WALL_SLIDE_SPEED,
  MELEE_COOLDOWN,
  RANGED_COOLDOWN,
  PLAYER_BASE_HP,
  PLAYER_BASE_ATTACK,
  PLAYER_BASE_DEFENSE,
  INVULNERABILITY_DURATION,
  MELEE_RANGE,
} from '@shared/constants';
import type { PlayerStats, Direction } from '@shared/types';
import { InputManager } from '../systems/InputManager';
import { CombatSystem } from '../systems/CombatSystem';
import { SoundFX } from '../systems/SoundFX';
import { StarProjectile } from './StarProjectile';

type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'wall_slide' | 'dash' | 'melee' | 'ranged' | 'hurt';

export class StarSailor extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  facing: Direction = 'right';
  projectiles: Phaser.Physics.Arcade.Group;
  meleeHitboxGroup: Phaser.Physics.Arcade.Group;

  private input: InputManager;
  private state: PlayerState = 'idle';
  private canDoubleJump = true;
  private isDashing = false;
  private dashCooldownTimer = 0;
  private meleeCooldownTimer = 0;
  private rangedCooldownTimer = 0;
  private invulnerable = false;
  private dead = false;
  private sfx: SoundFX;

  constructor(scene: Phaser.Scene, x: number, y: number, input: InputManager) {
    // Generate texture before constructing sprite so it exists for the initial frame
    StarSailor.ensureTexture(scene);
    super(scene, x, y, 'star_sailor');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.input = input;
    this.stats = {
      hp: PLAYER_BASE_HP,
      maxHp: PLAYER_BASE_HP,
      attack: PLAYER_BASE_ATTACK,
      defense: PLAYER_BASE_DEFENSE,
      speed: PLAYER_SPEED,
    };
    this.setSize(24, 32);
    this.setOffset(4, 0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setMaxVelocityX(DASH_SPEED);
    body.setCollideWorldBounds(true);

    // Projectile group — gravity disabled for all children
    this.projectiles = scene.physics.add.group({
      classType: StarProjectile,
      runChildUpdate: true,
      allowGravity: false,
    });

    // Melee hitbox group
    this.meleeHitboxGroup = scene.physics.add.group();

    // Sound effects
    this.sfx = new SoundFX(scene);
  }

  private static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('star_sailor')) return;
    const g = scene.add.graphics();
    // Body
    g.fillStyle(0x6644cc, 1);
    g.fillRoundedRect(0, 8, 32, 24, 4);
    // Head
    g.fillStyle(0x7755dd, 1);
    g.fillCircle(16, 8, 10);
    // Ears (cat ears)
    g.fillTriangle(8, 2, 6, -6, 12, 0);
    g.fillTriangle(24, 2, 20, 0, 26, -6);
    // Eyes
    g.fillStyle(0xffd700, 1);
    g.fillCircle(12, 7, 3);
    g.fillCircle(20, 7, 3);
    // Star on forehead
    g.fillStyle(0xffd700, 1);
    g.fillCircle(16, 2, 2);
    g.generateTexture('star_sailor', 32, 32);
    g.destroy();
  }

  update(time: number, delta: number): void {
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;
    const onWallLeft = body.blocked.left;
    const onWallRight = body.blocked.right;
    const onWall = (onWallLeft || onWallRight) && !onFloor;

    // Update cooldowns
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
    this.meleeCooldownTimer = Math.max(0, this.meleeCooldownTimer - delta);
    this.rangedCooldownTimer = Math.max(0, this.rangedCooldownTimer - delta);

    // Reset double jump on ground
    if (onFloor) {
      this.canDoubleJump = true;
    }

    // Skip movement during dash
    if (this.isDashing) return;

    // --- Movement ---
    if (this.input.isLeft()) {
      body.setVelocityX(-this.stats.speed);
      this.facing = 'left';
      this.setFlipX(true);
    } else if (this.input.isRight()) {
      body.setVelocityX(this.stats.speed);
      this.facing = 'right';
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // --- Wall Slide ---
    if (onWall && body.velocity.y > 0) {
      body.setVelocityY(WALL_SLIDE_SPEED);
      this.state = 'wall_slide';
    }

    // --- Jump ---
    if (this.input.isJumpJustPressed()) {
      if (onFloor) {
        body.setVelocityY(JUMP_VELOCITY);
        this.state = 'jump';
        this.sfx.jump();
      } else if (onWall) {
        const wallJumpDir = onWallLeft ? 1 : -1;
        body.setVelocityX(this.stats.speed * wallJumpDir);
        body.setVelocityY(JUMP_VELOCITY);
        this.facing = wallJumpDir > 0 ? 'right' : 'left';
        this.setFlipX(this.facing === 'left');
        this.sfx.jump();
      } else if (this.canDoubleJump) {
        body.setVelocityY(DOUBLE_JUMP_VELOCITY);
        this.sfx.jump();
        this.canDoubleJump = false;
        this.state = 'jump';
      }
    }

    // --- Dash ---
    if (this.input.isDashPressed() && this.dashCooldownTimer <= 0) {
      this.performDash();
    }

    // --- Melee Attack ---
    if (this.input.isMeleePressed() && this.meleeCooldownTimer <= 0) {
      this.performMelee();
    }

    // --- Ranged Attack ---
    if (this.input.isRangedPressed() && this.rangedCooldownTimer <= 0) {
      this.performRanged();
    }

    // --- State ---
    if (!this.isDashing) {
      if (onFloor) {
        this.state = body.velocity.x !== 0 ? 'run' : 'idle';
      } else if (!onWall) {
        this.state = body.velocity.y < 0 ? 'jump' : 'fall';
      }
    }
  }

  private performDash(): void {
    this.isDashing = true;
    this.dashCooldownTimer = DASH_COOLDOWN;
    this.sfx.dash();
    const dir = this.facing === 'right' ? 1 : -1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(DASH_SPEED * dir);
    body.setVelocityY(0);
    body.setAllowGravity(false);

    // Flash effect
    this.setTint(0x00ffff);

    this.scene.time.delayedCall(DASH_DURATION, () => {
      this.isDashing = false;
      body.setAllowGravity(true);
      this.clearTint();
    });
  }

  private performMelee(): void {
    this.meleeCooldownTimer = MELEE_COOLDOWN;
    this.state = 'melee';
    this.sfx.meleeSwipe();
    const facingRight = this.facing === 'right';
    const dir = facingRight ? 1 : -1;

    // Small lunge forward
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(dir * 180);

    // Hitbox — slightly larger than before, lasts longer for reliability
    const hitboxW = MELEE_RANGE + 12;
    const hitboxH = MELEE_RANGE;
    const offsetX = dir * (hitboxW / 2 + 8);
    const hitbox = this.scene.add.zone(this.x + offsetX, this.y, hitboxW, hitboxH);
    this.scene.physics.add.existing(hitbox, false);
    const hBody = hitbox.body as Phaser.Physics.Arcade.Body;
    hBody.setAllowGravity(false);
    this.meleeHitboxGroup.add(hitbox);
    this.scene.time.delayedCall(80, () => hitbox.destroy());

    // --- Visual: Claw arc slash ---
    this.drawClawArc(facingRight);

    // Brief tint
    this.setTint(0xff6644);
    this.scene.time.delayedCall(120, () => this.clearTint());
  }

  private drawClawArc(facingRight: boolean): void {
    const dir = facingRight ? 1 : -1;
    const cx = this.x + dir * 20;
    const cy = this.y - 4;

    // Three claw lines sweeping in an arc
    const clawColors = [0xffffff, 0xffcc44, 0xff8844];
    for (let i = 0; i < 3; i++) {
      const baseAngle = facingRight ? -0.6 : Math.PI + 0.6;
      const spread = (i - 1) * 0.35;
      const angle = baseAngle + spread;
      const len = 28 + i * 4;

      const startX = cx;
      const startY = cy + (i - 1) * 6;
      const endX = startX + Math.cos(angle) * len;
      const endY = startY + Math.sin(angle) * len;

      // Draw each claw line as a thin rectangle rotated along the angle
      const line = this.scene.add.graphics();
      line.lineStyle(3 - i * 0.5, clawColors[i], 0.9);
      line.beginPath();
      line.moveTo(startX, startY);
      line.lineTo(endX, endY);
      line.strokePath();
      line.setDepth(60);

      // Animate: quick slash then fade
      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 150,
        delay: i * 20,
        onComplete: () => line.destroy(),
      });
    }

    // Spark burst at the tip
    for (let i = 0; i < 5; i++) {
      const sparkAngle = (facingRight ? 0 : Math.PI) + Phaser.Math.FloatBetween(-0.8, 0.8);
      const dist = Phaser.Math.Between(16, 36);
      const sx = cx + Math.cos(sparkAngle) * dist;
      const sy = cy + Math.sin(sparkAngle) * dist;
      const spark = this.scene.add.circle(sx, sy, Phaser.Math.Between(1, 3), 0xffdd44, 1);
      spark.setDepth(61);
      this.scene.tweens.add({
        targets: spark,
        x: sx + Math.cos(sparkAngle) * 12,
        y: sy + Math.sin(sparkAngle) * 12,
        alpha: 0,
        scale: 0,
        duration: 180 + i * 30,
        onComplete: () => spark.destroy(),
      });
    }
  }

  private performRanged(): void {
    this.rangedCooldownTimer = RANGED_COOLDOWN;
    this.state = 'ranged';
    this.sfx.rangedShoot();
    const facingRight = this.facing === 'right';
    const offsetX = facingRight ? 20 : -20;
    const projectile = new StarProjectile(this.scene, this.x + offsetX, this.y, facingRight);
    this.projectiles.add(projectile);
  }

  takeDamage(amount: number, sourceX: number): void {
    if (this.invulnerable || this.dead) return;

    const damage = Math.max(1, amount - this.stats.defense);
    this.stats.hp = Math.max(0, this.stats.hp - damage);
    this.invulnerable = true;

    // Knockback
    CombatSystem.applyKnockback(this, sourceX);

    // Flash invulnerability
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: Math.floor(INVULNERABILITY_DURATION / 200),
      onComplete: () => {
        this.invulnerable = false;
        this.setAlpha(1);
      },
    });

    if (this.stats.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.dead = true;
    this.setTint(0xff0000);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.scene.time.delayedCall(500, () => {
      this.scene.events.emit('player-death');
    });
  }

  revive(): void {
    this.dead = false;
    this.invulnerable = false;
    this.clearTint();
    this.setAlpha(1);
  }

  isDead(): boolean {
    return this.dead;
  }

  getState(): PlayerState {
    return this.state;
  }
}

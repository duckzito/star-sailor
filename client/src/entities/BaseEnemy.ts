import Phaser from 'phaser';
import type { EnemyConfig, LootEntry } from '@shared/types';
import { StateMachine } from '../systems/StateMachine';
import { ItemDrop } from './ItemDrop';

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  config: EnemyConfig;
  hp: number;
  isElite = false;
  protected fsm: StateMachine;
  protected patrolPath: { x: number; y: number }[];
  protected patrolIndex = 0;
  protected patrolDirection = 1;
  protected target: Phaser.Physics.Arcade.Sprite | null = null;
  protected attackCooldown = 0;
  protected isHurt = false;
  private itemDropGroup: Phaser.Physics.Arcade.Group | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: EnemyConfig,
    patrolPath?: { x: number; y: number }[],
  ) {
    super(scene, x, y, '__MISSING');
    this.config = config;
    this.hp = config.hp;
    this.patrolPath = patrolPath ?? [
      { x: x - 100, y },
      { x: x + 100, y },
    ];

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.createTexture();
    this.setSize(24, 24);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    this.fsm = new StateMachine();
    this.setupStates();
    this.fsm.transition('patrol');
  }

  protected abstract createTexture(): void;

  getAttackDamage(): number {
    return this.config.attack;
  }

  setItemDropGroup(group: Phaser.Physics.Arcade.Group): void {
    this.itemDropGroup = group;
  }

  protected setupStates(): void {
    this.fsm
      .addState('patrol', {
        update: (delta) => this.updatePatrol(delta),
      })
      .addState('chase', {
        update: (delta) => this.updateChase(delta),
      })
      .addState('attack', {
        enter: () => this.startAttack(),
        update: (delta) => this.updateAttack(delta),
      })
      .addState('hurt', {
        enter: () => this.startHurt(),
      })
      .addState('die', {
        enter: () => this.startDie(),
      });
  }

  setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
  }

  update(time: number, delta: number): void {
    if (!this.active) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.fsm.update(delta);

    // Check for target proximity
    if (this.target && this.fsm.getCurrentState() === 'patrol') {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (dist < this.config.detectionRange) {
        this.fsm.transition('chase');
      }
    }
  }

  protected updatePatrol(_delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const target = this.patrolPath[this.patrolIndex];
    const dx = target.x - this.x;

    if (Math.abs(dx) < 5) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
    } else {
      body.setVelocityX(Math.sign(dx) * this.config.speed);
      this.setFlipX(dx < 0);
    }
  }

  protected updateChase(_delta: number): void {
    if (!this.target) {
      this.fsm.transition('patrol');
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    if (dist > this.config.detectionRange * 1.5) {
      this.fsm.transition('patrol');
      return;
    }

    if (dist < this.config.attackRange && this.attackCooldown <= 0) {
      this.fsm.transition('attack');
      return;
    }

    const dx = this.target.x - this.x;
    body.setVelocityX(Math.sign(dx) * this.config.speed * 1.3);
    this.setFlipX(dx < 0);
  }

  protected startAttack(): void {
    this.attackCooldown = 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    this.setTint(0xff6666);
    this.scene.time.delayedCall(300, () => {
      this.clearTint();
      if (this.active) this.fsm.transition('chase');
    });
  }

  protected updateAttack(_delta: number): void {
    // Override in subclass for custom attack behavior
  }

  takeDamage(amount: number, sourceX: number): void {
    if (this.isHurt || !this.active) return;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.fsm.transition('die');
    } else {
      this.fsm.transition('hurt');
      // Knockback
      const dir = this.x > sourceX ? 1 : -1;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(150 * dir, -100);
    }
  }

  protected startHurt(): void {
    this.isHurt = true;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(300, () => {
      this.isHurt = false;
      this.clearTint();
      if (this.active && this.hp > 0) {
        this.fsm.transition('patrol');
      }
    });
  }

  protected startDie(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    // Drop loot
    this.dropLoot();

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 400,
      onComplete: () => this.destroy(),
    });
  }

  protected dropLoot(): void {
    for (const entry of this.config.lootTable) {
      if (Math.random() < entry.dropRate) {
        const drop = new ItemDrop(this.scene, this.x, this.y - 10, entry.itemId);
        this.itemDropGroup?.add(drop);
      }
    }
  }
}

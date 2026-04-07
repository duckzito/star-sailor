import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '@shared/constants';
import { InputManager } from '../systems/InputManager';
import { StarSailor } from '../entities/StarSailor';
import { BaseEnemy } from '../entities/BaseEnemy';
import { MoonCrawler } from '../entities/enemies/MoonCrawler';
import { DustSprite } from '../entities/enemies/DustSprite';
import { ItemDrop } from '../entities/ItemDrop';
import { CombatSystem } from '../systems/CombatSystem';

export class TestScene extends Phaser.Scene {
  private player!: StarSailor;
  private inputManager!: InputManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private itemDropGroup!: Phaser.Physics.Arcade.Group;
  private stateText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private collectedItems: string[] = [];

  constructor() {
    super({ key: 'TestScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a2e');
    this.addStarfield();

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.createPlatforms();

    // Groups
    this.enemyGroup = this.physics.add.group();
    this.itemDropGroup = this.physics.add.group();

    // Input
    this.inputManager = new InputManager(this);

    // Player
    this.player = new StarSailor(this, 200, 500, this.inputManager);
    this.physics.add.collider(this.player, this.platforms);

    // Enemies
    this.spawnEnemies();

    // Combat collisions
    this.setupCombat();

    // Player death handler
    this.events.on('player-death', () => this.handlePlayerDeath());

    // Debug UI
    this.stateText = this.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    this.hpText = this.add.text(10, 36, '', {
      fontSize: '16px',
      color: '#ff4444',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    this.inventoryText = this.add.text(10, 62, '', {
      fontSize: '14px',
      color: '#44ff44',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    this.add.text(10, GAME_HEIGHT - 80, [
      'Controls:',
      'Arrow/WASD: Move | Space/Up: Jump | Shift: Dash',
      'Z: Melee | X: Ranged',
    ].join('\n'), {
      fontSize: '14px',
      color: '#aaaaaa',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
    this.physics.world.setBounds(0, 0, GAME_WIDTH * 2, GAME_HEIGHT);
  }

  private spawnEnemies(): void {
    const groundY = GAME_HEIGHT - TILE_SIZE - 16;

    const enemies: BaseEnemy[] = [
      new MoonCrawler(this, 500, groundY),
      new MoonCrawler(this, 900, groundY),
      new MoonCrawler(this, 1400, groundY),
      new DustSprite(this, 400, 380),
      new DustSprite(this, 700, 300),
      new DustSprite(this, 1100, 350),
    ];

    for (const enemy of enemies) {
      enemy.setTarget(this.player);
      enemy.setItemDropGroup(this.itemDropGroup);
      this.enemyGroup.add(enemy);
      this.physics.add.collider(enemy, this.platforms);
    }
  }

  private setupCombat(): void {
    // Melee hitboxes hit enemies (proper overlap between hitbox group and enemy group)
    this.physics.add.overlap(
      this.player.meleeHitboxGroup,
      this.enemyGroup,
      (_hitboxObj, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        const damage = CombatSystem.getMeleeDamage(this.player.stats);
        enemy.takeDamage(damage, this.player.x);
      },
    );

    // Ranged projectiles hit enemies
    this.physics.add.overlap(
      this.player.projectiles,
      this.enemyGroup,
      (projectileObj, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        const damage = CombatSystem.getRangedDamage(this.player.stats);
        enemy.takeDamage(damage, (projectileObj as Phaser.Physics.Arcade.Sprite).x);
        (projectileObj as Phaser.Physics.Arcade.Sprite).destroy();
      },
    );

    // Enemy body contact damages player
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        if (enemy.active && enemy.hp > 0) {
          this.player.takeDamage(enemy.getAttackDamage(), enemy.x);
        }
      },
    );

    // Player collects item drops
    this.physics.add.overlap(
      this.player,
      this.itemDropGroup,
      (_playerObj, itemObj) => {
        const item = itemObj as ItemDrop;
        if (item.active) {
          this.collectedItems.push(item.itemId);
          item.collect();
        }
      },
    );
  }

  private handlePlayerDeath(): void {
    // For now, respawn at start after a brief delay
    this.player.setTint(0xff0000);
    this.time.delayedCall(1000, () => {
      this.player.clearTint();
      this.player.setPosition(200, 500);
      this.player.stats.hp = this.player.stats.maxHp;
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    });
  }

  private createPlatforms(): void {
    for (let x = 0; x < GAME_WIDTH * 2; x += TILE_SIZE) {
      this.addPlatformBlock(x, GAME_HEIGHT - TILE_SIZE);
    }
    this.addPlatformRow(300, 520, 4);
    this.addPlatformRow(550, 420, 3);
    this.addPlatformRow(200, 320, 5);
    this.addPlatformRow(800, 480, 3);
    this.addPlatformRow(1000, 380, 4);
    this.addPlatformRow(1300, 300, 3);
    this.addWall(750, 420, 6);
    this.addWall(1200, 350, 8);
  }

  private addPlatformBlock(x: number, y: number): void {
    const block = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x4444aa);
    this.platforms.add(block);
  }

  private addPlatformRow(startX: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.addPlatformBlock(startX + i * TILE_SIZE, y);
    }
  }

  private addWall(x: number, startY: number, height: number): void {
    for (let i = 0; i < height; i++) {
      this.addPlatformBlock(x, startY + i * TILE_SIZE);
    }
  }

  private addStarfield(): void {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH * 2);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, 0.5);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    const enemies = this.enemyGroup.getChildren() as BaseEnemy[];
    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.update(time, delta);
      }
    }

    this.stateText.setText(`State: ${this.player.getState()} | Facing: ${this.player.facing} | Enemies: ${enemies.filter(e => e.active).length}`);
    this.hpText.setText(`HP: ${this.player.stats.hp}/${this.player.stats.maxHp}`);
    this.inventoryText.setText(`Items: ${this.collectedItems.length > 0 ? this.collectedItems.join(', ') : 'none'}`);
  }
}

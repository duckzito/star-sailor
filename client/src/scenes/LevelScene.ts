import Phaser from 'phaser';
import { GAME_HEIGHT, PLAYER_LIVES } from '@shared/constants';
import { LEVEL_CONFIGS } from '@shared/level-configs';
import type { LevelConfig, LoadoutSlots } from '@shared/types';
import { InputManager } from '../systems/InputManager';
import { StarSailor } from '../entities/StarSailor';
import { BaseEnemy } from '../entities/BaseEnemy';
import { CombatSystem } from '../systems/CombatSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { LevelLoader } from '../systems/LevelLoader';
import { CameraSystem } from '../systems/CameraSystem';
import { ParticleEffects } from '../systems/ParticleEffects';
import { ItemDrop } from '../entities/ItemDrop';
import { StarProjectile } from '../entities/StarProjectile';
import { HUD } from '../ui/HUD';
import { DamageNumbers } from '../ui/DamageNumbers';
import { PauseMenu } from '../ui/PauseMenu';
import { SoundFX } from '../systems/SoundFX';

export class LevelScene extends Phaser.Scene {
  private player!: StarSailor;
  private inputManager!: InputManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private itemDropGroup!: Phaser.Physics.Arcade.Group;
  private checkpointGroup!: Phaser.Physics.Arcade.StaticGroup;
  private levelConfig!: LevelConfig;
  private levelIndex = 0;
  private lives = PLAYER_LIVES;
  private lastCheckpoint = { x: 200, y: 500 };
  private loadout: LoadoutSlots = { weapon: null, armor: null, accessory: null, consumables: [null, null] };
  private unlockedLevels: number[] = [0];
  private inventory: string[] = [];
  private collectedItems: string[] = [];
  private elitesDefeated = 0;
  private totalElites = 0;
  private bossGateOpen = false;
  private transitioning = false;

  // Systems
  private cameraSystem!: CameraSystem;
  private particles!: ParticleEffects;
  private hud!: HUD;
  private damageNumbers!: DamageNumbers;
  private pauseMenu!: PauseMenu;
  private sfx!: SoundFX;

  constructor() {
    super({ key: 'LevelScene' });
  }

  init(data: {
    levelIndex?: number;
    loadout?: LoadoutSlots;
    unlockedLevels?: number[];
    inventory?: string[];
  }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.loadout = data.loadout ?? this.loadout;
    this.unlockedLevels = data.unlockedLevels ?? [0];
    this.inventory = data.inventory ?? [];
    this.levelConfig = LEVEL_CONFIGS[this.levelIndex];
    this.lives = PLAYER_LIVES;
    this.collectedItems = [];
    this.elitesDefeated = 0;
    this.bossGateOpen = false;
    this.transitioning = false;
    this.totalElites = this.levelConfig.enemies.filter((e) => e.isElite).length;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.getThemeBgColor());
    const levelWidth = LevelLoader.getLevelWidth(this.levelConfig);
    LevelLoader.addThemedBackground(this, this.levelConfig.theme, levelWidth);

    // Systems
    this.cameraSystem = new CameraSystem(this);
    this.particles = new ParticleEffects(this);
    this.damageNumbers = new DamageNumbers(this);
    this.sfx = new SoundFX(this);

    // Groups
    this.enemyGroup = this.physics.add.group();
    this.itemDropGroup = this.physics.add.group();

    // Platforms
    this.platforms = LevelLoader.createProceduralLevel(this, this.levelConfig);

    // Checkpoints
    this.checkpointGroup = LevelLoader.createCheckpoints(this, this.levelConfig.checkpoints);
    this.lastCheckpoint = { ...this.levelConfig.checkpoints[0] };

    // Input & Player
    this.inputManager = new InputManager(this, () => this.pauseMenu?.toggle());
    this.player = new StarSailor(this, this.lastCheckpoint.x, this.lastCheckpoint.y, this.inputManager);
    const stats = EquipmentSystem.applyLoadout(EquipmentSystem.getBaseStats(), this.loadout);
    this.player.stats = stats;
    this.physics.add.collider(this.player, this.platforms);

    // Spawn enemies & items
    LevelLoader.spawnEnemies(this, this.levelConfig.enemies, this.enemyGroup, this.player, this.itemDropGroup, this.platforms);
    LevelLoader.spawnItems(this, this.levelConfig.items, this.itemDropGroup);

    // Combat
    this.setupCombat();

    // Checkpoints
    this.physics.add.overlap(this.player, this.checkpointGroup, (_player, checkpoint) => {
      const cp = checkpoint as Phaser.GameObjects.Rectangle;
      if (cp.fillColor !== 0xffd700) {
        cp.setFillStyle(0xffd700, 0.8);
        this.lastCheckpoint = { x: cp.x, y: cp.y + 16 };
        this.particles.itemSparkle(cp.x, cp.y);
        this.sfx.checkpoint();
      }
    });

    // Boss gate
    const bossGate = this.add.rectangle(levelWidth - 100, GAME_HEIGHT - 96, 32, 64, 0xff4444, 0.6);
    this.physics.add.existing(bossGate, true);
    this.physics.add.overlap(this.player, bossGate, () => {
      if (this.bossGateOpen) this.startBossFight();
    });

    // Events
    this.events.on('player-death', () => this.handleDeath());
    this.events.on('enemy-defeated', (enemy: BaseEnemy) => {
      this.particles.deathPoof(enemy.x, enemy.y, 0xcc4444);
      if (enemy.isElite) {
        this.elitesDefeated++;
        if (this.elitesDefeated >= this.totalElites) {
          this.bossGateOpen = true;
          bossGate.setFillStyle(0x44ff44, 0.8);
          this.cameraSystem.flash(300, 100, 255, 100);
        }
      }
    });

    // Cleanup on scene shutdown
    this.events.on('shutdown', () => {
      this.hud.destroy();
      this.pauseMenu.destroy();
      this.inputManager.destroy();
      this.events.off('player-death');
      this.events.off('enemy-defeated');
    });

    // HUD
    this.hud = new HUD(this);
    this.hud.setLevelName(this.levelConfig.name);
    this.hud.setLoadout(this.loadout);

    // Pause menu (ESC / P)
    this.pauseMenu = new PauseMenu(
      this,
      () => {},
      () => {
        this.scene.start('LevelSelectScene');
      },
    );

    // Camera
    this.cameraSystem.follow(this.player, levelWidth);
    this.physics.world.setBounds(0, 0, levelWidth, GAME_HEIGHT);
  }

  private setupCombat(): void {
    // Melee hits enemies — with hit freeze for impact feel
    this.physics.add.overlap(
      this.player.meleeHitboxGroup,
      this.enemyGroup,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        const damage = CombatSystem.getMeleeDamage(this.player.stats);
        enemy.takeDamage(damage, this.player.x);
        this.damageNumbers.show(enemy.x, enemy.y, damage);
        this.particles.hitSpark(enemy.x, enemy.y);
        this.cameraSystem.shake(60, 0.004);
        this.sfx.hit();

        // Hit freeze — brief pause for impact (hitstop)
        this.time.timeScale = 0.15;
        this.time.delayedCall(30, () => { this.time.timeScale = 1; });

        if (enemy.hp <= 0) { this.sfx.enemyDeath(); this.events.emit('enemy-defeated', enemy); }
      },
    );

    // Ranged hits enemies
    this.physics.add.overlap(
      this.player.projectiles,
      this.enemyGroup,
      (a, b) => {
        const proj = a instanceof StarProjectile ? a : b as Phaser.Physics.Arcade.Sprite;
        const enemy = (a instanceof StarProjectile ? b : a) as BaseEnemy;
        const damage = CombatSystem.getRangedDamage(this.player.stats);
        enemy.takeDamage(damage, proj.x);
        if ((proj as StarProjectile).destroyWithEffect) {
          (proj as StarProjectile).destroyWithEffect();
        } else {
          proj.destroy();
        }
        this.damageNumbers.show(enemy.x, enemy.y, damage);
        this.particles.hitSpark(enemy.x, enemy.y);
        this.sfx.hit();
        if (enemy.hp <= 0) { this.sfx.enemyDeath(); this.events.emit('enemy-defeated', enemy); }
      },
    );

    // Enemy contact damages player
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_player, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        if (enemy.active && enemy.hp > 0) {
          const dmg = enemy.getAttackDamage();
          const hpBefore = this.player.stats.hp;
          this.player.takeDamage(dmg, enemy.x);
          if (this.player.stats.hp < hpBefore) {
            this.damageNumbers.show(this.player.x, this.player.y, hpBefore - this.player.stats.hp);
            this.cameraSystem.shake(100, 0.005);
            this.sfx.playerHurt();
          }
        }
      },
    );

    // Item collection
    this.physics.add.overlap(
      this.player,
      this.itemDropGroup,
      (_player, itemObj) => {
        const item = itemObj as ItemDrop;
        if (item.active) {
          this.collectedItems.push(item.itemId);
          this.particles.itemSparkle(item.x, item.y);
          this.sfx.itemCollect();
          item.collect();
        }
      },
    );
  }

  private handleDeath(): void {
    if (this.transitioning) return;
    this.lives--;
    this.cameraSystem.shake(300, 0.02);
    this.particles.deathPoof(this.player.x, this.player.y, 0x6644cc);

    if (this.lives <= 0) {
      this.transitioning = true;
      this.time.delayedCall(1500, () => {
        this.scene.start('LevelSelectScene', {
          unlockedLevels: this.unlockedLevels,
          inventory: this.inventory,
        });
      });
    } else {
      this.time.delayedCall(1000, () => {
        this.player.revive();
        this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
        this.player.stats.hp = this.player.stats.maxHp;
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      });
    }
  }

  private startBossFight(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameraSystem.flash(500, 255, 255, 255);
    this.time.delayedCall(300, () => {
      this.scene.start('BossScene', {
        levelIndex: this.levelIndex,
        loadout: this.loadout,
        unlockedLevels: this.unlockedLevels,
        inventory: this.inventory,
        collectedItems: this.collectedItems,
        playerStats: this.player.stats,
      });
    });
  }

  private getThemeBgColor(): string {
    switch (this.levelConfig.theme) {
      case 'lunar': return '#0a0a2e';
      case 'asteroid': return '#1a0a0a';
      case 'nebula': return '#0a1a0a';
      case 'station': return '#0a0a1a';
      case 'darkstar': return '#0a0010';
      default: return '#0a0a1a';
    }
  }


  update(time: number, delta: number): void {
    if (this.pauseMenu.isPaused()) return;

    this.player.update(time, delta);

    const enemies = this.enemyGroup.getChildren() as BaseEnemy[];
    for (const enemy of enemies) {
      if (enemy.active) enemy.update(time, delta);
    }

    // HUD update
    this.hud.update(this.player.stats, this.lives);
    this.hud.setGateStatus(this.bossGateOpen, this.elitesDefeated, this.totalElites);
  }
}

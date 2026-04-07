import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '@shared/constants';
import { LEVEL_CONFIGS } from '@shared/level-configs';
import type { BossConfig, LoadoutSlots, PlayerStats } from '@shared/types';
import { InputManager } from '../systems/InputManager';
import { StarSailor } from '../entities/StarSailor';
import { CombatSystem } from '../systems/CombatSystem';
import { BaseBoss } from '../entities/BaseBoss';
import { StarProjectile } from '../entities/StarProjectile';
import { BossHealthBar } from '../ui/BossHealthBar';
import { PauseMenu } from '../ui/PauseMenu';
import { SoundFX } from '../systems/SoundFX';
import { CraterTitan } from '../entities/bosses/CraterTitan';
import { AsteroidColossus } from '../entities/bosses/AsteroidColossus';
import { NebulaHydra } from '../entities/bosses/NebulaHydra';
import { RogueAICore } from '../entities/bosses/RogueAICore';
import { DarkStarEmperor } from '../entities/bosses/DarkStarEmperor';

const BOSS_FACTORY: Record<string, new (scene: Phaser.Scene, x: number, y: number) => BaseBoss> = {
  crater_titan: CraterTitan,
  asteroid_colossus: AsteroidColossus,
  nebula_hydra: NebulaHydra,
  rogue_ai_core: RogueAICore,
  dark_star_emperor: DarkStarEmperor,
};

export class BossScene extends Phaser.Scene {
  private player!: StarSailor;
  private inputManager!: InputManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private boss!: BaseBoss;
  private bossConfig!: BossConfig;
  private levelIndex = 0;
  private loadout: LoadoutSlots = { weapon: null, armor: null, accessory: null, consumables: [null, null] };
  private unlockedLevels: number[] = [0];
  private inventory: string[] = [];
  private collectedItems: string[] = [];

  // HUD
  private playerHpText!: Phaser.GameObjects.Text;
  private bossHealthBar!: BossHealthBar;
  private pauseMenu!: PauseMenu;
  private sfx!: SoundFX;

  constructor() {
    super({ key: 'BossScene' });
  }

  init(data: {
    levelIndex?: number;
    loadout?: LoadoutSlots;
    unlockedLevels?: number[];
    inventory?: string[];
    collectedItems?: string[];
    playerStats?: PlayerStats;
  }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.loadout = data.loadout ?? this.loadout;
    this.unlockedLevels = data.unlockedLevels ?? [0];
    this.inventory = data.inventory ?? [];
    this.collectedItems = data.collectedItems ?? [];

    const levelConfig = LEVEL_CONFIGS[this.levelIndex];
    this.bossConfig = levelConfig.boss;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0010');
    this.sfx = new SoundFX(this);

    // Boss arena — flat with walls
    this.platforms = this.physics.add.staticGroup();
    this.createArena();

    // Player
    this.inputManager = new InputManager(this, () => this.pauseMenu?.toggle());
    this.player = new StarSailor(this, 200, GAME_HEIGHT - 100, this.inputManager);
    this.physics.add.collider(this.player, this.platforms);

    // Boss
    this.boss = this.createBoss();
    this.physics.add.collider(this.boss, this.platforms);

    // Combat
    this.setupCombat();

    // Events
    this.events.on('player-death', () => {
      this.time.delayedCall(1500, () => {
        this.scene.start('LevelSelectScene', { unlockedLevels: this.unlockedLevels, inventory: this.inventory });
      });
    });

    this.events.on('boss-defeated', (config: BossConfig) => {
      this.sfx.bossDefeat();
      this.collectedItems.push(config.uniqueDrop);
      this.time.delayedCall(500, () => {
        this.scene.start('VictoryScene', {
          levelIndex: this.levelIndex,
          collectedItems: this.collectedItems,
          loadout: this.loadout,
          unlockedLevels: this.unlockedLevels,
          inventory: this.inventory,
          bossName: config.name,
        });
      });
    });

    // Cleanup on shutdown
    this.events.on('shutdown', () => {
      this.bossHealthBar.destroy();
      this.pauseMenu.destroy();
      this.inputManager.destroy();
      this.events.off('player-death');
      this.events.off('boss-defeated');
    });

    // HUD
    this.createHUD();
    this.showBossIntro();

    // Pause menu (ESC / P)
    this.pauseMenu = new PauseMenu(
      this,
      () => {},
      () => {
        this.scene.start('LevelSelectScene', { unlockedLevels: this.unlockedLevels, inventory: this.inventory });
      },
    );
  }

  private createArena(): void {
    const arenaWidth = GAME_WIDTH;
    // Floor
    for (let x = 0; x < arenaWidth; x += TILE_SIZE) {
      const block = this.add.rectangle(x + TILE_SIZE / 2, GAME_HEIGHT - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x332244);
      this.platforms.add(block);
    }
    // Walls
    for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
      this.platforms.add(this.add.rectangle(TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x332244));
      this.platforms.add(this.add.rectangle(arenaWidth - TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x332244));
    }
    // Mid platforms
    for (let i = 0; i < 3; i++) {
      this.platforms.add(this.add.rectangle(300 + i * TILE_SIZE, GAME_HEIGHT - 150, TILE_SIZE, TILE_SIZE, 0x443366));
      this.platforms.add(this.add.rectangle(GAME_WIDTH - 300 + i * TILE_SIZE, GAME_HEIGHT - 150, TILE_SIZE, TILE_SIZE, 0x443366));
    }
  }

  private createBoss(): BaseBoss {
    const BossClass = BOSS_FACTORY[this.bossConfig.id];
    if (BossClass) {
      const boss = new BossClass(this, GAME_WIDTH - 200, GAME_HEIGHT - 100);
      boss.setTarget(this.player);
      return boss;
    }

    // Fallback: generic boss using CraterTitan as placeholder
    console.warn(`No boss class for "${this.bossConfig.id}", using CraterTitan placeholder`);
    const boss = new CraterTitan(this, GAME_WIDTH - 200, GAME_HEIGHT - 100);
    boss.setTarget(this.player);
    return boss;
  }

  private setupCombat(): void {
    // Melee hits boss — with hit freeze and screen shake
    this.physics.add.overlap(
      this.player.meleeHitboxGroup,
      this.boss,
      () => {
        const damage = CombatSystem.getMeleeDamage(this.player.stats);
        this.boss.takeDamage(damage);
        this.cameras.main.shake(60, 0.005);
        this.sfx.bossHit();
        this.time.timeScale = 0.15;
        this.time.delayedCall(30, () => { this.time.timeScale = 1; });
      },
    );

    // Ranged hits boss
    this.physics.add.overlap(
      this.player.projectiles,
      this.boss,
      (a, b) => {
        const damage = CombatSystem.getRangedDamage(this.player.stats);
        this.boss.takeDamage(damage);
        // a could be the projectile or the boss depending on Phaser's internal ordering
        const proj = (a instanceof StarProjectile ? a : b) as StarProjectile;
        if (proj.destroyWithEffect) {
          proj.destroyWithEffect();
        } else {
          (proj as Phaser.Physics.Arcade.Sprite).destroy();
        }
      },
    );

    // Boss body contact damages player
    this.physics.add.overlap(
      this.player,
      this.boss,
      () => {
        if (this.boss.active) {
          this.player.takeDamage(20 + this.levelIndex * 8, this.boss.x);
        }
      },
    );

    // Boss projectiles hit player
    this.physics.add.overlap(
      this.player,
      this.boss.projectiles,
      (_player, proj) => {
        this.player.takeDamage(15 + this.levelIndex * 7, (proj as Phaser.Physics.Arcade.Sprite).x);
        (proj as Phaser.Physics.Arcade.Sprite).destroy();
      },
    );
  }

  private showBossIntro(): void {
    const introText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, this.bossConfig.name, {
      fontSize: '48px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: introText,
      alpha: { from: 0, to: 1 },
      y: GAME_HEIGHT / 2 - 120,
      duration: 1000,
      hold: 1500,
      yoyo: true,
      onComplete: () => introText.destroy(),
    });
  }

  private createHUD(): void {
    this.playerHpText = this.add.text(10, 10, '', {
      fontSize: '18px',
      color: '#ff4444',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0);

    this.bossHealthBar = new BossHealthBar(this, this.bossConfig.name);
  }

  update(time: number, delta: number): void {
    if (this.pauseMenu.isPaused()) return;

    this.player.update(time, delta);

    if (this.boss.active) {
      this.boss.update(time, delta);
    }

    // Update HUD
    this.playerHpText.setText(`HP: ${this.player.stats.hp}/${this.player.stats.maxHp}`);
    if (this.boss.active) {
      this.bossHealthBar.update(this.boss);
    }
  }
}

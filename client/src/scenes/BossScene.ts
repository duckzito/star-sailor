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
    const bgColors: Record<string, string> = {
      lunar: '#0a0a2e', asteroid: '#1a0a0a', nebula: '#0a1a0a', station: '#0a0a1a', darkstar: '#050008',
    };
    const levelConfig = LEVEL_CONFIGS[this.levelIndex];
    this.cameras.main.setBackgroundColor(bgColors[levelConfig.theme] ?? '#0a0010');
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
    const levelConfig = LEVEL_CONFIGS[this.levelIndex];
    const theme = levelConfig.theme;
    const arenaWidth = GAME_WIDTH;
    const T = TILE_SIZE;

    const themeColors: Record<string, { floor: number; wall: number; plat: number }> = {
      lunar: { floor: 0x555577, wall: 0x444466, plat: 0x6666aa },
      asteroid: { floor: 0x664422, wall: 0x553311, plat: 0x886633 },
      nebula: { floor: 0x226644, wall: 0x1a4433, plat: 0x338855 },
      station: { floor: 0x444466, wall: 0x333355, plat: 0x5555aa },
      darkstar: { floor: 0x332244, wall: 0x221133, plat: 0x443366 },
    };
    const c = themeColors[theme] ?? themeColors.darkstar;

    // Floor
    for (let x = 0; x < arenaWidth; x += T) {
      this.platforms.add(this.add.rectangle(x + T / 2, GAME_HEIGHT - T / 2, T, T, c.floor));
    }
    // Walls
    for (let y = 0; y < GAME_HEIGHT; y += T) {
      this.platforms.add(this.add.rectangle(T / 2, y + T / 2, T, T, c.wall));
      this.platforms.add(this.add.rectangle(arenaWidth - T / 2, y + T / 2, T, T, c.wall));
    }
    // Mid platforms
    for (let i = 0; i < 3; i++) {
      this.platforms.add(this.add.rectangle(280 + i * T, GAME_HEIGHT - 160, T, T, c.plat));
      this.platforms.add(this.add.rectangle(arenaWidth - 280 + i * T, GAME_HEIGHT - 160, T, T, c.plat));
    }
    // Higher platform in center
    for (let i = 0; i < 4; i++) {
      this.platforms.add(this.add.rectangle(arenaWidth / 2 - 64 + i * T, GAME_HEIGHT - 280, T, T, c.plat));
    }

    // Theme-specific arena decorations
    this.decorateArena(theme, c);
  }

  private decorateArena(theme: string, c: { floor: number; wall: number; plat: number }): void {
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;

    switch (theme) {
      case 'lunar': {
        // Craters on floor
        for (const cx of [300, 640, 980]) {
          this.add.ellipse(cx, H - 10, 60, 14, 0x3a3a5a, 0.5).setDepth(-1);
        }
        // Earth in sky
        this.add.circle(W * 0.8, 80, 40, 0x4488cc, 0.4).setDepth(-2);
        break;
      }
      case 'asteroid': {
        // Lava cracks
        for (const lx of [200, 500, 800, 1100]) {
          const crack = this.add.rectangle(lx, H - 14, Phaser.Math.Between(30, 60), 3, 0xff4400, 0.7);
          crack.setDepth(-1);
          this.tweens.add({ targets: crack, alpha: { from: 0.3, to: 0.9 }, duration: 700, yoyo: true, repeat: -1 });
        }
        // Floating rocks
        for (let i = 0; i < 8; i++) {
          const r = Phaser.Math.Between(6, 15);
          this.add.circle(Phaser.Math.Between(50, W - 50), Phaser.Math.Between(40, 300), r, 0x664433, 0.3).setDepth(-2);
        }
        break;
      }
      case 'nebula': {
        // Bioluminescent mushrooms
        for (let i = 0; i < 12; i++) {
          const mx = Phaser.Math.Between(60, W - 60);
          const shroom = this.add.circle(mx, H - 28, Phaser.Math.Between(3, 5), Phaser.Utils.Array.GetRandom([0x44ffaa, 0x88ff44]), 0.6);
          shroom.setDepth(-1);
          this.tweens.add({ targets: shroom, alpha: { from: 0.3, to: 0.8 }, duration: Phaser.Math.Between(1000, 2000), yoyo: true, repeat: -1 });
        }
        // Hanging vines from walls
        for (let y = 100; y < H - 200; y += 80) {
          for (const wx of [TILE_SIZE + 4, W - TILE_SIZE - 4]) {
            const vine = this.add.rectangle(wx, y, 3, Phaser.Math.Between(25, 50), 0x44aa66, 0.4);
            vine.setDepth(-1);
            this.tweens.add({ targets: vine, angle: { from: -3, to: 3 }, duration: 1500, yoyo: true, repeat: -1 });
          }
        }
        // Spore particles
        for (let i = 0; i < 15; i++) {
          const sx = Phaser.Math.Between(50, W - 50);
          const sy = Phaser.Math.Between(100, H - 100);
          const spore = this.add.circle(sx, sy, 2, 0x88ffaa, 0.3);
          spore.setDepth(-1);
          this.tweens.add({ targets: spore, y: sy - 60, alpha: 0, duration: Phaser.Math.Between(3000, 5000), repeat: -1 });
        }
        break;
      }
      case 'station': {
        // Warning lights
        for (const lx of [200, 450, 830, 1080]) {
          const light = this.add.circle(lx, H - 50, 3, 0xff4444, 0.8);
          light.setDepth(-1);
          this.tweens.add({ targets: light, alpha: { from: 0.2, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
        }
        // Grate lines
        for (let x = TILE_SIZE; x < W - TILE_SIZE; x += 64) {
          this.add.rectangle(x + 32, H - TILE_SIZE - 2, 56, 2, 0x555588, 0.3).setDepth(-1);
        }
        // Screens
        for (const sx of [200, 640, 1080]) {
          this.add.rectangle(sx, 100, 36, 26, 0x224488, 0.5).setDepth(-1);
          const scr = this.add.rectangle(sx, 100, 32, 22, 0x44aaff, 0.2).setDepth(-1);
          this.tweens.add({ targets: scr, alpha: { from: 0.15, to: 0.4 }, duration: 3000, yoyo: true, repeat: -1 });
        }
        break;
      }
      case 'darkstar': {
        // Void cracks
        for (const vx of [250, 640, 1030]) {
          const crack = this.add.rectangle(vx, H - 14, 3, TILE_SIZE, 0xaa44ff, 0.5);
          crack.setDepth(-1);
          this.tweens.add({ targets: crack, alpha: { from: 0.2, to: 0.7 }, duration: 500, yoyo: true, repeat: -1 });
          this.add.rectangle(vx, H - 14, 18, TILE_SIZE + 4, 0x6622aa, 0.1).setDepth(-2);
        }
        // Floating ruin fragments
        for (let i = 0; i < 10; i++) {
          const fx = Phaser.Math.Between(60, W - 60);
          const fy = Phaser.Math.Between(80, 400);
          const frag = this.add.rectangle(fx, fy, Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10), 0x443366, 0.3);
          frag.setAngle(Phaser.Math.Between(0, 45)).setDepth(-1);
          this.tweens.add({ targets: frag, y: fy + 8, angle: frag.angle + 15, duration: 3000, yoyo: true, repeat: -1 });
        }
        // Dark energy pillar glow at center
        const pillar = this.add.rectangle(W / 2, H / 2, 8, H, 0x8844cc, 0.06);
        pillar.setDepth(-3);
        this.tweens.add({ targets: pillar, alpha: { from: 0.03, to: 0.08 }, duration: 2000, yoyo: true, repeat: -1 });
        break;
      }
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

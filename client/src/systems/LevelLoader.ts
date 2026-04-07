import Phaser from 'phaser';
import type { LevelConfig, EnemySpawn, ItemSpawn, Vector2 } from '@shared/types';
import { GAME_HEIGHT, TILE_SIZE } from '@shared/constants';
import { BaseEnemy } from '../entities/BaseEnemy';
import { MoonCrawler } from '../entities/enemies/MoonCrawler';
import { DustSprite } from '../entities/enemies/DustSprite';
import { RockHornet } from '../entities/enemies/RockHornet';
import { MagmaSlug } from '../entities/enemies/MagmaSlug';
import { SporeWisp } from '../entities/enemies/SporeWisp';
import { VineStalker } from '../entities/enemies/VineStalker';
import { SecurityDrone } from '../entities/enemies/SecurityDrone';
import { LaserTurret } from '../entities/enemies/LaserTurret';
import { ShadowCat } from '../entities/enemies/ShadowCat';
import { VoidWraith } from '../entities/enemies/VoidWraith';
import { ItemDrop } from '../entities/ItemDrop';

const ENEMY_FACTORY: Record<string, new (scene: Phaser.Scene, x: number, y: number) => BaseEnemy> = {
  moon_crawler: MoonCrawler,
  dust_sprite: DustSprite,
  rock_hornet: RockHornet,
  magma_slug: MagmaSlug,
  spore_wisp: SporeWisp,
  vine_stalker: VineStalker,
  security_drone: SecurityDrone,
  laser_turret: LaserTurret,
  shadow_cat: ShadowCat,
  void_wraith: VoidWraith,
};

const T = TILE_SIZE;
const GY = GAME_HEIGHT - T; // ground top-edge Y

export class LevelLoader {
  static spawnEnemies(
    scene: Phaser.Scene,
    spawns: EnemySpawn[],
    group: Phaser.Physics.Arcade.Group,
    target: Phaser.Physics.Arcade.Sprite,
    itemDropGroup: Phaser.Physics.Arcade.Group,
    platforms: Phaser.Physics.Arcade.StaticGroup,
  ): void {
    for (const spawn of spawns) {
      const EnemyClass = ENEMY_FACTORY[spawn.enemyId];
      if (!EnemyClass) { console.warn(`Unknown enemy type: ${spawn.enemyId}`); continue; }
      const enemy = new EnemyClass(scene, spawn.position.x, spawn.position.y);
      enemy.setTarget(target);
      enemy.setItemDropGroup(itemDropGroup);
      if (spawn.isElite) {
        enemy.isElite = true;
        enemy.hp = Math.round(enemy.hp * 1.5);
        enemy.setTint(0xff8800);
      }
      group.add(enemy);
      scene.physics.add.collider(enemy, platforms);
    }
  }

  static spawnItems(scene: Phaser.Scene, spawns: ItemSpawn[], group: Phaser.Physics.Arcade.Group): void {
    for (const spawn of spawns) {
      if (spawn.hidden) continue;
      const drop = new ItemDrop(scene, spawn.position.x, spawn.position.y, spawn.itemId);
      group.add(drop);
    }
  }

  static createCheckpoints(scene: Phaser.Scene, positions: Vector2[]): Phaser.Physics.Arcade.StaticGroup {
    const group = scene.physics.add.staticGroup();
    for (const pos of positions) {
      // Pole
      const pole = scene.add.rectangle(pos.x, pos.y - 24, 4, 48, 0x888888);
      scene.add.existing(pole);
      // Flag
      const flag = scene.add.triangle(pos.x + 10, pos.y - 40, 0, 0, 0, 16, 18, 8, 0x44ff44, 0.8);
      scene.add.existing(flag);
      scene.tweens.add({ targets: flag, scaleX: { from: 1, to: 0.85 }, duration: 600, yoyo: true, repeat: -1 });
      // Hitbox
      const hitbox = scene.add.rectangle(pos.x, pos.y - 16, 24, 48, 0x000000, 0);
      group.add(hitbox);
    }
    return group;
  }

  static getLevelWidth(_config: LevelConfig): number {
    return 3200;
  }

  // ========== MAIN LEVEL BUILDER ==========

  static createProceduralLevel(scene: Phaser.Scene, config: LevelConfig): Phaser.Physics.Arcade.StaticGroup {
    const platforms = scene.physics.add.staticGroup();
    switch (config.theme) {
      case 'lunar': LevelLoader.buildLunar(scene, platforms); break;
      case 'asteroid': LevelLoader.buildAsteroid(scene, platforms); break;
      case 'nebula': LevelLoader.buildNebula(scene, platforms); break;
      case 'station': LevelLoader.buildStation(scene, platforms); break;
      case 'darkstar': LevelLoader.buildDarkstar(scene, platforms); break;
      default: LevelLoader.buildLunar(scene, platforms); break;
    }
    return platforms;
  }

  // ========== THEMED BACKGROUNDS ==========

  static addThemedBackground(scene: Phaser.Scene, theme: string, levelWidth: number): void {
    switch (theme) {
      case 'lunar': LevelLoader.bgLunar(scene, levelWidth); break;
      case 'asteroid': LevelLoader.bgAsteroid(scene, levelWidth); break;
      case 'nebula': LevelLoader.bgNebula(scene, levelWidth); break;
      case 'station': LevelLoader.bgStation(scene, levelWidth); break;
      case 'darkstar': LevelLoader.bgDarkstar(scene, levelWidth); break;
    }
  }

  // ==========================================
  // LEVEL 1: LUNAR LANDING
  // Craters, uneven terrain, moon rocks, Earth in sky
  // ==========================================

  private static buildLunar(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup): void {
    const c1 = 0x555577; // ground
    const c2 = 0x6666aa; // platforms
    const c3 = 0x444466; // sub-ground

    // Uneven ground — craters and hills
    const groundProfile = [
      0, 0, 0, 0, -1, -2, -2, -1, 0, 0, 0, 0, 1, 1, 0, 0,   // flat start, small hill
      0, 0, 2, 3, 3, 2, 0, 0, -1, -1, 0, 0, 0, 0, -1, -2,    // crater dip, ridge
      -2, -1, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, -1, -2, -3,   // large crater
      -3, -2, -1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,     // recovery, flat
      0, 0, -1, -1, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0,      // small features
      0, 0, 0, 0, 0, -1, -2, -1, 0, 0, 0, 0, 0, 0, 0, 0,     // gentle dip
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,        // flat end
    ];
    this.buildGround(scene, platforms, groundProfile, c1, c3);

    // Floating rock platforms — stepped ascent
    const plats = [
      { x: 280, y: 520, w: 4 }, { x: 550, y: 440, w: 3 },
      { x: 850, y: 500, w: 5 }, { x: 1050, y: 380, w: 3 },
      { x: 1350, y: 460, w: 4 }, { x: 1600, y: 350, w: 3 },
      { x: 1900, y: 420, w: 5 }, { x: 2200, y: 340, w: 3 },
      { x: 2500, y: 480, w: 4 }, { x: 2750, y: 380, w: 3 },
    ];
    for (const p of plats) {
      this.addPlatform(scene, platforms, p.x, p.y, p.w, c2);
    }

    // Moon rock pillars
    this.addWall(scene, platforms, 750, 480, 5, c3);
    this.addWall(scene, platforms, 1500, 430, 6, c3);
    this.addWall(scene, platforms, 2400, 450, 5, c3);

    // Decorative craters (non-collidable)
    for (const cx of [400, 1000, 1800, 2600]) {
      const r = Phaser.Math.Between(30, 50);
      scene.add.ellipse(cx, GY + T / 2, r * 2, r * 0.6, 0x3a3a5a, 0.5).setDepth(-1);
      scene.add.ellipse(cx, GY + T / 2 - 2, r * 1.6, r * 0.35, 0x2a2a4a, 0.4).setDepth(-1);
    }
  }

  private static bgLunar(scene: Phaser.Scene, levelWidth: number): void {
    // Earth in the sky
    const earth = scene.add.circle(levelWidth * 0.7, 100, 60, 0x4488cc, 0.6);
    scene.add.circle(levelWidth * 0.7 - 15, 85, 55, 0x55aadd, 0.3); // atmosphere
    earth.setScrollFactor(0.1);

    // Distant mountains (parallax)
    const g = scene.add.graphics().setScrollFactor(0.3).setDepth(-5);
    g.fillStyle(0x222244, 0.6);
    for (let x = 0; x < levelWidth * 1.5; x += 200) {
      const h = Phaser.Math.Between(80, 180);
      g.fillTriangle(x, GAME_HEIGHT, x + 100, GAME_HEIGHT - h, x + 200, GAME_HEIGHT);
    }

    // Stars
    LevelLoader.scatterStars(scene, levelWidth, 120, [0xffffff, 0xccccff, 0xaaaaee]);
  }

  // ==========================================
  // LEVEL 2: ASTEROID BELT
  // Jagged terrain, lava cracks, floating rocks
  // ==========================================

  private static buildAsteroid(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup): void {
    const c1 = 0x664422;
    const c2 = 0x886633;
    const c3 = 0x553311;

    // Jagged uneven terrain
    const groundProfile = [
      0, 0, -1, -2, -1, 0, 1, 2, 3, 2, 0, -1, 0, 0, -1, -3,
      -2, 0, 1, 3, 4, 3, 1, 0, -2, -3, -2, 0, 0, 1, 2, 0,
      -1, -2, 0, 2, 3, 2, 0, -1, -3, -2, 0, 1, 0, -1, -2, 0,
      1, 2, 0, -1, 0, 0, 0, -2, -3, -1, 0, 2, 3, 1, 0, 0,
      -1, 0, 1, 3, 2, 0, -2, -1, 0, 0, 1, 2, 0, -1, 0, 0,
      0, -1, -2, 0, 1, 3, 2, 0, -1, -2, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    this.buildGround(scene, platforms, groundProfile, c1, c3);

    // Floating asteroid chunks
    const plats = [
      { x: 320, y: 480, w: 3 }, { x: 580, y: 380, w: 2 },
      { x: 800, y: 450, w: 4 }, { x: 1050, y: 350, w: 2 },
      { x: 1300, y: 420, w: 3 }, { x: 1550, y: 300, w: 3 },
      { x: 1800, y: 450, w: 4 }, { x: 2100, y: 360, w: 3 },
      { x: 2400, y: 430, w: 2 }, { x: 2650, y: 340, w: 3 },
      { x: 2900, y: 480, w: 4 },
    ];
    for (const p of plats) {
      this.addPlatform(scene, platforms, p.x, p.y, p.w, c2);
    }

    // Rock pillars and overhangs
    this.addWall(scene, platforms, 700, 440, 6, c3);
    this.addWall(scene, platforms, 1450, 400, 7, c3);
    this.addWall(scene, platforms, 2300, 420, 6, c3);

    // Lava cracks (decorative glow)
    for (const lx of [500, 1100, 1700, 2200, 2800]) {
      const w = Phaser.Math.Between(40, 80);
      const crack = scene.add.rectangle(lx, GY + T / 2, w, 4, 0xff4400, 0.8);
      crack.setDepth(-1);
      scene.tweens.add({ targets: crack, alpha: { from: 0.4, to: 0.9 }, duration: 800, yoyo: true, repeat: -1 });
      // Glow
      scene.add.rectangle(lx, GY + T / 2, w + 10, 12, 0xff2200, 0.15).setDepth(-2);
    }
  }

  private static bgAsteroid(scene: Phaser.Scene, levelWidth: number): void {
    // Floating asteroid debris (parallax)
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, levelWidth);
      const y = Phaser.Math.Between(30, 400);
      const r = Phaser.Math.Between(8, 30);
      const rock = scene.add.circle(x, y, r, Phaser.Utils.Array.GetRandom([0x553322, 0x664433, 0x775544]), 0.4);
      rock.setScrollFactor(Phaser.Math.FloatBetween(0.15, 0.4)).setDepth(-4);
    }
    // Distant lava planet
    scene.add.circle(200, 120, 80, 0xcc4400, 0.3).setScrollFactor(0.05).setDepth(-6);
    scene.add.circle(200, 120, 75, 0xff6600, 0.15).setScrollFactor(0.05).setDepth(-6);

    LevelLoader.scatterStars(scene, levelWidth, 80, [0xffffff, 0xffccaa, 0xff8866]);
  }

  // ==========================================
  // LEVEL 3: NEBULA FOREST
  // Overgrown alien jungle, vine-covered platforms, bioluminescent
  // ==========================================

  private static buildNebula(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup): void {
    const c1 = 0x226644;
    const c2 = 0x338855;
    const c3 = 0x1a4433;

    // Rolling organic terrain
    const groundProfile = [
      0, 0, 0, -1, -1, 0, 0, 0, -1, -2, -2, -1, 0, 0, 1, 1,
      0, 0, -1, -2, -3, -2, -1, 0, 0, 1, 2, 1, 0, -1, -1, 0,
      0, 0, 0, -1, -2, -1, 0, 1, 2, 3, 2, 1, 0, -1, 0, 0,
      0, 0, -1, 0, 0, 0, 1, 1, 0, -1, -2, -1, 0, 0, 0, 0,
      0, -1, -2, -1, 0, 1, 2, 2, 1, 0, 0, -1, -2, -1, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, -1, -1, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    this.buildGround(scene, platforms, groundProfile, c1, c3);

    // Vine-covered platforms (with hanging vine decorations)
    const plats = [
      { x: 260, y: 510, w: 5 }, { x: 540, y: 420, w: 3 },
      { x: 800, y: 490, w: 4 }, { x: 1020, y: 370, w: 3 },
      { x: 1280, y: 450, w: 5 }, { x: 1550, y: 340, w: 3 },
      { x: 1800, y: 420, w: 4 }, { x: 2100, y: 330, w: 3 },
      { x: 2350, y: 460, w: 4 }, { x: 2650, y: 370, w: 3 },
      { x: 2900, y: 500, w: 5 },
    ];
    for (const p of plats) {
      this.addPlatform(scene, platforms, p.x, p.y, p.w, c2);
      // Hanging vines below platforms
      for (let v = 0; v < p.w; v++) {
        if (Math.random() > 0.5) {
          const vx = p.x + v * T + T / 2;
          const vineLen = Phaser.Math.Between(30, 70);
          const vine = scene.add.rectangle(vx, p.y + T / 2 + vineLen / 2, 3, vineLen, 0x44aa66, 0.5);
          vine.setDepth(-1);
          scene.tweens.add({ targets: vine, angle: { from: -4, to: 4 }, duration: 1500 + v * 200, yoyo: true, repeat: -1 });
        }
      }
    }

    // Tree trunks (walls)
    this.addWall(scene, platforms, 650, 400, 7, 0x3a2a1a);
    this.addWall(scene, platforms, 1400, 350, 8, 0x3a2a1a);
    this.addWall(scene, platforms, 2200, 380, 7, 0x3a2a1a);

    // Canopy tops (decorative)
    for (const tx of [650, 1400, 2200]) {
      for (let i = -2; i <= 2; i++) {
        const leafX = tx + T / 2 + i * 28;
        const leafY = 350 + Math.abs(i) * 15 + Phaser.Math.Between(-10, 10);
        const leaf = scene.add.ellipse(leafX, leafY, 40, 20, 0x33cc66, 0.5);
        leaf.setDepth(-1);
        scene.tweens.add({ targets: leaf, y: leafY - 3, duration: 2000 + i * 300, yoyo: true, repeat: -1 });
      }
    }

    // Bioluminescent mushrooms (decorative)
    for (let i = 0; i < 20; i++) {
      const mx = Phaser.Math.Between(100, 3100);
      const my = GY - Phaser.Math.Between(0, 5);
      const color = Phaser.Utils.Array.GetRandom([0x44ffaa, 0x88ff44, 0x44ff88]);
      const mushroom = scene.add.circle(mx, my, Phaser.Math.Between(3, 6), color, 0.7);
      mushroom.setDepth(-1);
      scene.tweens.add({ targets: mushroom, alpha: { from: 0.3, to: 0.8 }, duration: Phaser.Math.Between(1000, 2500), yoyo: true, repeat: -1 });
    }
  }

  private static bgNebula(scene: Phaser.Scene, levelWidth: number): void {
    // Nebula gas clouds (large, colorful, parallax)
    const colors = [0x225544, 0x336655, 0x224466, 0x334455];
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(-200, levelWidth + 200);
      const y = Phaser.Math.Between(20, 350);
      const r = Phaser.Math.Between(60, 150);
      const cloud = scene.add.ellipse(x, y, r * 2, r, Phaser.Utils.Array.GetRandom(colors), 0.2);
      cloud.setScrollFactor(Phaser.Math.FloatBetween(0.1, 0.3)).setDepth(-6);
    }

    // Distant glowing spores floating up
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, levelWidth);
      const y = Phaser.Math.Between(100, GAME_HEIGHT);
      const spore = scene.add.circle(x, y, Phaser.Math.Between(1, 3), 0x88ffaa, 0.4);
      spore.setScrollFactor(0.2).setDepth(-5);
      scene.tweens.add({ targets: spore, y: y - Phaser.Math.Between(50, 200), alpha: 0, duration: Phaser.Math.Between(3000, 6000), repeat: -1 });
    }

    LevelLoader.scatterStars(scene, levelWidth, 60, [0xaaffcc, 0x88ffaa, 0x66ff88]);
  }

  // ==========================================
  // LEVEL 4: SPACE STATION
  // Metal corridors, grated floors, blinking lights, cables
  // ==========================================

  private static buildStation(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup): void {
    const c1 = 0x444466;
    const c2 = 0x5555aa;
    const c3 = 0x333355;

    // Flat industrial ground with grate pattern
    const groundProfile = new Array(100).fill(0);
    this.buildGround(scene, platforms, groundProfile, c1, c3);

    // Grate lines on floor (decorative)
    for (let x = 0; x < 3200; x += 64) {
      scene.add.rectangle(x + 32, GY - 2, 56, 2, 0x555588, 0.3).setDepth(-1);
    }

    // Multi-level catwalks
    const plats = [
      { x: 200, y: 540, w: 6 }, { x: 500, y: 440, w: 4 },
      { x: 800, y: 540, w: 5 }, { x: 1000, y: 380, w: 6 },
      { x: 1350, y: 480, w: 4 }, { x: 1600, y: 340, w: 5 },
      { x: 1900, y: 440, w: 4 }, { x: 2150, y: 540, w: 6 },
      { x: 2400, y: 380, w: 4 }, { x: 2700, y: 480, w: 5 },
      { x: 2950, y: 340, w: 4 },
    ];
    for (const p of plats) {
      this.addPlatform(scene, platforms, p.x, p.y, p.w, c2);
      // Safety railing (decorative)
      scene.add.rectangle(p.x + (p.w * T) / 2, p.y - 10, p.w * T + 4, 2, 0x8888aa, 0.4).setDepth(-1);
    }

    // Vertical pipes/walls
    this.addWall(scene, platforms, 700, 380, 8, c3);
    this.addWall(scene, platforms, 1500, 340, 9, c3);
    this.addWall(scene, platforms, 2350, 360, 8, c3);

    // Cables and pipes (decorative)
    for (const wx of [700, 1500, 2350]) {
      // Horizontal cable from wall
      scene.add.rectangle(wx + 40, 400, 60, 3, 0x6666aa, 0.5).setDepth(-1);
      scene.add.rectangle(wx + 40, 440, 80, 3, 0x6666aa, 0.5).setDepth(-1);
    }

    // Blinking warning lights
    for (const lx of [300, 900, 1500, 2100, 2700]) {
      const light = scene.add.circle(lx, GY - 30, 4, 0xff4444, 0.8);
      light.setDepth(-1);
      scene.tweens.add({ targets: light, alpha: { from: 0.2, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
    }

    // Screens/monitors (decorative)
    for (const sx of [450, 1200, 1850, 2550]) {
      const screen = scene.add.rectangle(sx, 280, 40, 30, 0x224488, 0.6);
      screen.setDepth(-1);
      scene.add.rectangle(sx, 280, 36, 26, 0x44aaff, 0.2).setDepth(-1);
      scene.tweens.add({
        targets: screen,
        fillAlpha: { from: 0.4, to: 0.8 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private static bgStation(scene: Phaser.Scene, levelWidth: number): void {
    // Outer space visible through windows
    for (let i = 0; i < 6; i++) {
      const wx = 300 + i * 500;
      // Window frame
      scene.add.rectangle(wx, 150, 120, 80, 0x222244, 0.8).setScrollFactor(0.5).setDepth(-8);
      // Starfield through window
      scene.add.rectangle(wx, 150, 110, 70, 0x050520, 1).setScrollFactor(0.5).setDepth(-7);
      for (let s = 0; s < 6; s++) {
        const sx = wx + Phaser.Math.Between(-50, 50);
        const sy = 150 + Phaser.Math.Between(-30, 30);
        scene.add.circle(sx, sy, 1, 0xffffff, 0.7).setScrollFactor(0.5).setDepth(-6);
      }
    }

    // Ceiling structure
    const ceiling = scene.add.graphics().setScrollFactor(0.8).setDepth(-3);
    ceiling.fillStyle(0x333355, 0.5);
    ceiling.fillRect(0, 0, levelWidth, 40);
    ceiling.fillStyle(0x555577, 0.3);
    for (let x = 0; x < levelWidth; x += 100) {
      ceiling.fillRect(x, 35, 80, 5);
    }

    LevelLoader.scatterStars(scene, levelWidth, 40, [0x4488ff, 0x44aaff, 0x6688ff]);
  }

  // ==========================================
  // LEVEL 5: DARK STAR
  // Crumbling ruins, void cracks, dark energy pillars
  // ==========================================

  private static buildDarkstar(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup): void {
    const c1 = 0x332244;
    const c2 = 0x443366;
    const c3 = 0x221133;

    // Crumbling, broken terrain
    const groundProfile = [
      0, 0, -1, 0, 0, 99, 99, 0, 0, -1, -2, -1, 0, 0, 1, 2,  // gap (99 = no tile)
      1, 0, -1, 0, 0, 0, -1, -2, -3, -2, 0, 0, 99, 99, 99, 0,
      0, 1, 2, 1, 0, -1, -2, 0, 0, 0, 1, 2, 3, 2, 0, -1,
      0, 0, 99, 99, 0, 0, -1, 0, 0, 0, -1, -2, -1, 0, 0, 0,
      0, 1, 2, 1, 0, -2, -3, -2, 0, 0, 0, 0, 99, 99, 0, 0,
      0, -1, 0, 0, 0, 0, 1, 1, 0, 0, -1, -2, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    this.buildGround(scene, platforms, groundProfile, c1, c3);

    // Floating ruin platforms — irregular, broken edges
    const plats = [
      { x: 240, y: 500, w: 3 }, { x: 480, y: 400, w: 2 },
      { x: 720, y: 480, w: 4 }, { x: 960, y: 350, w: 2 },
      { x: 1200, y: 440, w: 3 }, { x: 1450, y: 320, w: 3 },
      { x: 1700, y: 420, w: 4 }, { x: 1950, y: 340, w: 2 },
      { x: 2200, y: 460, w: 3 }, { x: 2450, y: 360, w: 2 },
      { x: 2700, y: 430, w: 4 }, { x: 2950, y: 500, w: 3 },
    ];
    for (const p of plats) {
      this.addPlatform(scene, platforms, p.x, p.y, p.w, c2);
    }

    // Dark energy pillars
    this.addWall(scene, platforms, 600, 350, 8, c3);
    this.addWall(scene, platforms, 1350, 300, 9, c3);
    this.addWall(scene, platforms, 2100, 320, 8, c3);
    this.addWall(scene, platforms, 2800, 370, 7, c3);

    // Void energy cracks (decorative — glowing purple fissures)
    for (const vx of [350, 900, 1600, 2300, 2900]) {
      const crack = scene.add.rectangle(vx, GY + T / 2, 3, T, 0xaa44ff, 0.6);
      crack.setDepth(-1);
      // Glow
      const glow = scene.add.rectangle(vx, GY + T / 2, 20, T + 8, 0x6622aa, 0.15);
      glow.setDepth(-2);
      scene.tweens.add({ targets: [crack, glow], alpha: { from: 0.3, to: 0.8 }, duration: 600, yoyo: true, repeat: -1 });
    }

    // Floating ruin fragments (decorative)
    for (let i = 0; i < 15; i++) {
      const fx = Phaser.Math.Between(100, 3100);
      const fy = Phaser.Math.Between(200, 550);
      const size = Phaser.Math.Between(4, 12);
      const frag = scene.add.rectangle(fx, fy, size, size, 0x443366, 0.4);
      frag.setAngle(Phaser.Math.Between(0, 45)).setDepth(-1);
      scene.tweens.add({ targets: frag, y: fy + Phaser.Math.Between(-10, 10), angle: frag.angle + 20, duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1 });
    }

    // Corrupted crystals
    for (const cx of [500, 1100, 1800, 2500]) {
      const cy = GY - 10;
      const crystal = scene.add.triangle(cx, cy, 0, 20, 8, 0, 16, 20, 0x8844cc, 0.6);
      crystal.setDepth(-1);
      scene.tweens.add({ targets: crystal, scaleY: { from: 1, to: 1.15 }, alpha: { from: 0.4, to: 0.8 }, duration: 1200, yoyo: true, repeat: -1 });
    }
  }

  private static bgDarkstar(scene: Phaser.Scene, levelWidth: number): void {
    // Dark star / black hole in background
    const bhx = levelWidth * 0.6;
    const bhy = 130;
    // Accretion disk
    for (let ring = 5; ring > 0; ring--) {
      const r = 40 + ring * 20;
      const alpha = 0.1 + ring * 0.03;
      const disk = scene.add.ellipse(bhx, bhy, r * 2, r * 0.4, 0x8844cc, alpha);
      disk.setScrollFactor(0.05).setDepth(-8);
      scene.tweens.add({ targets: disk, angle: { from: 0, to: 360 }, duration: 20000 + ring * 5000, repeat: -1 });
    }
    // Event horizon
    scene.add.circle(bhx, bhy, 30, 0x000000, 0.9).setScrollFactor(0.05).setDepth(-7);
    scene.add.circle(bhx, bhy, 34, 0x6622aa, 0.4).setScrollFactor(0.05).setDepth(-7);

    // Void particles drifting toward black hole
    for (let i = 0; i < 20; i++) {
      const px = bhx + Phaser.Math.Between(-400, 400);
      const py = bhy + Phaser.Math.Between(-200, 200);
      const particle = scene.add.circle(px, py, 1, 0xaa66ff, 0.3);
      particle.setScrollFactor(0.05).setDepth(-6);
      scene.tweens.add({
        targets: particle,
        x: bhx + Phaser.Math.Between(-20, 20),
        y: bhy + Phaser.Math.Between(-10, 10),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
      });
    }

    LevelLoader.scatterStars(scene, levelWidth, 80, [0xaa66ff, 0x8844cc, 0x6622aa, 0xffffff]);
  }

  // ========== SHARED HELPERS ==========

  private static buildGround(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    profile: number[],
    topColor: number,
    fillColor: number,
  ): void {
    const levelWidth = 3200;
    for (let i = 0; i < Math.ceil(levelWidth / T); i++) {
      const heightMod = profile[i % profile.length] ?? 0;
      if (heightMod === 99) continue; // gap in terrain
      const tileY = GY + T / 2 - heightMod * (T / 2);
      // Top surface tile
      const block = scene.add.rectangle(i * T + T / 2, tileY, T, T, topColor);
      platforms.add(block);
      // Fill below to screen bottom
      const fillHeight = GAME_HEIGHT - tileY + T;
      if (fillHeight > T) {
        const fill = scene.add.rectangle(i * T + T / 2, tileY + T / 2 + fillHeight / 2, T, fillHeight, fillColor);
        fill.setDepth(-1);
        platforms.add(fill);
      }
    }
  }

  private static addPlatform(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number, y: number, width: number, color: number,
  ): void {
    for (let i = 0; i < width; i++) {
      const block = scene.add.rectangle(x + i * T + T / 2, y + T / 2, T, T, color);
      platforms.add(block);
    }
  }

  private static addWall(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    x: number, y: number, height: number, color: number,
  ): void {
    for (let i = 0; i < height; i++) {
      const block = scene.add.rectangle(x + T / 2, y + i * T + T / 2, T, T, color);
      platforms.add(block);
    }
  }

  private static scatterStars(scene: Phaser.Scene, levelWidth: number, count: number, colors: number[]): void {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, levelWidth);
      const y = Phaser.Math.Between(0, GAME_HEIGHT - 100);
      const star = scene.add.circle(x, y, Phaser.Math.Between(1, 2), Phaser.Utils.Array.GetRandom(colors), 0.5);
      star.setScrollFactor(Phaser.Math.FloatBetween(0.05, 0.2)).setDepth(-10);
      scene.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }
}

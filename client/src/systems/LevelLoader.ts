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
      if (!EnemyClass) {
        console.warn(`Unknown enemy type: ${spawn.enemyId}`);
        continue;
      }

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

  static spawnItems(
    scene: Phaser.Scene,
    spawns: ItemSpawn[],
    group: Phaser.Physics.Arcade.Group,
  ): void {
    for (const spawn of spawns) {
      if (spawn.hidden) continue; // Hidden items revealed by interaction
      const drop = new ItemDrop(scene, spawn.position.x, spawn.position.y, spawn.itemId);
      group.add(drop);
    }
  }

  static createCheckpoints(
    scene: Phaser.Scene,
    positions: Vector2[],
  ): Phaser.Physics.Arcade.StaticGroup {
    const group = scene.physics.add.staticGroup();

    for (const pos of positions) {
      // Checkpoint flag visual
      const flag = scene.add.rectangle(pos.x, pos.y - 16, 8, 32, 0x44ff44, 0.6);
      group.add(flag);
    }

    return group;
  }

  static createProceduralLevel(
    scene: Phaser.Scene,
    config: LevelConfig,
  ): Phaser.Physics.Arcade.StaticGroup {
    const platforms = scene.physics.add.staticGroup();
    const groundY = GAME_HEIGHT - TILE_SIZE;
    const levelWidth = 2560; // 2x game width

    // Ground tiles
    for (let x = 0; x < levelWidth; x += TILE_SIZE) {
      const groundColor = LevelLoader.getThemeGroundColor(config.theme);
      const block = scene.add.rectangle(
        x + TILE_SIZE / 2,
        groundY + TILE_SIZE / 2,
        TILE_SIZE,
        TILE_SIZE,
        groundColor,
      );
      platforms.add(block);
    }

    // Theme-specific platform layout
    const platformConfigs = LevelLoader.getThemePlatforms(config.theme);
    for (const plat of platformConfigs) {
      const color = LevelLoader.getThemePlatformColor(config.theme);
      for (let i = 0; i < plat.width; i++) {
        const block = scene.add.rectangle(
          plat.x + i * TILE_SIZE + TILE_SIZE / 2,
          plat.y + TILE_SIZE / 2,
          TILE_SIZE,
          TILE_SIZE,
          color,
        );
        platforms.add(block);
      }
    }

    // Walls
    const wallConfigs = LevelLoader.getThemeWalls(config.theme);
    for (const wall of wallConfigs) {
      const color = LevelLoader.getThemeGroundColor(config.theme);
      for (let i = 0; i < wall.height; i++) {
        const block = scene.add.rectangle(
          wall.x + TILE_SIZE / 2,
          wall.y + i * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE,
          TILE_SIZE,
          color,
        );
        platforms.add(block);
      }
    }

    return platforms;
  }

  static getLevelWidth(_config: LevelConfig): number {
    return 2560;
  }

  private static getThemeGroundColor(theme: string): number {
    switch (theme) {
      case 'lunar': return 0x555577;
      case 'asteroid': return 0x664422;
      case 'nebula': return 0x226644;
      case 'station': return 0x444466;
      case 'darkstar': return 0x332244;
      default: return 0x4444aa;
    }
  }

  private static getThemePlatformColor(theme: string): number {
    switch (theme) {
      case 'lunar': return 0x6666aa;
      case 'asteroid': return 0x886633;
      case 'nebula': return 0x338855;
      case 'station': return 0x5555aa;
      case 'darkstar': return 0x443366;
      default: return 0x5555bb;
    }
  }

  private static getThemePlatforms(theme: string): { x: number; y: number; width: number }[] {
    // Each theme has a distinct layout pattern
    const base = [
      { x: 300, y: 520, width: 4 },
      { x: 600, y: 420, width: 3 },
      { x: 200, y: 320, width: 5 },
      { x: 900, y: 480, width: 3 },
      { x: 1100, y: 380, width: 4 },
      { x: 1400, y: 300, width: 3 },
      { x: 1700, y: 420, width: 4 },
      { x: 2000, y: 320, width: 3 },
    ];

    // Vary heights per theme
    const offsets: Record<string, number> = {
      lunar: -20,
      asteroid: 0,
      nebula: -40,
      station: 10,
      darkstar: -30,
    };

    const offset = offsets[theme] ?? 0;
    return base.map((p) => ({ ...p, y: p.y + offset }));
  }

  private static getThemeWalls(theme: string): { x: number; y: number; height: number }[] {
    return [
      { x: 800, y: 400, height: 6 },
      { x: 1600, y: 350, height: 7 },
    ];
  }
}

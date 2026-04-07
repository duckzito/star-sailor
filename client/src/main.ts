import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from '@shared/constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { LoadoutScene } from './scenes/LoadoutScene';
import { LevelScene } from './scenes/LevelScene';
import { BossScene } from './scenes/BossScene';
import { VictoryScene } from './scenes/VictoryScene';
import { TestScene } from './scenes/TestScene';

const isDev = false;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: isDev,
    },
  },
  scene: [BootScene, MenuScene, LevelSelectScene, LoadoutScene, LevelScene, BossScene, VictoryScene, TestScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#0a0a1a',
};

const game = new Phaser.Game(config);
(window as any).__GAME__ = game;

import type { LevelConfig } from './types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'level1',
    name: 'Lunar Landing',
    theme: 'lunar',
    tilemapKey: 'level1-lunar',
    enemies: [
      { enemyId: 'moon_crawler', position: { x: 500, y: 400 } },
      { enemyId: 'moon_crawler', position: { x: 900, y: 400 } },
      { enemyId: 'moon_crawler', position: { x: 1300, y: 400 }, isElite: true },
      { enemyId: 'dust_sprite', position: { x: 700, y: 300 } },
      { enemyId: 'dust_sprite', position: { x: 1100, y: 250 } },
    ],
    boss: {
      id: 'crater_titan',
      name: 'Crater Titan',
      phases: [
        { hpThreshold: 1.0, attacks: ['ground_slam', 'rock_throw'], speed: 60, attackCooldown: 2000 },
        { hpThreshold: 0.5, attacks: ['ground_slam', 'rock_throw', 'charge', 'double_shockwave'], speed: 80, attackCooldown: 1500 },
      ],
      uniqueDrop: 'gravity_boots',
    },
    items: [
      { itemId: 'star_dust', position: { x: 400, y: 350 } },
      { itemId: 'star_dust', position: { x: 800, y: 280 }, hidden: true },
    ],
    checkpoints: [
      { x: 200, y: 500 },
      { x: 1000, y: 400 },
    ],
  },
  {
    id: 'level2',
    name: 'Asteroid Belt',
    theme: 'asteroid',
    tilemapKey: 'level2-asteroid',
    enemies: [
      { enemyId: 'rock_hornet', position: { x: 400, y: 300 } },
      { enemyId: 'rock_hornet', position: { x: 800, y: 250 } },
      { enemyId: 'magma_slug', position: { x: 600, y: 400 } },
      { enemyId: 'magma_slug', position: { x: 1200, y: 400 }, isElite: true },
    ],
    boss: {
      id: 'asteroid_colossus',
      name: 'Asteroid Colossus',
      phases: [
        { hpThreshold: 1.0, attacks: ['boulder_hurl', 'stomp'], speed: 50, attackCooldown: 2500 },
        { hpThreshold: 0.6, attacks: ['boulder_hurl', 'stomp', 'meteor_rain'], speed: 60, attackCooldown: 2000 },
        { hpThreshold: 0.3, attacks: ['boulder_hurl', 'stomp', 'meteor_rain', 'seismic_slam'], speed: 70, attackCooldown: 1500 },
      ],
      uniqueDrop: 'meteor_hammer',
    },
    items: [
      { itemId: 'star_dust', position: { x: 500, y: 300 } },
      { itemId: 'cosmic_claws', position: { x: 1000, y: 250 }, hidden: true },
    ],
    checkpoints: [
      { x: 200, y: 500 },
      { x: 900, y: 350 },
    ],
  },
  {
    id: 'level3',
    name: 'Nebula Forest',
    theme: 'nebula',
    tilemapKey: 'level3-nebula',
    enemies: [
      { enemyId: 'spore_wisp', position: { x: 450, y: 300 } },
      { enemyId: 'spore_wisp', position: { x: 850, y: 250 } },
      { enemyId: 'vine_stalker', position: { x: 650, y: 400 } },
      { enemyId: 'vine_stalker', position: { x: 1100, y: 400 }, isElite: true },
    ],
    boss: {
      id: 'nebula_hydra',
      name: 'Nebula Hydra',
      phases: [
        { hpThreshold: 1.0, attacks: ['acid_spit', 'vine_lash'], speed: 55, attackCooldown: 2200 },
        { hpThreshold: 0.6, attacks: ['acid_spit', 'vine_lash', 'spore_cloud'], speed: 65, attackCooldown: 1800 },
        { hpThreshold: 0.3, attacks: ['acid_spit', 'vine_lash', 'spore_cloud', 'multi_head_strike'], speed: 75, attackCooldown: 1400 },
      ],
      uniqueDrop: 'solar_wings',
    },
    items: [
      { itemId: 'star_dust', position: { x: 350, y: 350 } },
      { itemId: 'nebula_shield', position: { x: 950, y: 280 }, hidden: true },
    ],
    checkpoints: [
      { x: 200, y: 500 },
      { x: 850, y: 380 },
    ],
  },
  {
    id: 'level4',
    name: 'Space Station',
    theme: 'station',
    tilemapKey: 'level4-station',
    enemies: [
      { enemyId: 'security_drone', position: { x: 500, y: 300 } },
      { enemyId: 'security_drone', position: { x: 900, y: 250 } },
      { enemyId: 'laser_turret', position: { x: 700, y: 400 } },
      { enemyId: 'laser_turret', position: { x: 1200, y: 350 }, isElite: true },
    ],
    boss: {
      id: 'rogue_ai_core',
      name: 'Rogue AI Core',
      phases: [
        { hpThreshold: 1.0, attacks: ['laser_beam', 'drone_swarm'], speed: 0, attackCooldown: 2000 },
        { hpThreshold: 0.6, attacks: ['laser_beam', 'drone_swarm', 'emp_pulse'], speed: 0, attackCooldown: 1600 },
        { hpThreshold: 0.3, attacks: ['laser_beam', 'drone_swarm', 'emp_pulse', 'overload'], speed: 30, attackCooldown: 1200 },
      ],
      uniqueDrop: 'nova_blaster',
    },
    items: [
      { itemId: 'supernova_charge', position: { x: 450, y: 300 } },
      { itemId: 'asteroid_plate', position: { x: 1050, y: 250 }, hidden: true },
    ],
    checkpoints: [
      { x: 200, y: 500 },
      { x: 950, y: 380 },
    ],
  },
  {
    id: 'level5',
    name: 'Dark Star',
    theme: 'darkstar',
    tilemapKey: 'level5-darkstar',
    enemies: [
      { enemyId: 'shadow_cat', position: { x: 500, y: 350 } },
      { enemyId: 'shadow_cat', position: { x: 900, y: 300 } },
      { enemyId: 'void_wraith', position: { x: 700, y: 280 } },
      { enemyId: 'void_wraith', position: { x: 1200, y: 320 }, isElite: true },
    ],
    boss: {
      id: 'dark_star_emperor',
      name: 'Dark Star Emperor',
      phases: [
        { hpThreshold: 1.0, attacks: ['shadow_bolt', 'void_slash'], speed: 70, attackCooldown: 2000 },
        { hpThreshold: 0.7, attacks: ['shadow_bolt', 'void_slash', 'dark_nova'], speed: 80, attackCooldown: 1600 },
        { hpThreshold: 0.4, attacks: ['shadow_bolt', 'void_slash', 'dark_nova', 'shadow_clones'], speed: 90, attackCooldown: 1200 },
        { hpThreshold: 0.15, attacks: ['shadow_bolt', 'void_slash', 'dark_nova', 'shadow_clones', 'annihilate'], speed: 100, attackCooldown: 1000 },
      ],
      uniqueDrop: 'cosmic_crown',
    },
    items: [
      { itemId: 'supernova_charge', position: { x: 400, y: 300 } },
      { itemId: 'comet_trail', position: { x: 1100, y: 250 }, hidden: true },
    ],
    checkpoints: [
      { x: 200, y: 500 },
      { x: 1000, y: 350 },
    ],
  },
];

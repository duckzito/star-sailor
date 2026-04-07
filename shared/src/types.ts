export interface Vector2 {
  x: number;
  y: number;
}

export type Direction = 'left' | 'right';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'weapon' | 'armor' | 'accessory' | 'consumable';
  description: string;
  statModifiers: Partial<PlayerStats>;
  specialEffect?: string;
}

export interface LoadoutSlots {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
  consumables: (string | null)[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  hp: number;
  attack: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  lootTable: LootEntry[];
}

export interface LootEntry {
  itemId: string;
  dropRate: number;
}

export interface BossConfig {
  id: string;
  name: string;
  phases: BossPhaseConfig[];
  uniqueDrop: string;
}

export interface BossPhaseConfig {
  hpThreshold: number;
  attacks: string[];
  speed: number;
  attackCooldown: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  theme: string;
  tilemapKey: string;
  enemies: EnemySpawn[];
  boss: BossConfig;
  items: ItemSpawn[];
  checkpoints: Vector2[];
}

export interface EnemySpawn {
  enemyId: string;
  position: Vector2;
  patrolPath?: Vector2[];
  isElite?: boolean;
}

export interface ItemSpawn {
  itemId: string;
  position: Vector2;
  hidden?: boolean;
}

export interface SaveData {
  version: number;
  unlockedLevels: number[];
  equipment: string[];
  loadout: LoadoutSlots;
  settings: GameSettings;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
}

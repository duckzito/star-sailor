import type { SaveData, LoadoutSlots, GameSettings } from '@shared/types';

const SAVE_KEY = 'star_sailor_save';
const SAVE_VERSION = 1;

function getDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    unlockedLevels: [0],
    equipment: [],
    loadout: {
      weapon: null,
      armor: null,
      accessory: null,
      consumables: [null, null],
    },
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      fullscreen: false,
    },
  };
}

export class SaveSystem {
  private static data: SaveData | null = null;

  static load(): SaveData {
    if (this.data) return this.data;

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        this.data = this.migrate(parsed);
        return this.data;
      }
    } catch (e) {
      console.warn('Failed to load save data, using defaults', e);
    }

    this.data = getDefaultSaveData();
    return this.data;
  }

  static save(): void {
    if (!this.data) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data', e);
    }
  }

  private static migrate(data: SaveData): SaveData {
    if (!data.version || data.version < SAVE_VERSION) {
      // Future migrations go here
      data.version = SAVE_VERSION;
    }
    // Ensure required fields exist
    data.unlockedLevels ??= [0];
    data.equipment ??= [];
    data.loadout ??= { weapon: null, armor: null, accessory: null, consumables: [null, null] };
    data.settings ??= { musicVolume: 0.5, sfxVolume: 0.7, fullscreen: false };
    return data;
  }

  static unlockLevel(levelIndex: number): void {
    const data = this.load();
    if (!data.unlockedLevels.includes(levelIndex)) {
      data.unlockedLevels.push(levelIndex);
      this.save();
    }
  }

  static addEquipment(itemId: string): void {
    const data = this.load();
    if (!data.equipment.includes(itemId)) {
      data.equipment.push(itemId);
      this.save();
    }
  }

  static addEquipmentBatch(itemIds: string[]): void {
    const data = this.load();
    let changed = false;
    for (const id of itemIds) {
      if (!data.equipment.includes(id)) {
        data.equipment.push(id);
        changed = true;
      }
    }
    if (changed) this.save();
  }

  static updateLoadout(loadout: LoadoutSlots): void {
    const data = this.load();
    data.loadout = loadout;
    this.save();
  }

  static updateSettings(settings: GameSettings): void {
    const data = this.load();
    data.settings = settings;
    this.save();
  }

  static getUnlockedLevels(): number[] {
    return [...this.load().unlockedLevels];
  }

  static getEquipment(): string[] {
    return [...this.load().equipment];
  }

  static getLoadout(): LoadoutSlots {
    const loadout = this.load().loadout;
    return { ...loadout, consumables: [...loadout.consumables] };
  }

  static getSettings(): GameSettings {
    return { ...this.load().settings };
  }

  static resetProgress(): void {
    this.data = getDefaultSaveData();
    this.save();
  }
}

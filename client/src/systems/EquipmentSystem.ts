import type { PlayerStats, LoadoutSlots } from '@shared/types';
import { EQUIPMENT } from '@shared/equipment-data';
import { PLAYER_BASE_HP, PLAYER_BASE_ATTACK, PLAYER_BASE_DEFENSE, PLAYER_SPEED } from '@shared/constants';

export class EquipmentSystem {
  static getBaseStats(): PlayerStats {
    return {
      hp: PLAYER_BASE_HP,
      maxHp: PLAYER_BASE_HP,
      attack: PLAYER_BASE_ATTACK,
      defense: PLAYER_BASE_DEFENSE,
      speed: PLAYER_SPEED,
    };
  }

  static applyLoadout(baseStats: PlayerStats, loadout: LoadoutSlots): PlayerStats {
    const stats = { ...baseStats };
    const slots = [loadout.weapon, loadout.armor, loadout.accessory];

    for (const itemId of slots) {
      if (!itemId) continue;
      const item = EQUIPMENT[itemId];
      if (!item) continue;
      this.applyModifiers(stats, item.statModifiers);
    }

    // Ensure minimums
    stats.hp = Math.max(1, stats.hp);
    stats.maxHp = Math.max(1, stats.maxHp);
    stats.attack = Math.max(1, stats.attack);
    stats.defense = Math.max(0, stats.defense);
    stats.speed = Math.max(50, stats.speed);

    return stats;
  }

  private static applyModifiers(stats: PlayerStats, modifiers: Partial<PlayerStats>): void {
    if (modifiers.hp !== undefined) {
      stats.hp += modifiers.hp;
      stats.maxHp += modifiers.hp;
    }
    if (modifiers.attack !== undefined) stats.attack += modifiers.attack;
    if (modifiers.defense !== undefined) stats.defense += modifiers.defense;
    if (modifiers.speed !== undefined) stats.speed += modifiers.speed;
  }

  static getActiveSpecialEffects(loadout: LoadoutSlots): string[] {
    const effects: string[] = [];
    const slots = [loadout.weapon, loadout.armor, loadout.accessory];

    for (const itemId of slots) {
      if (!itemId) continue;
      const item = EQUIPMENT[itemId];
      if (item?.specialEffect) effects.push(item.specialEffect);
    }

    return effects;
  }
}

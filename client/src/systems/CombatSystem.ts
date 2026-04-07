import Phaser from 'phaser';
import { MELEE_DAMAGE, KNOCKBACK_FORCE, RANGED_DAMAGE } from '@shared/constants';
import type { PlayerStats } from '@shared/types';

export class CombatSystem {
  static calculateDamage(baseDamage: number, attackStat: number, defenseStat: number): number {
    const raw = baseDamage + attackStat - defenseStat;
    return Math.max(1, Math.round(raw));
  }

  static applyKnockback(
    target: Phaser.Physics.Arcade.Sprite,
    sourceX: number,
  ): void {
    const direction = target.x > sourceX ? 1 : -1;
    target.setVelocity(KNOCKBACK_FORCE * direction, -KNOCKBACK_FORCE * 0.5);
  }

  static getMeleeDamage(stats: PlayerStats): number {
    return CombatSystem.calculateDamage(MELEE_DAMAGE, stats.attack, 0);
  }

  static getRangedDamage(stats: PlayerStats): number {
    return CombatSystem.calculateDamage(RANGED_DAMAGE, stats.attack, 0);
  }
}

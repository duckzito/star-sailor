import type { EnemyConfig } from '@shared/types';
import { BaseEnemy } from '../BaseEnemy';

const CONFIG: EnemyConfig = {
  id: 'laser_turret',
  name: 'Laser Turret',
  hp: 60,
  attack: 12,
  speed: 0,
  detectionRange: 250,
  attackRange: 200,
  lootTable: [
    { itemId: 'star_dust', dropRate: 0.3 },
    { itemId: 'nova_blaster', dropRate: 0.05 },
  ],
};

export class LaserTurret extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, patrolPath?: { x: number; y: number }[]) {
    // Turrets don't patrol — static positions
    super(scene, x, y, CONFIG, [{ x, y }, { x, y }]);
  }

  protected createTexture(): void {
    const k = 'laser_turret';
    if (this.scene.textures.exists(k)) { this.setTexture(k); return; }
    const g = this.scene.add.graphics();
    // Base
    g.fillStyle(0x555577, 1);
    g.fillRect(6, 18, 20, 14);
    // Barrel
    g.fillStyle(0x777799, 1);
    g.fillRect(12, 4, 8, 16);
    // Sensor
    g.fillStyle(0xff2222, 1);
    g.fillCircle(16, 8, 3);
    g.lineStyle(1, 0xff4444, 0.6);
    g.strokeCircle(16, 8, 5);
    g.generateTexture(k, 32, 32);
    g.destroy();
    this.setTexture(k);
  }

  // Turrets don't move during patrol
  protected updatePatrol(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
  }

  protected updateChase(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    // Turret attacks from range by transitioning to attack state
    if (this.target) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (dist < this.config.attackRange && this.attackCooldown <= 0) {
        this.fsm.transition('attack');
      }
    }
  }
}

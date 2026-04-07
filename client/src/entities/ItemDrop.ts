import Phaser from 'phaser';
import { EQUIPMENT } from '@shared/equipment-data';

export class ItemDrop extends Phaser.Physics.Arcade.Sprite {
  readonly itemId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, itemId: string) {
    super(scene, x, y, '__MISSING');
    this.itemId = itemId;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Create item texture based on category
    const item = EQUIPMENT[itemId];
    const color = this.getCategoryColor(item?.category ?? 'consumable');
    const texKey = `item_${itemId}`;

    if (!scene.textures.exists(texKey)) {
      const g = scene.add.graphics();
      // Diamond shape
      g.fillStyle(color, 1);
      g.fillRect(4, 0, 8, 8);
      g.fillRect(0, 4, 16, 8);
      g.fillRect(4, 8, 8, 8);
      // Border glow
      g.lineStyle(1, 0xffffff, 0.8);
      g.strokeRect(0, 0, 16, 16);
      g.generateTexture(texKey, 16, 16);
      g.destroy();
    }

    this.setTexture(texKey);
    this.setSize(16, 16);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.bobTime = Math.random() * Math.PI * 2;
  }

  private bobTime = 0;

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.bobTime += delta * 0.004;
    const bobVelocity = Math.sin(this.bobTime) * 15;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(bobVelocity);
  }

  private getCategoryColor(category: string): number {
    switch (category) {
      case 'weapon': return 0xff4444;
      case 'armor': return 0x4488ff;
      case 'accessory': return 0x44ff44;
      case 'consumable': return 0xffdd44;
      default: return 0xffffff;
    }
  }

  collect(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}

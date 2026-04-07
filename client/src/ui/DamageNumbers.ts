import Phaser from 'phaser';

export class DamageNumbers {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(x: number, y: number, amount: number, isCritical = false): void {
    const color = isCritical ? '#ffdd00' : '#ff4444';
    const size = isCritical ? '22px' : '16px';
    const prefix = isCritical ? '!' : '';

    const text = this.scene.add.text(x, y - 10, `${prefix}${amount}`, {
      fontSize: size,
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showHeal(x: number, y: number, amount: number): void {
    const text = this.scene.add.text(x, y - 10, `+${amount}`, {
      fontSize: '16px',
      color: '#44ff44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}

import Phaser from 'phaser';

export class HealthBar {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private barWidth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0xff2222,
    scrollFactor = 1,
  ) {
    this.barWidth = width;
    this.bg = scene.add.rectangle(x, y, width, height, 0x333333).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(x, y, width, height, color).setOrigin(0, 0.5);

    if (scrollFactor !== 1) {
      this.bg.setScrollFactor(scrollFactor);
      this.fill.setScrollFactor(scrollFactor);
    }
  }

  update(current: number, max: number): void {
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    this.fill.width = this.barWidth * ratio;
  }

  setPosition(x: number, y: number): void {
    this.bg.setPosition(x, y);
    this.fill.setPosition(x, y);
  }

  setDepth(depth: number): void {
    this.bg.setDepth(depth);
    this.fill.setDepth(depth + 1);
  }

  setVisible(visible: boolean): void {
    this.bg.setVisible(visible);
    this.fill.setVisible(visible);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
  }
}

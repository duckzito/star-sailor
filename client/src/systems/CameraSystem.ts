import Phaser from 'phaser';
import { GAME_HEIGHT } from '@shared/constants';

export class CameraSystem {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  follow(target: Phaser.GameObjects.GameObject, levelWidth: number): void {
    this.camera.startFollow(target, true, 0.08, 0.08);
    this.camera.setBounds(0, 0, levelWidth, GAME_HEIGHT);
    this.camera.setDeadzone(100, 50);
  }

  shake(duration = 200, intensity = 0.01): void {
    this.camera.shake(duration, intensity);
  }

  flash(duration = 200, r = 255, g = 255, b = 255): void {
    this.camera.flash(duration, r, g, b);
  }

  zoomTo(zoom: number, duration = 500): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom,
      duration,
      ease: 'Power2',
    });
  }

  resetZoom(duration = 300): void {
    this.zoomTo(1, duration);
  }
}

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';

export class PauseMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private paused = false;

  private onResume: () => void;
  private onQuit: () => void;

  constructor(scene: Phaser.Scene, onResume: () => void, onQuit: () => void) {
    this.scene = scene;
    this.onResume = onResume;
    this.onQuit = onQuit;

    this.container = scene.add.container(0, 0).setDepth(1000).setVisible(false).setScrollFactor(0);
    this.build();

    // ESC key binding
    const escKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => this.toggle());

    // P key binding
    const pKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    pKey.on('down', () => this.toggle());
  }

  private build(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark overlay
    const overlay = this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    this.container.add(overlay);

    // Panel
    const panel = this.scene.add.rectangle(cx, cy, 320, 260, 0x1a1a3a);
    panel.setStrokeStyle(2, 0xffd700);
    panel.setScrollFactor(0);
    this.container.add(panel);

    // Title
    const title = this.scene.add.text(cx, cy - 90, 'PAUSED', {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.container.add(title);

    // Resume button
    const resumeBtn = this.scene.add.text(cx, cy - 20, '[ Resume ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#2a2a5a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerover', () => { resumeBtn.setBackgroundColor('#3a3a7a'); resumeBtn.setColor('#ffd700'); });
    resumeBtn.on('pointerout', () => { resumeBtn.setBackgroundColor('#2a2a5a'); resumeBtn.setColor('#ffffff'); });
    resumeBtn.on('pointerdown', () => this.resume());
    this.container.add(resumeBtn);

    // Quit button
    const quitBtn = this.scene.add.text(cx, cy + 50, '[ Quit to Menu ]', {
      fontSize: '24px',
      color: '#ff6666',
      backgroundColor: '#2a2a5a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0);
    quitBtn.setInteractive({ useHandCursor: true });
    quitBtn.on('pointerover', () => { quitBtn.setBackgroundColor('#3a3a7a'); quitBtn.setColor('#ff4444'); });
    quitBtn.on('pointerout', () => { quitBtn.setBackgroundColor('#2a2a5a'); quitBtn.setColor('#ff6666'); });
    quitBtn.on('pointerdown', () => {
      this.resume();
      this.onQuit();
    });
    this.container.add(quitBtn);

    // Hint
    const hint = this.scene.add.text(cx, cy + 110, 'ESC or P to resume', {
      fontSize: '14px',
      color: '#666688',
    }).setOrigin(0.5).setScrollFactor(0);
    this.container.add(hint);
  }

  toggle(): void {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.container.setVisible(true);
    this.scene.physics.pause();
    this.scene.tweens.pauseAll();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.container.setVisible(false);
    this.scene.physics.resume();
    this.scene.tweens.resumeAll();
    this.onResume();
  }

  isPaused(): boolean {
    return this.paused;
  }

  destroy(): void {
    if (this.paused) {
      this.scene.physics.resume();
      this.scene.tweens.resumeAll();
    }
    this.container.destroy(true);
  }
}

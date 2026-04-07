import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import type { GameSettings } from '@shared/types';

export class SettingsMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private visible = false;
  private settings: GameSettings;
  private onSave: (settings: GameSettings) => void;

  constructor(scene: Phaser.Scene, settings: GameSettings, onSave: (settings: GameSettings) => void) {
    this.scene = scene;
    this.settings = { ...settings };
    this.onSave = onSave;

    this.container = scene.add.container(0, 0).setDepth(500).setVisible(false).setScrollFactor(0);
    this.build();
  }

  private build(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Overlay
    const overlay = this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.container.add(overlay);

    // Panel
    const panel = this.scene.add.rectangle(cx, cy, 400, 300, 0x1a1a3a);
    panel.setStrokeStyle(2, 0xffd700);
    this.container.add(panel);

    // Title
    const title = this.scene.add.text(cx, cy - 120, 'Settings', {
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Music volume
    this.addSlider('Music Volume', cy - 60, this.settings.musicVolume, (val) => {
      this.settings.musicVolume = val;
    });

    // SFX volume
    this.addSlider('SFX Volume', cy, this.settings.sfxVolume, (val) => {
      this.settings.sfxVolume = val;
    });

    // Fullscreen toggle
    const fsText = this.scene.add.text(cx - 120, cy + 50, 'Fullscreen:', {
      fontSize: '18px',
      color: '#ffffff',
    });
    this.container.add(fsText);

    const fsBtn = this.scene.add.text(cx + 40, cy + 50, this.settings.fullscreen ? 'ON' : 'OFF', {
      fontSize: '18px',
      color: this.settings.fullscreen ? '#44ff44' : '#ff4444',
      backgroundColor: '#2a2a5a',
      padding: { x: 12, y: 4 },
    });
    fsBtn.setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      this.settings.fullscreen = !this.settings.fullscreen;
      fsBtn.setText(this.settings.fullscreen ? 'ON' : 'OFF');
      fsBtn.setColor(this.settings.fullscreen ? '#44ff44' : '#ff4444');
      if (this.settings.fullscreen) {
        this.scene.scale.startFullscreen();
      } else {
        this.scene.scale.stopFullscreen();
      }
    });
    this.container.add(fsBtn);

    // Close button
    const closeBtn = this.scene.add.text(cx, cy + 110, '[ Close ]', {
      fontSize: '22px',
      color: '#ffd700',
      backgroundColor: '#2a2a5a',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setBackgroundColor('#3a3a7a'));
    closeBtn.on('pointerout', () => closeBtn.setBackgroundColor('#2a2a5a'));
    closeBtn.on('pointerdown', () => {
      this.onSave(this.settings);
      this.hide();
    });
    this.container.add(closeBtn);
  }

  private addSlider(label: string, y: number, initial: number, onChange: (val: number) => void): void {
    const cx = GAME_WIDTH / 2;

    const labelText = this.scene.add.text(cx - 120, y, label + ':', {
      fontSize: '18px',
      color: '#ffffff',
    });
    this.container.add(labelText);

    let currentVal = Math.round(initial * 10) / 10; // snap to 0.1 increments

    const valText = this.scene.add.text(cx + 100, y, `${Math.round(currentVal * 100)}%`, {
      fontSize: '18px',
      color: '#aaccff',
    });
    this.container.add(valText);

    const updateDisplay = () => {
      valText.setText(`${Math.round(currentVal * 100)}%`);
      onChange(currentVal);
    };

    // Minus button
    const minus = this.scene.add.text(cx + 40, y, '-', {
      fontSize: '22px',
      color: '#ff4444',
      backgroundColor: '#2a2a5a',
      padding: { x: 8, y: 2 },
    });
    minus.setInteractive({ useHandCursor: true });
    minus.on('pointerdown', () => {
      currentVal = Math.round(Math.max(0, currentVal - 0.1) * 10) / 10;
      updateDisplay();
    });
    this.container.add(minus);

    // Plus button
    const plus = this.scene.add.text(cx + 70, y, '+', {
      fontSize: '22px',
      color: '#44ff44',
      backgroundColor: '#2a2a5a',
      padding: { x: 8, y: 2 },
    });
    plus.setInteractive({ useHandCursor: true });
    plus.on('pointerdown', () => {
      currentVal = Math.round(Math.min(1, currentVal + 0.1) * 10) / 10;
      updateDisplay();
    });
    this.container.add(plus);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
  }

  show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }
}

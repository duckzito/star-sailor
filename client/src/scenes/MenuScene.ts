import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import { SettingsMenu } from '../ui/SettingsMenu';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  private settingsMenu!: SettingsMenu;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Starfield
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 120, 'Star Sailor', {
      fontSize: '72px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 190, 'A Space Cat Adventure', {
      fontSize: '24px',
      color: '#aaccff',
    }).setOrigin(0.5);

    // Menu buttons
    const buttons = [
      { text: 'Play', scene: 'LevelSelectScene' },
      { text: 'Co-op (Coming Soon)', scene: null },
      { text: 'PvP (Coming Soon)', scene: null },
      { text: 'Equipment', scene: 'LoadoutScene', data: { viewOnly: true } },
    ];

    let y = 320;
    for (const btn of buttons) {
      const enabled = btn.scene !== null;
      const text = this.add.text(GAME_WIDTH / 2, y, btn.text, {
        fontSize: '28px',
        color: enabled ? '#ffffff' : '#666666',
        backgroundColor: enabled ? '#2a2a5a' : '#1a1a2a',
        padding: { x: 30, y: 12 },
      }).setOrigin(0.5);

      if (enabled) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => {
          text.setBackgroundColor('#3a3a7a');
          text.setColor('#ffd700');
        });
        text.on('pointerout', () => {
          text.setBackgroundColor('#2a2a5a');
          text.setColor('#ffffff');
        });
        text.on('pointerdown', () => {
          this.scene.start(btn.scene!, (btn as any).data ?? {});
        });
      }
      y += 70;
    }

    // Settings button
    const settingsBtn = this.add.text(GAME_WIDTH / 2, y, 'Settings', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#2a2a5a',
      padding: { x: 30, y: 12 },
    }).setOrigin(0.5);
    settingsBtn.setInteractive({ useHandCursor: true });
    settingsBtn.on('pointerover', () => { settingsBtn.setBackgroundColor('#3a3a7a'); settingsBtn.setColor('#ffd700'); });
    settingsBtn.on('pointerout', () => { settingsBtn.setBackgroundColor('#2a2a5a'); settingsBtn.setColor('#ffffff'); });
    settingsBtn.on('pointerdown', () => this.settingsMenu.toggle());

    // Settings menu overlay
    this.settingsMenu = new SettingsMenu(this, SaveSystem.getSettings(), (settings) => {
      SaveSystem.updateSettings(settings);
    });

    // Version
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0 MVP', {
      fontSize: '14px',
      color: '#444444',
    }).setOrigin(1, 1);
  }
}

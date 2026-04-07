import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';

/**
 * On-screen touch controls for mobile.
 * Left side: D-pad (left / right arrows)
 * Right side: action buttons (Jump, Dash, Melee, Ranged)
 * Top-right: Pause button
 *
 * All state is exposed as boolean flags read by InputManager.
 * Controls are created but only populated/visible on touch devices.
 */
export class TouchControls {
  // Directional state
  left = false;
  right = false;

  // Action state (momentary — true for one frame then cleared)
  jumpPressed = false;
  dashPressed = false;
  meleePressed = false;
  rangedPressed = false;

  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private active = false;
  private onPause: (() => void) | null = null;

  // Track consumed presses so InputManager can read-and-clear
  private _jumpConsumed = false;
  private _dashConsumed = false;
  private _meleeConsumed = false;
  private _rangedConsumed = false;

  constructor(scene: Phaser.Scene, onPause?: () => void) {
    this.scene = scene;
    this.onPause = onPause ?? null;
    this.container = scene.add.container(0, 0).setDepth(900).setScrollFactor(0).setAlpha(0.55);

    if (this.isTouchDevice()) {
      this.build();
      this.active = true;

      // Reset all state on touchcancel (OS interrupts like incoming calls)
      document.addEventListener('touchcancel', () => this.resetAll());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.resetAll();
      });
    }
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private resetAll(): void {
    this.left = false;
    this.right = false;
    this.jumpPressed = false;
    this.dashPressed = false;
    this.meleePressed = false;
    this.rangedPressed = false;
  }

  private build(): void {
    const pad = 16;
    const btnSize = 68;
    const gap = 10;

    // ===== LEFT SIDE: Direction buttons =====
    const dpadY = GAME_HEIGHT - pad - btnSize;

    const leftBtn = this.makeButton(pad, dpadY, btnSize, btnSize, '\u25C0', 0x334466);
    leftBtn.on('pointerdown', () => { this.left = true; });
    leftBtn.on('pointerup', () => { this.left = false; });

    const rightBtn = this.makeButton(pad + btnSize + gap, dpadY, btnSize, btnSize, '\u25B6', 0x334466);
    rightBtn.on('pointerdown', () => { this.right = true; });
    rightBtn.on('pointerup', () => { this.right = false; });

    // ===== RIGHT SIDE: Action buttons =====
    // Layout:     [Dash]
    //       [Melee][Jump][Ranged]
    const rightBase = GAME_WIDTH - pad - btnSize;
    const actionY = GAME_HEIGHT - pad - btnSize;

    // Jump — big central button
    const jumpBtn = this.makeButton(rightBase - btnSize - gap, actionY, btnSize, btnSize, 'JMP', 0x446644);
    jumpBtn.on('pointerdown', () => { this.jumpPressed = true; this._jumpConsumed = false; });
    jumpBtn.on('pointerup', () => { this.jumpPressed = false; });

    // Melee — left of jump
    const meleeBtn = this.makeButton(rightBase - (btnSize + gap) * 2, actionY, btnSize, btnSize, 'ATK', 0x664433);
    meleeBtn.on('pointerdown', () => { this.meleePressed = true; this._meleeConsumed = false; });
    meleeBtn.on('pointerup', () => { this.meleePressed = false; });

    // Ranged — right of jump
    const rangedBtn = this.makeButton(rightBase, actionY, btnSize, btnSize, 'SHT', 0x443366);
    rangedBtn.on('pointerdown', () => { this.rangedPressed = true; this._rangedConsumed = false; });
    rangedBtn.on('pointerup', () => { this.rangedPressed = false; });

    // Dash — above jump
    const dashBtn = this.makeButton(rightBase - btnSize - gap, actionY - btnSize - gap, btnSize, btnSize, 'DSH', 0x336666);
    dashBtn.on('pointerdown', () => { this.dashPressed = true; this._dashConsumed = false; });
    dashBtn.on('pointerup', () => { this.dashPressed = false; });

    // ===== TOP-RIGHT: Pause =====
    const pauseBtn = this.makeButton(GAME_WIDTH - pad - 48, pad, 48, 48, '| |', 0x444444);
    pauseBtn.on('pointerdown', () => {
      if (this.onPause) this.onPause();
    });
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, color: number): Phaser.GameObjects.Rectangle {
    const bg = this.scene.add.rectangle(0, 0, w, h, color, 0.7).setStrokeStyle(2, 0xffffff, 0.4);
    bg.setOrigin(0, 0);

    const txt = this.scene.add.text(w / 2, h / 2, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const btn = this.scene.add.container(x, y, [bg, txt]).setScrollFactor(0);
    bg.setInteractive();
    this.container.add(btn);

    return bg;
  }

  /** Called by InputManager — returns true once per press */
  consumeJump(): boolean {
    if (this.jumpPressed && !this._jumpConsumed) {
      this._jumpConsumed = true;
      return true;
    }
    return false;
  }

  consumeDash(): boolean {
    if (this.dashPressed && !this._dashConsumed) {
      this._dashConsumed = true;
      return true;
    }
    return false;
  }

  consumeMelee(): boolean {
    if (this.meleePressed && !this._meleeConsumed) {
      this._meleeConsumed = true;
      return true;
    }
    return false;
  }

  consumeRanged(): boolean {
    if (this.rangedPressed && !this._rangedConsumed) {
      this._rangedConsumed = true;
      return true;
    }
    return false;
  }

  isActive(): boolean {
    return this.active;
  }

  destroy(): void {
    this.container.destroy(true);
  }
}

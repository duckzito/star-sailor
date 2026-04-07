import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';

/**
 * On-screen touch controls for mobile.
 * Uses scene-level pointer tracking to correctly handle multi-touch.
 * Each button tracks which pointer ID owns it, so releasing one finger
 * never affects buttons held by another finger.
 */
export class TouchControls {
  // Directional state
  left = false;
  right = false;

  // Action state
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

  // Map pointer ID → button key, so we know which button each finger owns
  private pointerMap = new Map<number, string>();
  // Map button key → { rect, setter }
  private buttons = new Map<string, { rect: Phaser.GameObjects.Rectangle; down: () => void; up: () => void }>();

  constructor(scene: Phaser.Scene, onPause?: () => void) {
    this.scene = scene;
    this.onPause = onPause ?? null;
    this.container = scene.add.container(0, 0).setDepth(900).setScrollFactor(0).setAlpha(0.55);

    if (this.isTouchDevice()) {
      this.build();
      this.active = true;
      this.setupScenePointerTracking();

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
    this.pointerMap.clear();
  }

  private setupScenePointerTracking(): void {
    // On pointer down, find which button was hit and assign this pointer to it
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const btn = this.hitTest(pointer);
      if (!btn) return;

      this.pointerMap.set(pointer.id, btn);
      this.buttons.get(btn)!.down();
    });

    // On pointer up, release whichever button this pointer owned
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const btn = this.pointerMap.get(pointer.id);
      if (btn) {
        this.buttons.get(btn)?.up();
        this.pointerMap.delete(pointer.id);
      }
    });

    // On pointer move, check if finger slid off its button
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const ownedBtn = this.pointerMap.get(pointer.id);
      if (!ownedBtn) return;

      const currentBtn = this.hitTest(pointer);
      if (currentBtn !== ownedBtn) {
        // Finger left its button — release old
        this.buttons.get(ownedBtn)?.up();
        this.pointerMap.delete(pointer.id);

        // If finger slid onto another button, press it
        if (currentBtn) {
          this.pointerMap.set(pointer.id, currentBtn);
          this.buttons.get(currentBtn)!.down();
        }
      }
    });
  }

  /** Hit-test a pointer against all registered button rects */
  private hitTest(pointer: Phaser.Input.Pointer): string | null {
    // Convert screen coordinates to game coordinates
    const cam = this.scene.cameras.main;
    const gx = (pointer.x - cam.x) / cam.zoom;
    const gy = (pointer.y - cam.y) / cam.zoom;

    for (const [key, { rect }] of this.buttons) {
      const parent = rect.parentContainer;
      const bx = parent ? parent.x : 0;
      const by = parent ? parent.y : 0;
      // rect origin is (0,0) so bounds are [bx, bx+w] x [by, by+h]
      if (gx >= bx && gx <= bx + rect.width && gy >= by && gy <= by + rect.height) {
        return key;
      }
    }
    return null;
  }

  private build(): void {
    const pad = 16;
    const btnSize = 68;
    const gap = 10;

    // ===== LEFT SIDE: Direction buttons =====
    const dpadY = GAME_HEIGHT - pad - btnSize;

    this.registerButton('left', pad, dpadY, btnSize, btnSize, '\u25C0', 0x334466,
      () => { this.left = true; },
      () => { this.left = false; },
    );

    this.registerButton('right', pad + btnSize + gap, dpadY, btnSize, btnSize, '\u25B6', 0x334466,
      () => { this.right = true; },
      () => { this.right = false; },
    );

    // ===== RIGHT SIDE: Action buttons =====
    const rightBase = GAME_WIDTH - pad - btnSize;
    const actionY = GAME_HEIGHT - pad - btnSize;

    this.registerButton('jump', rightBase - btnSize - gap, actionY, btnSize, btnSize, 'JMP', 0x446644,
      () => { this.jumpPressed = true; this._jumpConsumed = false; },
      () => { this.jumpPressed = false; },
    );

    this.registerButton('melee', rightBase - (btnSize + gap) * 2, actionY, btnSize, btnSize, 'ATK', 0x664433,
      () => { this.meleePressed = true; this._meleeConsumed = false; },
      () => { this.meleePressed = false; },
    );

    this.registerButton('ranged', rightBase, actionY, btnSize, btnSize, 'SHT', 0x443366,
      () => { this.rangedPressed = true; this._rangedConsumed = false; },
      () => { this.rangedPressed = false; },
    );

    this.registerButton('dash', rightBase - btnSize - gap, actionY - btnSize - gap, btnSize, btnSize, 'DSH', 0x336666,
      () => { this.dashPressed = true; this._dashConsumed = false; },
      () => { this.dashPressed = false; },
    );

    // ===== TOP-RIGHT: Pause =====
    this.registerButton('pause', GAME_WIDTH - pad - 48, pad, 48, 48, '| |', 0x444444,
      () => { if (this.onPause) this.onPause(); },
      () => {},
    );
  }

  private registerButton(
    key: string, x: number, y: number, w: number, h: number,
    label: string, color: number, down: () => void, up: () => void,
  ): void {
    const bg = this.scene.add.rectangle(0, 0, w, h, color, 0.7).setStrokeStyle(2, 0xffffff, 0.4);
    bg.setOrigin(0, 0);

    const txt = this.scene.add.text(w / 2, h / 2, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const btn = this.scene.add.container(x, y, [bg, txt]).setScrollFactor(0);
    this.container.add(btn);

    this.buttons.set(key, { rect: bg, down, up });
  }

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
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointermove');
    this.pointerMap.clear();
    this.buttons.clear();
    this.container.destroy(true);
  }
}

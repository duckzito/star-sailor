import Phaser from 'phaser';

export class InputManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private jumpKey: Phaser.Input.Keyboard.Key;
  private dashKey: Phaser.Input.Keyboard.Key;
  private meleeKey: Phaser.Input.Keyboard.Key;
  private rangedKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.meleeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.rangedKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  isLeft(): boolean {
    return this.cursors.left.isDown || this.wasd.A.isDown;
  }

  isRight(): boolean {
    return this.cursors.right.isDown || this.wasd.D.isDown;
  }

  isUp(): boolean {
    return this.cursors.up.isDown || this.wasd.W.isDown;
  }

  isDown(): boolean {
    return this.cursors.down.isDown || this.wasd.S.isDown;
  }

  isJumpJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up);
  }

  isDashPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.dashKey);
  }

  isMeleePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.meleeKey);
  }

  isRangedPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.rangedKey);
  }
}

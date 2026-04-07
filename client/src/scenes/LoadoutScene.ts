import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@shared/constants';
import { EQUIPMENT } from '@shared/equipment-data';
import type { LoadoutSlots, EquipmentItem } from '@shared/types';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { SaveSystem } from '../systems/SaveSystem';

export class LoadoutScene extends Phaser.Scene {
  private inventory: string[] = [];
  private loadout: LoadoutSlots = {
    weapon: null,
    armor: null,
    accessory: null,
    consumables: [null, null],
  };
  private levelIndex = 0;
  private unlockedLevels: number[] = [0];
  private viewOnly = false;
  private statsText!: Phaser.GameObjects.Text;
  private slotTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  init(data: { inventory?: string[]; loadout?: LoadoutSlots; levelIndex?: number; unlockedLevels?: number[]; viewOnly?: boolean }): void {
    this.inventory = SaveSystem.getEquipment();
    this.loadout = data.loadout ?? SaveSystem.getLoadout();
    this.levelIndex = data.levelIndex ?? 0;
    this.unlockedLevels = data.unlockedLevels ?? SaveSystem.getUnlockedLevels();
    this.viewOnly = data.viewOnly ?? false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'Equipment Loadout', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Loadout slots (left side)
    this.add.text(80, 80, 'Loadout', {
      fontSize: '22px',
      color: '#ffffff',
    });

    const slotNames: { key: keyof LoadoutSlots; label: string; y: number }[] = [
      { key: 'weapon', label: 'Weapon', y: 120 },
      { key: 'armor', label: 'Armor', y: 170 },
      { key: 'accessory', label: 'Accessory', y: 220 },
    ];

    for (const slot of slotNames) {
      this.add.text(40, slot.y, `${slot.label}:`, {
        fontSize: '18px',
        color: '#aaccff',
      });

      const equipped = this.loadout[slot.key] as string | null;
      const itemName = equipped ? EQUIPMENT[equipped]?.name ?? 'Unknown' : '[ empty ]';
      const slotText = this.add.text(160, slot.y, itemName, {
        fontSize: '18px',
        color: equipped ? '#44ff44' : '#666666',
      });
      this.slotTexts.set(slot.key, slotText);
    }

    // Stats preview
    this.add.text(80, 290, 'Stats Preview', {
      fontSize: '22px',
      color: '#ffffff',
    });

    this.statsText = this.add.text(40, 330, '', {
      fontSize: '16px',
      color: '#cccccc',
      lineSpacing: 6,
    });
    this.updateStatsPreview();

    // Inventory (right side)
    this.add.text(GAME_WIDTH / 2 + 80, 80, 'Inventory', {
      fontSize: '22px',
      color: '#ffffff',
    });

    let iy = 120;
    for (const itemId of this.inventory) {
      const item = EQUIPMENT[itemId];
      if (!item) continue;

      const color = this.getCategoryColor(item.category);
      const btn = this.add.text(GAME_WIDTH / 2 + 40, iy, `${item.name} (${item.category})`, {
        fontSize: '16px',
        color: color,
        backgroundColor: '#1a1a3a',
        padding: { x: 8, y: 4 },
      });

      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setBackgroundColor('#2a2a5a'));
      btn.on('pointerout', () => btn.setBackgroundColor('#1a1a3a'));
      btn.on('pointerdown', () => this.equipItem(itemId));

      // Description on hover
      btn.on('pointerover', () => {
        btn.setBackgroundColor('#2a2a5a');
        this.showItemTooltip(item, btn.x + btn.width + 10, btn.y);
      });
      btn.on('pointerout', () => {
        btn.setBackgroundColor('#1a1a3a');
        this.hideTooltip();
      });

      iy += 36;
    }

    // Start button — only shown when entering from LevelSelect (not view-only from Menu)
    if (!this.viewOnly) {
      const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ Start Level ]', {
        fontSize: '28px',
        color: '#ffd700',
        backgroundColor: '#2a2a5a',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5);

      startBtn.setInteractive({ useHandCursor: true });
      startBtn.on('pointerover', () => startBtn.setBackgroundColor('#3a3a7a'));
      startBtn.on('pointerout', () => startBtn.setBackgroundColor('#2a2a5a'));
      startBtn.on('pointerdown', () => {
        this.scene.start('LevelScene', {
          levelIndex: this.levelIndex,
          loadout: this.loadout,
          inventory: this.inventory,
          unlockedLevels: this.unlockedLevels,
        });
      });
    }

    // Back button — returns to LevelSelect or Menu depending on entry point
    const backTarget = this.viewOnly ? 'MenuScene' : 'LevelSelectScene';
    const backBtn = this.add.text(60, GAME_HEIGHT - 60, '< Back', {
      fontSize: '22px',
      color: '#aaaaaa',
      backgroundColor: '#1a1a3a',
      padding: { x: 12, y: 6 },
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#aaaaaa'));
    backBtn.on('pointerdown', () => {
      this.scene.start(backTarget);
    });
  }

  private equipItem(itemId: string): void {
    const item = EQUIPMENT[itemId];
    if (!item) return;

    const slotKey = item.category === 'consumable' ? null : item.category;
    if (!slotKey) return; // Skip consumables for now

    if (slotKey === 'weapon' || slotKey === 'armor' || slotKey === 'accessory') {
      this.loadout[slotKey] = itemId;
      SaveSystem.updateLoadout(this.loadout);
      const slotText = this.slotTexts.get(slotKey);
      if (slotText) {
        slotText.setText(item.name);
        slotText.setColor('#44ff44');
      }
      this.updateStatsPreview();
    }
  }

  private updateStatsPreview(): void {
    const base = EquipmentSystem.getBaseStats();
    const modified = EquipmentSystem.applyLoadout(base, this.loadout);
    const effects = EquipmentSystem.getActiveSpecialEffects(this.loadout);

    this.statsText.setText([
      `HP: ${modified.maxHp}`,
      `Attack: ${modified.attack}`,
      `Defense: ${modified.defense}`,
      `Speed: ${modified.speed}`,
      effects.length > 0 ? `Effects: ${effects.join(', ')}` : '',
    ].filter(Boolean).join('\n'));
  }

  private tooltipText: Phaser.GameObjects.Text | null = null;

  private showItemTooltip(item: EquipmentItem, x: number, y: number): void {
    this.hideTooltip();
    const mods = Object.entries(item.statModifiers)
      .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`)
      .join(', ');
    this.tooltipText = this.add.text(x, y, `${item.description}\n${mods}`, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 6, y: 4 },
      wordWrap: { width: 250 },
    });
  }

  private hideTooltip(): void {
    this.tooltipText?.destroy();
    this.tooltipText = null;
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'weapon': return '#ff6666';
      case 'armor': return '#6688ff';
      case 'accessory': return '#66ff66';
      case 'consumable': return '#ffdd66';
      default: return '#ffffff';
    }
  }
}

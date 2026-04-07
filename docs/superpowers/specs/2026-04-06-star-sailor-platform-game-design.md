# Star Sailor — Platform Game Design Spec

## Overview

**Star Sailor** is a web-based multiplayer platformer starring Star Sailor, a space cat who battles through themed levels, collecting equipment and defeating bosses. The game supports both cooperative and competitive play.

**Target:** MVP with 5 levels, browser-based, local persistence.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Game engine | Phaser 3 (Arcade physics) |
| Language | TypeScript |
| Multiplayer server | Colyseus |
| Bundler | Vite |
| Level editor | Tiled (JSON export) |
| Persistence (MVP) | localStorage |

---

## Project Structure

```
sailor-venus-crystal/
├── client/
│   ├── src/
│   │   ├── scenes/          # BootScene, MenuScene, LobbyScene, LevelScene, BossScene, etc.
│   │   ├── entities/        # StarSailor, enemies, bosses, items
│   │   ├── systems/         # Combat, physics, equipment, input handling
│   │   ├── ui/              # HUD, menus, health bars, inventory overlay
│   │   ├── network/         # Colyseus client wrapper, state sync handlers
│   │   └── assets/          # Sprites, audio, tilemaps (Tiled JSON)
│   └── index.html
├── server/
│   ├── src/
│   │   ├── rooms/           # CoopRoom, PvPRoom
│   │   ├── schemas/         # Colyseus state schemas (PlayerState, EnemyState, LevelState)
│   │   ├── systems/         # Server-side combat resolution, spawning, boss AI
│   │   └── config/          # Level definitions, enemy stats, equipment data (JSON)
├── shared/
│   ├── types.ts             # Player, Enemy, Equipment, Level interfaces
│   └── constants.ts         # Game balance numbers, physics values
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Single monorepo. Client and server share types via the `shared/` directory.

---

## Player Character: Star Sailor

A star-shaped space cat. Cartoon/anime art style.

### Movement
- Run (left/right)
- Jump + double-jump
- Wall-slide
- Dash (horizontal, short cooldown)

### Combat
- **Melee:** Claw swipe (short range, fast)
- **Ranged:** Star projectile (medium range, moderate cooldown)
- **Special:** Changes based on equipped weapon/accessory

### Stats
- HP, Attack Power, Defense, Speed
- Modified by equipped items
- 3 lives per level attempt, respawn at last checkpoint

---

## Equipment System

Items collected during levels. Persisted in localStorage between sessions.

| Category | Examples | Effect |
|----------|----------|--------|
| Weapons | Cosmic Claws, Nova Blaster, Meteor Hammer | Change attack style and damage output |
| Armor | Nebula Shield, Asteroid Plate | Reduce incoming damage |
| Accessories | Gravity Boots, Solar Wings, Comet Trail | Modify movement abilities |
| Consumables | Star Dust (heal), Supernova Charge (temp boost) | Single-use effects during gameplay |

Each level has unique drops tied to its theme. Equipment is selected before entering a level (loadout screen).

---

## Enemy Design

### Per-Level Enemies
- **Common enemies:** Simple patrol patterns, basic attacks, low HP. 3-4 types per level.
- **Elite enemies:** More aggressive AI, special attacks, better loot drops.

### Boss Design
Each level ends with a multi-phase boss fight:
- Phase transitions triggered at HP thresholds
- Unique attack patterns per boss
- Visual tells before attacks (learnable patterns)
- Difficulty scales: 2 phases (Level 1) → 4 phases (Level 5)

In co-op, boss HP scales +50% per additional player.

---

## Level Design (5 Levels)

| # | Theme | Environment | Enemies | Boss | Unique Drop |
|---|-------|-------------|---------|------|-------------|
| 1 | Lunar Landing | Moon surface, low gravity | Moon Crawlers, Dust Sprites | Crater Titan | Gravity Boots |
| 2 | Asteroid Belt | Moving asteroid platforms | Rock Hornets, Magma Slugs | Asteroid Colossus | Meteor Hammer |
| 3 | Nebula Forest | Colorful gas clouds, floating trees | Spore Wisps, Vine Stalkers | Nebula Hydra | Solar Wings |
| 4 | Space Station | Metal corridors, zero-G zones | Security Drones, Laser Turrets | Rogue AI Core | Nova Blaster |
| 5 | Dark Star | Corrupted star, intense atmosphere | Shadow Cats, Void Wraiths | Dark Star Emperor | Cosmic Crown |

### Level Structure (each level)
- 3 platforming + combat sections
- 1 mid-level checkpoint
- Hidden paths with bonus equipment
- Boss gate at the end (requires defeating all elite enemies in the level to unlock)
- Estimated play time: 5-10 minutes per level

### Difficulty Curve
Each level introduces one new enemy mechanic and one new platforming challenge. Boss complexity increases progressively.

---

## Multiplayer

### Co-op Mode
- 2-4 players per `CoopRoom`, playing the same level simultaneously
- Colyseus server is authoritative: owns enemy positions, HP, loot drops, hit detection
- Clients send input; server validates and broadcasts state
- Player position, animation, and attack state synced via Colyseus schemas
- Each player gets independent loot drops (no stealing)
- Matchmaking: create room (get code to share) or join random open room

### Competitive Mode (PvP)
- Separate `PvPRoom` with dedicated arena maps
- 1v1 duel mode for MVP: last cat standing wins
- Equipment loadouts locked to pre-set options (fair play)
- Best of 3 rounds, 60 seconds per round

### Network Model
- **Server authoritative:** Server runs physics and combat resolution
- **Client-side prediction:** Player movement predicted locally for responsiveness
- **Server reconciliation:** Server sends authoritative state; client interpolates corrections
- **Tick rate:** 20 ticks/second for state updates
- **Transport:** WebSocket via Colyseus

---

## Client Architecture

### Scene Flow
```
BootScene → MenuScene → LobbyScene → LevelScene → BossScene → VictoryScene
                ↓
           PvPLobbyScene → PvPArenaScene → PvPResultScene
```

| Scene | Responsibility |
|-------|---------------|
| BootScene | Asset loading, splash screen |
| MenuScene | Main menu: Play (solo/co-op), PvP, Equipment, Settings |
| LobbyScene | Create/join co-op room, show connected players, select level |
| LevelScene | Core platforming gameplay, tilemap rendering, enemies, items, checkpoints |
| BossScene | Dedicated boss arena, multi-phase fight logic |
| VictoryScene | Loot summary, unlock next level |
| PvPLobbyScene | PvP matchmaking |
| PvPArenaScene | 1v1 combat |
| PvPResultScene | Match results |

### Entity Pattern
- Entities extend `Phaser.GameObjects.Sprite` with typed configuration
- Composable behavior mixins: `Movable`, `Attackable`, `Damageable`, `Collectible`
- State machines drive enemy AI and boss phase transitions

### HUD
- HP bar (top-left)
- Equipment slots (bottom)
- Boss HP bar (top-center, during boss fights only)
- Co-op: teammate HP indicators
- PvP: opponent HP, round timer, round counter

---

## Data Architecture

### Level Data (JSON config files)
```typescript
interface LevelConfig {
  id: string;
  name: string;
  theme: string;
  tilemapKey: string;           // Tiled JSON file reference
  enemies: EnemySpawn[];        // Type, position, patrol path
  boss: BossConfig;             // Boss type, phases, attack patterns
  items: ItemSpawn[];           // Equipment drops, positions
  checkpoints: Vector2[];       // Checkpoint positions
}
```

### Colyseus State Schemas
```typescript
// Server-owned state synced to all clients in a room
class GameRoomState {
  players: MapSchema<PlayerState>;   // Position, HP, equipment, animation
  enemies: MapSchema<EnemyState>;    // Position, HP, AI state
  items: MapSchema<ItemState>;       // Position, collected status
  bossState: BossState;             // Phase, HP, attack state
}
```

### localStorage Structure
```typescript
interface SaveData {
  unlockedLevels: number[];
  equipment: EquipmentItem[];
  loadout: LoadoutSlots;
  settings: GameSettings;
}
```

---

## Verification Plan

1. **Dev environment:** `npm run dev` starts both Vite client and Colyseus server. Open browser to local URL.
2. **Single player:** Navigate menus, enter Level 1, move/jump/attack, defeat enemies, reach boss, complete level.
3. **Co-op:** Open two browser tabs, create room in one, join in other. Verify player sync, shared enemies, boss HP scaling.
4. **PvP:** Open two tabs, matchmake into PvP arena. Verify combat, round system, results.
5. **Persistence:** Complete a level, refresh browser, verify equipment and level unlock persisted.
6. **Edge cases:** Player disconnect during co-op (remaining players continue), browser tab close during PvP (opponent wins by forfeit).

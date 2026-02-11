import { type TileMapData } from '@/world/TileMap';
import { TILE_SIZE } from '@/config/constants';
import { type NPCData } from '@/entities/NPC';
import { type LightSource } from '@/rendering/LightSource';

export interface LevelObjectDef {
  type: 'elevator' | 'ladder' | 'rope';
  x: number; // pixel coords
  y: number;
  width?: number;
  height?: number;
  travelDistance?: number; // elevator only
}

export interface LevelData {
  tilemap: TileMapData;
  objects: LevelObjectDef[];
  npcs: NPCData[];
  lights: LightSource[];
  spawn: { x: number; y: number };
}

/**
 * Generate a multi-tier mine level (160×100 tiles = 1280×800px).
 *
 * Layout (3 tiers + secret area):
 *   Ground   y≈76  — main walkable floor, spawn, NPC
 *   Tier 2   y=58  — mid-level platforms connected by ladders/elevator/ropes
 *   Tier 3   y=38  — upper platforms connected by ladders/ropes
 *   Secret   y=20  — reachable by grapple from tier 3
 */
export function generateTestLevel(): LevelData {
  const width = 160;
  const height = 100;
  const collision = new Array(width * height).fill(0);
  const background = new Array(width * height).fill(0);
  const lumbrite = new Array(width * height).fill(0);

  const set = (tx: number, ty: number, val: number) => {
    if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
      collision[ty * width + tx] = val;
      background[ty * width + tx] = val;
    }
  };

  const setLumbrite = (tx: number, ty: number, val: number) => {
    if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
      lumbrite[ty * width + tx] = val;
    }
  };

  /** Fill a rectangle of solid tiles */
  const fillRect = (x: number, y: number, w: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        set(x + dx, y + dy, 1);
      }
    }
  };

  // ══════════════════════════════════════════
  // BORDERS (2 tiles thick)
  // ══════════════════════════════════════════
  fillRect(0, 0, width, 2);
  fillRect(0, height - 2, width, 2);
  for (let y = 0; y < height; y++) {
    set(0, y, 1); set(1, y, 1);
    set(width - 1, y, 1); set(width - 2, y, 1);
  }

  // ══════════════════════════════════════════
  // CEILING (irregular, y ≈ 4–8)
  // ══════════════════════════════════════════
  for (let x = 0; x < width; x++) {
    const ceilY = 5 + Math.floor(Math.sin(x * 0.08) * 2 + Math.sin(x * 0.22) * 1);
    for (let y = 0; y <= ceilY; y++) set(x, y, 1);
  }

  // ══════════════════════════════════════════
  // GROUND FLOOR (irregular, y ≈ 74–78)
  // ══════════════════════════════════════════
  for (let x = 0; x < width; x++) {
    const groundY = 76 + Math.floor(Math.sin(x * 0.1) * 2);
    for (let y = groundY; y < height; y++) set(x, y, 1);
  }

  // ══════════════════════════════════════════
  // TIER 2 PLATFORMS (y = 58–59, 2 tiles thick)
  // ══════════════════════════════════════════
  // A — left (spawn side, near first ladder)
  fillRect(10, 58, 22, 2);     // x:10–31
  // B — center-left
  fillRect(40, 58, 22, 2);     // x:40–61
  // C — center-right
  fillRect(70, 58, 28, 2);     // x:70–97
  // D — right
  fillRect(116, 58, 34, 2);    // x:116–149

  // ══════════════════════════════════════════
  // TIER 3 PLATFORMS (y = 38–39, 2 tiles thick)
  // ══════════════════════════════════════════
  // E — left
  fillRect(22, 38, 24, 2);     // x:22–45
  // F — center
  fillRect(54, 38, 28, 2);     // x:54–81
  // G — right
  fillRect(90, 38, 30, 2);     // x:90–119

  // ══════════════════════════════════════════
  // SECRET AREA (y = 20–21, grapple target)
  // ══════════════════════════════════════════
  fillRect(44, 20, 30, 2);     // x:44–73

  // ══════════════════════════════════════════
  // WALLS, PILLARS & OVERHANGS
  // ══════════════════════════════════════════
  // Left wall extension (thick nook)
  fillRect(2, 44, 4, 32);      // x:2–5, y:44–75

  // Pillar between tier 2 B and C (visual + grapple overhang)
  fillRect(64, 46, 4, 12);     // shaft x:64–67, y:46–57
  fillRect(62, 46, 8, 2);      // cap   x:62–69, y:46–47

  // Pillar between tier 2 C and D
  fillRect(106, 50, 4, 8);     // shaft x:106–109, y:50–57
  fillRect(104, 50, 8, 2);     // cap   x:104–111, y:50–51

  // Overhangs for grapple between tier 3 and secret area
  fillRect(48, 26, 3, 6);      // left pillar to secret
  fillRect(70, 26, 3, 6);      // right pillar to secret

  // Right-side stepping stones (ground → tier 2 alternative path)
  fillRect(128, 70, 6, 2);     // x:128–133, y:70–71
  fillRect(138, 66, 6, 2);     // x:138–143, y:66–67
  fillRect(146, 62, 6, 2);     // x:146–151, y:62–63

  // ══════════════════════════════════════════
  // LUMBRITE VEINS
  // ══════════════════════════════════════════
  const lumbriteSpots = [
    { x: 4, y: 52, intensity: 160 },
    { x: 4, y: 54, intensity: 120 },
    { x: 18, y: 59, intensity: 180 },
    { x: 65, y: 50, intensity: 200 },
    { x: 66, y: 52, intensity: 150 },
    { x: 82, y: 59, intensity: 170 },
    { x: 107, y: 52, intensity: 190 },
    { x: 108, y: 54, intensity: 140 },
    { x: 135, y: 76, intensity: 120 },
    { x: 58, y: 20, intensity: 220 },
    { x: 62, y: 21, intensity: 180 },
    { x: 38, y: 5, intensity: 100 },
    { x: 110, y: 5, intensity: 110 },
  ];

  for (const s of lumbriteSpots) {
    setLumbrite(s.x, s.y, s.intensity);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        setLumbrite(s.x + dx, s.y + dy, Math.floor(s.intensity * 0.4));
      }
    }
  }

  // ══════════════════════════════════════════
  // INTERACTIVE OBJECTS (pixel coords)
  // ══════════════════════════════════════════
  const T = TILE_SIZE;
  const objects: LevelObjectDef[] = [
    // --- Ladders: ground ↔ tier 2 ---
    { type: 'ladder', x: 8 * T, y: 58 * T, height: 18 * T },     // left side
    { type: 'ladder', x: 98 * T, y: 58 * T, height: 18 * T },    // right side

    // --- Elevator: ground ↔ tier 2 (center) ---
    { type: 'elevator', x: 52 * T, y: 58 * T, width: 24, height: 6, travelDistance: 18 * T },

    // --- Ladders: tier 2 ↔ tier 3 ---
    { type: 'ladder', x: 28 * T, y: 38 * T, height: 20 * T },    // left
    { type: 'ladder', x: 92 * T, y: 38 * T, height: 20 * T },    // right

    // --- Ropes: tier 2 horizontal connections ---
    { type: 'rope', x: 31 * T, y: 57 * T, width: 9 * T },        // A → B
    { type: 'rope', x: 97 * T, y: 57 * T, width: 19 * T },       // C → D

    // --- Ropes: tier 3 horizontal connections ---
    { type: 'rope', x: 45 * T, y: 37 * T, width: 9 * T },        // E → F
    { type: 'rope', x: 81 * T, y: 37 * T, width: 9 * T },        // F → G
  ];

  // ══════════════════════════════════════════
  // NPCs
  // ══════════════════════════════════════════
  const npcs: NPCData[] = [
    {
      name: 'Old Miner Gregor',
      x: 20 * T,
      y: 58 * T - 14, // stands on tier 2 platform A
      lines: [
        "You shouldn't be down here, stranger.",
        "The lumbrite... it changes you. I've seen it.",
        "There was a girl with the humanitarian group. Bright eyes, full of hope.",
        "They went deeper. Nobody goes that deep and comes back the same.",
        "If you're looking for answers, check the old pneumatic station. Level 3.",
      ],
    },
  ];

  // ══════════════════════════════════════════
  // AREA LIGHTS
  // ══════════════════════════════════════════
  const lights: LightSource[] = [
    // Ground — torch near spawn
    { x: 8 * T, y: 74 * T, radius: 50, color: 0xffbb66, intensity: 0.55, flicker: true },
    // Tier 2 — lamp near Gregor
    { x: 22 * T, y: 56 * T, radius: 45, color: 0xeebb77, intensity: 0.5, flicker: true },
    // Tier 2 — steam glow at elevator
    { x: 54 * T, y: 56 * T, radius: 35, color: 0xccbbaa, intensity: 0.35,
      pulse: { speed: 2.0, amount: 0.15 } },
    // Tier 2 — lamp on platform C
    { x: 82 * T, y: 56 * T, radius: 50, color: 0xddcc99, intensity: 0.55, flicker: true },
    // Tier 2 — torch near right ladder
    { x: 96 * T, y: 56 * T, radius: 40, color: 0xffaa55, intensity: 0.45, flicker: true },
    // Tier 3 — warm glow left
    { x: 34 * T, y: 36 * T, radius: 40, color: 0xdd8855, intensity: 0.4,
      pulse: { speed: 0.8, amount: 0.2 } },
    // Tier 3 — cool light center
    { x: 66 * T, y: 36 * T, radius: 45, color: 0x99aabb, intensity: 0.45 },
    // Tier 3 — torch right
    { x: 108 * T, y: 36 * T, radius: 40, color: 0xffbb66, intensity: 0.4, flicker: true },
    // Secret area — cool lumbrite glow
    { x: 58 * T, y: 18 * T, radius: 55, color: 0x6699cc, intensity: 0.5,
      pulse: { speed: 1.2, amount: 0.15 } },
    // Right stepping stones
    { x: 140 * T, y: 64 * T, radius: 35, color: 0xeebb77, intensity: 0.35, flicker: true },
  ];

  const spawn = { x: 8 * T, y: 74 * T };

  return {
    tilemap: {
      width,
      height,
      collision,
      background,
      foreground: new Array(width * height).fill(0),
      lumbrite,
    },
    objects,
    npcs,
    lights,
    spawn,
  };
}

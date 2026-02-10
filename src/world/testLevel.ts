import { type TileMapData } from '@/world/TileMap';
import { TILE_SIZE } from '@/config/constants';
import { type NPCData } from '@/entities/NPC';

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
  spawn: { x: number; y: number };
}

/**
 * Generate a test level with 8px tiles (160x100 grid = 1280x800 pixels).
 * Includes interactive objects and an NPC.
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

  // Fill borders
  for (let x = 0; x < width; x++) {
    for (let t = 0; t < 2; t++) {
      set(x, t, 1);
      set(x, height - 1 - t, 1);
    }
  }
  for (let y = 0; y < height; y++) {
    for (let t = 0; t < 2; t++) {
      set(t, y, 1);
      set(width - 1 - t, y, 1);
    }
  }

  // Ground layer — irregular floor (doubled from 16px version)
  for (let x = 0; x < width; x++) {
    const groundY = 76 + Math.floor(Math.sin(x * 0.15) * 4);
    for (let y = groundY; y < height; y++) {
      set(x, y, 1);
    }
  }

  // Ceiling
  for (let x = 0; x < width; x++) {
    const ceilY = 4 + Math.floor(Math.sin(x * 0.1 + 1) * 3);
    for (let y = 0; y <= ceilY; y++) {
      set(x, y, 1);
    }
  }

  // Platforms (all coordinates doubled from 16px grid)
  const platforms = [
    { x: 20, y: 68, w: 12 },
    { x: 40, y: 60, w: 10 },
    { x: 56, y: 52, w: 14 },
    { x: 36, y: 44, w: 8 },
    { x: 76, y: 64, w: 16 },
    { x: 100, y: 56, w: 12 },
    { x: 84, y: 48, w: 10 },
    { x: 116, y: 68, w: 14 },
    { x: 130, y: 60, w: 10 },
    { x: 110, y: 40, w: 8 },
  ];

  for (const p of platforms) {
    for (let x = p.x; x < p.x + p.w; x++) {
      set(x, p.y, 1);
      set(x, p.y + 1, 1); // 2-tile thick platforms
    }
  }

  // Walls / pillars (doubled)
  const pillars = [
    { x: 30, y: 60, h: 16 },
    { x: 70, y: 56, h: 20 },
    { x: 110, y: 52, h: 24 },
    { x: 140, y: 64, h: 12 },
  ];

  for (const p of pillars) {
    for (let y = p.y; y < p.y + p.h; y++) {
      set(p.x, y, 1);
      set(p.x + 1, y, 1);
      set(p.x + 2, y, 1);
      set(p.x + 3, y, 1);
    }
  }

  // Lumbrite veins (doubled positions)
  const lumbriteSpots = [
    { x: 30, y: 62, intensity: 180 },
    { x: 32, y: 64, intensity: 120 },
    { x: 70, y: 58, intensity: 200 },
    { x: 72, y: 60, intensity: 150 },
    { x: 110, y: 54, intensity: 220 },
    { x: 112, y: 56, intensity: 160 },
    { x: 2, y: 40, intensity: 100 },
    { x: 3, y: 42, intensity: 80 },
    { x: 158, y: 50, intensity: 140 },
    { x: 56, y: 78, intensity: 100 },
    { x: 100, y: 76, intensity: 130 },
    { x: 130, y: 74, intensity: 110 },
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

  // --- Interactive objects (pixel coords) ---
  const objects: LevelObjectDef[] = [
    // Steam elevator near the first pillar
    { type: 'elevator', x: 34 * TILE_SIZE, y: 52 * TILE_SIZE, width: 24, height: 6, travelDistance: 80 },
    // Ladder on the tall pillar
    { type: 'ladder', x: 110 * TILE_SIZE, y: 36 * TILE_SIZE, height: 16 * TILE_SIZE },
    // Rope between platforms
    { type: 'rope', x: 56 * TILE_SIZE, y: 42 * TILE_SIZE, width: 20 * TILE_SIZE },
  ];

  // --- NPCs ---
  const npcs: NPCData[] = [
    {
      name: 'Old Miner Gregor',
      x: 24 * TILE_SIZE,
      y: 68 * TILE_SIZE - 14, // stand on platform
      lines: [
        "You shouldn't be down here, stranger.",
        "The lumbrite... it changes you. I've seen it.",
        "There was a girl with the humanitarian group. Bright eyes, full of hope.",
        "They went deeper. Nobody goes that deep and comes back the same.",
        "If you're looking for answers, check the old pneumatic station. Level 3.",
      ],
    },
  ];

  const spawn = { x: 10 * TILE_SIZE, y: 68 * TILE_SIZE };

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
    spawn,
  };
}

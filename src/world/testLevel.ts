import { type TileMapData } from '@/world/TileMap';

/**
 * Generate a simple cave-like test level for development.
 * This will be replaced by Tiled map loading later.
 */
export function generateTestLevel(): TileMapData {
  const width = 80;
  const height = 50;
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
    set(x, 0, 1);
    set(x, height - 1, 1);
  }
  for (let y = 0; y < height; y++) {
    set(0, y, 1);
    set(width - 1, y, 1);
  }

  // Ground layer - irregular floor
  for (let x = 0; x < width; x++) {
    const groundY = 38 + Math.floor(Math.sin(x * 0.3) * 2);
    for (let y = groundY; y < height; y++) {
      set(x, y, 1);
    }
  }

  // Ceiling
  for (let x = 0; x < width; x++) {
    const ceilY = 2 + Math.floor(Math.sin(x * 0.2 + 1) * 1.5);
    for (let y = 0; y <= ceilY; y++) {
      set(x, y, 1);
    }
  }

  // Platforms
  const platforms = [
    { x: 10, y: 34, w: 6 },
    { x: 20, y: 30, w: 5 },
    { x: 28, y: 26, w: 7 },
    { x: 18, y: 22, w: 4 },
    { x: 38, y: 32, w: 8 },
    { x: 50, y: 28, w: 6 },
    { x: 42, y: 24, w: 5 },
    { x: 58, y: 34, w: 7 },
    { x: 65, y: 30, w: 5 },
    { x: 55, y: 20, w: 4 },
  ];

  for (const p of platforms) {
    for (let x = p.x; x < p.x + p.w; x++) {
      set(x, p.y, 1);
    }
  }

  // Walls / pillars
  const pillars = [
    { x: 15, y: 30, h: 8 },
    { x: 35, y: 28, h: 10 },
    { x: 55, y: 26, h: 12 },
    { x: 70, y: 32, h: 6 },
  ];

  for (const p of pillars) {
    for (let y = p.y; y < p.y + p.h; y++) {
      set(p.x, y, 1);
      set(p.x + 1, y, 1);
    }
  }

  // Lumbrite veins in walls — scattered glowing spots
  const lumbriteSpots = [
    { x: 15, y: 31, intensity: 180 },
    { x: 16, y: 32, intensity: 120 },
    { x: 35, y: 29, intensity: 200 },
    { x: 36, y: 30, intensity: 150 },
    { x: 55, y: 27, intensity: 220 },
    { x: 56, y: 28, intensity: 160 },
    { x: 0, y: 20, intensity: 100 },
    { x: 1, y: 21, intensity: 80 },
    { x: 79, y: 25, intensity: 140 },
    { x: 28, y: 39, intensity: 100 },
    { x: 50, y: 38, intensity: 130 },
    { x: 65, y: 37, intensity: 110 },
  ];

  for (const s of lumbriteSpots) {
    setLumbrite(s.x, s.y, s.intensity);
    // Spread glow to neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        setLumbrite(s.x + dx, s.y + dy, Math.floor(s.intensity * 0.4));
      }
    }
  }

  return {
    width,
    height,
    collision,
    background,
    foreground: new Array(width * height).fill(0),
    lumbrite,
  };
}

/** Player spawn position in the test level (in pixels) */
export const TEST_SPAWN = { x: 5 * 16, y: 34 * 16 };

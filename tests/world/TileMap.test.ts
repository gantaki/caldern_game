import { describe, it, expect } from 'vitest';
import { TileMap, type TileMapData } from '@/world/TileMap';
import { TILE_SIZE } from '@/config/constants';

function createSimpleMap(width: number, height: number, solidTiles: [number, number][]): TileMap {
  const collision = new Array(width * height).fill(0);
  for (const [tx, ty] of solidTiles) {
    collision[ty * width + tx] = 1;
  }
  const data: TileMapData = {
    width,
    height,
    collision,
    background: new Array(width * height).fill(0),
    foreground: new Array(width * height).fill(0),
    lumbrite: new Array(width * height).fill(0),
  };
  return new TileMap(data);
}

describe('TileMap', () => {
  it('reports correct pixel dimensions', () => {
    const map = createSimpleMap(10, 8, []);
    expect(map.pixelWidth).toBe(10 * TILE_SIZE);
    expect(map.pixelHeight).toBe(8 * TILE_SIZE);
  });

  it('detects solid tiles', () => {
    const map = createSimpleMap(5, 5, [[2, 3]]);
    expect(map.isSolid(2, 3)).toBe(true);
    expect(map.isSolid(0, 0)).toBe(false);
  });

  it('out of bounds is solid', () => {
    const map = createSimpleMap(5, 5, []);
    expect(map.isSolid(-1, 0)).toBe(true);
    expect(map.isSolid(5, 0)).toBe(true);
    expect(map.isSolid(0, -1)).toBe(true);
    expect(map.isSolid(0, 5)).toBe(true);
  });

  it('converts pixel to tile coords', () => {
    const map = createSimpleMap(10, 10, []);
    // 3 * TILE_SIZE = 24 when TILE_SIZE=8, so pixel 24 -> tile 3
    expect(map.pixelToTile(3 * TILE_SIZE, 6 * TILE_SIZE)).toEqual({ tx: 3, ty: 6 });
    expect(map.pixelToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
  });

  it('detects rect overlap with solid tiles', () => {
    const map = createSimpleMap(10, 10, [[3, 3]]);
    // Tile (3,3) is at pixels (3*TS, 3*TS) to (4*TS, 4*TS)
    const px = 3 * TILE_SIZE + 2;
    const py = 3 * TILE_SIZE + 2;
    expect(map.rectOverlapsSolid(px, py, 4, 4)).toBe(true);
    // Rect not overlapping any solid
    expect(map.rectOverlapsSolid(0, 0, 4, 4)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { TileMap, type TileMapData } from '@/world/TileMap';

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
    expect(map.pixelWidth).toBe(160);
    expect(map.pixelHeight).toBe(128);
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
    expect(map.pixelToTile(24, 48)).toEqual({ tx: 1, ty: 3 });
    expect(map.pixelToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
  });

  it('detects rect overlap with solid tiles', () => {
    const map = createSimpleMap(10, 10, [[3, 3]]);
    // Rect overlapping tile (3,3) which is at pixels (48,48)-(64,64)
    expect(map.rectOverlapsSolid(50, 50, 8, 8)).toBe(true);
    // Rect not overlapping any solid
    expect(map.rectOverlapsSolid(0, 0, 8, 8)).toBe(false);
  });
});

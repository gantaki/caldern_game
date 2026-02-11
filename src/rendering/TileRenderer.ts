import { type Graphics } from 'pixi.js';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '@/config/constants';
import { type TileMap } from '@/world/TileMap';

/** Simple deterministic hash for tile position → variation */
function tileHash(tx: number, ty: number, seed: number = 0): number {
  let h = (tx * 374761393 + ty * 668265263 + seed) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (color & 0xff) * (1 - amount)) | 0;
  return (r << 16) | (g << 8) | b;
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * amount) | 0;
  const g = Math.min(255, ((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * amount) | 0;
  const b = Math.min(255, (color & 0xff) + (255 - (color & 0xff)) * amount) | 0;
  return (r << 16) | (g << 8) | b;
}

/**
 * Optimized single-pass tile renderer.
 * Reduced per-tile draw calls: base + 1-2 edge highlights + rare detail = max ~4 draws/tile.
 */
export class TileRenderer {
  private tileMap: TileMap;

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
  }

  render(gfx: Graphics, camX: number, camY: number): void {
    gfx.clear();

    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE));
    const startTy = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endTy = Math.min(this.tileMap.height - 1, Math.ceil((camY + GAME_HEIGHT) / TILE_SIZE));

    const w = this.tileMap.width;

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * w + tx;
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (this.tileMap.collision[idx]) {
          const lumVal = this.tileMap.lumbrite[idx] ?? 0;
          if (lumVal > 0) {
            this.renderLumbrite(gfx, tx, ty, px, py, lumVal);
          } else {
            this.renderStone(gfx, tx, ty, px, py);
          }
        } else {
          this.renderEmpty(gfx, tx, ty, px, py);
        }
      }
    }
  }

  private renderEmpty(gfx: Graphics, tx: number, ty: number, px: number, py: number): void {
    const h = tileHash(tx, ty, 99);
    const v = (h % 3) - 1;
    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(((0x0a + v) << 16) | ((0x0a + v) << 8) | (0x0f + v * 2));

    // One shadow edge near solid walls
    if (this.tileMap.isSolid(tx, ty - 1)) {
      gfx.rect(px, py, TILE_SIZE, 1).fill(0x050508);
    } else if (this.tileMap.isSolid(tx - 1, ty)) {
      gfx.rect(px, py, 1, TILE_SIZE).fill(0x060609);
    }
  }

  private renderStone(gfx: Graphics, tx: number, ty: number, px: number, py: number): void {
    const h = tileHash(tx, ty, 0);
    const baseColor = ((0x1a + (h % 6) - 3) << 16) | ((0x1a + ((h >> 3) % 6) - 3) << 8) | (0x22 + ((h >> 6) % 6) - 3);

    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(baseColor);

    const openTop = !this.tileMap.isSolid(tx, ty - 1);
    const openBottom = !this.tileMap.isSolid(tx, ty + 1);

    if (openTop) {
      gfx.rect(px, py, TILE_SIZE, 1).fill(lighten(baseColor, 0.25));
      // Rare moss
      if (h % 7 === 0) gfx.rect(px + (h >> 2) % 5, py, 2, 1).fill(0x1a2a1a);
    }
    if (openBottom) {
      gfx.rect(px, py + TILE_SIZE - 1, TILE_SIZE, 1).fill(darken(baseColor, 0.2));
      // Rare stalactite
      if (h % 11 === 0) gfx.rect(px + 2 + (h >> 3) % 4, py + TILE_SIZE, 1, 1 + h % 2).fill(0x161620);
    }
  }

  private renderLumbrite(gfx: Graphics, tx: number, ty: number, px: number, py: number, intensity: number): void {
    const t = intensity / 255;
    const h = tileHash(tx, ty, 0);
    const baseColor = ((0x1a + (0x33 - 0x1a) * t) << 16) | ((0x1a + (0x66 - 0x1a) * t) << 8) | (0x22 + (0xaa - 0x22) * t);

    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(baseColor);

    if (!this.tileMap.isSolid(tx, ty - 1)) {
      gfx.rect(px, py, TILE_SIZE, 1).fill(lighten(baseColor, 0.3));
    }

    // One crystal vein
    const vh = tileHash(tx, ty, 50);
    const vx = px + 1 + vh % (TILE_SIZE - 3);
    const vy = py + 1 + (vh >> 3) % (TILE_SIZE - 3);
    const veinColor = lighten(baseColor, 0.4 + t * 0.2);
    gfx.rect(vx, vy, (vh >> 5) % 2 === 0 ? 2 : 1, (vh >> 5) % 2 === 0 ? 1 : 2).fill(veinColor);

    if (intensity > 100 && h % 5 === 0) {
      gfx.rect(px + 2 + h % 4, py + 2 + (h >> 4) % 4, 1, 1).fill(lighten(baseColor, 0.7));
    }
  }
}

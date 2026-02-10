import { type Graphics } from 'pixi.js';
import { TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '@/config/constants';
import { type TileMap } from '@/world/TileMap';

/** Simple deterministic hash for tile position → variation */
function tileHash(tx: number, ty: number, seed: number = 0): number {
  let h = (tx * 374761393 + ty * 668265263 + seed) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

/** Darken a hex color by a fraction (0-1) */
function darken(color: number, amount: number): number {
  const r = Math.max(0, Math.floor(((color >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((color >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((color & 0xff) * (1 - amount)));
  return (r << 16) | (g << 8) | b;
}

/** Lighten a hex color by a fraction */
function lighten(color: number, amount: number): number {
  const r = Math.min(255, Math.floor(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.floor(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.floor((color & 0xff) + (255 - (color & 0xff)) * amount));
  return (r << 16) | (g << 8) | b;
}

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

    // First pass: background (empty tiles)
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * this.tileMap.width + tx;
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (!this.tileMap.collision[idx]) {
          this.renderEmpty(gfx, tx, ty, px, py);
        }
      }
    }

    // Second pass: solid tiles (on top of background)
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * this.tileMap.width + tx;
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (this.tileMap.collision[idx]) {
          const lumVal = this.tileMap.lumbrite[idx] ?? 0;
          if (lumVal > 0) {
            this.renderLumbrite(gfx, tx, ty, px, py, lumVal);
          } else {
            this.renderStone(gfx, tx, ty, px, py);
          }
        }
      }
    }

    // Third pass: edge details (stalactites, cracks, moss)
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * this.tileMap.width + tx;
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (this.tileMap.collision[idx]) {
          this.renderEdgeDetails(gfx, tx, ty, px, py);
        }
      }
    }
  }

  private renderEmpty(gfx: Graphics, tx: number, ty: number, px: number, py: number): void {
    const h = tileHash(tx, ty, 99);
    // Vary background color very slightly
    const variation = (h % 3) - 1; // -1, 0, or 1
    const r = Math.max(0, Math.min(255, 0x0a + variation));
    const g = Math.max(0, Math.min(255, 0x0a + variation));
    const b = Math.max(0, Math.min(255, 0x0f + variation * 2));
    const bgColor = (r << 16) | (g << 8) | b;
    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(bgColor);

    // Occasional background rock detail (very subtle, distant formations)
    if (h % 17 === 0) {
      const detailColor = 0x0e0e14;
      const dx = h % 5;
      const dy = (h >> 4) % 5;
      gfx.rect(px + dx, py + dy, 2, 1).fill(detailColor);
    }

    // Near solid walls, draw subtle depth shadow
    const solidLeft = this.tileMap.isSolid(tx - 1, ty);
    const solidRight = this.tileMap.isSolid(tx + 1, ty);
    const solidUp = this.tileMap.isSolid(tx, ty - 1);
    const solidDown = this.tileMap.isSolid(tx, ty + 1);

    if (solidLeft) {
      gfx.rect(px, py, 1, TILE_SIZE).fill(0x060609);
    }
    if (solidRight) {
      gfx.rect(px + TILE_SIZE - 1, py, 1, TILE_SIZE).fill(0x060609);
    }
    if (solidUp) {
      gfx.rect(px, py, TILE_SIZE, 1).fill(0x050508);
    }
    if (solidDown) {
      gfx.rect(px, py + TILE_SIZE - 1, TILE_SIZE, 1).fill(0x080810);
    }
  }

  private renderStone(gfx: Graphics, tx: number, ty: number, px: number, py: number): void {
    const h = tileHash(tx, ty, 0);

    // Base stone color with variation
    const baseR = 0x1a + (h % 6) - 3;
    const baseG = 0x1a + ((h >> 3) % 6) - 3;
    const baseB = 0x22 + ((h >> 6) % 6) - 3;
    const baseColor = (baseR << 16) | (baseG << 8) | baseB;

    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(baseColor);

    // Edge awareness
    const openTop = !this.tileMap.isSolid(tx, ty - 1);
    const openBottom = !this.tileMap.isSolid(tx, ty + 1);
    const openLeft = !this.tileMap.isSolid(tx - 1, ty);
    const openRight = !this.tileMap.isSolid(tx + 1, ty);

    // Top edge highlight (surface exposed to cave air)
    if (openTop) {
      gfx.rect(px, py, TILE_SIZE, 1).fill(lighten(baseColor, 0.25));
    }
    // Bottom edge shadow
    if (openBottom) {
      gfx.rect(px, py + TILE_SIZE - 1, TILE_SIZE, 1).fill(darken(baseColor, 0.2));
    }
    // Left edge
    if (openLeft) {
      gfx.rect(px, py, 1, TILE_SIZE).fill(lighten(baseColor, 0.12));
    }
    // Right edge shadow
    if (openRight) {
      gfx.rect(px + TILE_SIZE - 1, py, 1, TILE_SIZE).fill(darken(baseColor, 0.12));
    }

    // Inner corner shadows (where two open edges meet)
    if (openTop && openLeft) {
      gfx.rect(px, py, 1, 1).fill(lighten(baseColor, 0.35));
    }
    if (openTop && openRight) {
      gfx.rect(px + TILE_SIZE - 1, py, 1, 1).fill(lighten(baseColor, 0.18));
    }

    // Stone texture: small specks/mineral deposits
    const specks = (h >> 9) % 3;
    for (let s = 0; s < specks; s++) {
      const sx = px + 1 + tileHash(tx, ty, 10 + s) % (TILE_SIZE - 2);
      const sy = py + 1 + tileHash(tx, ty, 20 + s) % (TILE_SIZE - 2);
      const speckColor = (tileHash(tx, ty, 30 + s) % 2 === 0)
        ? lighten(baseColor, 0.15)
        : darken(baseColor, 0.15);
      gfx.rect(sx, sy, 1, 1).fill(speckColor);
    }

    // Occasional crack line
    if (h % 23 === 0) {
      const crackDir = (h >> 4) % 2; // 0=horizontal, 1=vertical
      const crackColor = darken(baseColor, 0.3);
      if (crackDir === 0) {
        const cy = py + 2 + (h >> 5) % (TILE_SIZE - 4);
        const cw = 2 + (h >> 7) % 3;
        const cx = px + (h >> 8) % (TILE_SIZE - cw);
        gfx.rect(cx, cy, cw, 1).fill(crackColor);
      } else {
        const cx = px + 2 + (h >> 5) % (TILE_SIZE - 4);
        const ch = 2 + (h >> 7) % 3;
        const cy = py + (h >> 8) % (TILE_SIZE - ch);
        gfx.rect(cx, cy, 1, ch).fill(crackColor);
      }
    }
  }

  private renderLumbrite(gfx: Graphics, tx: number, ty: number, px: number, py: number, intensity: number): void {
    const t = intensity / 255;
    const h = tileHash(tx, ty, 0);

    // Base lumbrite color — bluish-green mineral
    const r = Math.floor(0x1a + (0x33 - 0x1a) * t);
    const g = Math.floor(0x1a + (0x66 - 0x1a) * t);
    const b = Math.floor(0x22 + (0xaa - 0x22) * t);
    const baseColor = (r << 16) | (g << 8) | b;

    gfx.rect(px, py, TILE_SIZE, TILE_SIZE).fill(baseColor);

    // Edge awareness
    const openTop = !this.tileMap.isSolid(tx, ty - 1);
    const openBottom = !this.tileMap.isSolid(tx, ty + 1);
    const openLeft = !this.tileMap.isSolid(tx - 1, ty);
    const openRight = !this.tileMap.isSolid(tx + 1, ty);

    if (openTop) gfx.rect(px, py, TILE_SIZE, 1).fill(lighten(baseColor, 0.3));
    if (openBottom) gfx.rect(px, py + TILE_SIZE - 1, TILE_SIZE, 1).fill(darken(baseColor, 0.15));
    if (openLeft) gfx.rect(px, py, 1, TILE_SIZE).fill(lighten(baseColor, 0.15));
    if (openRight) gfx.rect(px + TILE_SIZE - 1, py, 1, TILE_SIZE).fill(darken(baseColor, 0.1));

    // Lumbrite crystal veins — bright lines within the mineral
    const veinColor = lighten(baseColor, 0.4 + t * 0.2);
    const veinCount = 1 + (h % 2);
    for (let v = 0; v < veinCount; v++) {
      const vh = tileHash(tx, ty, 50 + v);
      const vx = px + 1 + vh % (TILE_SIZE - 3);
      const vy = py + 1 + (vh >> 3) % (TILE_SIZE - 3);
      const vLen = 2 + vh % 2;
      const vDir = (vh >> 5) % 2;
      if (vDir === 0) {
        gfx.rect(vx, vy, vLen, 1).fill(veinColor);
      } else {
        gfx.rect(vx, vy, 1, vLen).fill(veinColor);
      }
    }

    // Bright sparkle point at high intensity
    if (intensity > 100 && h % 5 === 0) {
      const sx = px + 2 + h % (TILE_SIZE - 4);
      const sy = py + 2 + (h >> 4) % (TILE_SIZE - 4);
      gfx.rect(sx, sy, 1, 1).fill(lighten(baseColor, 0.7));
    }
  }

  private renderEdgeDetails(gfx: Graphics, tx: number, ty: number, px: number, py: number): void {
    const h = tileHash(tx, ty, 77);

    const openTop = !this.tileMap.isSolid(tx, ty - 1);
    const openBottom = !this.tileMap.isSolid(tx, ty + 1);

    // Stalactites: small triangular bumps hanging from bottom of ceiling tiles
    if (openBottom && h % 7 === 0) {
      const stalLen = 1 + h % 3; // 1-3 pixels long
      const stalX = px + 2 + (h >> 3) % (TILE_SIZE - 4);
      for (let d = 0; d < stalLen; d++) {
        const w = Math.max(1, stalLen - d);
        const sx = stalX - Math.floor(w / 2);
        gfx.rect(sx, py + TILE_SIZE + d, w, 1).fill(0x161620);
      }
    }

    // Stalagmites: small bumps rising from top of floor tiles
    if (openTop && h % 9 === 0) {
      const stagLen = 1 + (h >> 2) % 2;
      const stagX = px + 1 + (h >> 4) % (TILE_SIZE - 2);
      for (let d = 0; d < stagLen; d++) {
        const w = Math.max(1, stagLen - d);
        const sx = stagX - Math.floor(w / 2);
        gfx.rect(sx, py - 1 - d, w, 1).fill(0x181824);
      }
    }

    // Moss on exposed top surfaces (green-ish tint)
    if (openTop && h % 5 === 0) {
      const mossX = px + (h >> 2) % (TILE_SIZE - 2);
      const mossW = 1 + (h >> 5) % 3;
      gfx.rect(mossX, py, Math.min(mossW, TILE_SIZE - (mossX - px)), 1).fill(0x1a2a1a);
    }
  }
}

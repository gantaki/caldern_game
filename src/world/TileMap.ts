import { TILE_SIZE } from '@/config/constants';

export interface TileMapData {
  width: number;   // in tiles
  height: number;  // in tiles
  collision: number[];   // 0 = empty, 1 = solid
  background: number[];  // tile indices for background layer
  foreground: number[];  // tile indices for foreground layer
  lumbrite: number[];    // lumbrite intensity per tile (0-255)
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly collision: number[];
  readonly background: number[];
  readonly foreground: number[];
  readonly lumbrite: number[];

  constructor(data: TileMapData) {
    this.width = data.width;
    this.height = data.height;
    this.collision = data.collision;
    this.background = data.background;
    this.foreground = data.foreground;
    this.lumbrite = data.lumbrite;
  }

  /** Pixel dimensions */
  get pixelWidth(): number { return this.width * TILE_SIZE; }
  get pixelHeight(): number { return this.height * TILE_SIZE; }

  /** Get tile index from tile coordinates */
  private index(tx: number, ty: number): number | undefined {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return undefined;
    return ty * this.width + tx;
  }

  /** Is this tile solid? Out-of-bounds = solid */
  isSolid(tx: number, ty: number): boolean {
    const idx = this.index(tx, ty);
    if (idx === undefined) return true;
    return this.collision[idx] !== 0;
  }

  /** Get lumbrite intensity at tile */
  getLumbrite(tx: number, ty: number): number {
    const idx = this.index(tx, ty);
    if (idx === undefined) return 0;
    return this.lumbrite[idx] ?? 0;
  }

  /** Convert pixel coords to tile coords */
  pixelToTile(px: number, py: number): { tx: number; ty: number } {
    return {
      tx: Math.floor(px / TILE_SIZE),
      ty: Math.floor(py / TILE_SIZE),
    };
  }

  /** Is a pixel-space rect colliding with any solid tile? */
  rectOverlapsSolid(x: number, y: number, w: number, h: number): boolean {
    const startTx = Math.floor(x / TILE_SIZE);
    const endTx = Math.floor((x + w - 0.001) / TILE_SIZE);
    const startTy = Math.floor(y / TILE_SIZE);
    const endTy = Math.floor((y + h - 0.001) / TILE_SIZE);

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        if (this.isSolid(tx, ty)) return true;
      }
    }
    return false;
  }
}

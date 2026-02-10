import { type Graphics } from 'pixi.js';
import { InteractiveObject } from './InteractiveObject';
import { TILE_SIZE } from '@/config/constants';

export class Ladder extends InteractiveObject {
  constructor(x: number, y: number, height: number) {
    super('ladder', x, y, TILE_SIZE, height);
  }

  update(_dt: number): void {
    // Ladders are static
  }

  render(gfx: Graphics): void {
    const railW = 2;
    const rungSpacing = 6;

    // Left rail shadow
    gfx.rect(this.x + 1, this.y + 1, railW, this.height).fill(0x332211);
    // Right rail shadow
    gfx.rect(this.x + this.width - railW + 1, this.y + 1, railW, this.height).fill(0x332211);

    // Left rail
    gfx.rect(this.x, this.y, railW, this.height).fill(0x775533);
    // Left rail highlight
    gfx.rect(this.x, this.y, 1, this.height).fill(0x886644);
    // Right rail
    gfx.rect(this.x + this.width - railW, this.y, railW, this.height).fill(0x775533);
    // Right rail shadow edge
    gfx.rect(this.x + this.width - 1, this.y, 1, this.height).fill(0x664422);

    // Rungs with bolt detail
    let rungIdx = 0;
    for (let ry = this.y + rungSpacing; ry < this.y + this.height; ry += rungSpacing) {
      // Rung shadow
      gfx.rect(this.x + railW, ry + 1, this.width - railW * 2, 1).fill(0x443311);
      // Rung
      gfx.rect(this.x + railW, ry, this.width - railW * 2, 1).fill(0x996644);
      // Alternating rung shade for depth
      if (rungIdx % 2 === 0) {
        gfx.rect(this.x + railW, ry, this.width - railW * 2, 1).fill(0x8a5c3a);
      }
      // Bolt at rail-rung junction
      gfx.rect(this.x + railW - 1, ry, 1, 1).fill(0xaa8855);
      gfx.rect(this.x + this.width - railW, ry, 1, 1).fill(0xaa8855);
      rungIdx++;
    }

    // Top mounting bracket
    gfx.rect(this.x - 1, this.y, this.width + 2, 1).fill(0x555544);
    // Bottom mounting bracket
    gfx.rect(this.x - 1, this.y + this.height - 1, this.width + 2, 1).fill(0x555544);
  }
}

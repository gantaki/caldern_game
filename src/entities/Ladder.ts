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

    // Left rail
    gfx.rect(this.x, this.y, railW, this.height).fill(0x775533);
    // Right rail
    gfx.rect(this.x + this.width - railW, this.y, railW, this.height).fill(0x775533);

    // Rungs
    for (let ry = this.y + rungSpacing; ry < this.y + this.height; ry += rungSpacing) {
      gfx.rect(this.x + railW, ry, this.width - railW * 2, 1).fill(0x996644);
    }
  }
}

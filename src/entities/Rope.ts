import { type Graphics } from 'pixi.js';
import { InteractiveObject } from './InteractiveObject';

export class Rope extends InteractiveObject {
  constructor(x: number, y: number, ropeWidth: number) {
    super('rope', x, y, ropeWidth, 6);
  }

  update(_dt: number): void {
    // Ropes are static
  }

  render(gfx: Graphics): void {
    // Main rope line
    gfx.rect(this.x, this.y + 2, this.width, 2).fill(0x998866);
    // Anchor points at ends
    gfx.circle(this.x, this.y + 3, 3).fill(0x666655);
    gfx.circle(this.x + this.width, this.y + 3, 3).fill(0x666655);
    // Middle knot
    const midX = this.x + this.width / 2;
    gfx.rect(midX - 1, this.y + 3, 2, 1).fill(0x887755);
  }
}

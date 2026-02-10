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
    const midX = this.x + this.width / 2;

    // Rope shadow (offset 1px down)
    gfx.rect(this.x + 2, this.y + 3, this.width - 4, 2).fill(0x332211);

    // Rope sag — draw in segments that sag slightly toward middle
    const segments = Math.max(4, Math.floor(this.width / 8));
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const sx = this.x + t0 * this.width;
      const ex = this.x + t1 * this.width;
      // Parabolic sag: max 2px at center
      const sagMid = 2 * (1 - Math.abs(((t0 + t1) / 2) - 0.5) * 2);
      const sag = Math.floor(sagMid * sagMid * 0.5);
      gfx.rect(Math.floor(sx), this.y + 2 + sag, Math.ceil(ex - sx), 2).fill(0x998866);
      // Rope highlight on top
      gfx.rect(Math.floor(sx), this.y + 2 + sag, Math.ceil(ex - sx), 1).fill(0xaa9977);
    }

    // Left anchor — metal bracket
    gfx.rect(this.x - 2, this.y, 4, 2).fill(0x555544);
    gfx.rect(this.x - 1, this.y + 2, 2, 4).fill(0x666655);
    gfx.rect(this.x - 2, this.y + 1, 1, 3).fill(0x777766); // bolt

    // Right anchor — metal bracket
    gfx.rect(this.x + this.width - 2, this.y, 4, 2).fill(0x555544);
    gfx.rect(this.x + this.width - 1, this.y + 2, 2, 4).fill(0x666655);
    gfx.rect(this.x + this.width + 1, this.y + 1, 1, 3).fill(0x777766);

    // Knots along the rope for grip
    const knotSpacing = Math.floor(this.width / 5);
    for (let k = 1; k <= 4; k++) {
      const kx = this.x + k * knotSpacing;
      gfx.rect(kx - 1, this.y + 1, 2, 3).fill(0x887755);
    }

    // Frayed fibers at middle
    gfx.rect(midX, this.y + 1, 1, 1).fill(0xbbaa88);
    gfx.rect(midX - 2, this.y + 4, 1, 1).fill(0x887755);
    gfx.rect(midX + 2, this.y + 4, 1, 1).fill(0x887755);
  }
}

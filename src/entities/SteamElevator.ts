import { type Graphics } from 'pixi.js';
import { InteractiveObject } from './InteractiveObject';
import { ELEVATOR_SPEED } from '@/config/constants';

export class SteamElevator extends InteractiveObject {
  private minY: number;
  private maxY: number;
  private direction = 1; // 1 = down, -1 = up
  private steamTimer = 0;
  active = false;

  constructor(x: number, y: number, width: number, height: number, travelDistance: number) {
    super('elevator', x, y, width, height);
    this.minY = y;
    this.maxY = y + travelDistance;
  }

  activate(): void {
    this.active = true;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.steamTimer += dt;
    this.y += this.direction * ELEVATOR_SPEED * dt;

    if (this.y >= this.maxY) {
      this.y = this.maxY;
      this.direction = -1;
    } else if (this.y <= this.minY) {
      this.y = this.minY;
      this.direction = 1;
    }
  }

  render(gfx: Graphics): void {
    const cx = this.x + this.width / 2;

    // Guide rails on sides
    gfx.rect(this.x - 2, this.minY - 4, 2, this.maxY - this.minY + this.height + 8).fill(0x333328);
    gfx.rect(this.x + this.width, this.minY - 4, 2, this.maxY - this.minY + this.height + 8).fill(0x333328);

    // Rail bolts
    for (let by = this.minY; by < this.maxY + this.height; by += 12) {
      gfx.rect(this.x - 2, by, 2, 1).fill(0x555544);
      gfx.rect(this.x + this.width, by, 2, 1).fill(0x555544);
    }

    // Platform base (metal)
    gfx.rect(this.x, this.y + 2, this.width, this.height - 2).fill(0x554433);
    // Platform top surface (lighter)
    gfx.rect(this.x, this.y, this.width, 2).fill(0x999888);
    // Platform edge highlight
    gfx.rect(this.x, this.y, this.width, 1).fill(0xaaa999);

    // Rivets on platform
    gfx.rect(this.x + 2, this.y + 3, 1, 1).fill(0x777766);
    gfx.rect(this.x + this.width - 3, this.y + 3, 1, 1).fill(0x777766);
    gfx.rect(cx - 1, this.y + 3, 1, 1).fill(0x777766);

    // Platform underside shadow
    gfx.rect(this.x + 1, this.y + this.height, this.width - 2, 1).fill(0x221a12);

    // Steam vents when active
    if (this.active) {
      const phase = Math.sin(this.steamTimer * 8);
      const puff1Y = this.y + this.height + 1 + Math.abs(phase) * 3;
      const puff2Y = this.y + this.height + 2 + Math.abs(Math.cos(this.steamTimer * 6)) * 4;
      gfx.rect(this.x + 4, Math.floor(puff1Y), 2, 1).fill(0x888888);
      gfx.rect(this.x + this.width - 6, Math.floor(puff2Y), 2, 1).fill(0x888888);
      // Central steam puff
      gfx.rect(cx - 1, Math.floor(this.y + this.height + Math.abs(phase) * 2), 2, 2).fill(0xaaaaaa);
    } else {
      // Inactive indicator — dormant pipe
      gfx.rect(cx - 2, this.y + this.height, 4, 2).fill(0x443322);
    }
  }
}

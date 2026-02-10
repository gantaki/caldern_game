import { type Graphics } from 'pixi.js';
import { InteractiveObject } from './InteractiveObject';
import { ELEVATOR_SPEED } from '@/config/constants';

export class SteamElevator extends InteractiveObject {
  private minY: number;
  private maxY: number;
  private direction = 1; // 1 = down, -1 = up
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
    gfx.rect(this.x, this.y, this.width, this.height).fill(0x665544);
    gfx.rect(this.x, this.y, this.width, 2).fill(0x888877);
    if (this.active) {
      gfx.circle(this.x + this.width / 2, this.y - 3, 2).fill(0xcccccc);
    }
  }
}

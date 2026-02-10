import { GRAVITY } from '@/config/constants';

export class Body {
  x: number;
  y: number;
  width: number;
  height: number;
  vx = 0;
  vy = 0;
  gravityScale = 1;
  onGround = false;
  onCeiling = false;
  onWallLeft = false;
  onWallRight = false;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /** Get the bounding box edges */
  get left(): number { return this.x; }
  get right(): number { return this.x + this.width; }
  get top(): number { return this.y; }
  get bottom(): number { return this.y + this.height; }
  get centerX(): number { return this.x + this.width / 2; }
  get centerY(): number { return this.y + this.height / 2; }

  /** Apply gravity and advance position */
  integrate(dt: number): void {
    this.vy += GRAVITY * this.gravityScale * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

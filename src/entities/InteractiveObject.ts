import { type Graphics } from 'pixi.js';
import { type Body } from '@/physics/Body';
import { INTERACT_RANGE } from '@/config/constants';
import { aabbOverlap, type AABB } from '@/utils/math';

export type ObjectType = 'elevator' | 'ladder' | 'rope';

export abstract class InteractiveObject {
  readonly type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(type: ObjectType, x: number, y: number, width: number, height: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get aabb(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  overlaps(body: Body): boolean {
    return aabbOverlap(
      { x: body.x, y: body.y, width: body.width, height: body.height },
      this.aabb,
    );
  }

  inRange(body: Body): boolean {
    const cx = body.x + body.width / 2;
    const cy = body.y + body.height / 2;
    const ox = this.x + this.width / 2;
    const oy = this.y + this.height / 2;
    const dx = cx - ox;
    const dy = cy - oy;
    return Math.sqrt(dx * dx + dy * dy) < INTERACT_RANGE + Math.max(this.width, this.height) / 2;
  }

  abstract update(dt: number): void;
  abstract render(gfx: Graphics): void;
}

import { lerp, clamp, type Vec2 } from '@/utils/math';
import { GAME_WIDTH, GAME_HEIGHT, CAMERA_LERP } from '@/config/constants';

export class Camera {
  x = 0;
  y = 0;

  // World bounds (set when loading a map)
  boundsMinX = -Infinity;
  boundsMinY = -Infinity;
  boundsMaxX = Infinity;
  boundsMaxY = Infinity;

  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;

  get halfWidth(): number {
    return GAME_WIDTH / 2;
  }

  get halfHeight(): number {
    return GAME_HEIGHT / 2;
  }

  /** Set camera world bounds (in pixels) */
  setBounds(x: number, y: number, width: number, height: number): void {
    this.boundsMinX = x;
    this.boundsMinY = y;
    this.boundsMaxX = x + width;
    this.boundsMaxY = y + height;
  }

  /** Smoothly follow a target position */
  follow(target: Vec2, dt: number): void {
    const lerpFactor = 1 - Math.pow(1 - CAMERA_LERP, dt * 60);
    this.x = lerp(this.x, target.x, lerpFactor);
    this.y = lerp(this.y, target.y, lerpFactor);
    this.clampToBounds();
  }

  /** Snap directly to position (no lerp) */
  snapTo(target: Vec2): void {
    this.x = target.x;
    this.y = target.y;
    this.clampToBounds();
  }

  /** Start camera shake */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  /** Update shake, returns offset to apply */
  updateShake(dt: number): Vec2 {
    if (this.shakeTimer >= this.shakeDuration) {
      return { x: 0, y: 0 };
    }
    this.shakeTimer += dt;
    const decay = 1 - this.shakeTimer / this.shakeDuration;
    const intensity = this.shakeIntensity * decay;
    return {
      x: (Math.random() * 2 - 1) * intensity,
      y: (Math.random() * 2 - 1) * intensity,
    };
  }

  /** Get the top-left corner of the viewport (for rendering) */
  get viewX(): number {
    return this.x - this.halfWidth;
  }

  get viewY(): number {
    return this.y - this.halfHeight;
  }

  private clampToBounds(): void {
    const minX = this.boundsMinX + this.halfWidth;
    const maxX = this.boundsMaxX - this.halfWidth;
    const minY = this.boundsMinY + this.halfHeight;
    const maxY = this.boundsMaxY - this.halfHeight;

    if (minX < maxX) {
      this.x = clamp(this.x, minX, maxX);
    } else {
      this.x = (this.boundsMinX + this.boundsMaxX) / 2;
    }

    if (minY < maxY) {
      this.y = clamp(this.y, minY, maxY);
    } else {
      this.y = (this.boundsMinY + this.boundsMaxY) / 2;
    }
  }
}
